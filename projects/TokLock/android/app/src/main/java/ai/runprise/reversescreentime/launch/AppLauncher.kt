package ai.runprise.reversescreentime.launch

import android.content.Context
import android.content.Intent

/** Forces a target app back into the foreground. */
class AppLauncher(private val ctx: Context) {
    fun launch(pkg: String) {
        val i = ctx.packageManager.getLaunchIntentForPackage(pkg) ?: return
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        runCatching { ctx.startActivity(i) }
    }
}
