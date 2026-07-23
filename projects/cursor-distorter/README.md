# Cursor Distorter

> A precision-engineered SaaS platform whose entire product is making your mouse cursor slightly worse.
> Your cursor is technically still working.

## Team

- [@Hihatthepirat](https://github.com/Hihatthepirat) — idea, product, suffering
- Claude (Opus 4.8) — pair builder

## What is this?

Cursor Distorter is a deliberately anti-productive **desktop app** (Electron + React + TypeScript) that mildly sabotages your mouse cursor in increasingly absurd — but always reversible — ways. It ships a **Safe Demo Sandbox**: a fake macOS desktop (browser window, expense form, CAPTCHA, cookie banner, calendar, spreadsheet, file cleanup, popups) where every distortion can be demonstrated with zero OS permissions. It also has an optional **System Distortion Mode** that renders decoy cursors system-wide via macOS Accessibility. It runs on a laptop (browser or Electron). In one line, the demo looks like: *a venture-backed analytics dashboard that, once you press "Arm distortion", makes you slowly worse at using a computer.*

## Why should this not exist?

Pick 1–3 — we picked all of them:

- **Solves a problem nobody has** — cursors already work fine.
- **Wildly over-engineered for the outcome** — a deterministic, seedable `ChaosEngine`, 12 pluggable effect modules, an adaptive "counter-adaptation" rules engine, and a live analytics dashboard… to move your click 20px to the left.
- **Morally questionable UX (but harmless)** — it wants you to wonder "did I miss?", "is my mouse broken?", "which cursor is mine?" — while never actually locking you out.
- **Takes the long way on purpose** — one effect is literally called *The Long Way Around*.

It's built to look like a company that raised €12M to solve a problem that did not exist.

## What it does

**Actually does:**
- **12 configurable cursor-distortion effects**: Imprecision Field (clicks land nearby), Cursor Triplets (three identical cursors, none is the real one), Input Lag, Overshoot, Button Repulsion (targets edge away), Cursor Drift, Sensitivity Roulette, Micro-Freezes, Click Betrayal (ignore/double/delay/phantom/swap), The Long Way Around, Social Cursor (passive-aggressive speech bubbles), Cursor Confidence (fake analytics).
- **Central `ChaosEngine`** with seeded RNG → *"Replay this exact suffering."* Effects can be combined, weighted by probability, scheduled, and triggered by speed / proximity / clicks.
- **6 presets** including **Live Demo Catastrophe** (starts subtle, escalates over 3 minutes) and a giant **MAKE IT WORSE** button.
- **Safe Demo Sandbox** — a full fake desktop with mini-apps, including an "Accept all" cookie button that's easy and a "Reject all" that isn't, and a "Turn Off Cursor Distorter" button that becomes clickable only after 3 failed attempts.
- **Comically professional dashboard**: status telemetry, effect mixer, Live Cursor Map (intended vs. executed path), and convincingly meaningless live graphs (cursor trust, productivity interception, avoided responsibility).
- **Safety, enforced in code + tests**: global panic shortcut `⌘⇧⎋` bypasses *everything*, sessions auto-disable on a timer, a visible active indicator, and no persistence / logging / stealth. You can never be locked out.
- **37 unit tests**, full TypeScript typecheck, and a headless Playwright interaction test — all green.

**Should do (but doesn't yet):**
- Full system-wide *click interception* and pointer *movement* (currently a documented, opt-in native-helper Swift scaffold — System Distortion Mode ships read-only decoy cursors).
- Windows support (the code is structured for it; not implemented).

## How it works
```text
your real mouse
      │
      ▼
CursorContext (position, velocity, nearby clickable targets, click history, seed)
      │
      ▼
ChaosEngine → runs enabled effects → composes one FrameDistortion / ClickTransform
      │
      ▼
rendered fake cursor(s) + redirected clicks   ── "questionable output"
      │
      └── panic (⌘⇧⎋) bypasses the whole engine → identity transform → you're free
```

## Run it

### Requirements

#### Software
- **OS:** macOS (Electron target). The browser sandbox runs anywhere Chromium runs.
- **Language/runtime:** Node.js ≥ 20, TypeScript.
- **Package manager:** pnpm 9 (`corepack enable` or `npm i -g pnpm`).
- **Accounts / API keys (if any):** none. No secrets, no accounts, no network required.
- **Other dependencies:** installed via pnpm (Vite, React, Electron, Tailwind, Framer Motion, Zustand).

#### Hardware (if any)
- A computer with a mouse or trackpad (the victim).

### Setup

```bash
cd projects/cursor-distorter
pnpm install
```

### Start

```bash
# Interactive MVP in the browser (Safe Demo Sandbox, zero permissions):
pnpm dev:web        # → http://localhost:5199

# Full Electron desktop app:
pnpm dev

# Verify it:
pnpm test           # 37 unit tests
pnpm typecheck

# Build / package a macOS app:
pnpm build
pnpm package        # → apps/desktop/release/

# Emergency (restores normal input, deletes nothing):
pnpm recover
```

## Demo

- Screenshots in [`assets/`](assets/) (dashboard armed, cursor triplets, live-demo escalation) and more in [`docs/screenshots/`](docs/screenshots/).
- 90-second live-demo script: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).
- Full engineering writeup: [`README-product.md`](README-product.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

**At-bat, in four beats:**
1. *The bad idea:* an app that makes your cursor worse, on purpose.
2. *The build:* a fake macOS desktop + a 12-effect chaos engine + a €12M-looking analytics console.
3. *The proof:* `pnpm dev:web`, press **Arm distortion**, try to reject the cookie banner.
4. *The damage:* three cursors, a fleeing "Turn Off" button, and a straight-faced graph of your "avoided responsibility" — then `⌘⇧⎋` and everything is fine again.
