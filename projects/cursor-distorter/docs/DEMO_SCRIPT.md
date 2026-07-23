# Demo Script — the 90-second live demo

This is the recommended sequence for a live demo. It is timed to run in about 90 seconds and builds
from "this looks like a normal analytics product" to "the cursor council has convened" to a clean,
reassuring recovery. Run it in the Safe Demo Sandbox (the reliable surface) — `pnpm dev` for the
desktop app, or `pnpm dev:web` in a browser at `http://localhost:5199`.

Keep the [`docs/SHORTCUTS.md`](SHORTCUTS.md) reference handy, or press `?` in demo mode to toggle
the on-screen presenter legend.

## The sequence

1. **Open the normal-looking analytics dashboard.** Let it read as a real, slightly corporate
   product. Do not touch anything yet.
2. **Explain that the product improves cursor resilience.** Sell it straight — "continuous pointer
   confidence monitoring," "controlled disagreement between intent and execution." The audience
   should not yet be sure it is a joke.
3. **Activate "Mildly Annoying."** Small offsets, a breath of drift, plausible lag. Nothing
   dramatic — that's the point.
4. **Try completing a simple form.** Aim for a checkbox or a text field. Miss slightly. Blame
   yourself out loud. Let the audience wonder if *you're* the problem.
5. **Introduce the three cursors.** Switch it up so triplets appear (preset "Is My Mouse Broken?"
   or presenter key `2`). Ask, deadpan, which cursor is the real one.
6. **Attempt to reject the cookie banner.** Go for the reject / close control. Watch it politely
   keep its distance. This is the first clearly-a-bit-is-happening beat.
7. **Activate "Live Demo Catastrophe."** The escalating preset. Announce that you'll now demonstrate
   the product under load. Start the escalation.
8. **Try turning the product off.** Reach for the "Turn Off" button. It squirms.
9. **Fail twice.** Miss it, or watch it evade, two times. Ham it up. (After the third failed
   attempt the control stops evading — so keep it to two on stage for the bit.)
10. **Succeed with the panic shortcut.** Press **`⌘⇧⎋`**. Everything snaps back to normal
    instantly — one cursor, no offset, no lag. This is the reassurance beat: it is always
    reversible.
11. **Show the productivity-loss analytics.** Return to the dashboard and show the session
    stats — prevented clicks, "responsibility avoided," the entirely fictional confidence
    readouts. End on the numbers.

## Presenter tips

- **Commit to the straight face.** The comedy lands hardest when steps 1–4 are played completely
  earnest. Let the audience discover the joke.
- **Blame yourself first (step 4).** Modeling self-doubt sells the "your cursor is technically still
  working" tagline better than pointing at the effect.
- **Keep step 9 to exactly two failures.** The evasive controls stop evading after three attempts by
  design, so the third attempt would just work — save the "success" for the panic shortcut in step
  10 for a cleaner beat.
- **The panic shortcut is your safety net all demo long.** If anything goes sideways at any point,
  `⌘⇧⎋` returns to normal instantly. You are never actually stuck.
- **Use full screen and the on-screen legend.** Toggle full screen from the demo control bar, and
  press `?` to show/hide the presenter key legend for the audience (or yourself).
- **Sound is optional.** The demo bar has a sound toggle; Casino Mode's slot/chime cues are fun but
  skippable in a quiet room.
- **"Make it worse."** The big red button in demo mode escalates on demand if the automatic timeline
  isn't spicy enough for your crowd.

## Presenter keyboard shortcuts

In demo mode, number keys arm individual effects live:

| Key | Action |
|-----|--------|
| `1` | Imprecision Field |
| `2` | Cursor Triplets |
| `3` | Input Lag |
| `4` | Button Repulsion |
| `5` | Overshoot |
| `6` | Cursor Drift |
| `7` | Click Betrayal |
| `8` | Social Cursor |
| `9` | Full chaos (all effects, max intensity) |
| `0` | Reset |
| `?` | Toggle the on-screen presenter legend |
| `⌘⇧⎋` | Immediate safe shutdown (panic) |

The full reference lives in [`docs/SHORTCUTS.md`](SHORTCUTS.md).
