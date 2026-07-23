package ai.runprise.reversescreentime.ui

import ai.runprise.reversescreentime.data.AppConfig
import ai.runprise.reversescreentime.data.BudgetStore
import ai.runprise.reversescreentime.ui.theme.Alarm
import ai.runprise.reversescreentime.ui.theme.Bone
import ai.runprise.reversescreentime.ui.theme.Ink
import ai.runprise.reversescreentime.ui.theme.Muted
import ai.runprise.reversescreentime.ui.theme.Outline
import ai.runprise.reversescreentime.ui.theme.Surface1
import ai.runprise.reversescreentime.ui.theme.Surface2
import ai.runprise.reversescreentime.ui.theme.applyLightMode
import ai.runprise.reversescreentime.ui.util.InstalledApp
import ai.runprise.reversescreentime.ui.util.loadCuratedApps
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun ConfigScreen() {
    val ctx = LocalContext.current
    val scope = rememberCoroutineScope()
    val store = remember { BudgetStore(ctx) }
    var cfg by remember { mutableStateOf(AppConfig()) }
    var apps by remember { mutableStateOf(emptyList<InstalledApp>()) }
    var loading by remember { mutableStateOf(true) }
    var dirty by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        cfg = store.loadConfig()
        apps = withContext(Dispatchers.IO) { loadCuratedApps(ctx.packageManager) }
        loading = false
    }

    Column(Modifier.fillMaxSize().background(Ink)) {
        // Header
        Row(
            Modifier.fillMaxWidth().padding(start = 24.dp, top = 28.dp, end = 24.dp, bottom = 12.dp),
            verticalAlignment = Alignment.Bottom,
        ) {
            Column {
                Text("SETTINGS", style = MaterialTheme.typography.labelLarge, color = Muted)
                Spacer(Modifier.height(6.dp))
                Text("Your goal & apps", style = MaterialTheme.typography.headlineSmall, color = Bone)
            }
            Spacer(Modifier.weight(1f))
            Text(
                "${cfg.targetPackages.size} selected",
                style = MaterialTheme.typography.labelMedium,
                color = Alarm,
            )
        }

        LazyColumn(
            Modifier.weight(1f).padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item {
                Text("DAILY GOAL", style = MaterialTheme.typography.labelMedium, color = Muted)
                Spacer(Modifier.height(10.dp))
                RulesCard(cfg) { cfg = it; dirty = true }
                Spacer(Modifier.height(20.dp))

                Text("APPEARANCE", style = MaterialTheme.typography.labelLarge, color = Muted)
                Spacer(Modifier.height(10.dp))
                Row(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(Surface1)
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text("Light mode", style = MaterialTheme.typography.titleMedium, color = Bone)
                        Text("Switch the app to a bright theme.", style = MaterialTheme.typography.bodyMedium, color = Muted)
                    }
                    Switch(
                        checked = cfg.lightMode,
                        onCheckedChange = { on ->
                            val newCfg = cfg.copy(lightMode = on)
                            cfg = newCfg
                            applyLightMode(on)
                            scope.launch { store.saveConfig(newCfg) }
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Ink,
                            checkedTrackColor = Alarm,
                            uncheckedThumbColor = Muted,
                            uncheckedTrackColor = Surface2,
                            uncheckedBorderColor = Outline,
                        ),
                    )
                }
                Spacer(Modifier.height(20.dp))

                Text("YOUR APPS", style = MaterialTheme.typography.labelLarge, color = Muted)
                Spacer(Modifier.height(4.dp))
                Text("Which app will you savor?", style = MaterialTheme.typography.bodyMedium, color = Muted)
                Spacer(Modifier.height(12.dp))
            }

            if (loading) {
                item { Text("Loading…", color = Muted, modifier = Modifier.padding(16.dp)) }
            } else if (apps.isEmpty()) {
                item {
                    Text(
                        "Neither Instagram nor TikTok is installed.",
                        color = Muted,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(16.dp),
                    )
                }
            }

            items(apps, key = { it.pkg }) { app ->
                val selected = cfg.targetPackages.contains(app.pkg)
                AppRow(app = app, selected = selected) {
                    cfg = cfg.copy(
                        targetPackages = if (selected) cfg.targetPackages - app.pkg
                        else cfg.targetPackages + app.pkg,
                    )
                    dirty = true
                }
            }

            item { Spacer(Modifier.height(90.dp)) }
        }

        // Sticky save bar
        Box(Modifier.fillMaxWidth().background(Ink).padding(24.dp)) {
            Button(
                onClick = { scope.launch { store.saveConfig(cfg); dirty = false } },
                enabled = cfg.targetPackages.isNotEmpty() && dirty,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Alarm,
                    contentColor = Ink,
                    disabledContainerColor = Surface2,
                    disabledContentColor = Muted,
                ),
            ) {
                Text(
                    if (dirty) "Save" else "Saved ✓",
                    style = MaterialTheme.typography.titleMedium,
                )
            }
        }
    }
}

@Composable
private fun RulesCard(cfg: AppConfig, onChange: (AppConfig) -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Surface1)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        val hours = (cfg.dailyBudgetSeconds / 3600).toInt().coerceIn(1, 12)
        RuleSlider(
            label = "Daily goal",
            value = if (hours == 1) "1 hour" else "$hours hours",
            floatValue = hours.toFloat(),
            range = 1f..12f,
            steps = 10, // whole-hour stops between 1 and 12
            onChange = { onChange(cfg.copy(dailyBudgetSeconds = (it.toInt() * 3600).toLong())) },
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "How long you'll stay present each day before you're free.",
            style = MaterialTheme.typography.bodyMedium,
            color = Muted,
        )
    }
}

@Composable
private fun RuleSlider(
    label: String,
    value: String,
    floatValue: Float,
    range: ClosedFloatingPointRange<Float>,
    steps: Int = 0,
    onChange: (Float) -> Unit,
) {
    Column {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(label, style = MaterialTheme.typography.titleMedium, color = Bone)
            Spacer(Modifier.weight(1f))
            Text(value, style = MaterialTheme.typography.labelLarge, color = Alarm)
        }
        Slider(
            value = floatValue,
            onValueChange = onChange,
            valueRange = range,
            steps = steps,
            colors = SliderDefaults.colors(
                thumbColor = Alarm,
                activeTrackColor = Alarm,
                inactiveTrackColor = Outline,
            ),
        )
    }
}

@Composable
private fun AppRow(app: InstalledApp, selected: Boolean, onToggle: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(if (selected) Surface2 else Surface1)
            .border(
                width = if (selected) 1.5.dp else 0.dp,
                color = if (selected) Alarm else Color.Transparent,
                shape = RoundedCornerShape(14.dp),
            )
            .clickable(onClick = onToggle)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Image(
            bitmap = app.icon,
            contentDescription = null,
            modifier = Modifier.size(40.dp).clip(RoundedCornerShape(10.dp)),
        )
        Spacer(Modifier.size(14.dp))
        Text(app.label, style = MaterialTheme.typography.titleMedium, color = Bone)
        Spacer(Modifier.weight(1f))
        Box(
            Modifier
                .size(24.dp)
                .clip(CircleShape)
                .background(if (selected) Alarm else Color.Transparent)
                .border(1.5.dp, if (selected) Alarm else Outline, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            if (selected) {
                Text("✓", color = Ink, style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}
