# Screamy Bird

> Flappy Bird, except two people must yell into two separate phones to control
> their birds on one needlessly networked laptop screen.

## Team

- Jan Pfrenger / [@JanPfrenger](https://github.com/JanPfrenger)

## What is this?

Screamy Bird is a fullscreen browser duel with one game on each half of a
laptop display. Each side shows a QR code; scanning it turns that player's
phone into a dedicated microphone controller. A deliberately strict local
audio detector converts an actual yell into a tiny WebSocket flap event while
ordinary conversation, recordings and all raw audio stay on the phone.

The demo is: scan left, scan right, press launch, then watch two people lose
their voices trying to avoid pipes.

## Why should this not exist?

- It replaces two buttons with two phones, QR pairing, Web Audio analysis,
  room authentication, WebSockets, reconnect logic and a fullscreen flight
  control interface.
- It solves the nonexistent problem of Flappy Bird being too quiet.
- It turns public screaming into a competitive network protocol.

## What it does

**Actually does:**

- Switches between single-player and fullscreen two-player modes.
- Generates separate QR controllers for Player 1 and Player 2.
- Measures each phone microphone locally and ignores normal speech using a
  near-clipping yell gate.
- Sends only `{player, sequence, strength}` flap events to the laptop.
- Runs two identical deterministic pipe courses side by side.
- Uses survival time as the tie-breaker when both players crash at the same
  score.
- Keeps A/L as emergency demo controls; Space is intentionally disabled.

**Should do (but doesn't yet):**

- Invoice players for voice damage.
- Detect whether a scream was emotionally committed enough.
- Provide venue-wide vocal aviation insurance.

## How it works

```text
phone mic
  -> Web Audio RMS / dBFS
  -> 90% yell gate + 65 ms hold
  -> authenticated WebSocket flap event
  -> same-origin relay
  -> matching laptop canvas
  -> avoidable vocal aviation incident
```

No audio samples, transcripts or recordings leave either phone.

## Run it

### Requirements

#### Software

- OS: macOS, Linux or Windows
- Runtime: Node.js 22.13+
- Package manager: npm
- Browser: current Safari, Chrome, Edge or Firefox
- Accounts / API keys: none
- Optional for real phones: `cloudflared` for a temporary HTTPS URL

#### Hardware

- One laptop
- Two iOS or Android phones with microphones
- Internet access for the temporary HTTPS tunnel

### Setup

```bash
npm install
npm run build:static
```

### Start

```bash
npm run preview:phone
```

Open the local laptop view:

```text
http://localhost:4187/screamy-bird/?duo=1
```

For actual phones, mobile browsers require HTTPS:

```bash
cloudflared tunnel --no-autoupdate --protocol http2 --edge-ip-version 4 \
  --url http://localhost:4187
```

Open the printed URL with `/screamy-bird/?duo=1` on the laptop. Scan one QR per
player, tap **Enable microphone** on each phone, press **Launch both birds** and
yell in short bursts.

Single-player mode is available from the host's **Single player** button. The
single-player screen links back through **Open remote 2-player mode**.

## Validation

```bash
npm run build
npm run build:static
npm run lint
npm run test:relay
```

The relay test opens a real host socket plus two independent phone-controller
sockets and verifies presence, flap routing and disconnect behavior.

## Demo

- Laptop: fullscreen split-screen with one QR per side
- Phones: live dB meter, yell gate, room calibration and connection state
- Proof: the QR controllers visibly collapse to **Phone live** and their flap
  events move only the matching bird
