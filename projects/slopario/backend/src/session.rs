use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{Mutex, broadcast};
use uuid::Uuid;

use crate::food::{Food, create_mock_food};
use crate::player::{Player, create_mock_players};
use crate::game::GameState;

#[derive(Debug, Clone, PartialEq)]
pub enum SessionState {
    Waiting,
    Running,
}

pub struct Session {
    pub id: String,
    pub state: SessionState,
    pub players: Vec<Arc<Mutex<Player>>>,
    pub food: Vec<Food>,
    pub map_width: u32,
    pub map_height: u32,
    pub display_tx: Option<broadcast::Sender<GameState>>,
    pub player_count: u32,
    pub game_loop_started: bool,
}

impl Session {
    pub fn new(id: String, map_width: u32, map_height: u32) -> Self {
        let mock_players = create_mock_players();
        let players = mock_players
            .into_iter()
            .map(|p| Arc::new(Mutex::new(p)))
            .collect();

        Self {
            id,
            state: SessionState::Waiting,
            players,
            food: create_mock_food(),
            map_width,
            map_height,
            display_tx: None,
            player_count: 0,
            game_loop_started: false,
        }
    }

    /// Verbindet ein Display mit dieser Session.
    /// Erstellt den broadcast-Channel beim ersten Display.
    /// Gibt einen Receiver für Game-State-Updates zurück.
    pub fn connect_display(&mut self) -> broadcast::Receiver<GameState> {
        if self.display_tx.is_none() {
            let (tx, _) = broadcast::channel(32);
            self.display_tx = Some(tx);
        }
        self.display_tx.as_ref().unwrap().subscribe()
    }

    pub fn to_game_state(&self) -> GameState {
        let players = self
            .players
            .iter()
            .filter_map(|p| {
                let p = p.try_lock().ok()?;
                if p.alive {
                    Some(crate::game::PlayerInfo {
                        id: p.id.clone(),
                        x: p.x,
                        y: p.y,
                        size: p.size,
                        color: p.color.clone(),
                    })
                } else {
                    None
                }
            })
            .collect();

        let food = self
            .food
            .iter()
            .map(|f| crate::game::FoodInfo {
                x: f.x,
                y: f.y,
                size: f.size,
            })
            .collect();

        GameState { players, food }
    }
}

pub type SessionMap = Arc<Mutex<HashMap<String, Arc<Mutex<Session>>>>>;

pub fn create_session_map() -> SessionMap {
    Arc::new(Mutex::new(HashMap::new()))
}

pub fn generate_session_id() -> String {
    Uuid::new_v4().to_string()
}