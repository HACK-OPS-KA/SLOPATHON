use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub size: f64,
    pub color: String,
    pub direction: Option<Direction>,
    pub alive: bool,
    pub score: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Direction {
    pub x: f64,
    pub y: f64,
}

impl Player {
    pub fn new(id: String, x: f64, y: f64, color: String) -> Self {
        Self {
            id,
            x,
            y,
            size: 20.0,
            color,
            direction: None,
            alive: true,
            score: 0,
        }
    }
}

/// Erzeugt Mock-Spieler für Demo-Zwecke
pub fn create_mock_players() -> Vec<Player> {
    let colors = [
        "#ff0000",
        "#00ff00",
        "#0000ff",
        "#ffff00",
        "#ff00ff",
    ];

    let positions = [
        (200.0, 200.0),
        (600.0, 200.0),
        (400.0, 500.0),
        (200.0, 600.0),
        (700.0, 500.0),
    ];

    colors
        .iter()
        .enumerate()
        .map(|(i, &color)| {
            let (x, y) = positions[i];
            Player::new(format!("player_{}", i + 1), x, y, color.to_string())
        })
        .collect()
}