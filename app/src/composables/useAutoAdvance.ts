import { ref, computed, onUnmounted, type Ref } from 'vue'

/**
 * Composable for managing auto-advance countdown timer
 * 
 * Features:
 * - 3-second countdown with visual progress
 * - Pause/resume on hover
 * - Callback when countdown completes
 * - Clean state management
 */
export function useAutoAdvance(onComplete?: () => void) {
  const TOTAL_DURATION = 3000 // 3 seconds in milliseconds
  const UPDATE_INTERVAL = 100 // Update every 100ms for smooth animation

  // State
  const remainingTime = ref(TOTAL_DURATION)
  const isActive = ref(false)
  const isPaused = ref(false)
  
  let intervalId: ReturnType<typeof setInterval> | null = null

  // Computed progress percentage (0 to 100)
  const progress = computed(() => {
    const elapsed = TOTAL_DURATION - remainingTime.value
    return Math.min((elapsed / TOTAL_DURATION) * 100, 100)
  })

  // Computed countdown in seconds (for display if needed)
  const countdown = computed(() => {
    return Math.ceil(remainingTime.value / 1000)
  })

  /**
   * Clear the interval timer
   */
  const clearTimer = () => {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  /**
   * Start the countdown timer
   */
  const start = () => {
    // Reset state
    stop()
    
    remainingTime.value = TOTAL_DURATION
    isActive.value = true
    isPaused.value = false

    // Start interval
    intervalId = setInterval(() => {
      if (isPaused.value) {
        return
      }

      remainingTime.value -= UPDATE_INTERVAL

      // Check if countdown completed
      if (remainingTime.value <= 0) {
        remainingTime.value = 0
        stop()
        
        // Trigger callback
        if (onComplete) {
          onComplete()
        }
      }
    }, UPDATE_INTERVAL)
  }

  /**
   * Stop and reset the countdown
   */
  const stop = () => {
    clearTimer()
    remainingTime.value = TOTAL_DURATION
    isActive.value = false
    isPaused.value = false
  }

  /**
   * Pause the countdown (freezes at current position)
   */
  const pause = () => {
    if (isActive.value) {
      isPaused.value = true
    }
  }

  /**
   * Resume the countdown from paused state
   */
  const resume = () => {
    if (isActive.value) {
      isPaused.value = false
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    clearTimer()
  })

  return {
    // State
    remainingTime: remainingTime as Ref<number>,
    countdown,
    progress,
    isActive: isActive as Ref<boolean>,
    isPaused: isPaused as Ref<boolean>,
    
    // Methods
    start,
    stop,
    pause,
    resume
  }
}
