package ai.runprise.reversescreentime

import ai.runprise.reversescreentime.core.BudgetLogic
import ai.runprise.reversescreentime.core.DailyProgress
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class BudgetLogicTest {
    @Test
    fun same_day_keeps_served() {
        val p = DailyProgress(dayEpoch = 100, servedSeconds = 300)
        assertEquals(300, BudgetLogic.rollover(p, 100).servedSeconds)
    }

    @Test
    fun new_day_resets_served() {
        val p = DailyProgress(dayEpoch = 100, servedSeconds = 300)
        val r = BudgetLogic.rollover(p, 101)
        assertEquals(101, r.dayEpoch)
        assertEquals(0, r.servedSeconds)
    }

    @Test
    fun remaining_and_full() {
        val p = DailyProgress(100, 5000)
        assertEquals(400, BudgetLogic.remainingSeconds(p, 5400))
        assertFalse(BudgetLogic.isFull(p, 5400))
        assertTrue(BudgetLogic.isFull(DailyProgress(100, 5400), 5400))
    }
}
