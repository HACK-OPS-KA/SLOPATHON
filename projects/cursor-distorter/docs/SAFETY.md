# Safety

Cursor Distorter is comedy software with the brakes wired directly to the frame. This document
enumerates every emergency control and every safety invariant. The single governing rule:

> **The user can never be locked out.**

## Terminal recovery (start here if anything feels stuck)

If the UI is misbehaving or you just want everything to stop from outside the app, run this from the
project directory:

```bash
pnpm recover
# or, equivalently:
node scripts/recover.mjs
```

`scripts/recover.mjs` prints a clear banner, then safely attempts to terminate any running Cursor
Distorter Electron processes and the optional native helper, and prints the manual commands you can
run yourself. It is **safe and idempotent**, it only restores normal input, and it **deletes
nothing**. If you prefer to do it by hand, the script tells you exactly which commands it ran (e.g.
`pkill -f "Cursor Distorter"` and `pkill -f cursor-distorter-helper`).

## Emergency controls

- **Global panic — `⌘⇧⎋` (Cmd+Shift+Esc).** The primary escape hatch. It **bypasses the entire
  distortion engine**: the moment it is pressed, every effect stops contributing and the engine
  returns the identity transform (no offset, full smoothing, unit sensitivity, no extra cursors, no
  click alteration). It works in the browser (via a keydown handler) and in Electron (via a global
  shortcut forwarded from the main process), and it works no matter how many effects are enabled.
- **Menu-bar "Disable all distortion" kill switch.** In the packaged app, the tray menu has a
  one-click item that disarms distortion immediately.
- **Max session timer.** Distortion auto-disables when the session reaches its configured maximum.
  The **default is 10 minutes** (configurable from 1 to 60). Once the timer expires, the engine
  returns the identity transform even if nothing else is touched.
- **Auto-disable on failure.** Distortion turns itself off automatically on a crash, on
  native-helper disconnect, and on app quit. Quitting the app **always restores normal input
  first**.
- **Visible active indicator.** Whenever distortion is active, a menu-bar / tray indicator reflects
  the state (`off` / `sandbox` / `system`). System Distortion Mode is never active without a
  visible indicator.
- **System mode confirmation screen.** System Distortion Mode cannot start silently. It requires an
  explicit confirmation that states your real cursor will be affected across all apps until you
  disable it, the timer expires, or you press `⌘⇧⎋`.
- **The evasive controls always give up.** The "Turn Off" button and the popup's close control
  squirm away only briefly. After **3 failed attempts** they stop evading entirely and behave
  completely normally — the escape hatch is guaranteed to be reachable. (They are also marked as
  escape hatches so the global chaos effects never pile onto them.)

## Safety invariants

These are enforced in code (and asserted in the unit tests), not just documented:

- **Panic bypasses the whole engine.** `ChaosEngine.panic()` latches a panic flag, deactivates, and
  cleans up every effect. The active check runs at the top of every frame and every click, so a
  fully-loaded, maximum-intensity engine returns the identity transform once panic is latched. A
  unit test asserts exactly this.
- **The session timer is authoritative.** When the session is expired, the engine is inactive
  regardless of the `active` flag.
- **The evasive "Turn Off" / close controls become fully normal after 3 failed attempts.** This is
  the close-evasion release; the sandbox reads it and the controls stop moving.
- **System mode requires explicit confirmation and a persistent indicator.** It is unavailable in
  the browser and always visibly indicated when active.

## What Cursor Distorter never does

By construction — and as a hard product boundary — Cursor Distorter has **no**:

- persistence or stealth startup (it does not install itself to run at login or hide in the
  background)
- credential capture (no passwords, no secrets)
- input logging (no keystrokes, no typed text)
- screenshots or screen capture
- clipboard access
- remote control or command-and-control of any kind

The Electron bridge exposed to the renderer is a narrow, context-isolated surface with no
filesystem, input-logging, clipboard, or remote capability. System-mode pointer data is processed
in memory and discarded. See [`docs/PERMISSIONS.md`](PERMISSIONS.md) for the data details and
[`docs/KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) for the honest boundaries of System Distortion
Mode.
