package ai.runprise.reversescreentime.ui

import ai.runprise.reversescreentime.data.BudgetStore
import ai.runprise.reversescreentime.data.DayStat
import ai.runprise.reversescreentime.ui.theme.Alarm
import ai.runprise.reversescreentime.ui.theme.Bone
import ai.runprise.reversescreentime.ui.theme.Free
import ai.runprise.reversescreentime.ui.theme.Ink
import ai.runprise.reversescreentime.ui.theme.Muted
import ai.runprise.reversescreentime.ui.theme.Outline
import ai.runprise.reversescreentime.ui.theme.Surface1
import ai.runprise.reversescreentime.ui.util.InstalledApp
import ai.runprise.reversescreentime.ui.util.loadCuratedApps
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDate

@Composable
fun StatsScreen() {
    val ctx = LocalContext.current
    val store = remember { BudgetStore(ctx) }
    var budget by remember { mutableStateOf(0L) }
    var history by remember { mutableStateOf(emptyList<DayStat>()) }
    var perApp by remember { mutableStateOf(emptyMap<String, Long>()) }
    var meta by remember { mutableStateOf(emptyList<InstalledApp>()) }

    LaunchedEffect(Unit) {
        val today = LocalDate.now().toEpochDay()
        budget = store.loadConfig().dailyBudgetSeconds
        history = store.loadHistory(today, 7)
        perApp = store.loadPerApp(today)
        meta = withContext(Dispatchers.IO) { loadCuratedApps(ctx.packageManager) }
    }

    val todayServed = history.lastOrNull()?.servedSeconds ?: 0L
    val streak = computeStreak(history, budget)

    Column(
        Modifier
            .fillMaxSize()
            .background(Ink)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(28.dp))
        Text("PROGRESS", style = MaterialTheme.typography.labelLarge, color = Muted)
        Spacer(Modifier.height(6.dp))
        Text("Your journey", style = MaterialTheme.typography.headlineSmall, color = Bone, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(20.dp))

        // Today + streak tiles
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            StatTile(
                modifier = Modifier.weight(1f),
                label = "TODAY",
                value = "%.1f".format(todayServed / 3600f),
                unit = "/ ${budget / 3600}h",
                accent = if (budget > 0 && todayServed >= budget) Free else Alarm,
            )
            StatTile(
                modifier = Modifier.weight(1f),
                label = "STREAK",
                value = "$streak",
                unit = if (streak == 1) "day" else "days",
                accent = if (streak > 0) Free else Muted,
            )
        }

        Spacer(Modifier.height(16.dp))

        // Weekly bars
        Column(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Surface1).padding(16.dp),
        ) {
            Text("LAST 7 DAYS", style = MaterialTheme.typography.labelMedium, color = Muted)
            Spacer(Modifier.height(16.dp))
            WeeklyBars(history = history, budgetSeconds = budget)
        }

        Spacer(Modifier.height(16.dp))

        // Per-app split (today)
        Column(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Surface1).padding(16.dp),
        ) {
            Text("TODAY BY APP", style = MaterialTheme.typography.labelMedium, color = Muted)
            Spacer(Modifier.height(12.dp))
            val total = perApp.values.sum().coerceAtLeast(1)
            if (perApp.isEmpty()) {
                Text("Nothing enjoyed yet today.", style = MaterialTheme.typography.bodyMedium, color = Muted)
            } else {
                perApp.entries.sortedByDescending { it.value }.forEach { (pkg, secs) ->
                    val app = meta.firstOrNull { it.pkg == pkg }
                    AppSplitRow(
                        label = app?.label ?: pkg,
                        icon = app,
                        seconds = secs,
                        fraction = secs.toFloat() / total,
                    )
                    Spacer(Modifier.height(10.dp))
                }
            }
        }
        Spacer(Modifier.height(24.dp))
    }
}

private fun computeStreak(history: List<DayStat>, budgetSeconds: Long): Int {
    if (budgetSeconds <= 0 || history.isEmpty()) return 0
    var streak = 0
    val todayEpoch = history.last().dayEpoch
    for (d in history.reversed()) {
        if (d.dayEpoch == todayEpoch && d.servedSeconds < budgetSeconds) continue // today not done yet
        if (d.servedSeconds >= budgetSeconds) streak++ else break
    }
    return streak
}

@Composable
private fun StatTile(modifier: Modifier, label: String, value: String, unit: String, accent: androidx.compose.ui.graphics.Color) {
    Column(
        modifier.clip(RoundedCornerShape(16.dp)).background(Surface1).padding(16.dp),
    ) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = Muted)
        Spacer(Modifier.height(8.dp))
        Row(verticalAlignment = Alignment.Bottom) {
            Text(value, style = MaterialTheme.typography.displayMedium, color = accent)
            Spacer(Modifier.width(6.dp))
            Text(unit, style = MaterialTheme.typography.bodyMedium, color = Muted, modifier = Modifier.padding(bottom = 6.dp))
        }
    }
}

@Composable
private fun WeeklyBars(history: List<DayStat>, budgetSeconds: Long) {
    val max = (history.maxOfOrNull { it.servedSeconds } ?: 0L)
        .coerceAtLeast(budgetSeconds).coerceAtLeast(1)
    Row(
        Modifier.fillMaxWidth().height(140.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Bottom,
    ) {
        history.forEach { d ->
            val frac = (d.servedSeconds.toFloat() / max).coerceIn(0f, 1f)
            val done = budgetSeconds > 0 && d.servedSeconds >= budgetSeconds
            Column(
                Modifier.weight(1f).fillMaxHeight(),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    Modifier.weight(1f).fillMaxWidth(),
                    contentAlignment = Alignment.BottomCenter,
                ) {
                    Box(
                        Modifier
                            .fillMaxWidth(0.6f)
                            .fillMaxHeight(frac.coerceAtLeast(0.02f))
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (done) Free else if (d.servedSeconds > 0) Alarm else Outline),
                    )
                }
                Spacer(Modifier.height(8.dp))
                Text(weekdayLabel(d.dayEpoch), style = MaterialTheme.typography.labelMedium, color = Muted)
            }
        }
    }
}

@Composable
private fun AppSplitRow(label: String, icon: InstalledApp?, seconds: Long, fraction: Float) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        if (icon != null) {
            Image(bitmap = icon.icon, contentDescription = null, modifier = Modifier.size(28.dp).clip(RoundedCornerShape(8.dp)))
            Spacer(Modifier.width(10.dp))
        }
        Column(Modifier.weight(1f)) {
            Row(Modifier.fillMaxWidth()) {
                Text(label, style = MaterialTheme.typography.titleMedium, color = Bone, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.weight(1f))
                Text("${seconds / 60} min · ${(fraction * 100).toInt()}%", style = MaterialTheme.typography.bodyMedium, color = Muted)
            }
            Spacer(Modifier.height(6.dp))
            Box(Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)).background(Outline)) {
                Box(Modifier.fillMaxWidth(fraction.coerceIn(0f, 1f)).fillMaxHeight().clip(RoundedCornerShape(3.dp)).background(Alarm))
            }
        }
    }
}

private val WEEKDAYS = listOf("Mo", "Tu", "We", "Th", "Fr", "Sa", "Su")

private fun weekdayLabel(epochDay: Long): String {
    // DayOfWeek: MONDAY=1 .. SUNDAY=7
    val idx = (LocalDate.ofEpochDay(epochDay).dayOfWeek.value - 1).coerceIn(0, 6)
    return WEEKDAYS[idx]
}
