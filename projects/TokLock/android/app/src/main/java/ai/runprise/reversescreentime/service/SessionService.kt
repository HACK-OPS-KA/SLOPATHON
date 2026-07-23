package ai.runprise.reversescreentime.service

import ai.runprise.reversescreentime.core.BudgetLogic
import ai.runprise.reversescreentime.core.EscalationPolicy
import ai.runprise.reversescreentime.core.Event
import ai.runprise.reversescreentime.core.SessionState
import ai.runprise.reversescreentime.core.SessionStateMachine
import ai.runprise.reversescreentime.core.TormentLevel
import ai.runprise.reversescreentime.data.AppConfig
import ai.runprise.reversescreentime.data.BudgetStore
import ai.runprise.reversescreentime.launch.AppLauncher
import ai.runprise.reversescreentime.overlay.LockOverlayManager
import ai.runprise.reversescreentime.torment.TormentController
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import androidx.lifecycle.LifecycleService
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.time.LocalDate

/**
 * Foreground orchestrator. Owns the [SessionStateMachine], listens to the watchdog, accrues served
 * time while the user is captive in a target app, and drives torment + overlay + relaunch on escape.
 */
class SessionService : LifecycleService() {

    private lateinit var store: BudgetStore
    private lateinit var overlay: LockOverlayManager
    private lateinit var torment: TormentController
    private lateinit var launcher: AppLauncher

    private var config: AppConfig = AppConfig()
    private lateinit var sm: SessionStateMachine

    @Volatile
    private var currentForeground: String = ""
    private var loop: Job? = null
    private var lastCaptiveTickMs = 0L

    private var lastTargetPkg: String? = null
    private var lastTargetLabel: String = "your app"
    private var autoOpened = false

    private fun appLabel(pkg: String): String = runCatching {
        packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString()
    }.getOrNull() ?: "your app"

    private fun epochDay() = LocalDate.now().toEpochDay()
    private fun now() = SystemClock.elapsedRealtime()

    override fun onCreate() {
        super.onCreate()
        store = BudgetStore(this)
        overlay = LockOverlayManager(this)
        torment = TormentController(this)
        launcher = AppLauncher(this)
        startForeground(NOTIF_ID, buildNotification())
        lifecycleScope.launch {
            config = store.loadConfig()
            sm = SessionStateMachine(config.dailyBudgetSeconds * 1000)
            config.targetPackages.firstOrNull()?.let {
                lastTargetPkg = it
                lastTargetLabel = appLabel(it)
            }
            overlay.onOpenApp = { lastTargetPkg?.let { p -> launcher.launch(p) } }
            overlay.onOpenSelf = {
                val i = packageManager.getLaunchIntentForPackage(packageName)
                i?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                runCatching { startActivity(i) }
            }
            WatchdogAccessibilityService.listener = { pkg -> onForeground(pkg) }
            startLoop()
        }
    }

    /** Event-driven entry from the watchdog. */
    private fun onForeground(pkg: String) {
        if (!::sm.isInitialized) return
        if (pkg == currentForeground) return
        lifecycleScope.launch { processForeground(pkg) }
    }

    /** Single place that applies a foreground change to the state machine. */
    private suspend fun processForeground(pkg: String) {
        android.util.Log.d("RSSession", "fg -> $pkg (target=${config.targetPackages.contains(pkg)})")
        currentForeground = pkg
        val served = store.loadProgress(epochDay()).servedSeconds
        val isTarget = config.targetPackages.contains(pkg)
        val event = if (isTarget) Event.TargetAppForeground(now()) else Event.OtherAppForeground(now())
        sm.onEvent(event, served)
        if (isTarget) {
            lastTargetPkg = pkg
            lastTargetLabel = appLabel(pkg)
            autoOpened = false
            torment.stopAll()
            overlay.hide()
            lastCaptiveTickMs = now()
        }
    }

    private fun startLoop() {
        loop = lifecycleScope.launch {
            while (isActive) {
                delay(250)
                if (!::sm.isInitialized) continue

                // Poll the active window as the reliable source of truth (catches Home-press escapes
                // that emit no accessibility event).
                val polled = WatchdogAccessibilityService.instance?.activePackage()
                if (!polled.isNullOrBlank() && polled != currentForeground) {
                    processForeground(polled)
                }

                // While the user is inside OUR app (e.g. tapped "Go to TokLock"), pause
                // the whole show so the overlay doesn't cover our own UI.
                if (currentForeground == packageName) {
                    overlay.hide()
                    torment.stopAll()
                    continue
                }

                val inTarget = config.targetPackages.contains(currentForeground)

                // Accrue served time while captive in a target app.
                if (inTarget && sm.state == SessionState.CAPTIVE) {
                    val d = now() - lastCaptiveTickMs
                    if (d >= 1000) {
                        val whole = d / 1000
                        store.addServedSeconds(whole, epochDay(), currentForeground)
                        lastCaptiveTickMs += whole * 1000
                    }
                }

                val progress = store.loadProgress(epochDay())
                if (BudgetLogic.isFull(progress, config.dailyBudgetSeconds)) {
                    torment.stopAll()
                    overlay.showReleased()
                    continue
                }

                if (!inTarget && sm.state == SessionState.ESCALATION) {
                    val out = sm.outSinceMs?.let { now() - it } ?: 0L
                    val level = EscalationPolicy.level(out)
                    // Hold at NOTIFY until the whole notification sequence has finished playing —
                    // flash and ringtone only start once the sounds are done.
                    val gated = if (level.ordinal > TormentLevel.NOTIFY.ordinal && !torment.notificationDone()) {
                        TormentLevel.NOTIFY
                    } else {
                        level
                    }
                    val remaining = BudgetLogic.remainingSeconds(progress, config.dailyBudgetSeconds)
                    val openIn = if (gated == TormentLevel.ALARM) {
                        ((EscalationPolicy.AUTO_OPEN_AT_MS - out + 999) / 1000).toInt().coerceAtLeast(0)
                    } else {
                        null
                    }
                    overlay.showEscalation(gated, remaining, lastTargetLabel, openIn)
                    torment.apply(gated, config.intensity)
                    if (gated == TormentLevel.ALARM && out >= EscalationPolicy.AUTO_OPEN_AT_MS && !autoOpened) {
                        autoOpened = true
                        lastTargetPkg?.let { launcher.launch(it) }
                    }
                }
            }
        }
    }

    private fun buildNotification(): Notification {
        val nm = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL, "TokLock", NotificationManager.IMPORTANCE_LOW)
            )
        }
        return Notification.Builder(this, CHANNEL)
            .setContentTitle("TokLock")
            .setContentText("Keeping you in the zone.")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        loop?.cancel()
        WatchdogAccessibilityService.listener = null
        torment.stopAll()
        overlay.hide()
        super.onDestroy()
    }

    companion object {
        private const val CHANNEL = "reverse_screentime"
        private const val NOTIF_ID = 1

        fun start(ctx: Context) {
            val i = Intent(ctx, SessionService::class.java)
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i) else ctx.startService(i)
        }
    }
}
