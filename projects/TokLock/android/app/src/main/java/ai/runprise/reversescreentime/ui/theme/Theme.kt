package ai.runprise.reversescreentime.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

/** The full app palette. Two instances — dark (default) and light — both matched to the landing page. */
data class RsPalette(
    val ink: Color,
    val surface1: Color,
    val surface2: Color,
    val outline: Color,
    val bone: Color,
    val muted: Color,
    val dim: Color,
    val steel: Color,
    val alarm: Color,
    val free: Color,
)

private val DarkPalette = RsPalette(
    ink = Color(0xFF0B0908),
    surface1 = Color(0xFF181512),
    surface2 = Color(0xFF221D19),
    outline = Color(0xFF2A2420),
    bone = Color(0xFFF4EFE9),
    muted = Color(0xFFA89F96),
    dim = Color(0xFF6F665E),
    steel = Color(0xFF8FB0A3),
    alarm = Color(0xFF35D08A),
    free = Color(0xFF5FE08A),
)

private val LightPalette = RsPalette(
    ink = Color(0xFFFBFAF8),
    surface1 = Color(0xFFFFFFFF),
    surface2 = Color(0xFFF4F1EA),
    outline = Color(0xFFE7E1D7),
    bone = Color(0xFF1C1712),
    muted = Color(0xFF5F574E),
    dim = Color(0xFF9A8F84),
    steel = Color(0xFF4F7A64),
    alarm = Color(0xFF12A163),
    free = Color(0xFF12A163),
)

// App-wide theme state (single window). Reads inside composition subscribe and recolor on toggle.
private val paletteState = mutableStateOf(DarkPalette)

fun applyLightMode(light: Boolean) {
    paletteState.value = if (light) LightPalette else DarkPalette
}

val isLightMode: Boolean get() = paletteState.value === LightPalette

// Named accessors — screens keep using Ink / Bone / Alarm etc. unchanged; they now theme-switch.
val Ink: Color @Composable get() = paletteState.value.ink
val Surface1: Color @Composable get() = paletteState.value.surface1
val Surface2: Color @Composable get() = paletteState.value.surface2
val Outline: Color @Composable get() = paletteState.value.outline
val Bone: Color @Composable get() = paletteState.value.bone
val Muted: Color @Composable get() = paletteState.value.muted
val Dim: Color @Composable get() = paletteState.value.dim
val Steel: Color @Composable get() = paletteState.value.steel
val Alarm: Color @Composable get() = paletteState.value.alarm
val Free: Color @Composable get() = paletteState.value.free

private val Mono = FontFamily.Monospace

val RsTypography = Typography(
    displayLarge = TextStyle(fontFamily = Mono, fontWeight = FontWeight.Bold, fontSize = 64.sp, letterSpacing = (-1).sp),
    displayMedium = TextStyle(fontFamily = Mono, fontWeight = FontWeight.Bold, fontSize = 40.sp),
    headlineSmall = TextStyle(fontWeight = FontWeight.Bold, fontSize = 22.sp, letterSpacing = (-0.2).sp),
    titleMedium = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 16.sp),
    bodyLarge = TextStyle(fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 22.sp),
    bodyMedium = TextStyle(fontWeight = FontWeight.Normal, fontSize = 14.sp, lineHeight = 20.sp),
    labelLarge = TextStyle(fontFamily = Mono, fontWeight = FontWeight.Medium, fontSize = 12.sp, letterSpacing = 3.sp),
    labelMedium = TextStyle(fontFamily = Mono, fontWeight = FontWeight.Medium, fontSize = 11.sp, letterSpacing = 2.sp),
)

@Composable
fun RsTheme(content: @Composable () -> Unit) {
    val p = paletteState.value
    val scheme = if (p === LightPalette) {
        lightColorScheme(
            primary = p.alarm,
            onPrimary = Color.White,
            secondary = p.bone,
            onSecondary = p.ink,
            background = p.ink,
            onBackground = p.bone,
            surface = p.surface1,
            onSurface = p.bone,
            surfaceVariant = p.surface2,
            onSurfaceVariant = p.muted,
            outline = p.outline,
            error = p.alarm,
        )
    } else {
        darkColorScheme(
            primary = p.alarm,
            onPrimary = p.ink,
            secondary = p.bone,
            onSecondary = p.ink,
            background = p.ink,
            onBackground = p.bone,
            surface = p.surface1,
            onSurface = p.bone,
            surfaceVariant = p.surface2,
            onSurfaceVariant = p.muted,
            outline = p.outline,
            error = p.alarm,
        )
    }
    MaterialTheme(colorScheme = scheme, typography = RsTypography, content = content)
}
