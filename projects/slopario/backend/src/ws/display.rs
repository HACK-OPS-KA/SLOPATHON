use axum::extract::ws::{Message, WebSocket};
use futures::StreamExt;
use tokio::sync::broadcast;

use crate::game::{GameState, InitState};

/// Behandelt eine Display-WebSocket-Verbindung.
/// Sendet zuerst die Init-Nachricht mit der Map-Größe,
/// dann 30fps Game-State-Updates.
pub async fn handle_display(
    mut socket: WebSocket,
    map_width: u32,
    map_height: u32,
    mut rx: broadcast::Receiver<GameState>,
) {
    tracing::info!("Display connected");

    // 1. Init-Nachricht mit Map-Größe senden
    let init = InitState::new(map_width, map_height);
    let init_json = serde_json::to_string(&init).unwrap();
    if socket.send(Message::Text(init_json)).await.is_err() {
        return;
    }

    // 2. Auf erste Game-State-Updates warten und streamen
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