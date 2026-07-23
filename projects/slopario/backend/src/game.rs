use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{interval, Duration};

use crate::session::Session;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerInfo {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub size: f64,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FoodInfo {
    pub x: f64,
    pub y: f64,
    pub size: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub players: Vec<PlayerInfo>,
    pub food: Vec<FoodInfo>,
}

/// Wird beim Display-Connect als erste Nachricht gesendet.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitState {
    #[serde(rename = "type")]
    pub msg_type: String,
    pub map_width: u32,
    pub map_height: u32,
}

impl InitState {
    pub fn new(map_width: u32, map_height: u32) -> Self {
        Self {
            msg_type: "init".to_string(),
            map_width,
            map_height,
        }
    }
}

/// Startet den Game-Loop für eine Session.
/// Läuft mit 30 Ticks pro Sekunde und broadcasted den Game-State an das Display.
/// Wird aufgerufen sobald sich das erste Display verbindet.
pub fn start_game_loop(session: Arc<Mutex<Session>>) {
    tokio::spawn(async move {
        let mut ticker = interval(Duration::from_millis(33)); // ~30 fps

        loop {
            ticker.tick().await;

            let game_state = {
                let session = session.lock().await;
                session.to_game_state()
            };

            // Nur broadcasten wenn ein Display verbunden ist
            let session = session.lock().await;
            if let Some(ref tx) = session.display_tx {
                if tx.receiver_count() > 0 {
                    let _ = tx.send(game_state);
                }
            }
        }
    });
}