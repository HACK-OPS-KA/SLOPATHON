# Architecture

Cursor Distorter is a pnpm monorepo. The distortion logic is pure and testable; the app shell is
thin. This document describes how the pieces fit together and, most importantly, why the product
can always be turned off.

## Monorepo layout

```
cursor-distorter/
  apps/
    desktop/          Electron main + preload + React/Vite renderer
    native-helper/    Documented Swift accessibility-helper scaffold (optional, not built by default)
  packages/
    shared-types/     Cross-cutting TS types + the Electron IPC contract (source-consumed)
    chaos-engine/     Seeded RNG, ChaosEngine, adaptive rules, presets, escalation
    cursor-effects/   The 12 CursorEffect modules (pure logic) + EFFECT_CATALOG metadata
    ui/               Shared React primitives
  docs/               Architecture, permissions, safety, demo script, shortcuts, limitations
  scripts/            Recovery / smoke / screenshot scripts
```

Packages are consumed as source via workspace references (`workspace:*`), so there is no build
step between them and no stale artifacts. `shared-types` has no runtime dependencies — effects
depend only on types, which keeps the engine and effects trivially unit-testable.

## The ChaosEngine

`packages/chaos-engine` exports the `ChaosEngine` class. It composes independent effect modules
into a single per-frame distortion and a single per-click transform. It owns:

- effect registration, enable/intensity/probability, and per-effect parameters
- scheduling, triggers, and cooldowns (an effect only runs when it is *eligible*)
- the deterministic RNG stream
- behavior tracking (movement, failed clicks, close attempts) and session tracking (duration,
  prevented clicks, the session timer)
- an adaptive controller that can lightly reconfigure effects and emit fake "model" commentary
- **the panic bypass that guarantees reversibility**

Effects are composed additively. Positional offsets sum; smoothing takes the minimum (laggiest
wins); sensitivity multiplies; ghost cursors, messages, path bends, confidence readouts, and
target nudges accumulate. On the click path, an `ignore` short-circuits everything, otherwise
offsets sum, `double`/`fakeOnly`/`swapButton` flags OR together, and the largest delay wins.

## The CursorEffect interface

Every distortion module in `packages/cursor-effects` implements one small interface (defined in
`packages/shared-types/src/effects.ts`):

```ts
interface CursorEffect {
  readonly id: EffectId;
  readonly name: string;
  readonly description: string;
  enabled: boolean;
  intensity: number;    // 0..1
  probability: number;  // 0..1
  update(context: CursorContext): EffectResult;
  onPointerMove?(event: PointerEventContext): EffectResult;
  onPointerDown?(event: PointerEventContext): EffectResult;
  onPointerUp?(event: PointerEventContext): EffectResult;
  cleanup(): void;
}
```

An `EffectResult` is a bag of optional contributions (offset, smoothing, sensitivity, freeze,
ghosts, message, spinner, path bend, confidence readouts, target nudges, click transform). Because
each effect is a pure function of its `CursorContext`, the same inputs always produce the same
output. The twelve effects, in canonical order, are: Imprecision Field, Cursor Triplets, Input Lag,
Overshoot, Button Repulsion, Cursor Drift, Sensitivity Roulette, Micro-Freezes, Click Betrayal, The
Long Way Around, Social Cursor, and Cursor Confidence.

## Seeded RNG — "Replay this exact suffering"

All randomness flows through a single seedable stream (`SeededRandom` in `chaos-engine`, behind the
`RandomStream` interface in `shared-types`). It provides `next`, `range`, `int`, `bool`, `pick`,
`gaussian`, `onCircle`, and `fork(label)` for stable, independent sub-streams. Because every
distortion draws from this stream and effects are otherwise pure, **a given seed reproduces exactly
the same sequence of misbehavior** — the "Replay this exact suffering" property. The engine's
`setSeed` / `reset(seed)` re-create the stream so a session can be replayed deterministically, which
is also what makes the unit tests exact.

## The renderer chaos loop

`apps/desktop/src/cursor/ChaosLoop.ts` owns the per-frame render loop. Each frame:

```
real pointer (over the sandbox surface)
        │
        ▼
  CursorContext  ──►  ChaosEngine.frame()  ──►  FrameDistortion
  (real pos, velocity,   runs eligible effects,   (offset, smoothing,
   nearest clickable,     composes results,         sensitivity, freeze,
   viewport, elapsed,     seeded RNG)               ghost cursors, message,
   behavior, priorities)         │                  spinner, path bend,
        │                        │                  confidence, target nudges)
        │                        ▼
        │                 rendered cursor pipeline:
        │                 sensitivity scale → additive offsets → micro-freeze
        │                 → lag smoothing → path bend → 1..3 rendered cursors
        │
        └── pointerdown/up ──► ChaosEngine.pointerDown/Up() ──► ClickTransform
                               (offset / ignore / double / delay / swap / fakeOnly)
                                       │
                                       ▼
                               click redirection: dispatch the *effective* click
                               to the target under the rendered cursor (or a
                               phantom animation with no real activation)
```

The loop keeps three positions: the real pointer `M`, a `virtualP` (after sensitivity scaling),
and the rendered `R` (after offsets, freeze, and lag smoothing). A safety clamp prevents the
virtual pointer from diverging unusably far from the hand. A throttled (~8 Hz) live snapshot is
pushed to the dashboard for the analytics panels.

## The target registry

`apps/desktop/src/cursor/registry.tsx` is a non-reactive registry of clickable targets and drop
zones in the sandbox. Sandbox controls attach via the `useTarget` hook, which records each
element's live rectangle, importance, kind, priority tag, and whether it is an "escape hatch."
The registry provides:

- `computeTargets()` — a snapshot of enabled targets as engine-ready `ClickableTarget`s (used to
  find the nearest clickable and to power Button Repulsion / Cursor Drift's opinions about "useful"
  vs "useless" UI)
- `hitTest(point)` — the topmost (smallest-area) target under a point, used to resolve where an
  effective click actually lands
- `applyNudges()` — eases repulsion offsets so buttons spring away from the cursor
- hover/flash bookkeeping for visual feedback

Because the engine only ever sees rectangles and importance scores — never DOM or content — the
distortion logic stays pure and portable.

## Browser vs Electron split (`NO_ELECTRON`)

The renderer runs in two hosts from a single codebase:

- **Browser** (`NO_ELECTRON=1`, e.g. `pnpm dev:web` on port 5199): Safe Demo Sandbox only. Used for
  development and automated tests. No Electron, no native code, no OS permissions.
- **Electron** (`pnpm dev` / `pnpm package`): the sandbox **plus** System Distortion Mode (an
  overlay window, a tray indicator, the global panic shortcut, IPC, the session timer, and the
  system-mode confirmation gate).

The split is a runtime feature-detect, not a build fork. The Electron preload
(`apps/desktop/electron/preload.ts`) exposes a narrow, context-isolated bridge on
`window.cursorDistorter` (strict `contextIsolation`, `nodeIntegration: false`). The renderer checks
for that object: present → Electron capabilities are available; absent → browser/sandbox mode. The
bridge surface (`packages/shared-types/src/ipc.ts`) is deliberately tiny and safe — panic /
presenter-key / disable-all callbacks, an active/indicator setter, the system-mode request/stop/
status calls, and quit. It exposes **no** filesystem, input logging, clipboard, or remote access.

## The panic-bypass invariant

Reversibility is enforced in the engine itself, not bolted on in the UI. `ChaosEngine.panic()`
latches a `panicked` flag, sets `active = false`, and calls `cleanup()` on every effect. The
active check (`this.active && !this.panicked && !this.session.isExpired(now)`) is consulted at the
top of `frame()`, `pointerDown()`, and `pointerUp()`. The moment panic is latched — or the session
timer expires — every distortion path returns the **identity transform** (zero offset, full
smoothing, unit sensitivity, no ghosts, no click alteration), regardless of how many effects are
enabled or how high the intensity is. This is asserted directly in the unit tests: a fully-loaded
engine returns the identity once `panic()` is called. The same guarantee is wired to the global
`⌘⇧⎋` shortcut (browser and Electron) and the tray kill switch, so there is no engine state from
which the user cannot immediately escape.
