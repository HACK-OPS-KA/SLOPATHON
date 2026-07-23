package ai.runprise.reversescreentime.overlay

import ai.runprise.reversescreentime.core.TormentLevel
import android.animation.ObjectAnimator
import android.animation.PropertyValuesHolder
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Full-screen interactive overlay shown while the user is out of the target app. Unlike a passive
 * banner it carries a live "opening in Xs" countdown and an "Open <app>" button so the user can
 * jump back voluntarily. Touch works even with FLAG_NOT_FOCUSABLE because the window is full-screen,
 * so every tap lands on our view.
 */
class LockOverlayManager(private val ctx: Context) {
    private val wm = ctx.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private val main = Handler(Looper.getMainLooper())
    private val d = ctx.resources.displayMetrics.density

    private var root: LinearLayout? = null
    private var heading: TextView? = null
    private var sub: TextView? = null
    private var countdown: TextView? = null
    private var openBtn: Button? = null
    private var selfBtn: Button? = null

    /** Set by the service — invoked when the user taps "Open <app>". */
    var onOpenApp: (() -> Unit)? = null

    /** Invoked when the user taps "Go to TokLock". */
    var onOpenSelf: (() -> Unit)? = null

    // Red strobe
    private var flashing = false
    private var flashState = false
    private var flashPeriodMs = 420L
    private val flashTick = object : Runnable {
        override fun run() {
            if (!flashing) return
            flashState = !flashState
            root?.setBackgroundColor(if (flashState) RED_BRIGHT else RED_DARK)
            main.postDelayed(this, flashPeriodMs)
        }
    }

    private fun startFlashing() {
        if (flashing) return
        flashing = true
        flashState = false
        main.post(flashTick)
    }

    private fun stopFlashing() {
        flashing = false
        main.removeCallbacks(flashTick)
    }

    // Weird bouncing text
    private var bounce: ObjectAnimator? = null

    private fun startBounce() {
        val h = heading ?: return
        if (bounce != null) return
        bounce = ObjectAnimator.ofPropertyValuesHolder(
            h,
            PropertyValuesHolder.ofFloat(View.TRANSLATION_Y, 0f, -px(22f).toFloat()),
            PropertyValuesHolder.ofFloat(View.SCALE_X, 1f, 1.08f),
            PropertyValuesHolder.ofFloat(View.SCALE_Y, 1f, 1.08f),
            PropertyValuesHolder.ofFloat(View.ROTATION, -3f, 3f),
        ).apply {
            duration = 360
            repeatCount = ObjectAnimator.INFINITE
            repeatMode = ObjectAnimator.REVERSE
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }
    }

    private fun stopBounce() {
        bounce?.cancel()
        bounce = null
        heading?.apply { translationY = 0f; scaleX = 1f; scaleY = 1f; rotation = 0f }
    }

    private fun periodFor(level: TormentLevel): Long = when (level) {
        TormentLevel.NUDGE -> 520L
        TormentLevel.NOTIFY -> 360L
        TormentLevel.FLASH -> 240L
        else -> 120L // ALARM — frantic strobe
    }

    private fun px(v: Float) = (v * d).toInt()

    private fun params() = WindowManager.LayoutParams(
        WindowManager.LayoutParams.MATCH_PARENT,
        WindowManager.LayoutParams.MATCH_PARENT,
        if (Build.VERSION.SDK_INT >= 26) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
        PixelFormat.TRANSLUCENT,
    )

    private fun ensure(): LinearLayout {
        root?.let { return it }
        val container = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(px(40f), px(40f), px(40f), px(40f))
        }
        heading = TextView(ctx).apply {
            setTextColor(Color.WHITE)
            textSize = 30f
            gravity = Gravity.CENTER
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }
        sub = TextView(ctx).apply {
            setTextColor(0xFFF4EFE9.toInt())
            textSize = 17f
            gravity = Gravity.CENTER
            setPadding(0, px(10f), 0, 0)
        }
        countdown = TextView(ctx).apply {
            setTextColor(Color.WHITE)
            textSize = 20f
            gravity = Gravity.CENTER
            setPadding(0, px(24f), 0, 0)
            visibility = View.GONE
        }
        openBtn = Button(ctx).apply {
            isAllCaps = false
            textSize = 17f
            setTextColor(0xFF0B0908.toInt())
            setTypeface(typeface, android.graphics.Typeface.BOLD)
            background = GradientDrawable().apply {
                cornerRadius = px(14f).toFloat()
                setColor(0xFF35D08A.toInt())
            }
            setPadding(px(28f), px(16f), px(28f), px(16f))
            setOnClickListener { onOpenApp?.invoke() }
        }
        selfBtn = Button(ctx).apply {
            isAllCaps = false
            textSize = 15f
            text = "Go to TokLock"
            setTextColor(0xFFF4EFE9.toInt())
            background = GradientDrawable().apply {
                cornerRadius = px(14f).toFloat()
                setColor(0x00000000)
                setStroke(px(1.5f), 0xFFF4EFE9.toInt())
            }
            setPadding(px(24f), px(14f), px(24f), px(14f))
            setOnClickListener { onOpenSelf?.invoke() }
        }
        container.addView(heading)
        container.addView(sub)
        container.addView(countdown)
        container.addView(
            openBtn,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply { topMargin = px(32f) },
        )
        container.addView(
            selfBtn,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply { topMargin = px(14f) },
        )
        runCatching { wm.addView(container, params()) }
        root = container
        return container
    }

    fun showEscalation(level: TormentLevel, remainingSeconds: Long, appLabel: String, openInSeconds: Int?) =
        main.post {
            ensure()
            flashPeriodMs = periodFor(level)
            startFlashing()
            startBounce()
            heading?.text = "KEEP SCROLLING"
            sub?.text = "${fmt(remainingSeconds)} to your goal"
            openBtn?.text = "Open $appLabel"
            if (openInSeconds != null) {
                countdown?.visibility = View.VISIBLE
                countdown?.text = "Opening $appLabel in ${openInSeconds}s"
            } else {
                countdown?.visibility = View.GONE
            }
        }

    fun showReleased() = main.post {
        ensure()
        stopFlashing()
        stopBounce()
        root?.setBackgroundColor(0xF00F5E3C.toInt())
        heading?.text = "GOAL REACHED"
        sub?.text = "Enjoy your evening — until midnight."
        countdown?.visibility = View.GONE
        openBtn?.visibility = View.GONE
        selfBtn?.visibility = View.GONE
        main.postDelayed({ hide() }, 2500)
    }

    fun hide() = main.post {
        stopFlashing()
        stopBounce()
        root?.let { runCatching { wm.removeView(it) } }
        root = null; heading = null; sub = null; countdown = null; openBtn = null; selfBtn = null
    }

    private fun fmt(sec: Long): String {
        val h = sec / 3600; val m = (sec % 3600) / 60; val s = sec % 60
        return if (h > 0) "%d:%02d:%02d".format(h, m, s) else "%02d:%02d".format(m, s)
    }

    private companion object {
        val RED_BRIGHT = 0xFFE21414.toInt()
        val RED_DARK = 0xFF160404.toInt()
    }
}
