import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLocalStorage } from '../useLocalStorage'
import type { StorageState } from '@/types'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('restoreState', () => {
    it('should return null when localStorage is empty', () => {
      const { restoreState } = useLocalStorage()
      expect(restoreState()).toBeNull()
    })

    it('should restore v2 state from localStorage', () => {
      const mockState: StorageState = {
        currentQuizFile: 'test.json',
        quizzes: {
          'test.json': {
            answeredByCategory: {},
            selectedCategory: 'Wszystko',
            currentQuestionByCategory: {},
            selectionByCategory: {}
          }
        }
      }
      localStorage.setItem('quiz_state_v2', JSON.stringify(mockState))

      const { restoreState } = useLocalStorage()
      expect(restoreState()).toEqual(mockState)
    })

    it('should migrate v1 state to v2 format', () => {
      const v1State = {
        answeredByCategory: {},
        selectedCategory: 'Excel'
      }
      localStorage.setItem('quiz_state_v1', JSON.stringify(v1State))

      const { restoreState } = useLocalStorage()
      const result = restoreState()

      expect(result).toEqual({
        currentQuizFile: 'pytania.json',
        quizzes: {
          'pytania.json': v1State
        }
      })
    })
  })

  describe('saveState', () => {
    it('should save state to localStorage', () => {
      const mockState: StorageState = {
        currentQuizFile: 'test.json',
        quizzes: {}
      }

      const { saveState } = useLocalStorage()
      saveState(mockState)

      const stored = localStorage.getItem('quiz_state_v2')
      expect(stored).toBe(JSON.stringify(mockState))
    })
  })

  describe('clearQuizProgress', () => {
    it('should remove specific quiz from state', () => {
      const mockState: StorageState = {
        currentQuizFile: 'quiz1.json',
        quizzes: {
          'quiz1.json': {
            answeredByCategory: { Excel: { 'Q1': 'correct' } },
            selectedCategory: 'Wszystko',
            currentQuestionByCategory: {},
            selectionByCategory: {}
          },
          'quiz2.json': {
            answeredByCategory: {},
            selectedCategory: 'Wszystko',
            currentQuestionByCategory: {},
            selectionByCategory: {}
          }
        }
      }
      localStorage.setItem('quiz_state_v2', JSON.stringify(mockState))

      const { clearQuizProgress, restoreState } = useLocalStorage()
      clearQuizProgress('quiz1.json')

      const result = restoreState()
      expect(result?.quizzes['quiz1.json']).toBeUndefined()
      expect(result?.quizzes['quiz2.json']).toBeDefined()
    })
  })

  describe('getQuizProgress', () => {
    it('should return 0 for quiz with no progress', () => {
      const { getQuizProgress } = useLocalStorage()
      expect(getQuizProgress('test.json')).toBe(0)
    })

    it('should count correct answers across categories', () => {
      const mockState: StorageState = {
        currentQuizFile: 'test.json',
        quizzes: {
          'test.json': {
            answeredByCategory: {
              Excel: { 'Q1': 'correct', 'Q2': 'wrong' },
              Scratch: { 'Q3': 'correct' }
            },
            selectedCategory: 'Wszystko',
            currentQuestionByCategory: {},
            selectionByCategory: {}
          }
        }
      }
      localStorage.setItem('quiz_state_v2', JSON.stringify(mockState))

      const { getQuizProgress } = useLocalStorage()
      expect(getQuizProgress('test.json')).toBe(2)
    })
  })
})
