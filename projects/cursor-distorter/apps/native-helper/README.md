# Cursor Distorter — Native Helper (optional scaffold)

This is the **optional** macOS accessibility helper for Cursor Distorter's **System Distortion
Mode**. It is a **documented Swift Package scaffold** — an honest stub, not a finished component —
and it is **not built as part of the normal app build**.

## Purpose

Cursor Distorter's Safe Demo Sandbox needs no OS access. System Distortion Mode reaches outside the
app to draw decoy cursors and apply controlled pointer offsets across the whole system, and macOS
only allows that through the **Accessibility** permission. This helper is where that system-level
work would live.

Today, System Distortion Mode renders decoy cursors using **read-only cursor polling** and does not
require this helper. Full pointer movement and click interception across other apps is exactly what
a real version of this helper would provide — which is why it is called out as a scaffold and left
disabled by default. See [`../../docs/KNOWN_LIMITATIONS.md`](../../docs/KNOWN_LIMITATIONS.md).

## What the scaffold actually does

The stub (`Sources/CursorDistorterHelper/main.swift`) does exactly one real thing:

- calls `AXIsProcessTrusted` / `AXIsProcessTrustedWithOptions` to check whether the process is
  trusted for Accessibility, and prints the status.

Everything else is **comments** documenting precisely where the legitimate CoreGraphics /
Accessibility APIs *would* read mouse coordinates, compute a small controlled offset, warp the
pointer, and intercept clicks — with the safety boundaries spelled out inline. It ships **no**
distortion behavior, **no** input logging, and **no** stealth of any kind.

## Building it

The helper is optional and separate from the JS/TS monorepo build. To build it you need macOS and
the Swift toolchain (Xcode command-line tools):

```bash
cd apps/native-helper
swift build
```

Run the built stub to see the Accessibility status check:

```bash
swift run cursor-distorter-helper
```

Build artifacts (`.build/`) are git-ignored.

- `swift-tools-version`: **5.9**
- Platform: **macOS** (13+)
- Executable target: **`cursor-distorter-helper`**

## Safety boundaries

If this scaffold is ever developed into a working helper, it must remain within the same hard
boundaries the rest of the product follows:

1. **Always visible.** A menu-bar / on-screen indicator stays up the entire time it is active. It
   must never run invisibly.
2. **Always consented.** It only runs after the user explicitly enables System Distortion Mode
   through the app's confirmation screen and grants Accessibility.
3. **Always reversible.** The global panic shortcut (`⌘⇧⎋`), the max session timer, app quit, and
   `pkill -f cursor-distorter-helper` must each fully stop it and restore normal input. Any pointer
   offset is transient and cleared on stop.
4. **Never malicious.** No input logging, no credential capture, no screenshots, no clipboard, no
   remote control, no persistence or stealth startup. Pointer coordinates are processed in memory
   and discarded.

This is comedy software. The helper must never be used to trap, surveil, or deceive anyone.

## Status

**This is a scaffold.** It compiles and reports Accessibility status; it does not move your cursor.
It exists to document the intended, consented, reversible integration point — not to enable
system-wide distortion by default. To stop anything at any time, see
[`../../docs/SAFETY.md`](../../docs/SAFETY.md) (`pnpm recover` / `node scripts/recover.mjs`).
