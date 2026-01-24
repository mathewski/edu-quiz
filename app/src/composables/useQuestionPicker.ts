import type { Question } from '@/types'

/**
 * Composable for question selection logic
 */
export function useQuestionPicker() {
  /**
   * Get status for a specific question
   */
  const getStatusForQuestion = (
    questionText: string,
    categoryMap: Record<string, string>,
    answeredByCategory: Record<string, Record<string, 'correct' | 'wrong'>>
  ): 'correct' | 'wrong' | undefined => {
    const category = categoryMap[questionText]
    if (!category) {
      return undefined
    }
    return answeredByCategory[category]?.[questionText]
  }

  /**
   * Get pool of unanswered questions (or incorrectly answered)
   */
  const getQuestionPool = (
    questions: Question[],
    categoryMap: Record<string, string>,
    answeredByCategory: Record<string, Record<string, 'correct' | 'wrong'>>
  ): Question[] => {
    return questions.filter(
      (question) => getStatusForQuestion(question.question, categoryMap, answeredByCategory) !== 'correct'
    )
  }

  /**
   * Pick a random question from the pool
   */
  const pickRandomQuestion = (pool: Question[]): Question | null => {
    if (!pool.length) {
      return null
    }
    const index = Math.floor(Math.random() * pool.length)
    return pool[index]
  }

  return {
    getStatusForQuestion,
    getQuestionPool,
    pickRandomQuestion
  }
}
