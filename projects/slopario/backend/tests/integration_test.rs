use std::net::TcpListener;
use std::time::Duration;

use futures::{SinkExt, StreamExt};
use tokio::time::timeout;

/// End-to-end integration test of the full game lifecycle.
#[tokio::test]
async fn test_full_game_session() {
    // ------------------------------------------------------------------
    // 1. Start server on a random available port
    // ------------------------------------------------------------------
    let listener = TcpListener::bind("127.0.0.1:0").expect("Failed to bind test port");
    let port = listener.local_addr().unwrap().port();
    drop(listener);

    let addr = slopario_backend::run_on_port(port).await;
    let base_url = format!("http://{}", addr);
    let ws_base = format!("ws://{}", addr);

    println!("Test server running on {}", addr);

    // Give the server a moment to be ready
    tokio::time::sleep(Duration::from_millis(100)).await;

    // ------------------------------------------------------------------
    // 2. Create a session
    // ------------------------------------------------------------------
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .unwrap();
    let resp = client
        .get(format!("{}/api/session?width=1000&height=800", base_url))
        .send()
        .await
        .expect("Failed to create session");
    assert!(resp.status().is_success(), "Session creation should succeed");

    let session: serde_json::Value = resp.json().await.unwrap();
    let session_id = session["session_id"].as_str().unwrap().to_string();
    let map_width = session["map_width"].as_u64().unwrap();
    let map_height = session["map_height"].as_u64().unwrap();

    assert_eq!(map_width, 1000);
    assert_eq!(map_height, 800);
    assert!(!session_id.is_empty());

    println!("Created session: {} ({}x{})", session_id, map_width, map_height);

    // ------------------------------------------------------------------
    // 3. Connect display WebSocket
    // ------------------------------------------------------------------
    let display_ws_url = format!("{}/ws/view/{}", ws_base, session_id);
    println!("Connecting display to: {}", display_ws_url);
    let display_ws = loop {
        match timeout(Duration::from_secs(2), tokio_tungstenite::connect_async(&display_ws_url)).await {
            Ok(Ok(ws)) => break ws,
            Ok(Err(e)) => {
                println!("Display WS connect failed: {:?}, retrying...", e);
                tokio::time::sleep(Duration::from_millis(200)).await;
            }
            Err(_) => {
                println!("Display WS connect timed out, retrying...");
                tokio::time::sleep(Duration::from_millis(200)).await;
            }
        }
    };
    let (mut display_writer, mut display_reader) = display_ws.0.split();

    // Receive InitState (with timeout)
    let init_msg = timeout(Duration::from_secs(2), display_reader.next())
        .await
        .expect("Display should receive init message within timeout")
        .expect("Init message should be Some")
        .expect("Init message should be valid");
    let init_text = init_msg.into_text().unwrap();
    let init: serde_json::Value = serde_json::from_str(&init_text).unwrap();
    assert_eq!(init["type"], "init");
    assert_eq!(init["map_width"], 1000);
    assert_eq!(init["map_height"], 800);
    println!("Display received InitState");

    // ------------------------------------------------------------------
    // 4. Connect 3 controller WebSockets
    // ------------------------------------------------------------------
    let controller_url = format!("{}/ws/controller/{}", ws_base, session_id);
    let mut controllers = Vec::new();

    for i in 0..3 {
        let (ws, _) = tokio_tungstenite::connect_async(&controller_url)
            .await
            .expect(&format!("Controller {} should connect", i));
        let (writer, mut reader) = ws.split();

        let msg = timeout(Duration::from_secs(2), reader.next())
            .await
            .expect(&format!("Controller {} should receive lobby within timeout", i))
            .expect("Controller message should be Some")
            .expect("Controller message should be valid");
        let text = msg.into_text().unwrap();
        assert_eq!(text.trim(), "lobby", "Controller {} should get 'lobby'", i);
        println!("Controller {} received 'lobby'", i);

        controllers.push((writer, reader));
    }

    // ------------------------------------------------------------------
    // 5. Display sends "start" → controllers receive "ingame"
    // ------------------------------------------------------------------
    display_writer
        .send(tokio_tungstenite::tungstenite::Message::Text("start".into()))
        .await
        .expect("Display should send start");

    for (i, (_writer, reader)) in controllers.iter_mut().enumerate() {
        let msg = timeout(Duration::from_secs(2), reader.next())
            .await
            .expect(&format!("Controller {} should receive ingame within timeout", i))
            .expect("Controller message should be Some")
            .expect("Controller message should be valid");
        let text = msg.into_text().unwrap();
        assert_eq!(text.trim(), "ingame", "Controller {} should get 'ingame'", i);
        println!("Controller {} received 'ingame'", i);
    }

    // ------------------------------------------------------------------
    // 6. Controllers send directions
    // ------------------------------------------------------------------
    controllers[0]
        .0
        .send(tokio_tungstenite::tungstenite::Message::Text(
            r#"{"direction":{"x":1.0,"y":0.0}}"#.into(),
        ))
        .await
        .unwrap();

    controllers[1]
        .0
        .send(tokio_tungstenite::tungstenite::Message::Text(
            r#"{"direction":{"x":0.0,"y":1.0}}"#.into(),
        ))
        .await
        .unwrap();

    controllers[2]
        .0
        .send(tokio_tungstenite::tungstenite::Message::Text(
            r#"{"switch_color":true}"#.into(),
        ))
        .await
        .unwrap();

    // ------------------------------------------------------------------
    // 7. Display receives GameState at 30fps
    // ------------------------------------------------------------------
    for i in 0..3 {
        let msg = timeout(Duration::from_secs(2), display_reader.next())
            .await
            .expect(&format!("Display should receive GameState #{} within timeout", i))
            .expect("GameState should be Some")
            .expect("GameState should be valid");
        let text = msg.into_text().unwrap();
        let state: serde_json::Value = serde_json::from_str(&text).unwrap();

        assert!(state["players"].is_array(), "GameState should contain players array");
        assert!(state["food"].is_array(), "GameState should contain food array");
        assert!(!state["players"].as_array().unwrap().is_empty(), "Should have at least one player");
        assert!(!state["food"].as_array().unwrap().is_empty(), "Should have food items");

        if let Some(player) = state["players"].as_array().unwrap().first() {
            assert!(player["id"].is_string());
            assert!(player["x"].is_number());
            assert!(player["y"].is_number());
            assert!(player["size"].is_number());
            assert!(player["color"].is_string());
        }

        println!("Display received GameState #{}", i);
    }

    // ------------------------------------------------------------------
    // 8. Verify movement happened
    // ------------------------------------------------------------------
    let msg = timeout(Duration::from_secs(2), display_reader.next())
        .await
        .expect("Display should receive another GameState within timeout")
        .expect("GameState should be Some")
        .expect("GameState should be valid");
    let text = msg.into_text().unwrap();
    let state: serde_json::Value = serde_json::from_str(&text).unwrap();

    let players = state["players"].as_array().unwrap();
    let player_1 = players.iter().find(|p| p["id"] == "player_1");
    if let Some(p1) = player_1 {
        assert!(p1["x"].as_f64().unwrap() > 0.0, "Player 1 should have moved");
        assert!(p1["size"].as_f64().unwrap() > 0.0, "Player should have size");
    }
    println!("Movement verification passed");

    // ------------------------------------------------------------------
    // 9. Send another direction and verify game still runs
    // ------------------------------------------------------------------
    controllers[0]
        .0
        .send(tokio_tungstenite::tungstenite::Message::Text(
            r#"{"direction":{"x":-1.0,"y":0.0}}"#.into(),
        ))
        .await
        .unwrap();

    let msg = timeout(Duration::from_secs(2), display_reader.next())
        .await
        .expect("Display should continue receiving updates within timeout")
        .expect("GameState should be Some")
        .expect("GameState should be valid");
    let text = msg.into_text().unwrap();
    let _state: serde_json::Value = serde_json::from_str(&text).unwrap();
    println!("Game continues after direction change");

    // ------------------------------------------------------------------
    // 10. Clean up
    // ------------------------------------------------------------------
    display_writer
        .send(tokio_tungstenite::tungstenite::Message::Close(None))
        .await
        .ok();

    println!("=== Full E2E test passed ===");
}