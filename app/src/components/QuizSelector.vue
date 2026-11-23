<script setup lang="ts">
import { computed, inject, ref, watch, type Ref } from 'vue'
import type { QuizMetadata } from '@/types'
import { parseQuizName, sortGrades } from '@/utils/parseQuizName'

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

const props = defineProps<{
  visible: boolean
}>()

const parsedQuizzes = computed(() => availableQuizzes.value.map(parseQuizName))
const grades = computed(() => sortGrades(parsedQuizzes.value.map((q) => q.grade)))

const selectedGrade = ref<string | null>(null)

// Po otwarciu modala zaznacz klasę aktualnego quizu (albo pierwszą dostępną)
watch(
  [() => props.visible, grades],
  ([visible]) => {
    if (!visible) return
    const current = parsedQuizzes.value.find((q) => q.file === selectedQuizFile.value)
    if (current) {
      selectedGrade.value = current.grade
    } else if (!selectedGrade.value || !grades.value.includes(selectedGrade.value)) {
      selectedGrade.value = grades.value[0] ?? null
    }
  },
  { immediate: true }
)

const quizzesForGrade = computed(() =>
  parsedQuizzes.value
    .filter((q) => q.grade === selectedGrade.value)
    .sort((a, b) => a.subject.localeCompare(b.subject, 'pl'))
)

const gradeLabel = (grade: string) => (/^\d+$/.test(grade) ? `Klasa ${grade}` : grade)

defineEmits<{
  selectQuiz: [quizFile: string]
  close: []
}>()
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 py-8 backdrop-blur-sm sm:pt-[15vh]"
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

      <!-- Grade selector -->
      <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Klasa</h3>
      <div class="mb-6 flex flex-wrap gap-2" role="radiogroup" aria-label="Klasa">
        <button
          v-for="grade in grades"
          :key="grade"
          type="button"
          role="radio"
          :aria-checked="grade === selectedGrade"
          class="rounded-full border px-4 py-2 text-sm font-semibold transition"
          :class="
            grade === selectedGrade
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
          "
          @click="selectedGrade = grade"
        >
          {{ gradeLabel(grade) }}
        </button>
      </div>

      <!-- Subject selector -->
      <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Przedmiot</h3>
      <div class="space-y-3">
        <button
          v-for="quiz in quizzesForGrade"
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
            <h4 class="font-semibold text-slate-900">{{ quiz.subject }}</h4>
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
