<script setup lang="ts">
import { inject, type ComputedRef } from 'vue'
import type { ProgressSegments } from '@/types'

interface QuizStateInjection {
  correctCount: ComputedRef<number>
  wrongCount: ComputedRef<number>
  remainingCount: ComputedRef<number>
  progressSegments: ComputedRef<ProgressSegments>
}

const quizState = inject<QuizStateInjection>('quizState')

if (!quizState) {
  throw new Error('QuizStats: quizState not provided')
}

const { correctCount, wrongCount, remainingCount, progressSegments } = quizState
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
      <div class="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
        <p class="text-xs uppercase tracking-wide text-emerald-600">
          Poprawne
        </p>
        <p class="text-2xl font-semibold text-emerald-700">
          {{ correctCount }}
        </p>
      </div>
      <div class="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
        <p class="text-xs uppercase tracking-wide text-rose-600">
          Błędne
        </p>
        <p class="text-2xl font-semibold text-rose-700">
          {{ wrongCount }}
        </p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p class="text-xs uppercase tracking-wide text-slate-500">
          Do odpowiedzenia
        </p>
        <p class="text-2xl font-semibold text-slate-700">
          {{ remainingCount }}
        </p>
      </div>
    </div>
    <div class="h-3 w-full overflow-hidden rounded-full bg-slate-100">
      <div class="flex h-full w-full">
        <div
          class="h-full bg-emerald-400"
          :style="{ width: `${progressSegments.correct}%` }"
        ></div>
        <div
          class="h-full bg-rose-400"
          :style="{ width: `${progressSegments.wrong}%` }"
        ></div>
        <div
          class="h-full bg-slate-300"
          :style="{ width: `${progressSegments.remaining}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
