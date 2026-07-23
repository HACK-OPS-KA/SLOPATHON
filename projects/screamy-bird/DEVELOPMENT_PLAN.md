# Screamy Bird development plan

## Product sentence

Screamy Bird is a fullscreen two-player laptop duel controlled by two phone
microphones: scan your half, yell into your own phone, and move only your bird.

## Current vertical slice

- Responsive arcade interface suitable for a standalone page or iframe.
- Canvas game loop with deterministic pipe generation and collision detection.
- Web Audio API input, RMS volume analysis, noise calibration and adjustable
  trigger threshold.
- A vertical volume meter with the jump line shown directly beside the game.
- Rising-edge and cooldown logic so one continuous scream cannot produce
  unlimited jumps.
- Deliberately high phone yell gate: 90% default (about -6 dBFS), hard 85%
  minimum, a 65-millisecond loudness hold and 180 milliseconds of quiet before
  re-arming.
- Fullscreen split-screen laptop host with one QR per player half.
- Phone-specific mic calibration, wake lock and reconnect handling.
- Same-origin WebSocket relay carrying only tiny flap events, never audio.
- A/L keyboard controls as live-demo fallbacks; Space is disabled.
- Device-local high score storage. Audio never leaves the browser.
- Cloudflare-compatible build plus a static GitHub Pages build.

## Architecture

```text
Phone microphone
  -> getUserMedia (after an explicit click)
  -> Web Audio AnalyserNode
  -> RMS / approximate dBFS
  -> normalized volume
  -> threshold crossing + cooldown
  -> { player, sequence, strength } flap event
  -> same-origin WebSocket relay
  -> matching laptop canvas
```

The first release intentionally has no camera and no server-side audio path.
Only flap events leave a phone. This prevents laptop background noise, avoids
echo and makes network latency small enough to feel immediate.

## Full-stack roadmap

### Phase 1 — playable local build

1. Finish single-player and fullscreen phone duel.
2. Validate microphone permissions, QR pairing and both phone roles.
3. Tune gravity, pipe speed, gap size and the yell gate in the venue.
4. Verify build, lint, rendered UI and real WebSocket E2E tests.
5. Copy the project to
   `/Users/janpfrenger/Desktop/projects/screamy-bird`.

### Phase 2 — website launch

1. Run `npm run build:static`.
2. Copy `dist-static/` to
   `/Users/janpfrenger/Desktop/projects/lab.janpfrenger.com/screamy-bird/`.
3. Link the first Lab project card to `/screamy-bird/`.
4. Deploy a separate Cloudflare Worker + Durable Object relay and configure its
   `wss://` URL for the static host.
5. Verify `https://lab.janpfrenger.com/screamy-bird/` on mobile Safari and
   Chrome because browsers suspend microphone contexts differently.

The static build uses `/screamy-bird/` as its asset base and deliberately avoids
history routing, so it can be served directly by the existing GitHub Pages repo.
GitHub Pages cannot host the WebSocket relay; production multiplayer therefore
uses one Durable Object per room. For tonight, the built local preview plus a
temporary HTTPS tunnel provides the same user flow.

### Phase 3 — optional global scoreboard

1. Add `POST /api/scores` and `GET /api/scores` on a separate API host.
2. Persist score, timestamp, input mode and a generated player nickname.
3. Add rate limiting and basic impossible-score validation.
4. Show a venue leaderboard without requiring accounts.

The existing Lab site is static, so the scoreboard is deliberately outside the
critical demo path. A local high score is enough for the first launch.

## Release checklist

- Microphone permission is requested only from a user gesture.
- Click and tap work when permission is denied; Space is intentionally disabled.
- No audio samples, transcripts or recordings are stored.
- The trigger line cannot be lowered below the deliberate yell gate.
- The game remains usable at laptop and mobile viewport sizes.
- `npm run build`, `npm run build:static`, `npm run lint`,
  `npm run test:relay` and the rendered interface test pass.
- Production is served over HTTPS, which browsers require for microphone access
  outside localhost.
