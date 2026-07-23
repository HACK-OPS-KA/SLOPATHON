# Project Brief: Slopario

A sloppy agar.io clone backend written in Rust.

## Core Requirements
- Real-time multiplayer game server using WebSockets
- Two frontends: Host (display/lobby) and Client (controller)
- Multiple controllers send direction input, host displays game state
- Game mechanics: eat food, eat other players, last one standing wins

## Architecture
- **Backend**: Rust with Axum (HTTP + WebSocket server)
- **Frontends**: Static HTML/JS (embedded in binary via `include_str!`)
  - Host: `/host` - lobby with QR code, game display
  - Client: `/client` - joystick controller for mobile
- **Port**: 6969