# Sloppy Keyboard

> A keyboard that makes every letter take the scenic route.

## What is this?

Sloppy Keyboard is a Windows Electron app disguised as a Galton board. Keep it
above a browser, click the launch rail, and a ball tumbles through brass pins.
The lowercase letter in its landing bin is typed into the input that already
has focus.

Ten unique letters are available in each volley. Launch as many as 25 balls at
once; their shared letter bank rerolls after the final ball lands.

```text
click -> gravity -> statistically questionable spelling -> keyboard input
```

## Requirements

- Windows 10 or newer
- Node.js and npm for development
- A normal, non-administrator browser or text editor as the typing target

Windows prevents a normal application from injecting input into an elevated
administrator application. Run the browser and Sloppy Keyboard at the same
permission level.

## Run

```bash
npm install
npm start
```

Focus a text field in another application, then click the dark drop rail at
the top of Sloppy Keyboard. The board is non-focusable, so the other
application should retain keyboard focus.

Press `Ctrl+Alt+K` at any time to minimize or restore the board without
changing the focused typing target.

## Verify

```bash
npm test
npm run typecheck
npm run lint
npm run package
```

## Architecture

- `board-state.ts` owns random letters and volley lifecycle.
- `board-physics.ts` owns Matter.js bodies and landing detection.
- `board-renderer.ts` draws the machine without controlling its behavior.
- `renderer.ts` connects UI, physics, and the restricted preload API.
- `input-service.ts` validates and serializes Windows keyboard output.

Each source file stays below 500 lines so features can be developed in
parallel with fewer overlapping edits.
