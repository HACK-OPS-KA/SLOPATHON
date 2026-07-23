package ai.runprise.reversescreentime.ui.util

import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap

data class InstalledApp(val pkg: String, val label: String, val icon: ImageBitmap)

private fun Drawable.toImageBitmap(size: Int = 128): ImageBitmap {
    val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bmp)
    setBounds(0, 0, size, size)
    draw(canvas)
    return bmp.asImageBitmap()
}

/**
 * The apps you can be trapped in. Kept deliberately short — this is a self-control tool, not an app
 * drawer. Each entry lists candidate package names (regional/variant builds); the first installed
 * one wins.
 */
val CURATED_TARGETS: List<Pair<String, List<String>>> = listOf(
    "Instagram" to listOf("com.instagram.android"),
    "TikTok" to listOf(
        "com.zhiliaoapp.musically",       // global
        "com.ss.android.ugc.trill",        // some regions
        "com.zhiliaoapp.musically.go",     // TikTok Lite
    ),
)

/** Resolves the curated targets that are actually installed, with real icon + label. Fast (≤ a few). */
fun loadCuratedApps(pm: PackageManager): List<InstalledApp> =
    CURATED_TARGETS.mapNotNull { (label, candidates) ->
        val pkg = candidates.firstOrNull { runCatching { pm.getApplicationInfo(it, 0) }.isSuccess }
            ?: return@mapNotNull null
        val icon = runCatching { pm.getApplicationIcon(pkg) }.getOrNull()?.toImageBitmap()
            ?: Bitmap.createBitmap(128, 128, Bitmap.Config.ARGB_8888).asImageBitmap()
        InstalledApp(pkg, label, icon)
    }

/** Loads launchable, non-system apps with their real icon + label. Heavy — call off the main thread. */
fun loadInstalledApps(pm: PackageManager, selfPackage: String): List<InstalledApp> {
    val launchable = pm.getInstalledApplications(0)
        .asSequence()
        .filter { it.packageName != selfPackage }
        .filter { pm.getLaunchIntentForPackage(it.packageName) != null }
        .map { info ->
            InstalledApp(
                pkg = info.packageName,
                label = pm.getApplicationLabel(info).toString(),
                icon = runCatching { pm.getApplicationIcon(info) }.getOrNull()?.toImageBitmap()
                    ?: Bitmap.createBitmap(128, 128, Bitmap.Config.ARGB_8888).asImageBitmap(),
            )
        }
        .sortedBy { it.label.lowercase() }
    return launchable.toList()
}
