import { describe, it, expect } from 'vitest'
import { useQuestionPicker } from '../useQuestionPicker'
import type { Question } from '@/types'

describe('useQuestionPicker', () => {
  const mockQuestions: Question[] = [
    {
      question: 'Question 1',
      answers: ['A', 'B', 'C'],
      correctAnswerIndex: 0
    },
    {
      question: 'Question 2',
      answers: ['A', 'B', 'C'],
      correctAnswerIndex: 1
    },
    {
      question: 'Question 3',
      answers: ['A', 'B', 'C'],
      correctAnswerIndex: 2
    }
  ]

  const mockCategoryMap = {
    'Question 1': 'Excel',
    'Question 2': 'Excel',
    'Question 3': 'Scratch'
  }

  describe('getStatusForQuestion', () => {
    it('should return status for a question', () => {
      const answeredByCategory = {
        Excel: {
          'Question 1': 'correct' as const,
          'Question 2': 'wrong' as const
        }
      }

      const { getStatusForQuestion } = useQuestionPicker()
      
      expect(getStatusForQuestion('Question 1', mockCategoryMap, answeredByCategory)).toBe('correct')
      expect(getStatusForQuestion('Question 2', mockCategoryMap, answeredByCategory)).toBe('wrong')
      expect(getStatusForQuestion('Question 3', mockCategoryMap, answeredByCategory)).toBeUndefined()
    })

    it('should return undefined for unmapped question', () => {
      const { getStatusForQuestion } = useQuestionPicker()
      
      expect(getStatusForQuestion('Unknown', {}, {})).toBeUndefined()
    })
  })

  describe('getQuestionPool', () => {
    it('should return only unanswered questions', () => {
      const answeredByCategory = {
        Excel: {
          'Question 1': 'correct' as const
        }
      }

      const { getQuestionPool } = useQuestionPicker()
      const pool = getQuestionPool(mockQuestions, mockCategoryMap, answeredByCategory)

      expect(pool).toHaveLength(2)
      expect(pool.map(q => q.question)).toEqual(['Question 2', 'Question 3'])
    })

    it('should include wrongly answered questions', () => {
      const answeredByCategory = {
        Excel: {
          'Question 1': 'correct' as const,
          'Question 2': 'wrong' as const
        }
      }

      const { getQuestionPool } = useQuestionPicker()
      const pool = getQuestionPool(mockQuestions, mockCategoryMap, answeredByCategory)

      expect(pool).toHaveLength(2)
      expect(pool.map(q => q.question)).toContain('Question 2')
    })

    it('should return all questions when none are answered', () => {
      const { getQuestionPool } = useQuestionPicker()
      const pool = getQuestionPool(mockQuestions, mockCategoryMap, {})

      expect(pool).toHaveLength(3)
    })
  })

  describe('pickRandomQuestion', () => {
    it('should return null for empty pool', () => {
      const { pickRandomQuestion } = useQuestionPicker()
      expect(pickRandomQuestion([])).toBeNull()
    })

    it('should return a question from the pool', () => {
      const { pickRandomQuestion } = useQuestionPicker()
      const question = pickRandomQuestion(mockQuestions)

      expect(question).not.toBeNull()
      expect(mockQuestions).toContain(question!)
    })

    it('should return the only question in a single-item pool', () => {
      const { pickRandomQuestion } = useQuestionPicker()
      const singleQuestion = [mockQuestions[0]]
      const question = pickRandomQuestion(singleQuestion)

      expect(question).toBe(mockQuestions[0])
    })
  })
})
