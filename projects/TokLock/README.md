# TokLock

> An app that locks you *inside* TikTok until you've served your daily screen-time sentence.
> Reverse screen-time: it doesn't take your phone away — it won't let you put it down.

## Team

- @izqkk

## What is this?

TokLock is a **native Android app** that inverts every screen-time tool ever made. Instead of
nagging you to stop scrolling, it **traps you in Instagram / TikTok** until you've "served" a daily
budget (default: **5 hours**). Try to leave early and it escalates: a red, strobing, bouncing
full-screen overlay, a layered notification-sound barrage, the flashlight, a looping alarm, and
finally it just re-opens the app for you with a countdown.

It ships with a straight-faced **satirical landing page** that markets the whole thing as a gentle
wellness coach whose proud goal is to help you *quadruple your screen time*.

- **What runs it:** an Android phone (Android 8+), no root, everything on-device.
- **Demo in one line:** open TikTok → press Home → watch the phone lose its mind until you go back.

## Why should this not exist?

- **Morally questionable UX (but harmless):** it fights you to keep you doomscrolling.
- **Wildly over-engineered:** Accessibility Service + Foreground Service + system overlay + camera
  strobe + layered `MediaPlayer` choreography… to make you use TikTok *more*.
- **Solves a problem nobody has:** "I don't spend *enough* time on my phone."

## What it does

**Actually does:**
- Detects when you open a chosen app (Instagram / TikTok) and starts a "captive" session.
- Counts served time toward a daily budget (in hours); unlocks only when the budget is full — free until midnight, then resets.
- On an escape attempt, runs a **staged escalation**: red strobing overlay → layered notification sound → flashlight → looping alarm → auto-reopens the app with an "Opening in Xs" countdown.
- Overlay has two buttons: **Open \<app\>** (go back voluntarily) and **Go to TokLock** (opens the app's own settings and pauses the escalation).
- Bundles custom sounds (`ringtone.mp3`, `notification.mp3`), a Stats tab (today / streak / last 7 days / per-app split), and a light/dark theme toggle.

**Should do (but doesn't yet):**
- Multiple profiles, time-window rules, accountability "shame-sharing", a home-screen widget.

## How it works

```text
open TikTok ──► Accessibility watchdog ──► Foreground service (state machine)
   ▲                                             │
   │ auto-reopen (18–21s)              leave early │
   └──────────── red strobe overlay ◄── escalate ─┘
                 + layered sounds + flashlight + alarm
```

## Repo layout

```text
projects/TokLock/
├── README.md            ← you are here (overview + quick start)
├── android/             ← the native Android app (Kotlin + Jetpack Compose)
│   └── README.md        ← detailed build / install / permission setup
├── landing-page/        ← self-contained satirical marketing site (one HTML file)
│   └── README.md        ← how to open / deploy
└── assets/              ← screenshots
```

## Run it

Two independent pieces. Full step-by-step guides live in each sub-README.

### The app (short version)

```bash
cd android
echo "sdk.dir=/path/to/Android/Sdk" > local.properties   # or export ANDROID_HOME
./gradlew :app:installDebug                               # phone connected via USB, JDK 17
```

Then, on the phone, grant the **two permissions** and pick your app(s). Full details incl. the
per-ROM quirks: **[android/README.md](android/README.md)**.

### The landing page (short version)

```bash
cd landing-page
xdg-open index.html      # or just double-click it — no build step
```

Details: **[landing-page/README.md](landing-page/README.md)**.

## Demo

- Screenshots in [`assets/`](assets/).
- Best live moment: open TikTok, press Home, and let all escalation stages run (~20s) to the auto-reopen.

---

`HACK//OPS · OP001 · SLOPATHON` — built to make the wrong thing work on purpose.
