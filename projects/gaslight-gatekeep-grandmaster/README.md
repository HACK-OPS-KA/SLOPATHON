# GASLIGHT · GATEKEEP · GRANDMASTER

> Chess, but the engine hates you personally. Instead of setting the bot's ELO, you set its **Roast Level** — and it insults you, gaslights the board, steals your Aura and jumpscares you with the Slopathon poster.

## Team

- Lionel Pillich ([@Lionel-Pillich](https://github.com/Lionel-Pillich))

## What is this?

A single-file browser chess game whose only real feature is emotional damage. It runs a working chess engine (legal move generation, check, checkmate, stalemate, castling) purely so it can *correctly* detect the exact moment you hang your queen — and then roast you for it by name, out loud, through your speakers.

Instead of an ELO slider it has a **Roast Level** slider (1 = "harmless (it lies)" to 5 = "GOES TOO FAR"). Instead of a score it tracks **Aura**, which visibly evacuates your body in red numbers every time you blunder. It runs on any laptop in Chrome, no install, no build step, no dependencies, no API keys — just open the HTML file and suffer.

The demo looks like this: someone plays chess on a projector while a rotating cast of German text-to-speech voices explains why they are a disappointment.

## Why should this not exist?

- **wildly over-engineered for the outcome** — full attack/defense map, material-risk evaluation and legal-move generation, built exclusively to power insults
- **morally questionable UX (but harmless)** — the board lies to you, swaps your pieces and insists it was always that way
- **solves a problem nobody has** — chess engines were already better than us; they just weren't mean about it

## What it does

**Actually does:**

- **Real chess engine** — legal moves, check/checkmate/stalemate detection, castling, a greedy bot with a check-seeking bonus
- **Real blunder detection** — computes attackers/defenders per square and material-at-risk, so it knows *which* piece you hung and calls it out by name ("Deine Dame hängt")
- **Roast Level instead of ELO (1–5)** — scales insult severity, Aura loss, sabotage frequency and jumpscare probability
- **Aura system** — the actual score. `-9000 AURA` in giant red numbers, with a screen-wide vignette flash
- **~120 curated German roasts** across 8 situation categories, plus a 🌶️ SPICY pool of chess double-entendres that fires on roughly every 4th line (toggleable mid-demo)
- **Voice personas that switch by play style** — a `recklessness` meter tracks how wildly you sacrifice; play loose enough and the bot switches to a flirty voice and tells you you're playing dirty. Demon voice for blunders, chirpy gremlin for boring moves, unsettling therapist voice for toxic positivity. Auto-cycles through every German system voice installed
- **Board sabotage** — turns your pieces into household appliances, sets squares on fire, secretly swaps two of your pieces and gaslights you about it, makes pieces go on strike until you bribe them by hammering spacebar
- **Cheat buttons** — 🐐 Magnus move (perfect move, then punishes you with crying-baby rain), 🧒 Kevin age 6 (bot crashes, you move again), 🍺 buy the bot a beer (it plays drunk for 2 moves, screen blurs), ⏩ double move
- **🎤 Roast-Back microphone** — hold the button and insult the bot out loud; speech recognition scores your roast. Good roast = free double move. Weak roast = you lose a piece
- **Situational visual FX** — the FX target the exact piece being roasted: red pulsing halo on the hanging piece, golden spotlight on free material you ignored, RGB glitch, screen shake, speed lines, emoji particle bursts, vaporwave wash during flirt mode
- **SLOPATHON stalker easter egg** — the bot whispers "Ich weiß wo du wohnst… Marktplatz. 23. Juli." and then slams the actual event poster on screen as a full-screen jumpscare with a buzzer
- **Audience mode** — projector layout with a giant Aura counter, a localStorage Aura leaderboard, and keys `1`–`5` so bystanders can vote to rotate the board, set fires, swap pieces or trigger jumpscares

**Should do (but doesn't yet):**

- LLM-generated roasts about the specific move (the curated pool carries it; the hook is designed but not wired)
- En passant and pawn promotion (the bot will simply never mention it)
- Webcam so it can roast your face too

## How it works

```text
your move -> legal move generation -> attacker/defender map per square
          -> material-at-risk evaluation -> verdict (hangBig | hangPiece | missed |
             brilliant | good | trade | toxic | meh)
          -> Aura delta + roast line + voice persona + targeted screen FX
          -> occasional sabotage / jumpscare / SLOPATHON stalker
          -> bot moves -> repeat until self-esteem = 0
```

## Run it

### Requirements

#### Software

- OS: any (macOS / Windows / Linux)
- Language/runtime: none — plain HTML/CSS/JS, zero dependencies, zero build step
- Package manager: none
- Accounts / API keys: **none**
- Other dependencies: **Google Chrome recommended** (Web Speech API for text-to-speech and the roast-back microphone). Works in other browsers with reduced audio.

#### Hardware (if any)

- Laptop + speakers (loud) + projector
- Microphone (optional, for the roast-back cheat)

### Setup

```bash
# nothing to install. clone and open.
git clone https://github.com/HACK-OPS-KA/SLOPATHON.git
cd SLOPATHON/projects/gaslight-gatekeep-grandmaster
```

### Start

```bash
# macOS
open -a "Google Chrome" ggg.html

# Linux
google-chrome ggg.html

# Windows
start chrome ggg.html
```

Then click **▶ SPIELEN** (required — browsers only allow audio after a click) and hang your queen.

> Keep `ggg.html` and `image.png` in the same folder — the poster jumpscare loads the image from disk.

**More voices = better demo.** The bot cycles through the German TTS voices installed on the system. On macOS, add more under
*System Settings → Accessibility → Spoken Content → System Voice → Manage Voices*.

### Controls

| Input | Effect |
|---|---|
| Click piece → click square | Move (legal moves highlighted) |
| Roast Level slider | Difficulty, but for your feelings |
| 🌶️ SPICY toggle | Turns the crude roasts on/off mid-demo |
| Hold 🎤 ROAST-BACK | Insult the bot for a free double move |
| Spacebar | Bribe a striking piece |
| `1` / `2` / `3` / `4` / `5` | Audience chaos: rotate board / set fire / swap pieces / jumpscare / SLOPATHON stalker |

## Demo

- `ggg.html` — the entire game, one file
- `image.png` — the official SLOPATHON poster, used as the jumpscare payload

Live demo is the whole point: put it on the projector, let a stranger play, set Roast Level to 5, and press `5` when they finally do something good.
