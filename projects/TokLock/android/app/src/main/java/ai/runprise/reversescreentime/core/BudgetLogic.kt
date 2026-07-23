package ai.runprise.reversescreentime.core

data class DailyProgress(val dayEpoch: Long, val servedSeconds: Long)

/**
 * Pure daily-budget arithmetic. The caller supplies the current local epoch-day so the rollover
 * (reset at local midnight) stays testable and timezone decisions live at the edge.
 */
object BudgetLogic {
    fun rollover(prev: DailyProgress, nowEpochDay: Long): DailyProgress =
        if (nowEpochDay == prev.dayEpoch) prev else DailyProgress(nowEpochDay, 0)

    fun remainingSeconds(p: DailyProgress, budgetSeconds: Long): Long =
        (budgetSeconds - p.servedSeconds).coerceAtLeast(0)

    fun isFull(p: DailyProgress, budgetSeconds: Long): Boolean =
        p.servedSeconds >= budgetSeconds
}
