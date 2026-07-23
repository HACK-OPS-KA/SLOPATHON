package ai.runprise.reversescreentime.core

/**
 * Pure, framework-free state machine driving the "captive" experience.
 *
 * A session begins when the user opens a target app (or explicitly requests one). While CAPTIVE,
 * leaving the target app before the daily budget is full flips to ESCALATION — there is no
 * minimum-session escape hatch; the only clean exit is filling the day's budget (RELEASED).
 *
 * Time is passed in by the caller (elapsedRealtime millis) so this class stays unit-testable.
 */
class SessionStateMachine(
    private val dailyBudgetMs: Long,
) {
    var state: SessionState = SessionState.IDLE
        private set
    var attempts: Int = 0
        private set
    var outSinceMs: Long? = null
        private set

    fun onEvent(e: Event, secondsInTargetToday: Long): SessionState {
        val budgetFull = secondsInTargetToday * 1000L >= dailyBudgetMs
        when (e) {
            is Event.SessionRequested, is Event.TargetAppForeground -> {
                outSinceMs = null
                state = if (budgetFull) SessionState.RELEASED else SessionState.CAPTIVE
            }

            is Event.OtherAppForeground -> {
                if (budgetFull) {
                    state = SessionState.RELEASED
                    return state
                }
                // Only the FIRST leave starts the out-timer. Further hops between non-target apps
                // (launcher, system UI, our own overlay window) must not restart it — otherwise the
                // escalation clock keeps resetting and the overlay flickers off.
                if (state == SessionState.CAPTIVE) {
                    attempts++
                    outSinceMs = e.at
                    state = SessionState.ESCALATION
                }
            }

            is Event.Tick -> {
                // Level is derived externally by EscalationPolicy from outSinceMs.
            }
        }
        return state
    }

    fun resetDaily() {
        attempts = 0
        outSinceMs = null
        state = SessionState.IDLE
    }
}
