# Permissions

Cursor Distorter is built so that the fun default requires **no operating-system permissions at
all**, and the one mode that does request a permission is explicit, visible, and easy to revoke.

## Why there are two modes

A web page — and by extension an Electron renderer running the same page — **cannot move or
redirect the real operating-system cursor**. The browser sandbox has no API for it, by design. So
Cursor Distorter has two modes:

1. **Safe Demo Sandbox** distorts a cursor it *is* allowed to control: a rendered cursor inside the
   app's own surface. No OS involvement, no permissions.
2. **System Distortion Mode** reaches outside the app using macOS **Accessibility**, which is the
   only sanctioned way for an app to observe and influence pointer input system-wide.

## Safe Demo Sandbox — zero permissions

The Safe Demo Sandbox needs **no** OS permissions. Everything it does happens inside the app's own
window: it hides the real cursor over the sandbox, draws one to three fake cursors, and redirects
clicks among the sandbox's own fake controls. This is why it runs in a plain browser
(`pnpm dev:web` at `http://localhost:5199`) and is the reliable surface for demos and tests.

If you never enable System Distortion Mode, Cursor Distorter never asks the OS for anything.

## System Distortion Mode — requests macOS Accessibility

System Distortion Mode is **optional** and only offered in the packaged desktop app. When you
enable it, the app requests the macOS **Accessibility** permission (Privacy & Security →
Accessibility). This is the standard permission that lets an assistive app observe pointer state
and draw system-wide overlays.

This mode is **never secret**:

- It is gated behind an explicit **confirmation screen** that states, in plain language, that your
  real cursor will be affected across all apps until you disable it, the timer expires, or you press
  `⌘⇧⎋`.
- A **menu-bar / tray indicator stays visible the entire time** it is active.
- `⌘⇧⎋` (Cmd+Shift+Esc) instantly restores normal input.
- The session timer (default 10 minutes) auto-disables it.

See [`docs/KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) for exactly what this mode does today
(decoy cursors via read-only pointer polling) versus what would require the optional native helper
(full pointer movement / click interception, documented as a scaffold and not enabled by default).

## What data is accessed

| Mode | Reads | Uses it for | Retention |
|------|-------|-------------|-----------|
| Safe Demo Sandbox | Pointer events over the app's own window only | Drawing fake cursors, redirecting clicks within the sandbox | In memory; discarded |
| System Distortion Mode | Pointer coordinates (via Accessibility) | Positioning decoy cursors and computing controlled offsets | Processed **in memory and discarded** when the session ends |

Anonymous session statistics (counts and estimates shown in the app) and your local settings are
the only things stored, and they stay on your machine.

## What is never accessed

Regardless of mode, Cursor Distorter **never** reads:

- typed text or keystrokes
- passwords or credentials
- screenshots or window contents
- clipboard contents
- browsing history
- anything outside the demo sandbox (in Safe Demo mode)

There is no keylogging, no screen capture, no network exfiltration, and no remote control. The
Electron bridge exposed to the renderer (`packages/shared-types/src/ipc.ts`) has no filesystem,
input-logging, clipboard, or remote surface at all.

## How to revoke

To revoke Accessibility permission at any time:

1. Open **System Settings**.
2. Go to **Privacy & Security → Accessibility**.
3. Find **Cursor Distorter** and toggle it **off** (or remove it with the `–` button).

Revoking the permission immediately prevents System Distortion Mode from running. The Safe Demo
Sandbox continues to work without any permission. You can also just quit the app — quitting always
restores normal input first — or run the Terminal recovery described in
[`docs/SAFETY.md`](SAFETY.md).
