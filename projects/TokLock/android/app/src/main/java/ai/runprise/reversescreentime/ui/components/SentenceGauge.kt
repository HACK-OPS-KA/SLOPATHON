package ai.runprise.reversescreentime.ui.components

import ai.runprise.reversescreentime.ui.theme.Alarm
import ai.runprise.reversescreentime.ui.theme.Free
import ai.runprise.reversescreentime.ui.theme.Outline
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.dp
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * The signature: a ring of tally-style ticks around a big centre slot. Served time lights ticks in
 * order (like scratches on a cell wall); once the sentence is complete the whole ring turns green.
 *
 * @param progress 0f..1f share of the daily budget served.
 * @param released true when the day's budget is full — the ring goes green and calm.
 */
@Composable
fun SentenceGauge(
    progress: Float,
    released: Boolean,
    modifier: Modifier = Modifier,
    ticks: Int = 60,
    diameter: Int = 260,
    center: @Composable () -> Unit,
) {
    val animated by animateFloatAsState(targetValue = progress.coerceIn(0f, 1f), label = "gauge")
    val lit = if (released) ticks else (animated * ticks).roundToInt()
    val onColor = if (released) Free else Alarm
    val offColor = Outline // read here — @Composable getter can't run inside the draw lambda

    Box(modifier = modifier.size(diameter.dp), contentAlignment = Alignment.Center) {
        Canvas(Modifier.size(diameter.dp)) {
            val cx = size.width / 2f
            val cy = size.height / 2f
            val outer = size.minDimension / 2f
            val tickLen = outer * 0.16f
            val stroke = outer * 0.030f
            // Start at 12 o'clock, go clockwise.
            for (i in 0 until ticks) {
                val angle = (-PI / 2.0) + (2.0 * PI * i / ticks)
                val ca = cos(angle).toFloat()
                val sa = sin(angle).toFloat()
                val on = i < lit
                val len = if (on) tickLen * 1.25f else tickLen
                val innerR = outer - len
                drawLine(
                    color = if (on) onColor else offColor,
                    start = Offset(cx + innerR * ca, cy + innerR * sa),
                    end = Offset(cx + outer * ca, cy + outer * sa),
                    strokeWidth = if (on) stroke * 1.4f else stroke,
                    cap = StrokeCap.Round,
                )
            }
            // Faint enclosing ring inside the ticks.
            drawCircle(
                color = Color(0x22FFFFFF),
                radius = (outer - tickLen * 1.6f),
                style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1f),
            )
        }
        center()
    }
}
