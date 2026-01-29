import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useQuizData } from '../useQuizData'

// Mock fetch globally
global.fetch = vi.fn()

describe('useQuizData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('loadAvailableQuizzes', () => {
    it('should load quizzes from quizzes.json', async () => {
      const mockQuizzes = [
        { file: 'quiz1.json', name: 'Quiz 1' },
        { file: 'quiz2.json', name: 'Quiz 2' }
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuizzes
      } as Response)

      const { loadAvailableQuizzes, availableQuizzes } = useQuizData()
      await loadAvailableQuizzes()

      expect(availableQuizzes.value).toEqual(mockQuizzes)
    })

    it('should use fallback when quizzes.json fails', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const { loadAvailableQuizzes, availableQuizzes } = useQuizData()
      await loadAvailableQuizzes()

      expect(availableQuizzes.value).toEqual([
        { file: 'pytania.json', name: 'Quiz Informatyka' }
      ])
    })
  })

  describe('loadQuizData', () => {
    it('should load quiz data and build category map', async () => {
      const mockCategories = [
        {
          category: 'Excel',
          questions: [
            { question: 'Q1', answers: ['A', 'B'], correctAnswerIndex: 0 }
          ]
        },
        {
          category: 'Scratch',
          questions: [
            { question: 'Q2', answers: ['A', 'B'], correctAnswerIndex: 1 }
          ]
        }
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories
      } as Response)

      const { loadQuizData, categories, questionCategoryMap } = useQuizData()
      await loadQuizData('test.json')

      expect(categories.value).toEqual(mockCategories)
      expect(questionCategoryMap.value).toEqual({
        'Q1': 'Excel',
        'Q2': 'Scratch'
      })
    })

    it('should set error message on failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false
      } as Response)

      const { loadQuizData, errorMessage } = useQuizData()
      await loadQuizData('invalid.json')

      expect(errorMessage.value).toContain('Nie udało się wczytać')
    })
  })

  describe('getQuizName', () => {
    it('should return quiz name for known file', () => {
      const { availableQuizzes, getQuizName } = useQuizData()
      availableQuizzes.value = [
        { file: 'quiz1.json', name: 'Quiz 1' },
        { file: 'quiz2.json', name: 'Quiz 2' }
      ]

      expect(getQuizName('quiz1.json')).toBe('Quiz 1')
      expect(getQuizName('quiz2.json')).toBe('Quiz 2')
    })

    it('should return default for unknown file', () => {
      const { getQuizName } = useQuizData()
      expect(getQuizName('unknown.json')).toBe('Quiz')
    })
  })

  describe('getQuizProgressText', () => {
    it('should return null for quiz with no progress', () => {
      const { getQuizProgressText } = useQuizData()
      expect(getQuizProgressText('test.json')).toBeNull()
    })

    it('should return progress text with correct count', () => {
      const mockState = {
        currentQuizFile: 'test.json',
        quizzes: {
          'test.json': {
            answeredByCategory: {
              Excel: { 'Q1': 'correct' }
            },
            selectedCategory: 'Wszystko',
            currentQuestionByCategory: {},
            selectionByCategory: {}
          }
        }
      }
      localStorage.setItem('quiz_state_v2', JSON.stringify(mockState))

      const { getQuizProgressText } = useQuizData()
      expect(getQuizProgressText('test.json')).toBe('1 poprawnych odpowiedzi')
    })
  })

  describe('initializeApp', () => {
    it('should load quiz when stored quiz file exists', async () => {
      const mockState = {
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

      const mockCategories = [
        {
          category: 'Excel',
          questions: [
            { question: 'Q1', answers: ['A', 'B'], correctAnswerIndex: 0 }
          ]
        }
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories
      } as Response)

      const { initializeApp, selectedQuizFile, categories, loading } = useQuizData()
      await initializeApp()

      expect(selectedQuizFile.value).toBe('test.json')
      expect(categories.value).toEqual(mockCategories)
      expect(loading.value).toBe(false)
    })

    it('should clear selectedQuizFile when stored quiz file fails to load (404)', async () => {
      const mockState = {
        currentQuizFile: 'missing-quiz.json',
        quizzes: {
          'missing-quiz.json': {
            answeredByCategory: {
              Excel: { 'Q1': 'correct' }
            },
            selectedCategory: 'Wszystko',
            currentQuestionByCategory: {},
            selectionByCategory: {}
          }
        }
      }
      localStorage.setItem('quiz_state_v2', JSON.stringify(mockState))

      // Mock fetch to return 404
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false
      } as Response)

      const { initializeApp, selectedQuizFile, errorMessage, loading } = useQuizData()
      await initializeApp()

      // After 404, selectedQuizFile should be cleared
      expect(selectedQuizFile.value).toBeNull()
      expect(errorMessage.value).toContain('Nie udało się wczytać')
      expect(loading.value).toBe(false)

      // Check that localStorage was cleaned up
      const updatedState = JSON.parse(localStorage.getItem('quiz_state_v2') || '{}')
      expect(updatedState.currentQuizFile).toBe('')
      expect(updatedState.quizzes['missing-quiz.json']).toBeUndefined()
    })

    it('should show selector when no quiz is stored', async () => {
      const { initializeApp, selectedQuizFile, loading } = useQuizData()
      await initializeApp()

      expect(selectedQuizFile.value).toBeNull()
      expect(loading.value).toBe(false)
    })
  })
})
