import { describe, it, expect, beforeEach } from 'vitest'
import { useQuizState } from '../useQuizState'
import { ref } from 'vue'

describe('useQuizState', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const createMockQuizData = () => ({
    categories: ref([
      {
        category: 'Excel',
        questions: [
          { question: 'Q1', answers: ['A', 'B'], correctAnswerIndex: 0 },
          { question: 'Q2', answers: ['A', 'B'], correctAnswerIndex: 1 }
        ]
      },
      {
        category: 'Scratch',
        questions: [
          { question: 'Q3', answers: ['A', 'B'], correctAnswerIndex: 0 }
        ]
      }
    ]),
    questionCategoryMap: ref({
      'Q1': 'Excel',
      'Q2': 'Excel',
      'Q3': 'Scratch'
    }),
    selectedQuizFile: ref('test.json')
  })

  describe('computed properties', () => {
    it('should compute uiCategories correctly', () => {
      const mockData = createMockQuizData()
      const quizState = useQuizState(mockData)

      expect(quizState.uiCategories.value).toEqual(['Wszystko', 'Excel', 'Scratch'])
    })

    it('should compute allQuestions correctly', () => {
      const mockData = createMockQuizData()
      const quizState = useQuizState(mockData)

      expect(quizState.allQuestions.value).toHaveLength(3)
    })

    it('should compute currentCategoryQuestions for specific category', () => {
      const mockData = createMockQuizData()
      const quizState = useQuizState(mockData)

      quizState.selectedCategory.value = 'Excel'
      expect(quizState.currentCategoryQuestions.value).toHaveLength(2)

      quizState.selectedCategory.value = 'Scratch'
      expect(quizState.currentCategoryQuestions.value).toHaveLength(1)
    })

    it('should compute progress segments correctly', () => {
      const mockData = createMockQuizData()
      const quizState = useQuizState(mockData)

      quizState.answeredByCategory.value = {
        Excel: { 'Q1': 'correct', 'Q2': 'wrong' }
      }

      const segments = quizState.progressSegments.value
      expect(segments.correct).toBeCloseTo(33.33, 1)
      expect(segments.wrong).toBeCloseTo(33.33, 1)
      expect(segments.remaining).toBeCloseTo(33.33, 1)
    })

    it('should detect when category is completed', () => {
      const mockData = createMockQuizData()
      const quizState = useQuizState(mockData)

      quizState.selectedCategory.value = 'Excel'
      quizState.answeredByCategory.value = {
        Excel: { 'Q1': 'correct', 'Q2': 'correct' }
      }

      expect(quizState.categoryCompleted.value).toBe(true)
    })

    it('should detect when all questions are completed', () => {
      const mockData = createMockQuizData()
      const quizState = useQuizState(mockData)

      quizState.answeredByCategory.value = {
        Excel: { 'Q1': 'correct', 'Q2': 'correct' },
        Scratch: { 'Q3': 'correct' }
      }

      expect(quizState.allCompleted.value).toBe(true)
    })
  })

  describe('submitAnswer', () => {
    it('should mark answer as correct when right answer is selected', () => {
      const mockData = createMockQuizData()
      const quizState = useQuizState(mockData)

      quizState.currentQuestion.value = mockData.categories.value[0].questions[0]
      quizState.selectedIndex.value = 0

      quizState.submitAnswer()

      expect(quizState.isSubmitted.value).toBe(true)
      expect(quizState.isCorrect.value).toBe(true)
      expect(quizState.answeredByCategory.value['Excel']['Q1']).toBe('correct')
    })

    it('should mark answer as wrong when incorrect answer is selected', () => {
      const mockData = createMockQuizData()
      const quizState = useQuizState(mockData)

      quizState.currentQuestion.value = mockData.categories.value[0].questions[0]
      quizState.selectedIndex.value = 1

      quizState.submitAnswer()

      expect(quizState.isSubmitted.value).toBe(true)
      expect(quizState.isCorrect.value).toBe(false)
      expect(quizState.answeredByCategory.value['Excel']['Q1']).toBe('wrong')
    })
  })

  describe('changeCategory', () => {
    it('should change category and reset question state', () => {
      const mockData = createMockQuizData()
      const quizState = useQuizState(mockData)

      quizState.selectedIndex.value = 1
      quizState.isSubmitted.value = true

      quizState.changeCategory('Excel')

      expect(quizState.selectedCategory.value).toBe('Excel')
      expect(quizState.selectedIndex.value).toBeNull()
      expect(quizState.isSubmitted.value).toBe(false)
    })
  })

  describe('resetQuiz', () => {
    it('should clear all progress', () => {
      const mockData = createMockQuizData()
      const quizState = useQuizState(mockData)

      quizState.answeredByCategory.value = {
        Excel: { 'Q1': 'correct' }
      }

      quizState.resetQuiz()

      expect(quizState.answeredByCategory.value).toEqual({})
      expect(quizState.selectedCategory.value).toBe('Wszystko')
    })
  })
})
