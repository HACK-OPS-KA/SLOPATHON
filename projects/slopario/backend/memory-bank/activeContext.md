# Active Context: Slopario

## Current Work Focus
Backend is fully implemented with game logic and all tests passing. Frontend development by another agent.

## Recent Changes
- **Dependencies upgraded**: axum 0.7→0.8, tower-http 0.5→0.7
- **404 WebSocket bug fixed**: Route syntax `{session_id}` requires Axum 0.8 (matchit 0.8). Axum 0.7 used `:session_id`.
- **Axum 0.8 migration**: `Message::Text(...)` now takes `Utf8Bytes` instead of `String` → all calls use `.into()`
- **Integration test now passes**: `tests/integration_test.rs` runs full E2E lifecycle (session creation, display WS, controller WS, start game, GameState streaming)
- All other features (game loop, controller comms, display streaming, embedded frontends) remain unchanged

## Next Steps
- Frontend development (separate agent)
- Potential: clean up compiler warnings
- Potential: session cleanup for stale sessions

## Active Decisions
- Game loop runs when first display connects, but only updates when `state == Running`
- Controller messages: newline-delimited plain text (lobby/ingame/message)
- Display messages: JSON (InitState + GameState at 30fps)
- Map size is u32, positions/sizes are f64 internally
- Colors are HTML hex strings

## Important Patterns
- All shared state behind `Arc<Mutex<>>`
- `try_lock()` in game loop to avoid blocking
- Controller mpsc senders stored in `Session.controller_txs`
- Display uses broadcast channel