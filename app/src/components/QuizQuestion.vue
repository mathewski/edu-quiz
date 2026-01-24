<script setup lang="ts">
import { inject, computed, type ComputedRef, type Ref } from 'vue'
import type { Question } from '@/types'

interface QuizStateInjection {
  currentQuestion: Ref<Question | null>
  selectedIndex: Ref<number | null>
  isSubmitted: Ref<boolean>
  isCorrect: Ref<boolean>
  wasPreviouslyWrong: ComputedRef<boolean>
  canSubmit: ComputedRef<boolean>
  canNext: ComputedRef<boolean>
}

const quizState = inject<QuizStateInjection>('quizState')

if (!quizState) {
  throw new Error('QuizQuestion: quizState not provided')
}

const {
  currentQuestion,
  selectedIndex,
  isSubmitted,
  isCorrect,
  wasPreviouslyWrong,
  canSubmit,
  canNext
} = quizState

defineEmits<{
  submitAnswer: []
  nextQuestion: []
}>()

const answerClasses = computed(() => (index: number) => {
  const base = 'flex items-center gap-3 rounded-xl border px-4 py-3 transition'
  if (!isSubmitted.value || selectedIndex.value !== index) {
    return `${base} border-slate-200 bg-white hover:border-slate-300`
  }
  return isCorrect.value
    ? `${base} border-emerald-400 bg-emerald-50`
    : `${base} border-rose-400 bg-rose-50`
})
</script>

<template>
  <div v-if="currentQuestion" class="space-y-6">
    <div class="space-y-2">
      <h2 class="text-xl font-semibold text-slate-900">
        {{ currentQuestion.question }}
      </h2>
      <p v-if="wasPreviouslyWrong" class="text-sm font-semibold text-rose-600">
        Na to pytanie wcześniej odpowiedziałeś błędnie. Spróbuj jeszcze raz!
      </p>
    </div>

    <form class="space-y-3">
      <label
        v-for="(answer, index) in currentQuestion.answers"
        :key="index"
        :class="answerClasses(index)"
      >
        <input
          v-model="selectedIndex"
          :value="index"
          :disabled="isSubmitted"
          type="radio"
          name="answer"
          class="h-4 w-4 text-slate-900"
        />
        <span class="text-slate-800">{{ answer }}</span>
      </label>
    </form>

    <div
      v-if="isSubmitted"
      class="rounded-2xl text-sm font-semibold text-center px-2 py-1"
      :class="
        isCorrect
          ? 'text-emerald-700'
          : 'text-rose-700'
      "
    >
      {{
        isCorrect
          ? 'Brawo! To poprawna odpowiedź.'
          : 'Niestety, to nie jest poprawna odpowiedź.'
      }}
    </div>

    <div class="flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        class="flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        :disabled="!canSubmit"
        @click="$emit('submitAnswer')"
      >
        Sprawdź odpowiedź
      </button>
      <button
        type="button"
        class="flex-1 rounded-full border px-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
        :class="
          isCorrect
            ? 'bg-emerald-500 border-emerald-500 text-white transition hover:bg-emerald-400 hover:text-white hover:border-emerald-500'
            : 'border-slate-200 text-slate-700 transition hover:border-slate-300 hover:text-slate-900'
        "
        :disabled="!canNext"
        @click="$emit('nextQuestion')"
      >
        {{ isCorrect ? 'Następne pytanie' : 'Inne pytanie' }}
      </button>
    </div>
  </div>
</template>
