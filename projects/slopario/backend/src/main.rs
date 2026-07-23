mod food;
mod game;
mod player;
mod session;
mod ws {
    pub mod controller;
    pub mod display;
}

use axum::{
    extract::{
        ws::{WebSocket, WebSocketUpgrade},
        Path, State,
    },
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use tokio::sync::broadcast;
use tracing_subscriber::EnvFilter;

use crate::game::{start_game_loop, GameState};
use crate::session::{create_session_map, generate_session_id, SessionMap};
use crate::ws::controller::handle_controller;
use crate::ws::display::handle_display;

const PORT: u16 = 6969;

#[derive(Serialize)]
struct CreateSessionResponse {
    session_id: String,
}

#[derive(Clone)]
struct AppState {
    sessions: SessionMap,
}

/// Erstellt eine neue Session und gibt die ID zurück.
/// Der Game-Loop startet noch nicht – erst wenn das erste Display sich verbindet.
async fn create_session(State(state): State<AppState>) -> Json<CreateSessionResponse> {
    let session_id = generate_session_id();
    let session = crate::session::Session::new(session_id.clone());
    let session = std::sync::Arc::new(tokio::sync::Mutex::new(session));

    // Speichere die Session (ohne Game-Loop)
    {
        let mut sessions = state.sessions.lock().await;
        sessions.insert(session_id.clone(), session);
    }

    tracing::info!("Created new session: {}", session_id);

    Json(CreateSessionResponse {
        session_id: session_id.clone(),
    })
}

/// Controller-WebSocket: /ws/controller/:session_id
async fn ws_controller_handler(
    ws: WebSocketUpgrade,
    Path(session_id): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_controller_with_session(socket, session_id, state))
}

async fn handle_controller_with_session(
    socket: WebSocket,
    session_id: String,
    state: AppState,
) {
    let session = {
        let sessions = state.sessions.lock().await;
        sessions.get(&session_id).cloned()
    };

    match session {
        Some(session) => handle_controller(socket, session).await,
        None => {
            tracing::warn!("Session not found: {}", session_id);
        }
    }
}

/// Display-WebSocket: /ws/view/:session_id
async fn ws_display_handler(
    ws: WebSocketUpgrade,
    Path(session_id): Path<String>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_display_with_session(socket, session_id, state))
}

async fn handle_display_with_session(
    socket: WebSocket,
    session_id: String,
    state: AppState,
) {
    let session = {
        let sessions = state.sessions.lock().await;
        sessions.get(&session_id).cloned()
    };

    match session {
        Some(session_arc) => {
            // Display verbindet sich: Erstelle broadcast-Channel
            let rx: broadcast::Receiver<GameState> = {
                let mut session = session_arc.lock().await;
                session.connect_display()
            };

            // Starte den Game-Loop nur beim ersten Display
            {
                let mut session = session_arc.lock().await;
                if !session.game_loop_started {
                    session.game_loop_started = true;
                    // Release lock, dann start_game_loop mit dem Arc
                    drop(session);
                    start_game_loop(session_arc.clone());
                }
            }

            // Behandle Display-Verbindung mit dem Receiver
            handle_display(socket, rx).await;
        }
        None => {
            tracing::warn!("Session not found: {}", session_id);
        }
    }
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    let state = AppState {
        sessions: create_session_map(),
    };

    let app = Router::new()
        .route("/api/session", get(create_session))
        .route("/ws/controller/{session_id}", get(ws_controller_handler))
        .route("/ws/view/{session_id}", get(ws_display_handler))
        .with_state(state);

    let addr = format!("0.0.0.0:{}", PORT);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect(&format!("Failed to bind to port {}", PORT));

    tracing::info!("Server running on http://{}", addr);
    tracing::info!("Endpoints:");
    tracing::info!("  GET /api/session                         - Create session");
    tracing::info!("  GET /ws/controller/{{session_id}}        - Controller WebSocket");
    tracing::info!("  GET /ws/view/{{session_id}}              - Display WebSocket");

    axum::serve(listener, app)
        .await
        .expect("Server failed");
}