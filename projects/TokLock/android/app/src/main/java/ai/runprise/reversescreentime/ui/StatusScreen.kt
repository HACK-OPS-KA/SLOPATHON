package ai.runprise.reversescreentime.ui

import ai.runprise.reversescreentime.core.BudgetLogic
import ai.runprise.reversescreentime.core.DailyProgress
import ai.runprise.reversescreentime.data.BudgetStore
import ai.runprise.reversescreentime.launch.AppLauncher
import ai.runprise.reversescreentime.service.SessionService
import ai.runprise.reversescreentime.ui.components.SentenceGauge
import ai.runprise.reversescreentime.ui.theme.Alarm
import ai.runprise.reversescreentime.ui.theme.Bone
import ai.runprise.reversescreentime.ui.theme.Free
import ai.runprise.reversescreentime.ui.theme.Ink
import ai.runprise.reversescreentime.ui.theme.Muted
import ai.runprise.reversescreentime.ui.theme.Surface2
import ai.runprise.reversescreentime.ui.util.InstalledApp
import ai.runprise.reversescreentime.ui.util.loadCuratedApps
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDate

@Composable
fun StatusScreen() {
    val ctx = LocalContext.current
    val store = remember { BudgetStore(ctx) }
    var served by remember { mutableStateOf(0L) }
    var budget by remember { mutableStateOf(0L) }
    var targets by remember { mutableStateOf(emptySet<String>()) }
    var targetApps by remember { mutableStateOf(emptyList<InstalledApp>()) }

    LaunchedEffect(Unit) {
        val c = store.loadConfig()
        budget = c.dailyBudgetSeconds
        targets = c.targetPackages
        served = store.loadProgress(LocalDate.now().toEpochDay()).servedSeconds
        if (c.targetPackages.isNotEmpty()) {
            targetApps = withContext(Dispatchers.IO) {
                loadCuratedApps(ctx.packageManager)
                    .filter { it.pkg in c.targetPackages }
            }
        }
    }

    val progress = if (budget > 0) served.toFloat() / budget else 0f
    val remaining = BudgetLogic.remainingSeconds(DailyProgress(0, served), budget)
    val released = budget > 0 && served >= budget

    Column(
        Modifier
            .fillMaxSize()
            .background(Ink)
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(28.dp))
        Text("IN THE ZONE", style = MaterialTheme.typography.labelLarge, color = Muted)
        Spacer(Modifier.height(40.dp))

        SentenceGauge(progress = progress, released = released, diameter = 280) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    if (released) "GOAL REACHED" else "KEEP GOING",
                    style = MaterialTheme.typography.labelMedium,
                    color = if (released) Free else Alarm,
                )
                Spacer(Modifier.height(6.dp))
                if (released) {
                    Text("FREE", style = MaterialTheme.typography.displayMedium, color = Free)
                } else {
                    val remText = if (remaining >= 3600) {
                        "%d:%02d:%02d".format(remaining / 3600, (remaining % 3600) / 60, remaining % 60)
                    } else {
                        "%d:%02d".format(remaining / 60, remaining % 60)
                    }
                    Text(
                        remText,
                        style = if (remaining >= 3600) MaterialTheme.typography.displayMedium
                        else MaterialTheme.typography.displayLarge,
                        color = Bone,
                    )
                }
                Spacer(Modifier.height(2.dp))
                Text(
                    "${served / 3600}h ${(served % 3600) / 60}m of ${budget / 3600}h today",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Muted,
                )
            }
        }

        Spacer(Modifier.height(36.dp))

        if (targetApps.isNotEmpty()) {
            Text("YOUR HAPPY PLACE", style = MaterialTheme.typography.labelMedium, color = Muted)
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                targetApps.take(6).forEach { app ->
                    Image(
                        bitmap = app.icon,
                        contentDescription = app.label,
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Surface2),
                    )
                }
            }
        } else {
            Text(
                "Pick an app to enjoy in Settings.",
                style = MaterialTheme.typography.bodyMedium,
                color = Muted,
                textAlign = TextAlign.Center,
            )
        }

        Spacer(Modifier.weight(1f))

        Button(
            onClick = {
                SessionService.start(ctx)
                targets.firstOrNull()?.let { AppLauncher(ctx).launch(it) }
            },
            enabled = targets.isNotEmpty() && !released,
            modifier = Modifier.fillMaxWidth().height(60.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Alarm, contentColor = Ink),
        ) {
            Text(
                if (released) "Done for today" else "Start Scrolling",
                style = MaterialTheme.typography.titleMedium,
            )
        }
        Spacer(Modifier.height(20.dp))
    }
}
