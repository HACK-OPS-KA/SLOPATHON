package ai.runprise.reversescreentime.service

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * Watchdog. Two ways to learn the foreground app:
 *  1. Event-driven [listener] callback on TYPE_WINDOW_STATE_CHANGED — snappy when entering an app.
 *  2. On-demand [activePackage] read of the active window — the reliable fallback, because some
 *     launchers (e.g. Nothing OS) do NOT emit a window-state-change event on Home press, which is
 *     exactly the escape we must catch. The SessionService polls this every tick.
 */
class WatchdogAccessibilityService : AccessibilityService() {

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
        val pkg = event.packageName?.toString() ?: return
        if (pkg.isBlank()) return
        Log.d(TAG, "event foreground: $pkg")
        listener?.invoke(pkg)
    }

    /** Best-effort read of the currently active window's package. */
    fun activePackage(): String? =
        runCatching { rootInActiveWindow?.packageName?.toString() }.getOrNull()?.takeIf { it.isNotBlank() }

    override fun onInterrupt() {}

    override fun onUnbind(intent: android.content.Intent?): Boolean {
        instance = null
        return super.onUnbind(intent)
    }

    companion object {
        private const val TAG = "RSWatchdog"

        @Volatile
        var listener: ((String) -> Unit)? = null

        @Volatile
        var instance: WatchdogAccessibilityService? = null
    }
}
