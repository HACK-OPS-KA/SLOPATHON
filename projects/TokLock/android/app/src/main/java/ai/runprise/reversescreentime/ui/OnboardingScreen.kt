package ai.runprise.reversescreentime.ui

import ai.runprise.reversescreentime.ui.theme.Alarm
import ai.runprise.reversescreentime.ui.theme.Bone
import ai.runprise.reversescreentime.ui.theme.Free
import ai.runprise.reversescreentime.ui.theme.Ink
import ai.runprise.reversescreentime.ui.theme.Muted
import ai.runprise.reversescreentime.ui.theme.Surface1
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

fun overlayGranted(ctx: Context): Boolean = Settings.canDrawOverlays(ctx)

fun a11yEnabled(ctx: Context): Boolean {
    val s = Settings.Secure.getString(
        ctx.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
    ) ?: return false
    val pkg = ctx.packageName
    return s.contains("$pkg/.service.WatchdogAccessibilityService") ||
        s.contains("$pkg/$pkg.service.WatchdogAccessibilityService")
}

@Composable
fun OnboardingScreen(onDone: () -> Unit) {
    val ctx = LocalContext.current
    var overlay by remember { mutableStateOf(overlayGranted(ctx)) }
    var a11y by remember { mutableStateOf(a11yEnabled(ctx)) }

    Column(
        Modifier.fillMaxSize().background(Ink).padding(24.dp),
    ) {
        Spacer(Modifier.height(24.dp))
        Text("SETUP", style = MaterialTheme.typography.labelLarge, color = Muted)
        Spacer(Modifier.height(8.dp))
        Text("Two quick permissions", style = MaterialTheme.typography.headlineSmall, color = Bone)
        Spacer(Modifier.height(8.dp))
        Text(
            "Both let your coach keep you present. You can revoke either one anytime in system settings — that's your built-in peace of mind.",
            style = MaterialTheme.typography.bodyMedium,
            color = Muted,
        )
        Spacer(Modifier.height(28.dp))

        PermissionCard(
            title = "Display over other apps",
            subtitle = "Shows your encouragement note when you drift.",
            granted = overlay,
            actionLabel = "Allow",
            onAction = {
                ctx.startActivity(
                    Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${ctx.packageName}"))
                )
            },
        )
        Spacer(Modifier.height(12.dp))
        PermissionCard(
            title = "Accessibility service",
            subtitle = "Notices the moment your focus drifts.",
            granted = a11y,
            actionLabel = "Enable",
            onAction = { ctx.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) },
        )

        Spacer(Modifier.height(20.dp))
        TextButton(onClick = {
            overlay = overlayGranted(ctx)
            a11y = a11yEnabled(ctx)
        }) { Text("Check again", color = Muted) }

        Spacer(Modifier.weight(1f))
        Button(
            enabled = overlay && a11y,
            onClick = onDone,
            modifier = Modifier.fillMaxWidth().height(60.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Alarm,
                contentColor = Ink,
                disabledContainerColor = Surface1,
                disabledContentColor = Muted,
            ),
        ) { Text("Continue", style = MaterialTheme.typography.titleMedium) }
    }
}

@Composable
private fun PermissionCard(
    title: String,
    subtitle: String,
    granted: Boolean,
    actionLabel: String,
    onAction: () -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Surface1)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        androidx.compose.foundation.layout.Box(
            Modifier.size(10.dp).clip(CircleShape).background(if (granted) Free else Muted),
        )
        Spacer(Modifier.size(14.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = Bone)
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = Muted)
        }
        Spacer(Modifier.size(12.dp))
        if (granted) {
            Text("✓", color = Free, style = MaterialTheme.typography.headlineSmall)
        } else {
            Button(
                onClick = onAction,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, contentColor = Alarm),
                border = androidx.compose.foundation.BorderStroke(1.dp, Alarm),
            ) { Text(actionLabel) }
        }
    }
}
