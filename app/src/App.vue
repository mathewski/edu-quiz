<script setup>
import { computed, onMounted, ref } from "vue";

const questions = ref([]);
const currentQuestion = ref(null);
const selectedIndex = ref(null);
const isSubmitted = ref(false);
const isCorrect = ref(false);
const loading = ref(true);
const errorMessage = ref("");

const canSubmit = computed(() => selectedIndex.value !== null && !isSubmitted.value);
const canNext = computed(() => isSubmitted.value && questions.value.length > 0);

const loadQuestions = async () => {
  try {
    const response = await fetch("/pytania.json");
    if (!response.ok) {
      throw new Error("Nie udało się wczytać pliku pytania.json.");
    }
    questions.value = await response.json();
    pickRandomQuestion();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const pickRandomQuestion = () => {
  if (!questions.value.length) {
    currentQuestion.value = null;
    return;
  }
  const index = Math.floor(Math.random() * questions.value.length);
  currentQuestion.value = questions.value[index];
  selectedIndex.value = null;
  isSubmitted.value = false;
  isCorrect.value = false;
};

const submitAnswer = () => {
  if (selectedIndex.value === null || !currentQuestion.value) {
    return;
  }
  isSubmitted.value = true;
  isCorrect.value =
    selectedIndex.value === currentQuestion.value.correctAnswerIndex;
};

const nextQuestion = () => {
  pickRandomQuestion();
};

const answerClasses = (index) => {
  const base =
    "flex items-center gap-3 rounded-xl border px-4 py-3 transition";
  if (!isSubmitted.value || selectedIndex.value !== index) {
    return `${base} border-slate-200 bg-white hover:border-slate-300`;
  }
  return isCorrect.value
    ? `${base} border-emerald-400 bg-emerald-50`
    : `${base} border-rose-400 bg-rose-50`;
};

onMounted(loadQuestions);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <main class="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <header class="mb-10">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Quiz informatyczny
        </p>
        <h1 class="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
          Sprawdź wiedzę, jedno pytanie na raz
        </h1>
        <p class="mt-3 max-w-2xl text-slate-600">
          Wybierz odpowiedź, zatwierdź i sprawdź, czy jest poprawna.
        </p>
      </header>

      <section
        class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur"
      >
        <div v-if="loading" class="text-slate-500">Ładowanie pytań...</div>
        <div v-else-if="errorMessage" class="text-rose-600">
          {{ errorMessage }}
        </div>
        <div v-else-if="currentQuestion" class="space-y-6">
          <h2 class="text-xl font-semibold text-slate-900">
            {{ currentQuestion.question }}
          </h2>

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
            class="rounded-2xl border px-4 py-3 text-sm font-semibold"
            :class="
              isCorrect
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
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
              @click="submitAnswer"
            >
              Zatwierdź
            </button>
            <button
              type="button"
              class="flex-1 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              :disabled="!canNext"
              @click="nextQuestion"
            >
              Następne pytanie
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
