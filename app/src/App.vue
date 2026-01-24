<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import { useQuizData } from '@/composables/useQuizData'
import { useQuizState } from '@/composables/useQuizState'
import QuizSelector from '@/components/QuizSelector.vue'
import QuizHeader from '@/components/QuizHeader.vue'
import QuizStats from '@/components/QuizStats.vue'
import QuizQuestion from '@/components/QuizQuestion.vue'
import QuizCompleted from '@/components/QuizCompleted.vue'

// Initialize composables
const quizData = useQuizData()
const quizState = useQuizState(quizData)

// Quiz selector visibility
const showQuizSelector = ref(false)

// Provide state to child components
provide('quizData', quizData)
provide('quizState', quizState)

// Event handlers
const handleSelectQuiz = async (quizFile: string) => {
  if (quizFile === quizData.selectedQuizFile.value) {
    // Same quiz, just close selector
    showQuizSelector.value = false
    return
  }

  // Clear current quiz state
  quizData.categories.value = []
  quizState.answeredByCategory.value = {}
  quizState.currentQuestion.value = null
  quizState.selectedIndex.value = null
  quizState.isSubmitted.value = false
  quizState.isCorrect.value = false
  quizState.selectedCategory.value = 'Wszystko'

  // Load new quiz
  quizData.selectedQuizFile.value = quizFile
  await quizData.loadQuizData(quizFile)

  // Initialize quiz state
  quizState.initializeQuizState(quizFile)

  // Close selector
  showQuizSelector.value = false
}

const handleToggleSelector = () => {
  showQuizSelector.value = !showQuizSelector.value
}

const handleChangeCategory = (category: string) => {
  quizState.changeCategory(category)
}

const handleSubmitAnswer = () => {
  quizState.submitAnswer()
}

const handleNextQuestion = () => {
  quizState.nextQuestion()
}

const handleResetQuiz = () => {
  quizState.resetQuiz()
}

// Initialize app on mount
onMounted(async () => {
  await quizData.loadAvailableQuizzes()
  await quizData.initializeApp()

  // Show selector if no quiz selected
  if (!quizData.selectedQuizFile.value) {
    showQuizSelector.value = true
  } else {
    // Initialize quiz state with loaded data
    quizState.initializeQuizState(quizData.selectedQuizFile.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <!-- Quiz Selector Overlay -->
    <QuizSelector
      :visible="showQuizSelector || !quizData.selectedQuizFile.value"
      @select-quiz="handleSelectQuiz"
      @close="showQuizSelector = false"
    />

    <main class="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <!-- Header with quiz name and category buttons -->
      <QuizHeader
        @change-category="handleChangeCategory"
        @toggle-selector="handleToggleSelector"
      />

      <!-- Main quiz section -->
      <section
        class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur"
      >
        <!-- Loading state -->
        <div v-if="quizData.loading.value" class="text-slate-500">
          Ładowanie pytań...
        </div>

        <!-- Error state -->
        <div v-else-if="quizData.errorMessage.value" class="text-rose-600">
          {{ quizData.errorMessage.value }}
        </div>

        <!-- All questions completed -->
        <QuizCompleted
          v-else-if="quizState.allCompleted.value"
          type="all"
          @reset-quiz="handleResetQuiz"
        />

        <!-- Category completed -->
        <QuizCompleted
          v-else-if="quizState.categoryCompleted.value"
          type="category"
          :category-name="quizState.selectedCategory.value"
        />

        <!-- Active quiz -->
        <div v-else-if="quizState.currentQuestion.value" class="space-y-6">
          <QuizStats />
          <QuizQuestion
            @submit-answer="handleSubmitAnswer"
            @next-question="handleNextQuestion"
          />
        </div>

        <!-- No questions available -->
        <div v-else class="text-slate-500">
          Brak dostępnych pytań.
        </div>
      </section>
    </main>
  </div>
</template>
