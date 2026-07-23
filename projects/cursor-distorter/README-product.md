# Cursor Distorter

> Cursor Distorter is a precision-engineered productivity obstruction platform. It introduces controlled disagreement between user intent and pointer execution.

**Your cursor is technically still working.**

---

## What it is

Cursor Distorter is a deliberately anti-productive macOS desktop app that mildly sabotages
the mouse cursor for comedic effect — always reversibly. It is a polished Electron + React +
TypeScript application (a pnpm monorepo) that renders extra cursors, nudges your clicks a few
pixels off, adds a plausible amount of lag, and reports rich, entirely fictional analytics about
your "cursor confidence."

Nothing here is malware and nothing is permanent. The whole thing is built around a single
promise: **the user can never be locked out.**

### Product philosophy

- **Mild inconvenience, not damage.** Every effect is a small, survivable annoyance. You will
  blame yourself first — which is the joke.
- **Uncertainty over obstruction.** The fun is in *not being sure* whether your mouse is broken.
- **Comedy first.** The escalating "Live Demo Catastrophe" exists to get a laugh, not to trap you.
- **Reversibility is a feature, not an afterthought.** A global panic shortcut, a menu-bar kill
  switch, a max session timer, auto-disable on crash, and a Terminal recovery script all guarantee
  a way out.
- **Safety and honesty.** System-wide distortion is never secret. When it is on, an indicator is
  always visible. No keystrokes, passwords, screenshots, clipboard, or browsing data are ever read.

## Two operating modes

Cursor Distorter runs in one of two clearly distinct modes. A browser cannot control the operating
system's cursor, which is exactly why there are two.

1. **Safe Demo Sandbox** — the default. Zero OS permissions. All distortion happens *inside the
   app's own surface* (a fake analytics dashboard with real-feeling mini-apps), so it works in a
   plain browser and is fully testable. This is the reliable demo surface and where every effect
   is guaranteed to behave.
2. **System Distortion Mode** — optional, Electron-only. Requests macOS **Accessibility** permission
   to render decoy cursors system-wide. It is **never secret**: a menu-bar indicator stays visible
   the entire time, an explicit confirmation screen gates it, and `⌘⇧⎋` instantly restores normal
   input. See [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) and
   [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) for exactly what this mode does and
   does not do today.

## Prerequisites

- **Node.js** `>= 20`
- **pnpm** `9`

## Install

```bash
pnpm install
```

## Development

```bash
pnpm dev       # Electron app (Safe Demo Sandbox + System Distortion Mode)
pnpm dev:web   # Browser-only Safe Demo Sandbox at http://localhost:5199
```

`pnpm dev:web` runs the renderer with `NO_ELECTRON=1`, so there is no Electron, no native code, and
no OS permissions involved — just the sandbox in your browser.

## Build

```bash
pnpm build       # Build the desktop (Electron) app
pnpm build:web   # Build the browser-only sandbox into apps/desktop/dist-web
```

## Package

```bash
pnpm package     # Build and package the macOS app with electron-builder
```

The packaged application is written to `apps/desktop/release`. Packaging requires macOS.

## Test

```bash
pnpm test        # Run the Vitest unit suite (chaos-engine + cursor-effects)
pnpm typecheck   # Type-check the whole monorepo with tsc --noEmit
```

The engine and effects are pure and deterministic, so the unit tests are exact. A Playwright
smoke test (`scripts/smoke.mjs`) can additionally drive the live sandbox in a real browser.

## The 12 effects

Every distortion module lives in `packages/cursor-effects` and is registered in the
`EFFECT_CATALOG`. In canonical order:

| # | Effect | What it does |
|---|--------|--------------|
| 1 | **Imprecision Field** | Redirects each click to a more innovative location nearby. |
| 2 | **Cursor Triplets** | Three identical cursors. None of them will confess. |
| 3 | **Input Lag** | The rendered cursor trails a moment behind reality. |
| 4 | **Overshoot** | Arrives past the target, then springs back. |
| 5 | **Button Repulsion** | Clickable targets keep a respectful distance. |
| 6 | **Cursor Drift** | A slow, directional opinion about where you should be. |
| 7 | **Sensitivity Roulette** | Pointer sensitivity, continuously re-optimized. |
| 8 | **Micro-Freezes** | Brief, deniable pauses. Rarely dramatic. |
| 9 | **Click Betrayal** | Ignore, double, delay, shift, phantom, or swap a click. |
| 10 | **The Long Way Around** | Bends the path into an arc, loop, or scenic detour. |
| 11 | **Social Cursor** | Small speech bubbles with strong opinions. |
| 12 | **Cursor Confidence** | Live analytics with no basis in reality. |

## The 6 presets

Presets layer a curated set of effects on top of a starting intensity.

| Preset | Vibe |
|--------|------|
| **Mildly Annoying** | You'll blame yourself first. Small offsets, a light breeze of drift, plausible lag. |
| **Is My Mouse Broken?** | Technically, no. Triplets, roulette sensitivity, spring overshoot, phantom clicks. |
| **Executive Productivity** | Optimized for everything except the task. Avoids useful controls, reports confidence. |
| **Group Project** | Someone else can handle this. Pauses before work, delegates responsibility. |
| **Casino Mode** | Every click is a rare win. Probability meters, fake streaks, celebratory sounds. |
| **Live Demo Catastrophe** | Starts subtle. Does not stay subtle. Auto-escalates over three minutes. |

## Emergency controls & recovery

There is always a way out. In rough order of convenience:

- **Global panic — `⌘⇧⎋` (Cmd+Shift+Esc).** Bypasses the entire distortion engine instantly and
  latches a safe state. Works in the browser and in Electron.
- **Menu-bar "Disable all distortion".** The tray kill switch, always one click away in the
  packaged app.
- **Max session timer.** Distortion auto-disables at the configured maximum — **default 10 minutes**.
- **Auto-disable on failure.** Distortion turns itself off on a crash, on native-helper disconnect,
  and on app quit; quitting always restores normal input first.
- **Terminal recovery.** From the project directory, run:

  ```bash
  pnpm recover
  # or, equivalently:
  node scripts/recover.mjs
  ```

  This stops any running Cursor Distorter processes and restores normal input. It deletes nothing.

See [`docs/SAFETY.md`](docs/SAFETY.md) for the complete list of invariants.

## Privacy

Cursor Distorter stores **only local settings and anonymous session statistics** (counts and
estimates). It **never** logs or collects:

- typed text or keystrokes
- passwords or credentials
- screenshots or window contents
- clipboard contents
- browsing history
- anything outside the demo sandbox

In System Distortion Mode, pointer coordinates are **processed in memory and discarded** when the
session ends. There is no persistence, no stealth startup, no remote control, and no telemetry
beyond the local, anonymous stats you can see in the app. See
[`docs/PERMISSIONS.md`](docs/PERMISSIONS.md).

## Known limitations

A browser or Electron renderer cannot redirect the real OS cursor's clicks — which is why the Safe
Demo Sandbox is the reliable surface, and why full system-wide pointer interception is a documented
(not-enabled-by-default) native helper scaffold. Read the honest details in
[`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the monorepo, the ChaosEngine, the chaos loop,
  seeded RNG, and the browser-vs-Electron split.
- [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) — what each mode needs, what data is and isn't
  accessed, and how to revoke Accessibility.
- [`docs/SAFETY.md`](docs/SAFETY.md) — every emergency control and safety invariant.
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — the recommended 90-second live demo.
- [`docs/SHORTCUTS.md`](docs/SHORTCUTS.md) — the keyboard reference.
- [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md) — honest limitations.
- [`apps/native-helper/README.md`](apps/native-helper/README.md) — the optional, documented Swift
  accessibility-helper scaffold.

Demo captures used throughout the docs live in [`docs/screenshots/`](docs/screenshots/).

## Safety

This is comedy software with brakes wired directly to the frame. The panic shortcut bypasses the
engine entirely, the session timer expires on its own, and a Terminal command restores everything
even if the UI is misbehaving. **You can never be locked out of your own machine.**
