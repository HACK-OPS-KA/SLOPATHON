package ai.runprise.reversescreentime.core

enum class SessionState { IDLE, CAPTIVE, ESCALATION, RELEASED }

sealed interface Event {
    data class TargetAppForeground(val at: Long) : Event
    data class OtherAppForeground(val at: Long) : Event
    data class Tick(val at: Long) : Event
    data class SessionRequested(val at: Long) : Event
}
