import type { StorageState, QuizState } from '@/types'

const STORAGE_KEY = 'quiz_state_v2'
const OLD_STORAGE_KEY = 'quiz_state_v1'

/**
 * Composable for managing quiz state persistence in localStorage
 */
export function useLocalStorage() {
  /**
   * Migrate state from v1 to v2 format
   */
  const migrateFromV1 = (): StorageState | null => {
    if (typeof localStorage === 'undefined') {
      return null
    }

    const raw = localStorage.getItem(OLD_STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      const oldState = JSON.parse(raw)
      const newState: StorageState = {
        currentQuizFile: 'pytania.json',
        quizzes: {
          'pytania.json': oldState
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      return newState
    } catch (error) {
      console.error('Failed to migrate v1 state:', error)
      return null
    }
  }

  /**
   * Restore state from localStorage
   */
  const restoreState = (): StorageState | null => {
    if (typeof localStorage === 'undefined') {
      return null
    }

    // Try v2 first
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch (error) {
        console.error('Failed to parse v2 state:', error)
        return null
      }
    }

    // Try migration from v1
    return migrateFromV1()
  }

  /**
   * Save quiz state to localStorage
   */
  const saveState = (state: StorageState): void => {
    if (typeof localStorage === 'undefined') {
      return
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save state:', error)
    }
  }

  /**
   * Clear progress for a specific quiz
   */
  const clearQuizProgress = (quizFile: string): StorageState | null => {
    const stored = restoreState()
    if (!stored) {
      return null
    }

    if (stored.quizzes[quizFile]) {
      delete stored.quizzes[quizFile]
    }

    saveState(stored)
    return stored
  }

  /**
   * Get progress for a specific quiz
   */
  const getQuizProgress = (quizFile: string): number => {
    const stored = restoreState()
    const quizState = stored?.quizzes?.[quizFile]

    if (!quizState?.answeredByCategory) {
      return 0
    }

    let totalCorrect = 0
    for (const answers of Object.values(quizState.answeredByCategory)) {
      totalCorrect += Object.values(answers).filter(v => v === 'correct').length
    }

    return totalCorrect
  }

  return {
    restoreState,
    saveState,
    clearQuizProgress,
    getQuizProgress,
    migrateFromV1
  }
}
