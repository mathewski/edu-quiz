<script setup>
import { computed, onMounted, ref, watch } from "vue";

const STORAGE_KEY = "quiz_state_v1";

const questions = ref([]);
const currentQuestion = ref(null);
const selectedIndex = ref(null);
const isSubmitted = ref(false);
const isCorrect = ref(false);
const loading = ref(true);
const errorMessage = ref("");
const answered = ref({});

const currentQuestionText = computed(
  () => currentQuestion.value?.question ?? null,
);

const canSubmit = computed(() => selectedIndex.value !== null && !isSubmitted.value);
const canNext = computed(() => questions.value.length > 0);

const totalCount = computed(() => questions.value.length);
const correctCount = computed(
  () => Object.values(answered.value).filter((value) => value === "correct").length,
);
const wrongCount = computed(
  () => Object.values(answered.value).filter((value) => value === "wrong").length,
);
const remainingCount = computed(() =>
  Math.max(totalCount.value - correctCount.value, 0),
);

const progressSegments = computed(() => {
  if (!totalCount.value) {
    return { correct: 0, wrong: 0, remaining: 100 };
  }
  const correct = (correctCount.value / totalCount.value) * 100;
  const wrong = (wrongCount.value / totalCount.value) * 100;
  const remaining = Math.max(100 - correct - wrong, 0);
  return { correct, wrong, remaining };
});

const wasPreviouslyWrong = computed(() => {
  if (!currentQuestionText.value) {
    return false;
  }
  return answered.value[currentQuestionText.value] === "wrong" && !isSubmitted.value;
});

const saveState = () => {
  if (typeof localStorage === "undefined") {
    return;
  }
  const state = {
    answered: answered.value,
    currentQuestionText: currentQuestionText.value,
    selectedIndex: selectedIndex.value,
    isSubmitted: isSubmitted.value,
    isCorrect: isCorrect.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const restoreState = () => {
  if (typeof localStorage === "undefined") {
    return null;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const getQuestionPool = () =>
  questions.value.filter(
    (question) => answered.value[question.question] !== "correct",
  );

const pickRandomQuestion = () => {
  const pool = getQuestionPool();
  if (!pool.length) {
    currentQuestion.value = null;
    selectedIndex.value = null;
    isSubmitted.value = false;
    isCorrect.value = false;
    return;
  }
  const index = Math.floor(Math.random() * pool.length);
  currentQuestion.value = pool[index];
  selectedIndex.value = null;
  isSubmitted.value = false;
  isCorrect.value = false;
};

const loadQuestions = async () => {
  try {
    const response = await fetch("/pytania.json");
    if (!response.ok) {
      throw new Error("Nie udało się wczytać pliku pytania.json.");
    }
    questions.value = await response.json();

    const stored = restoreState();
    if (stored?.answered) {
      answered.value = stored.answered;
    }

    if (stored?.currentQuestionText) {
      const matched = questions.value.find(
        (question) => question.question === stored.currentQuestionText,
      );
      if (matched) {
        currentQuestion.value = matched;
        selectedIndex.value = stored.selectedIndex ?? null;
        isSubmitted.value = Boolean(stored.isSubmitted);
        isCorrect.value = Boolean(stored.isCorrect);
      } else {
        pickRandomQuestion();
      }
    } else {
      pickRandomQuestion();
    }
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const submitAnswer = () => {
  if (selectedIndex.value === null || !currentQuestion.value) {
    return;
  }
  isSubmitted.value = true;
  isCorrect.value =
    selectedIndex.value === currentQuestion.value.correctAnswerIndex;
  answered.value[currentQuestion.value.question] = isCorrect.value
    ? "correct"
    : "wrong";
  saveState();
};

const nextQuestion = () => {
  pickRandomQuestion();
  saveState();
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

watch([selectedIndex, isSubmitted, isCorrect, currentQuestionText], saveState);
watch(
  answered,
  () => {
    saveState();
  },
  { deep: true },
);

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
        <div v-else class="text-slate-500">
          Wszystkie pytania zostały już poprawnie rozwiązane.
        </div>
      </section>
    </main>
  </div>
</template>
