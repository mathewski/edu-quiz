import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAutoAdvance } from '../useAutoAdvance'

describe('useAutoAdvance', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { remainingTime, countdown, progress, isActive, isPaused } = useAutoAdvance()
      
      expect(remainingTime.value).toBe(3000)
      expect(countdown.value).toBe(3)
      expect(progress.value).toBe(0)
      expect(isActive.value).toBe(false)
      expect(isPaused.value).toBe(false)
    })
  })

  describe('start', () => {
    it('should activate the timer and set initial state', () => {
      const { isActive, isPaused, start } = useAutoAdvance()
      
      start()
      
      expect(isActive.value).toBe(true)
      expect(isPaused.value).toBe(false)
    })

    it('should decrement remaining time over intervals', () => {
      const { remainingTime, start } = useAutoAdvance()
      
      start()
      
      // After 1 second (10 intervals of 100ms)
      vi.advanceTimersByTime(1000)
      expect(remainingTime.value).toBe(2000)
      
      // After 1 more second
      vi.advanceTimersByTime(1000)
      expect(remainingTime.value).toBe(1000)
    })

    it('should update progress percentage correctly', () => {
      const { progress, start } = useAutoAdvance()
      
      start()
      
      // After 1 second (~33% progress)
      vi.advanceTimersByTime(1000)
      expect(progress.value).toBeCloseTo(33.33, 1)
      
      // After 1.5 seconds total (50% progress)
      vi.advanceTimersByTime(500)
      expect(progress.value).toBe(50)
      
      // After 2.4 seconds total (80% progress)
      vi.advanceTimersByTime(900)
      expect(progress.value).toBe(80)
    })

    it('should update countdown display value', () => {
      const { countdown, start } = useAutoAdvance()
      
      start()
      expect(countdown.value).toBe(3)
      
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBe(2)
      
      vi.advanceTimersByTime(1000)
      expect(countdown.value).toBe(1)
      
      // Just before completion
      vi.advanceTimersByTime(900)
      expect(countdown.value).toBe(1)
    })

    it('should reset if start is called again', () => {
      const { remainingTime, start } = useAutoAdvance()
      
      start()
      vi.advanceTimersByTime(1500)
      expect(remainingTime.value).toBe(1500)
      
      // Start again - should reset
      start()
      expect(remainingTime.value).toBe(3000)
    })
  })

  describe('stop', () => {
    it('should deactivate timer and reset state', () => {
      const { remainingTime, isActive, isPaused, start, stop } = useAutoAdvance()
      
      start()
      vi.advanceTimersByTime(1500)
      
      stop()
      
      expect(remainingTime.value).toBe(3000)
      expect(isActive.value).toBe(false)
      expect(isPaused.value).toBe(false)
    })

    it('should stop the timer from decrementing', () => {
      const { remainingTime, start, stop } = useAutoAdvance()
      
      start()
      vi.advanceTimersByTime(1000)
      stop()
      
      const timeAfterStop = remainingTime.value
      vi.advanceTimersByTime(5000)
      
      // Time should be reset to initial, not continuing to decrement
      expect(remainingTime.value).toBe(3000)
    })
  })

  describe('pause', () => {
    it('should pause the countdown', () => {
      const { isPaused, start, pause } = useAutoAdvance()
      
      start()
      pause()
      
      expect(isPaused.value).toBe(true)
    })

    it('should freeze remaining time when paused', () => {
      const { remainingTime, start, pause } = useAutoAdvance()
      
      start()
      vi.advanceTimersByTime(1000)
      expect(remainingTime.value).toBe(2000)
      
      pause()
      
      // Time should not decrease while paused
      vi.advanceTimersByTime(2000)
      expect(remainingTime.value).toBe(2000)
    })

    it('should keep isActive true when paused', () => {
      const { isActive, start, pause } = useAutoAdvance()
      
      start()
      pause()
      
      expect(isActive.value).toBe(true)
    })

    it('should do nothing if timer is not active', () => {
      const { isPaused, pause } = useAutoAdvance()
      
      pause()
      
      expect(isPaused.value).toBe(false)
    })
  })

  describe('resume', () => {
    it('should resume the countdown from paused state', () => {
      const { isPaused, start, pause, resume } = useAutoAdvance()
      
      start()
      pause()
      resume()
      
      expect(isPaused.value).toBe(false)
    })

    it('should continue decrementing after resume', () => {
      const { remainingTime, start, pause, resume } = useAutoAdvance()
      
      start()
      vi.advanceTimersByTime(1000)
      expect(remainingTime.value).toBe(2000)
      
      pause()
      vi.advanceTimersByTime(1000)
      expect(remainingTime.value).toBe(2000) // Still 2000 while paused
      
      resume()
      vi.advanceTimersByTime(1000)
      expect(remainingTime.value).toBe(1000) // Continues after resume
    })

    it('should do nothing if timer is not active', () => {
      const { isPaused, resume } = useAutoAdvance()
      
      resume()
      
      expect(isPaused.value).toBe(false)
    })
  })

  describe('onComplete callback', () => {
    it('should call callback when countdown reaches 0', () => {
      const onComplete = vi.fn()
      const { start } = useAutoAdvance(onComplete)
      
      start()
      vi.advanceTimersByTime(3000)
      
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should stop timer after callback is called', () => {
      const onComplete = vi.fn()
      const { isActive, start } = useAutoAdvance(onComplete)
      
      start()
      vi.advanceTimersByTime(3000)
      
      expect(isActive.value).toBe(false)
    })

    it('should not call callback if stopped before completion', () => {
      const onComplete = vi.fn()
      const { start, stop } = useAutoAdvance(onComplete)
      
      start()
      vi.advanceTimersByTime(1500)
      stop()
      vi.advanceTimersByTime(5000)
      
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('should handle missing callback gracefully', () => {
      const { start } = useAutoAdvance()
      
      expect(() => {
        start()
        vi.advanceTimersByTime(3000)
      }).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle progress when timer completes', () => {
      const { progress, remainingTime, start } = useAutoAdvance()
      
      start()
      
      // Just before completion
      vi.advanceTimersByTime(2900)
      expect(progress.value).toBeCloseTo(96.67, 1)
      
      // Complete the timer
      vi.advanceTimersByTime(100)
      
      // After completion, timer is stopped and reset
      expect(remainingTime.value).toBe(3000)
      expect(progress.value).toBe(0)
    })

    it('should handle countdown value at completion', () => {
      const onComplete = vi.fn()
      const { countdown, start } = useAutoAdvance(onComplete)
      
      start()
      vi.advanceTimersByTime(3000)
      
      // After completion, state is reset
      expect(countdown.value).toBe(3)
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple pause/resume cycles', () => {
      const { remainingTime, start, pause, resume } = useAutoAdvance()
      
      start()
      
      vi.advanceTimersByTime(500)
      expect(remainingTime.value).toBe(2500)
      
      pause()
      vi.advanceTimersByTime(500)
      expect(remainingTime.value).toBe(2500)
      
      resume()
      vi.advanceTimersByTime(500)
      expect(remainingTime.value).toBe(2000)
      
      pause()
      vi.advanceTimersByTime(500)
      expect(remainingTime.value).toBe(2000)
      
      resume()
      vi.advanceTimersByTime(500)
      expect(remainingTime.value).toBe(1500)
    })
  })
})
