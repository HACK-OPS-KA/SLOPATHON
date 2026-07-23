package ai.runprise.reversescreentime

import ai.runprise.reversescreentime.core.Event
import ai.runprise.reversescreentime.core.SessionState
import ai.runprise.reversescreentime.core.SessionStateMachine
import kotlin.test.Test
import kotlin.test.assertEquals

class SessionStateMachineTest {
    private fun sm() = SessionStateMachine(dailyBudgetMs = 5 * 3600 * 1000L)

    @Test
    fun opening_target_app_enters_captive() {
        val m = sm()
        m.onEvent(Event.TargetAppForeground(1000), secondsInTargetToday = 0)
        assertEquals(SessionState.CAPTIVE, m.state)
    }

    @Test
    fun leaving_before_budget_full_triggers_escalation() {
        val m = sm()
        m.onEvent(Event.TargetAppForeground(0), 0)
        m.onEvent(Event.OtherAppForeground(5_000), 0)
        assertEquals(SessionState.ESCALATION, m.state)
        assertEquals(1, m.attempts)
    }

    @Test
    fun budget_full_releases() {
        val m = sm()
        m.onEvent(Event.TargetAppForeground(0), 0)
        val s = m.onEvent(Event.OtherAppForeground(1000), secondsInTargetToday = 5 * 3600L)
        assertEquals(SessionState.RELEASED, s)
    }

    @Test
    fun hopping_between_non_target_apps_does_not_reset_out_timer() {
        val m = sm()
        m.onEvent(Event.TargetAppForeground(0), 0)
        m.onEvent(Event.OtherAppForeground(2_000), 0) // first leave starts the timer
        val firstOut = m.outSinceMs
        m.onEvent(Event.OtherAppForeground(5_000), 0) // launcher -> system UI -> overlay ...
        m.onEvent(Event.OtherAppForeground(8_000), 0)
        assertEquals(firstOut, m.outSinceMs)
        assertEquals(SessionState.ESCALATION, m.state)
    }

    @Test
    fun returning_to_target_from_escalation_resumes_captive() {
        val m = sm()
        m.onEvent(Event.TargetAppForeground(0), 0)
        m.onEvent(Event.OtherAppForeground(2_000), 0)
        m.onEvent(Event.TargetAppForeground(3_000), 0)
        assertEquals(SessionState.CAPTIVE, m.state)
    }

    @Test
    fun opening_target_when_budget_already_full_releases() {
        val m = sm()
        val s = m.onEvent(Event.TargetAppForeground(0), secondsInTargetToday = 5 * 3600L)
        assertEquals(SessionState.RELEASED, s)
    }
}
