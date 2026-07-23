use axum::extract::ws::{Message, WebSocket};
use futures::StreamExt;
use tokio::sync::broadcast;

use crate::game::GameState;

/// Behandelt eine Display-WebSocket-Verbindung.
/// Das Display empfängt 30fps Game-State-Updates.
pub async fn handle_display(mut socket: WebSocket, mut rx: broadcast::Receiver<GameState>) {
    tracing::info!("Display connected");

    // Sende initialen Game-State (warte kurz auf ersten Tick oder sende leeren State)
    // Der Game-Loop sendet den ersten State nach ~33ms, also warten wir kurz
    tokio::select! {
        result = rx.recv() => {
            if let Ok(state) = result {
                let json = serde_json::to_string(&state).unwrap();
                if socket.send(Message::Text(json)).await.is_err() {
                    return;
                }
            }
        }
        _ = tokio::time::sleep(tokio::time::Duration::from_millis(50)) => {
            // Timeout: sende nichts, warte auf nächsten Tick
        }
    }

    // Warte auf Game-State-Updates und sende sie an das Display
    loop {
        tokio::select! {
            result = rx.recv() => {
                match result {
                    Ok(state) => {
                        let json = serde_json::to_string(&state).unwrap();
                        if socket.send(Message::Text(json)).await.is_err() {
                            break;
                        }
                    }
                    Err(_) => {
                        // Sender wurde gedropped
                        break;
                    }
                }
            }
            msg = socket.next() => {
                match msg {
                    Some(Ok(Message::Close(_))) | None => {
                        tracing::info!("Display disconnected");
                        break;
                    }
                    _ => {}
                }
            }
        }
    }
}