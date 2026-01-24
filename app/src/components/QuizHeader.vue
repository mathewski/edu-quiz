<script setup lang="ts">
import { inject, type ComputedRef, type Ref } from 'vue'

interface QuizDataInjection {
  selectedQuizFile: Ref<string | null>
  getQuizName: (file: string) => string
}

interface QuizStateInjection {
  uiCategories: ComputedRef<string[]>
  selectedCategory: Ref<string>
}

const quizData = inject<QuizDataInjection>('quizData')
const quizState = inject<QuizStateInjection>('quizState')

if (!quizData || !quizState) {
  throw new Error('QuizHeader: quizData or quizState not provided')
}

const { selectedQuizFile, getQuizName } = quizData
const { uiCategories, selectedCategory } = quizState

defineEmits<{
  changeCategory: [category: string]
  toggleSelector: []
}>()
</script>

<template>
  <header class="mb-10">
    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
      {{ selectedQuizFile ? getQuizName(selectedQuizFile) : 'Wybierz quiz' }}
    </p>

    <!-- Quiz name display + selector toggle -->
    <div class="mt-3 flex items-center justify-between gap-4">
      <h1 class="text-3xl font-bold text-slate-900 sm:text-4xl">
        Sprawdź wiedzę
      </h1>
      <button
        v-if="selectedQuizFile"
        type="button"
        class="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
        @click="$emit('toggleSelector')"
      >
        Zmień quiz
      </button>
    </div>

    <!-- Category buttons - only show when quiz is selected -->
    <div v-if="selectedQuizFile" class="mt-6 flex flex-wrap gap-2">
      <button
        v-for="category in uiCategories"
        :key="category"
        type="button"
        class="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition"
        :class="
          category === selectedCategory
            ? 'border-slate-900 bg-slate-900 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
        "
        @click="$emit('changeCategory', category)"
      >
        {{ category }}
      </button>
    </div>
  </header>
</template>
