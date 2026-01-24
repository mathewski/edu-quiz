<script setup lang="ts">
defineProps<{
  type: 'all' | 'category'
  categoryName?: string
}>()

defineEmits<{
  resetQuiz: []
}>()
</script>

<template>
  <div v-if="type === 'all'" class="space-y-6 text-center py-12">
    <div class="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-amber-100 text-amber-500">
      <svg
        class="h-14 w-14"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M7 2a1 1 0 0 0-1 1v2H4a1 1 0 0 0-1 1v3a5 5 0 0 0 5 5h.09A5.002 5.002 0 0 0 11 15.9V18H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.1A5.002 5.002 0 0 0 15.91 14H16a5 5 0 0 0 5-5V6a1 1 0 0 0-1-1h-2V3a1 1 0 0 0-1-1H7Zm-2 7V7h1v2a5.02 5.02 0 0 0 .27 1.6A3 3 0 0 1 5 9Zm14 0a3 3 0 0 1-1.27 2.6A5.02 5.02 0 0 0 18 9V7h1v2Zm-9 4a3 3 0 0 1-3-3V4h10v6a3 3 0 0 1-3 3h-4Z"
        />
      </svg>
    </div>
    <h2 class="text-2xl font-semibold text-emerald-600 sm:text-3xl">
      Ukończyłeś quiz!
    </h2>
    <button
      type="button"
      class="mx-auto rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
      @click="$emit('resetQuiz')"
    >
      Rozwiąż ponownie
    </button>
  </div>

  <div v-else class="space-y-2 text-slate-600 py-12">
    <p class="text-base font-semibold text-slate-900 text-center text-emerald-600">
      Odpowiedziałeś poprawnie na wszystkie pytania w kategorii <strong class="uppercase">{{ categoryName }}</strong>.
    </p>
    <p class="text-center text-emerald-600">Wybierz inną kategorię.</p>
  </div>
</template>
