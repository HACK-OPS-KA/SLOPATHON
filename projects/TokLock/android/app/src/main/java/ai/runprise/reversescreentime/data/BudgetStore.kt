package ai.runprise.reversescreentime.data

import ai.runprise.reversescreentime.core.BudgetLogic
import ai.runprise.reversescreentime.core.DailyProgress
import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first

private val Context.dataStore by preferencesDataStore("reverse_screentime")

/** One finished (or current) day of served time. */
data class DayStat(val dayEpoch: Long, val servedSeconds: Long)

/** DataStore-backed persistence for config, today's served-time, per-app split, and daily history. */
class BudgetStore(private val context: Context) {
    private val pkgs = stringSetPreferencesKey("target_packages")
    private val budget = longPreferencesKey("daily_budget_s")
    private val intensity = intPreferencesKey("intensity")
    private val lightMode = booleanPreferencesKey("light_mode")
    private val day = longPreferencesKey("day_epoch")
    private val served = longPreferencesKey("served_s")
    private val perApp = stringSetPreferencesKey("served_by_app")   // entries "pkg:seconds", today only
    private val history = stringSetPreferencesKey("history")        // entries "dayEpoch:seconds"

    suspend fun loadConfig(): AppConfig {
        val p = context.dataStore.data.first()
        return AppConfig(
            targetPackages = p[pkgs] ?: emptySet(),
            dailyBudgetSeconds = p[budget] ?: (5 * 3600),
            intensity = p[intensity] ?: 3,
            lightMode = p[lightMode] ?: false,
        )
    }

    suspend fun saveConfig(c: AppConfig) {
        context.dataStore.edit {
            it[pkgs] = c.targetPackages
            it[budget] = c.dailyBudgetSeconds
            it[intensity] = c.intensity
            it[lightMode] = c.lightMode
        }
    }

    /**
     * Returns today's progress, rolling over at local midnight. On rollover the finished day is
     * archived into [history] and the per-app split is cleared.
     */
    suspend fun loadProgress(nowEpochDay: Long): DailyProgress {
        val p = context.dataStore.data.first()
        val prev = DailyProgress(p[day] ?: nowEpochDay, p[served] ?: 0)
        val rolled = BudgetLogic.rollover(prev, nowEpochDay)
        if (rolled != prev) {
            context.dataStore.edit { prefs ->
                prefs[day] = rolled.dayEpoch
                prefs[served] = rolled.servedSeconds
                prefs[perApp] = emptySet()
                if (prev.servedSeconds > 0) {
                    val existing = prefs[history] ?: emptySet()
                    // Replace any stale entry for that day, then add the finished one.
                    val cleaned = existing.filterNot { it.substringBefore(':') == prev.dayEpoch.toString() }
                    prefs[history] = (cleaned + "${prev.dayEpoch}:${prev.servedSeconds}").toSet()
                }
            }
        }
        return rolled
    }

    /** Adds served seconds to today's total and attributes them to [pkg]. */
    suspend fun addServedSeconds(delta: Long, nowEpochDay: Long, pkg: String) {
        val cur = loadProgress(nowEpochDay)
        context.dataStore.edit { prefs ->
            prefs[day] = cur.dayEpoch
            prefs[served] = cur.servedSeconds + delta
            val map = parsePairs(prefs[perApp] ?: emptySet()).toMutableMap()
            map[pkg] = (map[pkg] ?: 0) + delta
            prefs[perApp] = map.entries.map { "${it.key}:${it.value}" }.toSet()
        }
    }

    /** Today's served split per package. */
    suspend fun loadPerApp(nowEpochDay: Long): Map<String, Long> {
        loadProgress(nowEpochDay) // trigger rollover/clear if needed
        return parsePairs(context.dataStore.data.first()[perApp] ?: emptySet())
    }

    /**
     * Daily history including today, most-recent last, covering the last [days] calendar days
     * (missing days filled with 0).
     */
    suspend fun loadHistory(nowEpochDay: Long, days: Int = 7): List<DayStat> {
        val today = loadProgress(nowEpochDay)
        val past = parsePairs(context.dataStore.data.first()[history] ?: emptySet())
            .mapKeys { it.key.toLongOrNull() ?: -1L }
        return (0 until days).map { offset ->
            val d = nowEpochDay - (days - 1 - offset)
            val secs = if (d == nowEpochDay) today.servedSeconds else (past[d] ?: 0L)
            DayStat(d, secs)
        }
    }

    private fun parsePairs(set: Set<String>): Map<String, Long> =
        set.mapNotNull { e ->
            val i = e.lastIndexOf(':')
            if (i <= 0) return@mapNotNull null
            val k = e.substring(0, i)
            val v = e.substring(i + 1).toLongOrNull() ?: return@mapNotNull null
            k to v
        }.toMap()
}
