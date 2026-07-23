# CURSED MINESWEEPER

> Minesweeper, but we made 14 cursed versions of it because one was not enough content for the grind.
> Example vibe: "the #1 SLOPATHON minesweeper experience™. no refunds. touch grass afterwards."

## Team

- Bugra, Julian, Maxim

## What is this?

It's classic Minesweeper, except we couldn't stop, so it's now 14 separate cursed
variants of Minesweeper living in one repo. Each variant takes the "click square, pray
no bomb" loop and ruins it in a new and specific way. It's all plain HTML/CSS/JS with no
build step, so it runs in any browser by just opening a file. The demo: open the landing
page, pick a cursed mode, and watch a solved-problem game become an unsolved one.

- What you built: vanilla Minesweeper plus 13 mutant variants (ads, sycophant, anxiety,
  captcha, crawler, far-vision, gravity, lootbox, multiplier, snake, adversarial,
  try-not-to-win, wanderlust).
- Runs on: a browser. No server, no backend, no package manager, no dependencies.
- Demo in one line: click tiles, get emotionally and mechanically betrayed, lose anyway.

## Why should this not exist?

- totally unnecessary
- wildly over-engineered for the outcome (14 game engines for one solved game)
- takes the long way on purpose

## What it does

Actually does:
- Playable Minesweeper in the browser (vanilla mode actually works).
- 13 additional variants that each break the game in their own themed way:
  ads (real fake ads plastered over the board), sycophant (compliments you),
  anxiety, captcha (prove you're human to click), gravity (tiles fall), crawler,
  far-vision, lootbox, multiplier, snake, adversarial, try-not-to-win, wanderlust.
- A landing page that routes you to the variants.

Should do (but doesn't yet):
- A high-score board nobody asked for.

## How it works

```text
click a tile -> unnecessary cursed machinery per variant -> you lose (with flair)
```

## Run it

### Requirements

#### Software
- OS: anything with a browser
- Language/runtime: none (vanilla HTML/CSS/JS)
- Package manager: none
- Accounts / API keys: none
- Other dependencies: none

#### Hardware (if any)
- Board/device: your laptop
- Sensors/actuators: a mouse (or a finger)
- Power: whatever your laptop already has

### Setup

```bash
# no install. just get the files.
git clone <this-repo>
cd minesweeper
```

### Start

```bash
# just open it
open index.html         # macOS
xdg-open index.html     # Linux
# or drag index.html into a browser

# optional, if you prefer a local server:
python3 -m http.server 8000   # then visit http://localhost:8000
```

Opening index.html redirects to the vanilla game; from there browse the cursed variants.

## Demo

- Screenshot(s) in assets/
- Photo(s) of the build
- Short clip link: <drop link here>
