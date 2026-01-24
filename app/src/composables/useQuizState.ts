import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import type { Question, QuizState, StorageState, ProgressSegments } from '@/types'
import { useLocalStorage } from './useLocalStorage'
import { useQuestionPicker } from './useQuestionPicker'

interface UseQuizDataReturn {
  categories: Ref<any[]>
  questionCategoryMap: Ref<Record<string, string>>
  selectedQuizFile: Ref<string | null>
}

/**
 * Composable for managing quiz state and logic
 */
export function useQuizState(quizData: UseQuizDataReturn) {
  // State
  const currentQuestion = ref<Question | null>(null)
  const selectedIndex = ref<number | null>(null)
  const isSubmitted = ref(false)
  const isCorrect = ref(false)
  const answeredByCategory = ref<Record<string, Record<string, 'correct' | 'wrong'>>>({})
  const selectedCategory = ref('Wszystko')
  const stateCache = ref<StorageState | null>(null)

  // Get utilities
  const { restoreState, saveState, clearQuizProgress } = useLocalStorage()
  const { getStatusForQuestion, getQuestionPool, pickRandomQuestion } = useQuestionPicker()

  // Computed - Question text
  const currentQuestionText = computed(() => currentQuestion.value?.question ?? null)

  // Computed - UI categories
  const uiCategories = computed(() => [
    'Wszystko',
    ...quizData.categories.value.map((item) => item.category)
  ])

  // Computed - All questions
  const allQuestions = computed(() =>
    quizData.categories.value.flatMap((item) => item.questions)
  )

  // Computed - Current category questions
  const currentCategoryQuestions = computed(() => {
    if (selectedCategory.value === 'Wszystko') {
      return allQuestions.value
    }
    const group = quizData.categories.value.find(
      (item) => item.category === selectedCategory.value
    )
    return group?.questions ?? []
  })

  // Computed - Current answered (for current category)
  const currentAnswered = computed(() => {
    if (selectedCategory.value === 'Wszystko') {
      const merged: Record<string, 'correct' | 'wrong'> = {}
      for (const [category, answers] of Object.entries(answeredByCategory.value)) {
        for (const [questionText, status] of Object.entries(answers)) {
          merged[questionText] = status
        }
      }
      return merged
    }
    return answeredByCategory.value[selectedCategory.value] ?? {}
  })

  // Computed - Counts
  const totalCount = computed(() => currentCategoryQuestions.value.length)
  
  const correctCount = computed(() =>
    Object.values(currentAnswered.value).filter((value) => value === 'correct').length
  )
  
  const wrongCount = computed(() =>
    Object.values(currentAnswered.value).filter((value) => value === 'wrong').length
  )
  
  const remainingCount = computed(() =>
    Math.max(totalCount.value - correctCount.value, 0)
  )

  // Computed - Completion status
  const allCompleted = computed(() => {
    const total = allQuestions.value.length
    if (!total) {
      return false
    }
    const completed = allQuestions.value.filter(
      (question) => 
        getStatusForQuestion(question.question, quizData.questionCategoryMap.value, answeredByCategory.value) === 'correct'
    ).length
    return completed === total
  })

  const categoryCompleted = computed(() => {
    if (!currentCategoryQuestions.value.length) {
      return false
    }
    const completed = currentCategoryQuestions.value.filter(
      (question) =>
        getStatusForQuestion(question.question, quizData.questionCategoryMap.value, answeredByCategory.value) === 'correct'
    ).length
    return completed === currentCategoryQuestions.value.length
  })

  // Computed - Progress segments
  const progressSegments = computed<ProgressSegments>(() => {
    if (!totalCount.value) {
      return { correct: 0, wrong: 0, remaining: 100 }
    }
    const correct = (correctCount.value / totalCount.value) * 100
    const wrong = (wrongCount.value / totalCount.value) * 100
    const remaining = Math.max(100 - correct - wrong, 0)
    return { correct, wrong, remaining }
  })

  // Computed - Was previously wrong
  const wasPreviouslyWrong = computed(() => {
    if (!currentQuestionText.value) {
      return false
    }
    return (
      currentAnswered.value[currentQuestionText.value] === 'wrong' &&
      !isSubmitted.value
    )
  })

  // Computed - Can submit/next
  const canSubmit = computed(() => selectedIndex.value !== null && !isSubmitted.value)
  const canNext = computed(() => currentCategoryQuestions.value.length > 0)

  /**
   * Save current state to localStorage
   */
  const saveCurrentState = () => {
    if (typeof localStorage === 'undefined' || !quizData.selectedQuizFile.value) {
      return
    }

    // Load existing state
    const stored = restoreState() ?? { quizzes: {} }

    // Get current quiz's cached state
    const currentQuizCache = stored.quizzes[quizData.selectedQuizFile.value] ?? {}

    // Update current quiz's state
    const quizState: QuizState = {
      answeredByCategory: answeredByCategory.value,
      selectedCategory: selectedCategory.value,
      currentQuestionByCategory: {
        ...(currentQuizCache.currentQuestionByCategory ?? {}),
        [selectedCategory.value]: currentQuestionText.value ?? ''
      },
      selectionByCategory: {
        ...(currentQuizCache.selectionByCategory ?? {}),
        [selectedCategory.value]: {
          selectedIndex: selectedIndex.value,
          isSubmitted: isSubmitted.value,
          isCorrect: isCorrect.value
        }
      }
    }

    // Update full state
    stored.currentQuizFile = quizData.selectedQuizFile.value
    stored.quizzes[quizData.selectedQuizFile.value] = quizState

    saveState(stored)
    stateCache.value = stored
  }

  /**
   * Restore category state from cache
   */
  const restoreCategoryState = () => {
    const stored = stateCache.value
    if (!selectedCategory.value || !quizData.selectedQuizFile.value) {
      currentQuestion.value = null
      return
    }

    const quizState = stored?.quizzes?.[quizData.selectedQuizFile.value]
    const questionText = quizState?.currentQuestionByCategory?.[selectedCategory.value]
    const selection = quizState?.selectionByCategory?.[selectedCategory.value]
    const matched = questionText
      ? currentCategoryQuestions.value.find(
          (question) => question.question === questionText
        )
      : null

    if (matched) {
      currentQuestion.value = matched
      selectedIndex.value = selection?.selectedIndex ?? null
      isSubmitted.value = Boolean(selection?.isSubmitted)
      isCorrect.value = Boolean(selection?.isCorrect)
    } else {
      pickNextQuestion()
    }
  }

  /**
   * Pick the next question
   */
  const pickNextQuestion = () => {
    const pool = getQuestionPool(
      currentCategoryQuestions.value,
      quizData.questionCategoryMap.value,
      answeredByCategory.value
    )
    
    const question = pickRandomQuestion(pool)
    
    if (!question) {
      currentQuestion.value = null
      selectedIndex.value = null
      isSubmitted.value = false
      isCorrect.value = false
      return
    }
    
    currentQuestion.value = question
    selectedIndex.value = null
    isSubmitted.value = false
    isCorrect.value = false
  }

  /**
   * Submit answer
   */
  const submitAnswer = () => {
    if (selectedIndex.value === null || !currentQuestion.value) {
      return
    }
    
    isSubmitted.value = true
    isCorrect.value = selectedIndex.value === currentQuestion.value.correctAnswerIndex
    
    const category =
      quizData.questionCategoryMap.value[currentQuestion.value.question] ??
      selectedCategory.value
    
    if (!answeredByCategory.value[category]) {
      answeredByCategory.value[category] = {}
    }
    
    answeredByCategory.value[category][currentQuestion.value.question] = isCorrect.value
      ? 'correct'
      : 'wrong'
    
    saveCurrentState()
  }

  /**
   * Move to next question
   */
  const nextQuestion = () => {
    pickNextQuestion()
    saveCurrentState()
  }

  /**
   * Change category
   */
  const changeCategory = (category: string) => {
    if (category === selectedCategory.value) {
      return
    }
    selectedCategory.value = category
    selectedIndex.value = null
    isSubmitted.value = false
    isCorrect.value = false
    restoreCategoryState()
    saveCurrentState()
  }

  /**
   * Reset current quiz
   */
  const resetQuiz = () => {
    if (!quizData.selectedQuizFile.value) return

    // Clear only current quiz's progress
    const stored = clearQuizProgress(quizData.selectedQuizFile.value)

    answeredByCategory.value = {}
    selectedCategory.value = 'Wszystko'
    currentQuestion.value = null
    selectedIndex.value = null
    isSubmitted.value = false
    isCorrect.value = false
    stateCache.value = stored
    restoreCategoryState()
  }

  /**
   * Initialize quiz state (call after loading quiz data)
   */
  const initializeQuizState = (quizFile: string) => {
    const stored = restoreState()
    stateCache.value = stored
    const quizState = stored?.quizzes?.[quizFile]

    if (quizState?.answeredByCategory) {
      answeredByCategory.value = quizState.answeredByCategory
    } else {
      answeredByCategory.value = {}
    }

    const initialCategory = quizState?.selectedCategory ?? 'Wszystko'
    selectedCategory.value = initialCategory

    restoreCategoryState()
  }

  // Watch for changes and auto-save
  watch([selectedIndex, isSubmitted, isCorrect, currentQuestionText], saveCurrentState)
  watch(answeredByCategory, saveCurrentState, { deep: true })
  watch(selectedCategory, () => {
    restoreCategoryState()
    saveCurrentState()
  })

  return {
    // State
    currentQuestion,
    selectedIndex,
    isSubmitted,
    isCorrect,
    answeredByCategory,
    selectedCategory,
    
    // Computed
    currentQuestionText,
    uiCategories,
    allQuestions,
    currentCategoryQuestions,
    currentAnswered,
    totalCount,
    correctCount,
    wrongCount,
    remainingCount,
    allCompleted,
    categoryCompleted,
    progressSegments,
    wasPreviouslyWrong,
    canSubmit,
    canNext,
    
    // Methods
    submitAnswer,
    nextQuestion,
    changeCategory,
    resetQuiz,
    restoreCategoryState,
    initializeQuizState
  }
}
