package ai.runprise.reversescreentime

import ai.runprise.reversescreentime.core.EscalationPolicy
import ai.runprise.reversescreentime.core.TormentLevel
import kotlin.test.Test
import kotlin.test.assertEquals

class EscalationPolicyTest {
    @Test
    fun in_app_is_grace() = assertEquals(TormentLevel.GRACE, EscalationPolicy.level(null))

    @Test
    fun starts_immediately_with_nudge() {
        assertEquals(TormentLevel.NUDGE, EscalationPolicy.level(0))
        assertEquals(TormentLevel.NUDGE, EscalationPolicy.level(3_999))
    }

    @Test
    fun four_seconds_starts_notify() = assertEquals(TormentLevel.NOTIFY, EscalationPolicy.level(4_500))

    @Test
    fun nine_seconds_starts_flash() = assertEquals(TormentLevel.FLASH, EscalationPolicy.level(9_500))

    @Test
    fun sixteen_seconds_starts_alarm() = assertEquals(TormentLevel.ALARM, EscalationPolicy.level(16_500))
}
