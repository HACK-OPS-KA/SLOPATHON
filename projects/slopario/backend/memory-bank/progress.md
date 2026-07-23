# Progress: Slopario

## What Works
- ✅ Rust project initialized with Axum 0.8 + WebSocket
- ✅ Session creation with configurable map size (`GET /api/session?width=1920&height=1080`)
- ✅ Controller WebSocket (`/ws/controller/{id}`)
  - Receives direction input as JSON
  - Receives "lobby\n", "ingame\n", "message: ...\n" via mpsc channel
  - Color switching via `{"switch_color": true}`
- ✅ Display WebSocket (`/ws/view/{id}`)
  - Sends InitState JSON on connect (`{"type":"init","map_width":1920,"map_height":1080}`)
  - Waits for "start" from display to begin game
  - Streams GameState at 30fps (`{"players":[...],"food":[...]}`)
- ✅ Game loop (30fps) with:
  - Player movement with direction vector and size-based speed
  - World boundary clamping
  - Food eating (grow on eat, respawn new food)
  - PvP eating (15% size advantage required)
  - Death messages (`message: rank X`)
  - Win detection (`message: winner player_X`)
- ✅ Colors as HTML hex strings (`#ff0000`)
- ✅ Frontend HTML files embedded in binary via `include_str!`
  - `/host` → host-frontend/index.html
  - `/client` → client-frontend/index.html
- ✅ CORS enabled (permissive for development)
- ✅ API.md documenting frozen communication format
- ✅ Dependencies upgraded: axum 0.7→0.8, tower-http 0.5→0.7
- ✅ 17 unit tests passing (game logic: movement, food, PvP, ranking, GameState)
- ✅ 1 integration test (E2E) passing (full session lifecycle with display + 3 controllers)

## What's Left to Build
- ❌ Frontend development (separate agent)
- ❌ Production hardening (session cleanup, error handling)

## Current Status
Backend is feature-complete with 18 passing tests (17 unit + 1 integration). The API is frozen. Frontend development is handled by a separate agent.

## Known Issues
- 5 compiler warnings (unused imports/variables, dead code) - expected for current stage
- `create_mock_food` in food.rs is unused (food is generated in Session::new directly)
- `SessionState::Running` variant is never constructed (only compared against)
- `Session.id` and `Session.state` fields are never read externally
- `player_count` variable in game.rs is unused
- `session` variable in controller.rs line 49 is unused (leftover from refactoring)

## Evolution of Project Decisions
- Moved from `[u8; 3]` to `String` for colors (HTML hex format)
- Moved map size from GameState to InitState (fixed at session creation)
- Changed controller communication from single "start" to newline-delimited protocol (lobby/ingame/message)
- Game loop starts on first display connect, only updates when `state == Running`
- Upgraded axum 0.7→0.8, tower-http 0.5→0.7 (fixed `{param}` route syntax + `Utf8Bytes` migration)
- Added integration test with real HTTP/WS connections via tokio-tungstenite + reqwest