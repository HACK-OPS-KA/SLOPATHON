# Progress: Slopario

## What Works
- ✅ Rust project initialized with Axum + WebSocket
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
- ✅ Memory bank initialized

## What's Left to Build
- ❌ Frontend development (separate agent)
- ❌ End-to-end testing
- ❌ Potential bug fixes in game logic edge cases
- ❌ Production hardening (session cleanup, error handling)

## Current Status
The backend is feature-complete and compiles without errors. The API is frozen. Frontend development is being handled by a separate agent.

## Known Issues
- 6 compiler warnings (unused imports/variables, dead code) - all expected for current development stage
- `create_mock_food` in food.rs is unused (food is generated in Session::new directly)
- `SessionState::Running` variant is never constructed (only compared against)
- `Session.id` and `Session.state` fields are never read externally
- `player_count` variable in game.rs is unused
- `session` variable in controller.rs line 49 is unused (leftover from refactoring)

## Evolution of Project Decisions
- Moved from `[u8; 3]` to `String` for colors (HTML hex format)
- Moved map size from GameState to InitState (fixed at session creation)
- Changed controller communication from single "start" to newline-delimited protocol (lobby/ingame/message)
- Game loop now starts on first display connect, not at session creation
- Game only updates when state == Running (display sends "start")