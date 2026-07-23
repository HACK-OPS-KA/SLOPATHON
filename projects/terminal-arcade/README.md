# Terminal Arcade

> Claude Code's loading spinner is boring, so we made it play Snake instead — a real, playable game that gets yanked off-screen the instant the actual answer is ready.

## Team

- mayasjain

## What is this?

A CLI wrapper (`arcade`) that spawns the real `claude` CLI inside a pseudo-terminal. Claude Code hooks tell the wrapper the exact moment a turn starts and ends; while Claude is thinking or running a tool call, the wrapper switches to the terminal's alternate screen buffer and hands you a genuinely playable Snake game (arrow keys/WASD, real collision, real score). The moment Claude's answer is ready, the game freezes — same score, same snake, ready to resume next turn — and the real output takes over the exact same terminal window. Runs on a laptop, no browser, no separate pane.

```
$ arcade
> summarize what this repo does

  Snake — Score: 4                    <- you're playing this while
  +--------------------------+           Claude reads the code and
  |                          |           writes its answer
  |            *             |
  |         oo@              |
  |                          |
  +--------------------------+
  Arrows/WASD to move — Ctrl-C to quit.

                    ↓ (the moment the answer is ready)

  This repo is a Terminal Arcade wrapper for Claude Code...
```

## Why should this not exist?

- wildly over-engineered for the outcome
- totally unnecessary
- solves a problem nobody has (a two-second spinner was never actually a problem)

## What it does

**Actually does:**
- Spawns `claude` in a real pty via `node-pty` so its own UI behaves exactly like running it standalone
- Detects busy/idle via `UserPromptSubmit`/`Stop`/`Notification` hooks over a Unix socket
- Takes over the terminal (alt-screen buffer) and runs real Snake while Claude works, buffering Claude's real output so nothing is lost
- Pauses (not resets) the game between turns — score and position persist for the life of one `arcade` session
- Hands control back and flushes the real answer the instant it's ready
- Falls back to plain passthrough automatically if not running in a real terminal (piped/CI)

**Should do (but doesn't yet):**
- More than one game (Minesweeper, Tetris, etc. — Snake was the only one built)
- Persist state to disk across separate `arcade` runs (currently only persists within one running session)

## How it works
```text
claude prompt -> UserPromptSubmit hook -> arcade wrapper takes over the terminal
                                            -> real Snake game (yours to play)
claude finishes -> Stop hook -> arcade wrapper hands the real terminal back
                                  -> Claude's actual answer appears
```

- `bin/arcade.js` — entry point: spawns `claude`, wires everything together.
- `src/pty-manager.js` — spawns `claude` inside a real pty.
- `src/hook-bridge.js` — Unix-socket server that receives busy/ready events from the Claude Code hooks.
- `src/terminal-controller.js` — owns the alternate-screen takeover, output buffering, and the Snake session's pause/resume lifecycle.
- `src/games/snake.js` — the game itself; standalone and dependency-free.
- `src/doctor.js` — the `arcade doctor` diagnostic command.
- `hooks/notify.js` — the actual Claude Code hook script.
- `.claude/settings.json` — project-local hook configuration (committed; never touches your global Claude Code settings).

## Run it

### Requirements

#### Software
- OS: macOS (developed/tested there; Linux should work, Windows untested)
- Language/runtime: Node.js >= 18
- Package manager: npm
- Accounts / API keys: a working `claude` (Claude Code) CLI install, already logged in
- Other dependencies: Xcode Command Line Tools on macOS (only needed if `node-pty`'s prebuilt binary doesn't match your platform and has to compile from source)

### Setup

```bash
cd projects/terminal-arcade
npm install
npm link          # optional: makes the `arcade` command available globally
node bin/arcade.js doctor   # sanity-check node-pty, claude on PATH, hook config
```

### Start

```bash
node bin/arcade.js
# or, if you ran `npm link`:
arcade
```

Then just use Claude Code normally — ask it something that takes a few seconds or triggers a tool call, and Snake takes over until the answer's ready. Arrow keys/WASD to move, Ctrl-C to quit, any key to restart after a game over.

Must be run from inside this folder — the project-local `.claude/settings.json` here is what wires up the hooks, and only applies when Claude Code's working directory matches.

### Troubleshooting

**`arcade doctor` reports `node-pty failed to load`**
```bash
xcode-select --install
npm install
```

**No game ever shows up** — `arcade doctor` checks for a project-local `.claude/settings.json` in your current directory; if that's missing, you're not running `arcade` from inside this folder.

**Terminal looks broken after quitting** — shouldn't happen (the wrapper traps `SIGINT`/`SIGTERM`/`exit`/uncaught exceptions and always restores the terminal), but `reset` in your shell will fix it if it ever does.

## Demo

- Live at the HACK//OPS table — bring a laptop with Claude Code installed and watch a real answer get interrupted mid-thought by a snake eating a piece of fruit.
