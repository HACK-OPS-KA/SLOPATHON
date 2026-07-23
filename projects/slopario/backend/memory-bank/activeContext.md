# Active Context: Slopario

## Current Work Focus
Backend is fully implemented with game logic. Frontends are being developed by another agent.

## Recent Changes
- Initialized Rust project with Axum + WebSocket support
- Implemented full game loop (30fps) with movement, eating, PvP
- Controller communication via mpsc channels (lobby/ingame/message)
- Display receives init message + 30fps GameState broadcasts
- Lobby → Ingame flow: display sends "start" to begin game
- Session creation takes map size as query parameter (`?width=1920&height=1080`)
- Map size is fixed after session creation, removed from GameState
- Colors are HTML hex strings (`#ff0000`)
- Frontend HTML files embedded into binary via `include_str!`
- API.md documents the frozen communication format

## Next Steps
- Frontend development (separate agent)
- Testing and bug fixes
- Potential netcode refinements (death messages, win condition)

## Active Decisions
- Game loop runs even without display connected (starts when first display connects)
- Game only updates when `state == Running` (started by display)
- Controller messages are newline-delimited plain text lines
- Display messages are JSON (InitState + GameState at 30fps)
- Map size is u32, positions/sizes are f64 internally

## Important Patterns
- All shared state is behind `Arc<Mutex<>>`
- `try_lock()` used in game loop to avoid blocking on contested locks
- Controller mpsc senders stored in `Session.controller_txs`
- Display uses broadcast channel