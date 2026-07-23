# System Patterns: Slopario

## System Architecture

```
┌─────────────┐     WebSocket      ┌──────────────────┐
│  Controller  │ ─── direction ──→ │                  │
│  (Mobile)    │ ←── lobby/ingame  │   Rust Backend   │
│  /client     │     /message ──── │   (Axum, Port    │
└─────────────┘                    │    6969)         │
                                   │                  │
┌─────────────┐     WebSocket      │  ┌────────────┐  │
│  Host       │ ←─── InitState +  │  │  Session   │  │
│  (Display)  │      30fps JSON   │  │  Manager   │  │
│  /host       │ ─── "start" ────→ │  └────────────┘  │
└─────────────┘                    └──────────────────┘
```

## Key Technical Decisions

### Shared State Pattern
- `SessionMap = Arc<Mutex<HashMap<String, Arc<Mutex<Session>>>>>`
- All player objects are `Arc<Mutex<Player>>`
- Game loop uses `try_lock()` to avoid deadlocks on contested mutexes

### Communication Channels
- **Display → Controllers**: `broadcast::Sender<GameState>` (tokio broadcast channel, 32 capacity)
- **Backend → Controller**: `mpsc::UnboundedSender<String>` per connection, stored in `Vec` on Session
- **Display receives "start"**: Via the WebSocket stream itself (first message from display)

### Game Loop
- Runs at 30fps (`interval(Duration::from_millis(33))`)
- Started when first display connects (not at session creation)
- Only updates when `SessionState == Running` (set by display sending "start")
- Three phases per tick: movement → food eating → PvP eating → death messages

### Data Flow
1. `GET /api/session?width=1920&height=1080` → creates Session, returns session_id
2. Display connects to `/ws/view/{id}` → gets InitState JSON, sends "start" to begin
3. Controller connects to `/ws/controller/{id}` → gets "lobby\n", then "ingame\n"
4. Controller sends `{"direction":{"x":0.5,"y":-0.3}}` or `{"switch_color":true}`
5. Game loop updates positions, eating, deaths at 30fps
6. Display receives `{"players":[...],"food":[...]}` at 30fps
7. On death: controller gets `message: rank 3\n`
8. On game end: all controllers get `message: winner player_1\n`

## Module Structure
```
src/
├── main.rs          # Router, AppState, embedded frontends, all HTTP/WS handlers
├── player.rs        # Player struct, Direction, create_mock_players
├── food.rs          # Food struct, random food generation
├── session.rs       # Session struct, SessionMap, connect_display, broadcast_to_controllers
├── game.rs          # GameState, InitState, PlayerInfo, FoodInfo, update(), start_game_loop
├── ws/
│   ├── controller.rs  # handle_controller: mpsc channel, direction updates
│   └── display.rs     # handle_display: init, wait for start, stream game state