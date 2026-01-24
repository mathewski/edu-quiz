<script setup lang="ts">
import { inject, type Ref } from 'vue'
import type { QuizMetadata } from '@/types'

interface QuizDataInjection {
  availableQuizzes: Ref<QuizMetadata[]>
  selectedQuizFile: Ref<string | null>
  getQuizProgressText: (file: string) => string | null
}

const quizData = inject<QuizDataInjection>('quizData')

if (!quizData) {
  throw new Error('QuizSelector: quizData not provided')
}

const { availableQuizzes, selectedQuizFile, getQuizProgressText } = quizData

defineProps<{
  visible: boolean
}>()

defineEmits<{
  selectQuiz: [quizFile: string]
  close: []
}>()
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
    @click.self="selectedQuizFile ? $emit('close') : null"
  >
    <div class="relative mx-4 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
      <!-- Close button - only show if a quiz is already selected -->
      <button
        v-if="selectedQuizFile"
        type="button"
        class="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        @click="$emit('close')"
        aria-label="Zamknij"
      >
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h2 class="mb-2 text-2xl font-bold text-slate-900">
        {{ selectedQuizFile ? 'Wybierz inny quiz' : 'Wybierz quiz' }}
      </h2>
      <p class="mb-6 text-sm text-slate-600">
        {{ selectedQuizFile ? 'Twój postęp zostanie zapisany automatycznie.' : 'Zacznij od wybrania quizu.' }}
      </p>

      <!-- Quiz List -->
      <div class="space-y-3">
        <button
          v-for="quiz in availableQuizzes"
          :key="quiz.file"
          type="button"
          class="flex w-full items-center justify-between rounded-2xl border p-4 text-left transition"
          :class="
            quiz.file === selectedQuizFile
              ? 'border-slate-900 bg-slate-50'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
          "
          @click="$emit('selectQuiz', quiz.file)"
        >
          <div class="flex-1">
            <h3 class="font-semibold text-slate-900">{{ quiz.name }}</h3>
            <p v-if="getQuizProgressText(quiz.file)" class="mt-1 text-sm text-slate-600">
              {{ getQuizProgressText(quiz.file) }}
            </p>
          </div>

          <!-- Current quiz indicator -->
          <div v-if="quiz.file === selectedQuizFile" class="ml-4">
            <span class="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              Aktualny
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
