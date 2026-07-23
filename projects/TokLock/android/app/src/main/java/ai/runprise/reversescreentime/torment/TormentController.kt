package ai.runprise.reversescreentime.torment

import ai.runprise.reversescreentime.core.TormentLevel
import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

/**
 * Produces the staged "torment". Each apply(level) is called repeatedly (~4x/s) by the service, so
 * every start-* is idempotent and only kicks off once per escalation episode; [stopAll] resets the
 * whole thing when the user returns to the target app.
 */
class TormentController(private val ctx: Context) {
    private val cam = ctx.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    private val audio = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private val vibrator: Vibrator = if (Build.VERSION.SDK_INT >= 31) {
        (ctx.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
    } else {
        @Suppress("DEPRECATION") ctx.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }
    private val main = Handler(Looper.getMainLooper())

    private var vibrating = false
    private var flashing = false
    private var notifStarted = false
    private var notifFired = 0
    private val notifPlayers = mutableListOf<MediaPlayer>()
    private val notifRunnables = mutableListOf<Runnable>()
    private var alarmPlayer: MediaPlayer? = null

    // When (ms after NOTIFY starts) each notification hit fires: once, +3s, +2s, then +1s twice quick.
    private val notifSchedule = longArrayOf(0L, 3_000L, 5_000L, 6_000L, 6_300L)

    /** True once every scheduled notification hit has fired AND finished playing. */
    fun notificationDone(): Boolean =
        notifStarted && notifFired >= notifSchedule.size && notifPlayers.isEmpty()

    private val torchId: String? = runCatching {
        cam.cameraIdList.firstOrNull { id ->
            cam.getCameraCharacteristics(id).get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
        }
    }.getOrNull()

    private val alarmAttrs = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()

    fun apply(level: TormentLevel, intensity: Int) {
        when (level) {
            TormentLevel.GRACE -> stopAll()
            TormentLevel.NUDGE -> startVibration()
            TormentLevel.NOTIFY -> { startVibration(); startNotificationBurst() }
            TormentLevel.FLASH -> { startVibration(); startNotificationBurst(); startFlash(300) }
            TormentLevel.ALARM -> { startVibration(); stopNotification(); startFlash(120); startAlarm(intensity) }
        }
    }

    // --- Sound sources (bundled res/raw, falling back to system sounds) ---

    private fun soundUri(name: String, fallbackType: Int): Uri {
        val id = ctx.resources.getIdentifier(name, "raw", ctx.packageName)
        return if (id != 0) Uri.parse("android.resource://${ctx.packageName}/$id")
        else RingtoneManager.getDefaultUri(fallbackType)
    }

    private fun raiseAlarmVolume(fraction: Float) {
        val max = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM)
        audio.setStreamVolume(AudioManager.STREAM_ALARM, (max * fraction).toInt().coerceIn(1, max), 0)
    }

    /** Fires notification.mp3 on the layered schedule (once, +3s, +2s, +1s twice). Idempotent. */
    private fun startNotificationBurst() {
        if (notifStarted) return
        notifStarted = true
        notifFired = 0
        raiseAlarmVolume(0.8f)
        notifSchedule.forEach { offset ->
            val r = Runnable { notifFired++; playNotificationOnce() }
            notifRunnables.add(r)
            main.postDelayed(r, offset)
        }
    }

    /** Each hit is its own player, so overlapping ("layered") hits are fine. */
    private fun playNotificationOnce() {
        val mp = MediaPlayer()
        runCatching {
            mp.setAudioAttributes(alarmAttrs)
            mp.setDataSource(ctx, soundUri("notification", RingtoneManager.TYPE_NOTIFICATION))
            mp.setOnPreparedListener { it.start() }
            mp.setOnCompletionListener {
                runCatching { it.release() }
                notifPlayers.remove(it)
            }
            mp.setOnErrorListener { p, _, _ ->
                runCatching { p.release() }
                notifPlayers.remove(p)
                true
            }
            mp.prepareAsync()
            notifPlayers.add(mp)
        }.onFailure { mp.release() }
    }

    private fun stopNotification() {
        notifRunnables.forEach { main.removeCallbacks(it) }
        notifRunnables.clear()
        notifPlayers.forEach { runCatching { it.stop() }; runCatching { it.release() } }
        notifPlayers.clear()
        notifFired = 0
    }

    /** Loops ringtone.mp3 at high volume. */
    private fun startAlarm(intensity: Int) {
        if (alarmPlayer != null) return
        raiseAlarmVolume(0.6f + 0.4f * (intensity.coerceIn(1, 3) / 3f))
        val mp = MediaPlayer()
        runCatching {
            mp.setAudioAttributes(alarmAttrs)
            mp.setDataSource(ctx, soundUri("ringtone", RingtoneManager.TYPE_ALARM))
            mp.isLooping = true
            mp.setOnPreparedListener { it.start() }
            mp.prepareAsync()
            alarmPlayer = mp
        }.onFailure { mp.release() }
    }

    private fun stopAlarm() {
        alarmPlayer?.let { runCatching { it.stop() }; runCatching { it.release() } }
        alarmPlayer = null
    }

    // --- Flashlight strobe ---

    private fun startFlash(periodMs: Long) {
        val id = torchId ?: return
        if (flashing) return
        flashing = true
        var on = false
        val r = object : Runnable {
            override fun run() {
                if (!flashing) return
                on = !on
                runCatching { cam.setTorchMode(id, on) }
                main.postDelayed(this, periodMs)
            }
        }
        main.post(r)
    }

    private fun stopFlash() {
        flashing = false
        torchId?.let { runCatching { cam.setTorchMode(it, false) } }
    }

    // --- Vibration (repeating pulse) ---

    private fun startVibration() {
        if (vibrating) return
        vibrating = true
        val timings = longArrayOf(0, 350, 250) // start, vibrate, pause
        if (Build.VERSION.SDK_INT >= 26) {
            val amps = intArrayOf(0, 255, 0)
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amps, 0))
        } else {
            @Suppress("DEPRECATION") vibrator.vibrate(timings, 0)
        }
    }

    private fun stopVibration() {
        vibrating = false
        runCatching { vibrator.cancel() }
    }

    fun stopAll() {
        stopVibration()
        stopFlash()
        stopNotification()
        stopAlarm()
        notifStarted = false
    }
}
