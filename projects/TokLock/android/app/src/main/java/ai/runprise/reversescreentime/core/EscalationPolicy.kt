package ai.runprise.reversescreentime.core

/**
 * Staged escalation while the user is out of the target app (starts immediately — no grace):
 *  NUDGE  (0–4s)      overlay + vibration
 *  NOTIFY (4–9s)      notification sound a few times + vibration + overlay
 *  FLASH  (9–13s)     flashlight strobe + vibration + overlay
 *  ALARM  (>= 13s)    looping ringtone + flashlight + vibration + "opening in Xs" countdown,
 *                     then the target app is auto-opened at [AUTO_OPEN_AT_MS].
 *  GRACE is only the in-app state (outForMs == null): nothing happens.
 */
enum class TormentLevel { GRACE, NUDGE, NOTIFY, FLASH, ALARM }

object EscalationPolicy {
    const val NOTIFY_AT_MS = 4_000L
    const val FLASH_AT_MS = 9_000L
    const val ALARM_AT_MS = 16_000L
    const val AUTO_OPEN_AT_MS = 21_000L

    fun level(outForMs: Long?): TormentLevel {
        if (outForMs == null) return TormentLevel.GRACE
        return when {
            outForMs < NOTIFY_AT_MS -> TormentLevel.NUDGE
            outForMs < FLASH_AT_MS -> TormentLevel.NOTIFY
            outForMs < ALARM_AT_MS -> TormentLevel.FLASH
            else -> TormentLevel.ALARM
        }
    }
}
