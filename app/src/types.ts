// Type definitions for the quiz application

export interface QuizAnswer {
  text: string
  isCorrect: boolean
}

export interface Question {
  question: string
  answers: string[]
  correctAnswerIndex: number
}

export interface Category {
  category: string
  questions: Question[]
}

export interface QuizMetadata {
  file: string
  name: string
}

export interface QuizState {
  answeredByCategory: Record<string, Record<string, 'correct' | 'wrong'>>
  selectedCategory: string
  currentQuestionByCategory: Record<string, string>
  selectionByCategory: Record<string, {
    selectedIndex: number | null
    isSubmitted: boolean
    isCorrect: boolean
  }>
}

export interface StorageState {
  currentQuizFile: string
  quizzes: Record<string, QuizState>
}

export interface ProgressSegments {
  correct: number
  wrong: number
  remaining: number
}
