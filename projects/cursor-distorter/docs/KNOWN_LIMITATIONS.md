# Known Limitations

Cursor Distorter is deliberately honest about what it can and cannot do. These are the real
limitations, not marketing softeners.

## A renderer cannot redirect the OS cursor's clicks

A browser — and the Electron renderer running the same page — **cannot move the real operating
system cursor or redirect where its clicks land**. There is no web API for it, by design. This is
the fundamental reason the product has two modes.

Consequently, the **Safe Demo Sandbox is the reliable surface**. Inside the sandbox, Cursor
Distorter fully controls a rendered cursor and the sandbox's own fake controls, so every effect —
offsets, triplets, lag, repulsion, click betrayal, the works — behaves exactly and reproducibly.
This is where demos and tests should run.

## System Distortion Mode is currently read-only

System Distortion Mode uses macOS **Accessibility** to render **decoy cursors system-wide** based on
**read-only cursor polling**. It observes where the pointer is and draws additional cursors and
overlays around it. It is always visibly indicated and always reversible.

What it does **not** do out of the box: actually move the real pointer or intercept and redirect
real clicks across other applications. **Full pointer movement and click interception require the
optional native helper**, which is provided as a **documented Swift scaffold and is not enabled by
default**. See [`apps/native-helper/README.md`](../apps/native-helper/README.md). The scaffold
documents where the legitimate CGEvent / Accessibility APIs *would* read mouse coordinates and apply
controlled offsets, but ships no hidden behavior, no input logging, and no stealth.

## Packaging requires macOS

`pnpm package` uses electron-builder targeting macOS and produces the app in
`apps/desktop/release`. Building the packaged desktop app must be done on macOS. The native helper,
if you choose to build it, likewise requires macOS and the Swift toolchain.

## Windows support is not implemented

The architecture is structurally portable — the engine, effects, and Safe Demo Sandbox are
platform-agnostic and would run in a browser on any OS. But System Distortion Mode is macOS-specific
(Accessibility + the Swift helper), and there is **no Windows implementation** of system-wide
distortion today. Windows support is possible but not built.

## Other notes

- The virtual pointer has a **safety clamp**: the rendered cursor is not allowed to diverge unusably
  far from the real hand position, so even at maximum chaos the sandbox stays usable enough to reach
  the escape hatches.
- The **evasive controls always relent** after three failed attempts, by design — so they can never
  become a genuine lock-out. This is a safety feature, not a bug.
- Session statistics and the "confidence" analytics are **intentionally fictional** comedy readouts,
  not real measurements of anything.

For the safety guarantees that hold regardless of these limitations, see
[`docs/SAFETY.md`](SAFETY.md).
