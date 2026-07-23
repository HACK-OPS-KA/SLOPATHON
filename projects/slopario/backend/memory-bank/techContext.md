# Technical Context: Slopario

## Technologies Used
- **Language**: Rust (edition 2024)
- **HTTP/WebSocket Server**: Axum 0.8 with WebSocket support
- **Async Runtime**: Tokio 1.x (full features)
- **Serialization**: Serde + Serde JSON
- **WebSocket Utilities**: futures (SinkExt, StreamExt)
- **CORS**: tower-http 0.7
- **Logging**: tracing + tracing-subscriber
- **UUID**: uuid 1.x (v4)
- **Random**: rand 0.8

## Development Setup
- **IDE**: RustRover
- **Build**: cargo build / cargo run
- **Test**: cargo test (17 unit tests, 1 integration test)
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
axum = { version = "0.8", features = ["ws"] }     # Updated from 0.7
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
futures = "0.3"
tower-http = { version = "0.7", features = ["cors"] }  # Updated from 0.5
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
uuid = { version = "1", features = ["v4"] }
rand = "0.8"

[dev-dependencies]
tokio-tungstenite = { version = "0.24", features = ["__rustls-tls"] }
reqwest = { version = "0.12", default-features = false, features = ["json", "rustls-tls"] }
futures = "0.3"
```

## Tool Usage Patterns
- `cargo check` for compilation checks
- `cargo run` starts the server on port 6969
- `cargo test --lib` runs 17 unit tests
- `cargo test --test integration_test` runs the E2E integration test
- Server can be tested with `curl` for REST endpoints

## Key Migration Notes (Axum 0.7 → 0.8)
- Route syntax: `{session_id}` is now supported (was `:session_id` in 0.7)
- `Message::Text(String)` → `Message::Text(string.into())` (takes `Utf8Bytes`)

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
│   ├── lib.rs                # Library crate (for integration tests)
│   ├── main.rs               # Binary entry point
│   ├── player.rs
│   ├── food.rs
│   ├── session.rs
│   ├── game.rs               # Contains 17 unit tests
│   └── ws/
│       ├── controller.rs
│       └── display.rs
├── tests/
│   └── integration_test.rs   # E2E integration test
├── host-frontend/            # Separate project (other agent)
│   └── index.html
├── client-frontend/          # Separate project (other agent)
│   └── index.html