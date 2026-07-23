# Product Context: Slopario

## Why this project exists
A fun, sloppy agar.io clone for parties/gatherings where players use their phones as controllers and a shared screen as the display.

## Problems it solves
- No game server needed - one person runs the backend, others scan QR code
- Instant lobby creation via QR code for easy multiplayer joining
- Cross-platform: works on any device with a browser

## How it should work
1. Host opens `/host` → creates a session, shows QR code
2. Players scan QR code → opens `/client?session_id=xxx` on their phone
3. Host presses "start" → game begins
4. Each player controls their dot with a joystick on their phone
5. The host screen shows the full game state in real-time (30fps)
6. Last player standing wins

## User Experience Goals
- Zero setup: open URL, scan QR, play
- Responsive joystick on mobile
- Real-time 30fps game display
- Simple, fun party game mechanics