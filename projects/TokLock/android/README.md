# TokLock — Android app

Native Android app (Kotlin + Jetpack Compose) that keeps you *captive* in a social app until your
daily screen-time budget is served. This document is the full setup guide.

## 1. What you need

### Software
- **JDK 17** (e.g. Temurin/OpenJDK 17). Newer JDKs may work but 17 is what this is built with.
- **Android SDK** with:
  - Platform **API 35** (`platforms;android-35`)
  - Build-Tools **35.0.0**
  - Platform-Tools (for `adb`)
- **Gradle**: none needed — the project ships a Gradle **wrapper** (`./gradlew`, Gradle 8.11.1).
- No accounts, no API keys, no cloud. Everything is local.

### Device
- A physical Android phone on **Android 8.0 (API 26) or newer** (minSdk is 29 / Android 10).
  An emulator works for the UI, but the flashlight and "feel" need a real phone.
- **USB debugging** enabled (Settings → About phone → tap *Build number* 7× → Developer options →
  USB debugging).

### Key facts
| | |
|---|---|
| Application ID | `ai.runprise.reversescreentime` |
| App name (label) | **TokLock** |
| compileSdk / targetSdk | 35 |
| minSdk | 29 |
| Language / UI | Kotlin / Jetpack Compose (Material 3) |

## 2. Point the build at your SDK

From this `android/` folder, create `local.properties` (git-ignored) with your SDK path:

```bash
echo "sdk.dir=/absolute/path/to/Android/Sdk" > local.properties
```

Alternatively export `ANDROID_HOME=/absolute/path/to/Android/Sdk` in your shell. Set `JAVA_HOME`
to your JDK 17 if it isn't the default:

```bash
export JAVA_HOME=/path/to/jdk-17
export ANDROID_HOME=/path/to/Android/Sdk
```

## 3. Build & install

Connect the phone (`adb devices` should list it), then:

```bash
./gradlew :app:installDebug
```

Or build the APK only and install manually:

```bash
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Run the unit tests (pure logic — state machine, escalation policy, budget math):

```bash
./gradlew :app:testDebugUnitTest
```

Launch it:

```bash
adb shell monkey -p ai.runprise.reversescreentime -c android.intent.category.LAUNCHER 1
```

## 4. Grant the two permissions (required)

TokLock is inert without both:

1. **Display over other apps** (`SYSTEM_ALERT_WINDOW`) — draws the escape overlay.
2. **Accessibility service** — the watchdog that notices when you leave the target app.

The onboarding screen links you straight to both system pages. Tap **Allow** / **Enable** and, for
the accessibility dialog, confirm **"Allow full control"**.

> **Heads-up (important):** many OEM ROMs (e.g. Nothing OS, some Xiaomi/Samsung builds) **silently
> revert** an accessibility service that was enabled via `adb settings put …`. Enable it through the
> real in-app toggle instead. Also: **reinstalling the app disables its accessibility service** — you
> must re-enable it after every `installDebug`.

Overlay can be pre-granted from a computer (this one usually sticks):

```bash
adb shell appops set ai.runprise.reversescreentime SYSTEM_ALERT_WINDOW allow
```

## 5. Configure & use

1. Open TokLock → finish onboarding (both permissions green).
2. **Settings** tab → pick **Instagram** and/or **TikTok**, set your **Daily goal** (hours), optional **Light mode**. Tap **Save**.
3. **Screen Time** tab → **Start Scrolling** (or just open the target app yourself).
4. Try to leave (Home button). The escalation begins:

| Time out of app | What happens |
|---|---|
| 0–4 s | Red strobing overlay with bouncing **"KEEP SCROLLING"** + vibration |
| 4–9 s | `notification.mp3` fires on a layered schedule (once, +3s, +2s, +1s ×2) |
| after sounds finish | Flashlight strobe |
| then | `ringtone.mp3` looping alarm + **"Opening \<app\> in Xs"** countdown |
| ~21 s | The target app is auto-reopened |

Return to the target app any time and everything stops. The lock releases for the day once the full
budget is served (until midnight, then it resets).

## 6. Swapping the sounds

Drop-in replace the bundled audio and rebuild:

```text
app/src/main/res/raw/ringtone.mp3       ← the looping alarm
app/src/main/res/raw/notification.mp3   ← the layered nag
```

Keep the file names (referenced by resource name). MP3/OGG/WAV all work.

## 7. Troubleshooting

- **Onboarding says Accessibility is off even though you enabled it** → the ROM reverted it; enable via the in-app toggle and, if it still flips, disable battery optimization for TokLock (Settings → Apps → TokLock → Battery → Unrestricted).
- **Overlay flickers / never appears** → make sure "Display over other apps" is allowed and the accessibility service is actually bound (`adb shell dumpsys accessibility | grep reversescreentime`).
- **No sound** → the app plays on the **alarm** stream; raise the alarm volume, and check the phone isn't in a DND mode that also silences alarms.
- **Watchdog gets killed after a while** → disable battery optimization for the app (foreground services on aggressive ROMs get culled).
- **`SDK location not found`** → create `local.properties` (step 2) or export `ANDROID_HOME`.

## 8. How it's built (for the curious)

- **`WatchdogAccessibilityService`** — reports the foreground package (event + active-window polling, so Home-press escapes are caught even on launchers that emit no event).
- **`SessionService`** (foreground service) — owns a pure `SessionStateMachine`, accrues served time, and drives the escalation via `EscalationPolicy`.
- **`TormentController`** — flashlight strobe, layered notification `MediaPlayer`s, looping alarm, vibration.
- **`LockOverlayManager`** — the red strobing, bouncing full-screen overlay with the two buttons and the countdown.
- **`BudgetStore`** (DataStore) — config, today's served time, per-app split, 7-day history, theme.
- Pure logic (state machine, escalation thresholds, budget/rollover) is unit-tested; the device-bound parts are verified by hand.

The only real escape is the OS itself (Settings → force-stop / disable the services). On a
non-rooted device the app *cannot* close that door — that's the built-in safety net, by design.
