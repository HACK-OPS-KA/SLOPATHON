package ai.runprise.reversescreentime.ui

import ai.runprise.reversescreentime.data.BudgetStore
import ai.runprise.reversescreentime.ui.theme.Alarm
import ai.runprise.reversescreentime.ui.theme.Ink
import ai.runprise.reversescreentime.ui.theme.Muted
import ai.runprise.reversescreentime.ui.theme.RsTheme
import ai.runprise.reversescreentime.ui.theme.Surface1
import ai.runprise.reversescreentime.ui.theme.applyLightMode
import androidx.compose.runtime.LaunchedEffect
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            RsTheme {
                Surface(color = Ink) {
                    val ctx = LocalContext.current
                    LaunchedEffect(Unit) {
                        applyLightMode(BudgetStore(ctx).loadConfig().lightMode)
                    }
                    var onboarded by remember {
                        mutableStateOf(overlayGranted(ctx) && a11yEnabled(ctx))
                    }
                    if (!onboarded) {
                        Box(Modifier.windowInsetsPadding(WindowInsets.systemBars)) {
                            OnboardingScreen(onDone = { onboarded = true })
                        }
                    } else {
                        MainTabs()
                    }
                }
            }
        }
    }
}

private enum class Tab(val label: String, val icon: ImageVector) {
    ScreenTime("Screen Time", Icons.Filled.Lock),
    Stats("Stats", Icons.Filled.List),
    Settings("Settings", Icons.Filled.Settings),
}

@Composable
private fun MainTabs() {
    var tab by remember { mutableIntStateOf(0) }
    Scaffold(
        containerColor = Ink,
        bottomBar = {
            NavigationBar(containerColor = Surface1, tonalElevation = 0.dp) {
                Tab.entries.forEachIndexed { i, t ->
                    NavigationBarItem(
                        selected = tab == i,
                        onClick = { tab = i },
                        icon = { Icon(t.icon, contentDescription = t.label) },
                        label = { Text(t.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Ink,
                            selectedTextColor = Alarm,
                            indicatorColor = Alarm,
                            unselectedIconColor = Muted,
                            unselectedTextColor = Muted,
                        ),
                    )
                }
            }
        },
    ) { inner ->
        Box(Modifier.padding(inner)) {
            when (tab) {
                0 -> StatusScreen()
                1 -> StatsScreen()
                else -> ConfigScreen()
            }
        }
    }
}
