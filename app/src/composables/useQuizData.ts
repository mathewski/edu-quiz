import { ref } from 'vue'
import type { QuizMetadata, Category } from '@/types'
import { useLocalStorage } from './useLocalStorage'

/**
 * Composable for loading and managing quiz data
 */
export function useQuizData() {
  const availableQuizzes = ref<QuizMetadata[]>([])
  const selectedQuizFile = ref<string | null>(null)
  const categories = ref<Category[]>([])
  const questionCategoryMap = ref<Record<string, string>>({})
  const loading = ref(true)
  const errorMessage = ref('')
  
  const { restoreState, getQuizProgress, clearQuizProgress, saveState } = useLocalStorage()

  /**
   * Load available quizzes from quizzes.json
   */
  const loadAvailableQuizzes = async (): Promise<void> => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}quizzes.json`)
      if (!response.ok) {
        throw new Error('Nie udało się wczytać listy quizów')
      }
      availableQuizzes.value = await response.json()
    } catch (error) {
      // Fallback: if no quizzes.json, use default
      console.warn('Failed to load quizzes.json, using default:', error)
      availableQuizzes.value = [{
        file: 'pytania.json',
        name: 'Quiz Informatyka'
      }]
    }
  }

  /**
   * Load quiz data from a specific JSON file
   */
  const loadQuizData = async (quizFile: string): Promise<void> => {
    try {
      loading.value = true
      errorMessage.value = ''
      
      const response = await fetch(`${import.meta.env.BASE_URL}${quizFile}`)
      if (!response.ok) {
        throw new Error(`Nie udało się wczytać pliku ${quizFile}.`)
      }
      
      categories.value = await response.json()
      
      // Build category mapping
      const mapping: Record<string, string> = {}
      for (const group of categories.value) {
        for (const question of group.questions) {
          mapping[question.question] = group.category
        }
      }
      questionCategoryMap.value = mapping
      
    } catch (error) {
      errorMessage.value = (error as Error).message
    } finally {
      loading.value = false
    }
  }

  /**
   * Initialize app - check for stored quiz selection
   */
  const initializeApp = async (): Promise<void> => {
    const stored = restoreState()

    if (stored?.currentQuizFile) {
      // User has a quiz in progress
      selectedQuizFile.value = stored.currentQuizFile
      await loadQuizData(stored.currentQuizFile)
      
      // If quiz failed to load (404 or other error), clear selection and localStorage
      if (errorMessage.value) {
        selectedQuizFile.value = null
        clearQuizProgress(stored.currentQuizFile)
        // Update the stored state to clear currentQuizFile
        const updatedState = restoreState()
        if (updatedState) {
          updatedState.currentQuizFile = ''
          saveState(updatedState)
        }
      }
    } else {
      // No quiz selected - will show selector
      selectedQuizFile.value = null
      loading.value = false
    }
  }

  /**
   * Get quiz display name
   */
  const getQuizName = (file: string): string => {
    const quiz = availableQuizzes.value.find(q => q.file === file)
    return quiz?.name ?? 'Quiz'
  }

  /**
   * Get quiz progress text
   */
  const getQuizProgressText = (quizFile: string): string | null => {
    const correct = getQuizProgress(quizFile)
    return correct > 0 ? `${correct} poprawnych odpowiedzi` : null
  }

  return {
    // State
    availableQuizzes,
    selectedQuizFile,
    categories,
    questionCategoryMap,
    loading,
    errorMessage,
    
    // Methods
    loadAvailableQuizzes,
    loadQuizData,
    initializeApp,
    getQuizName,
    getQuizProgressText
  }
}
