# Technical Context: Slopario

## Technologies Used
- **Language**: Rust (edition 2024)
- **HTTP/WebSocket Server**: Axum 0.7 with WebSocket support
- **Async Runtime**: Tokio 1.x (full features)
- **Serialization**: Serde + Serde JSON
- **WebSocket Utilities**: futures (SinkExt, StreamExt)
- **CORS**: tower-http 0.5
- **Logging**: tracing + tracing-subscriber
- **UUID**: uuid 1.x (v4)
- **Random**: rand 0.8

## Development Setup
- **IDE**: RustRover
- **Build**: cargo build / cargo run
- **Port**: 6969 (hardcoded as constant)
- **Workspace**: `/home/ich/workspace/slopatron/projects/slopario/backend`

## Technical Constraints
- All frontend files embedded at compile time via `include_str!`
- No database or file system access at runtime
- In-memory state only (sessions stored in HashMap)
- Game loop runs in a tokio task per session
- Frontends are developed by a separate agent - backend doesn't modify them

## Dependencies
```toml
[dependencies]
axum = { version = "0.7", features = ["ws"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
futures = "0.3"
tower-http = { version = "0.5", features = ["cors"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
uuid = { version = "1", features = ["v4"] }
rand = "0.8"
```

## Tool Usage Patterns
- `cargo check` for compilation checks
- `cargo run` starts the server on port 6969
- Server can be tested with `curl` for REST endpoints
- WebSocket testing via `websocat` CLI tool

## Project Structure
```
backend/
├── Cargo.toml
├── API.md                    # Frozen API documentation
├── README.md
├── memory-bank/              # Cline's memory bank
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── activeContext.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   └── progress.md
├── src/
│   ├── main.rs
│   ├── player.rs
│   ├── food.rs
│   ├── session.rs
│   ├── game.rs
│   └── ws/
│       ├── controller.rs
│       └── display.rs
├── target/
├── ../host-frontend/         # Separate project (other agent)
│   └── index.html
├── ../client-frontend/       # Separate project (other agent)
│   └── index.html