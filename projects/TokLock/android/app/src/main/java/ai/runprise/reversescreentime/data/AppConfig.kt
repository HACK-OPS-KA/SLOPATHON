package ai.runprise.reversescreentime.data

data class AppConfig(
    val targetPackages: Set<String> = emptySet(),
    val dailyBudgetSeconds: Long = 5 * 3600, // 5 hours
    val intensity: Int = 3, // fixed at max; not user-configurable anymore
    val lightMode: Boolean = false,
)
