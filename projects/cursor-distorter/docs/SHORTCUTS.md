# Keyboard Shortcuts

## Presenter keys (demo mode)

In demo mode, single number keys arm individual effects live so you can build up chaos on stage.
These fire on plain key presses (no modifier).

| Key | Effect / Action |
|-----|-----------------|
| `1` | **Imprecision Field** — redirects clicks to a more innovative nearby location |
| `2` | **Cursor Triplets** — three identical cursors |
| `3` | **Input Lag** — the rendered cursor trails reality |
| `4` | **Button Repulsion** — clickable targets keep their distance |
| `5` | **Overshoot** — arrives past the target, then springs back |
| `6` | **Cursor Drift** — a slow directional opinion about where you should be |
| `7` | **Click Betrayal** — ignore / double / delay / shift / phantom / swap a click |
| `8` | **Social Cursor** — small speech bubbles with strong opinions |
| `9` | **Full chaos** — enable every effect at maximum intensity |
| `0` | **Reset** — reset the escalation timeline |

## Legend

| Key | Action |
|-----|--------|
| `?` | Toggle the in-app presenter legend (the on-screen shortcut cheat sheet) |

## Emergency

| Key | Action |
|-----|--------|
| `⌘⇧⎋` (Cmd+Shift+Esc) | **Immediate safe shutdown (panic).** Bypasses the entire distortion engine and restores normal input instantly. |

## Notes

- The panic shortcut works everywhere — the browser sandbox, the Electron app, and (via a global
  shortcut) System Distortion Mode. It is the one shortcut that always works regardless of screen or
  state.
- Presenter number keys (`1`–`0`) are a demo-mode convenience. On the dashboard you can arm the same
  effects and presets from the UI.
- In the packaged desktop app the presenter keys can also be forwarded from the Electron main
  process, so they work even when the renderer doesn't have keyboard focus.
- `⌘` is Command on macOS; the handler also accepts `Ctrl` so the panic shortcut works when
  developing on non-mac keyboards.

See [`docs/DEMO_SCRIPT.md`](DEMO_SCRIPT.md) for how these fit into a live demo, and
[`docs/SAFETY.md`](SAFETY.md) for the full set of emergency controls.
