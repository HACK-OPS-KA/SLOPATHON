# Cursor Distorter — Implementation Plan

> A precision-engineered productivity obstruction platform. Deliberately anti-productive,
> surprisingly polished, always reversible.

## Guiding constraints

1. **Safe Demo Sandbox must ship even if system-wide manipulation is hard.** The entire
   distortion experience is rendered inside the app's own surface, so it works with zero OS
   permissions and is fully testable in a browser.
2. **Always reversible.** Global panic shortcut (`Cmd+Shift+Esc`), menu-bar kill switch, a
   max session timer, auto-disable on crash/helper-disconnect, and a Terminal recovery script.
3. **Never malware.** No persistence, stealth startup, input logging, credential capture,
   screenshots, clipboard, or remote control. System mode is always visibly indicated.

## Architecture (pnpm monorepo)

```
cursor-distorter/
  apps/
    desktop/          Electron main + preload + React/Vite renderer
    native-helper/    Documented Swift accessibility helper stub (optional)
  packages/
    shared-types/     Cross-cutting TS types & IPC contracts (source-consumed)
    chaos-engine/     Seeded RNG, ChaosEngine, adaptive rules, presets, escalation
    cursor-effects/   The 12 CursorEffect modules (pure logic)
    ui/               Shared React primitives
  docs/               Architecture, permissions, safety, demo script, shortcuts
  scripts/            Recovery / kill scripts
```

**Key decision — the renderer runs in two hosts:**
- **Browser** (`NO_ELECTRON=1`): Safe Demo Sandbox only. Used for dev + Playwright tests.
- **Electron**: Sandbox *plus* System Distortion Mode (overlay window, tray, global shortcut).

The renderer feature-detects `window.cursorDistorter` (exposed by preload via `contextBridge`,
strict `contextIsolation`). Absent → web/sandbox mode. This keeps the polished demo un-blocked
by native complexity, exactly as required.

## Data flow (the chaos loop)

```
pointer events over sandbox surface
        │
        ▼
  CursorContext  ─────►  ChaosEngine.update()  ─────►  RenderedCursorState
  (real pos,             runs enabled effects,          (1-3 fake cursors,
   velocity, nearby      combines EffectResults,         offsets, bubbles,
   clickables, click     weighted by probability,        spinner, confidence)
   history, elapsed)     seeded RNG                              │
        │                        │                               ▼
        └── onPointerDown/Up ─────┴──► click redirection ──► dispatch effective
                                       (offset/ignore/dbl/swap)   click to sandbox
```

Effects are pure and deterministic given a seed → "Replay this exact suffering".

## Build order (matches spec priorities)

1. Tooling scaffold + install ✳ (Tailwind v4 CSS-first, Vite 8, Vitest 4, vite-plugin-electron)
2. `shared-types`
3. `chaos-engine` + unit tests
4. `cursor-effects` (12 effects) + unit tests
5. Cursor rendering + pointer tracking (renderer)
6. Safe Demo Sandbox + fake mini-apps
7. Dashboard + presets + onboarding
8. Demo mode + escalation + MAKE IT WORSE + presenter shortcuts
9. Electron shell (main/preload/tray/IPC/panic/session-timer/system-mode gate)
10. Sound design + native-helper stub
11. Verify: vitest green, `vite build`, Playwright drives the sandbox, screenshots
12. Docs, packaging (electron-builder mac), final polish

## Verification strategy

- **Unit**: Vitest over `chaos-engine` + `cursor-effects` (pure math is fully deterministic).
- **Build**: `vite build` (web) + full electron build must compile clean.
- **Interaction**: launch web dev server, drive the sandbox with Playwright — verify click
  redirection, evasive popup/close-after-3, triplet CAPTCHA, panic bypass — capture screenshots.
- **Package**: electron-builder mac target.

## Safety invariants (enforced in code + tests)

- Panic path bypasses the entire ChaosEngine (test asserts a fully-loaded engine returns the
  identity transform once `panic()` is latched).
- Session timer auto-disables at the configured max (default 10 min).
- The evasive "Turn Off" / close controls become fully normal after 3 failed attempts.
- System mode requires an explicit confirmation screen and shows a persistent indicator.
