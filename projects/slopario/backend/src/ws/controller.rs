use axum::extract::ws::{Message, WebSocket};
use futures::StreamExt;
use serde::Deserialize;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::player::Direction;
use crate::session::Session;

#[derive(Debug, Deserialize)]
struct ControllerInput {
    direction: Option<Direction>,
    switch_color: Option<bool>,
}

/// Sends a text line to the controller with newline delimiter.
async fn send_line(socket: &mut WebSocket, line: &str) -> Result<(), ()> {
    let msg = format!("{}\n", line);
    socket.send(Message::Text(msg)).await.map_err(|_| ())
}

/// Behandelt eine Controller-WebSocket-Verbindung.
/// Der Controller sendet nur Richtungsdaten (unidirektional).
/// Das Backend sendet Text-Lines:
///   - "lobby"   bei Verbindungsaufbau
///   - "ingame"  wenn das Spiel beginnt
///   - "message: [Text]" für Nachrichten (z.B. "message: rank 3")
pub async fn handle_controller(mut socket: WebSocket, session: Arc<Mutex<Session>>) {
    tracing::info!("Controller connected");

    // Controller bei der Session registrieren
    let player_id = {
        let mut session = session.lock().await;
        session.player_count += 1;
        let player_id = format!("player_{}", session.player_count);
        let color = random_color();
        let x = rand::random::<f64>() * session.map_width as f64;
        let y = rand::random::<f64>() * session.map_height as f64;
        let player = crate::player::Player::new(player_id.clone(), x, y, color);
        session.players.push(Arc::new(Mutex::new(player)));
        player_id
    };

    tracing::info!("Controller assigned player: {}", player_id);

    // Sende "lobby" an den Controller (in der Lobby-Phase)
    if send_line(&mut socket, "lobby").await.is_err() {
        return;
    }

    // Mock: sofort "ingame" senden
    if send_line(&mut socket, "ingame").await.is_err() {
        return;
    }

    // Warte auf Richtungs-Updates vom Controller
    while let Some(Ok(msg)) = socket.next().await {
        match msg {
            Message::Text(text) => {
                // Parse das JSON
                if let Ok(input) = serde_json::from_str::<ControllerInput>(&text) {
                    let session = session.lock().await;

                    // Finde den Spieler und aktualisiere die Richtung
                    for player in &session.players {
                        let mut player = player.lock().await;
                        if player.id == player_id {
                            if let Some(dir) = input.direction {
                                player.direction = Some(dir);
                            }
                            if let Some(switch) = input.switch_color {
                                if switch {
                                    player.color = random_color();
                                }
                            }
                            break;
                        }
                    }
                }
            }
            Message::Close(_) => {
                tracing::info!("Controller {} disconnected", player_id);
                break;
            }
            _ => {}
        }
    }
}

fn random_color() -> String {
    format!(
        "#{:02x}{:02x}{:02x}",
        rand::random::<u8>(),
        rand::random::<u8>(),
        rand::random::<u8>(),
    )
}
