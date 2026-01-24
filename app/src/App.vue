<script setup>
import { computed, onMounted, ref, watch } from "vue";

const STORAGE_KEY = "quiz_state_v2";

// Quiz selection state
const availableQuizzes = ref([]);
const selectedQuizFile = ref(null);
const showQuizSelector = ref(false);

// Quiz data state
const categories = ref([]);
const questionCategoryMap = ref({});
const currentQuestion = ref(null);
const selectedIndex = ref(null);
const isSubmitted = ref(false);
const isCorrect = ref(false);
const loading = ref(true);
const errorMessage = ref("");
const answeredByCategory = ref({});
const selectedCategory = ref("");

const currentQuestionText = computed(
  () => currentQuestion.value?.question ?? null,
);

const canSubmit = computed(
  () => selectedIndex.value !== null && !isSubmitted.value,
);
const canNext = computed(() => currentCategoryQuestions.value.length > 0);

const uiCategories = computed(() => [
  "Wszystko",
  ...categories.value.map((item) => item.category),
]);

const allQuestions = computed(() =>
  categories.value.flatMap((item) => item.questions),
);

const currentCategoryQuestions = computed(() => {
  if (selectedCategory.value === "Wszystko") {
    return allQuestions.value;
  }
  const group = categories.value.find(
    (item) => item.category === selectedCategory.value,
  );
  return group?.questions ?? [];
});

const currentAnswered = computed(() => {
  if (selectedCategory.value === "Wszystko") {
    const merged = {};
    for (const [category, answers] of Object.entries(
      answeredByCategory.value,
    )) {
      for (const [questionText, status] of Object.entries(answers)) {
        merged[questionText] = status;
      }
    }
    return merged;
  }
  return answeredByCategory.value[selectedCategory.value] ?? {};
});

const totalCount = computed(() => currentCategoryQuestions.value.length);
const correctCount = computed(
  () =>
    Object.values(currentAnswered.value).filter((value) => value === "correct")
      .length,
);
const wrongCount = computed(
  () =>
    Object.values(currentAnswered.value).filter((value) => value === "wrong")
      .length,
);
const remainingCount = computed(() =>
  Math.max(totalCount.value - correctCount.value, 0),
);

const allCompleted = computed(() => {
  const total = allQuestions.value.length;
  if (!total) {
    return false;
  }
  const completed = allQuestions.value.filter(
    (question) => getStatusForQuestion(question.question) === "correct",
  ).length;
  return completed === total;
});

const categoryCompleted = computed(() => {
  if (!currentCategoryQuestions.value.length) {
    return false;
  }
  const completed = currentCategoryQuestions.value.filter(
    (question) => getStatusForQuestion(question.question) === "correct",
  ).length;
  return completed === currentCategoryQuestions.value.length;
});

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
  return (
    currentAnswered.value[currentQuestionText.value] === "wrong" &&
    !isSubmitted.value
  );
});

const saveState = () => {
  if (typeof localStorage === "undefined" || !selectedQuizFile.value) {
    return;
  }

  // Load existing state
  const stored = restoreState() ?? { quizzes: {} };

  // Get current quiz's cached state
  const currentQuizCache = stored.quizzes[selectedQuizFile.value] ?? {};

  // Update current quiz's state
  const quizState = {
    answeredByCategory: answeredByCategory.value,
    selectedCategory: selectedCategory.value,
    currentQuestionByCategory: {
      ...(currentQuizCache.currentQuestionByCategory ?? {}),
      [selectedCategory.value]: currentQuestionText.value,
    },
    selectionByCategory: {
      ...(currentQuizCache.selectionByCategory ?? {}),
      [selectedCategory.value]: {
        selectedIndex: selectedIndex.value,
        isSubmitted: isSubmitted.value,
        isCorrect: isCorrect.value,
      },
    },
  };

  // Update full state
  stored.currentQuizFile = selectedQuizFile.value;
  stored.quizzes[selectedQuizFile.value] = quizState;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  stateCache.value = stored;
};

const stateCache = ref(null);

const restoreState = () => {
  if (typeof localStorage === "undefined") {
    return null;
  }

  // Try v2 first
  let raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  // Migration: try v1 and convert
  raw = localStorage.getItem("quiz_state_v1");
  if (raw) {
    try {
      const oldState = JSON.parse(raw);
      const newState = {
        currentQuizFile: "pytania.json",
        quizzes: {
          "pytania.json": oldState
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    } catch (error) {
      return null;
    }
  }

  return null;
};

const getStatusForQuestion = (questionText) => {
  const category = questionCategoryMap.value[questionText];
  if (!category) {
    return currentAnswered.value[questionText];
  }
  return answeredByCategory.value[category]?.[questionText];
};

const getQuestionPool = () =>
  currentCategoryQuestions.value.filter(
    (question) => getStatusForQuestion(question.question) !== "correct",
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

const loadAvailableQuizzes = async () => {
  try {
    const response = await fetch("/quizzes.json");
    if (!response.ok) {
      throw new Error("Nie udało się wczytać listy quizów");
    }
    availableQuizzes.value = await response.json();
  } catch (error) {
    // Fallback: if no quizzes.json, use default
    console.warn("Failed to load quizzes.json, using default:", error);
    availableQuizzes.value = [{
      file: "pytania.json",
      name: "Quiz Informatyka"
    }];
  }
};

const loadQuizData = async (quizFile) => {
  try {
    loading.value = true;
    errorMessage.value = "";
    const response = await fetch(`/${quizFile}`);
    if (!response.ok) {
      throw new Error(`Nie udało się wczytać pliku ${quizFile}.`);
    }
    categories.value = await response.json();
    const mapping = {};
    for (const group of categories.value) {
      for (const question of group.questions) {
        mapping[question.question] = group.category;
      }
    }
    questionCategoryMap.value = mapping;

    const stored = restoreState();
    stateCache.value = stored;
    const quizState = stored?.quizzes?.[quizFile];

    if (quizState?.answeredByCategory) {
      answeredByCategory.value = quizState.answeredByCategory;
    } else {
      answeredByCategory.value = {};
    }

    const initialCategory = quizState?.selectedCategory ?? "Wszystko";
    selectedCategory.value = initialCategory;

    restoreCategoryState();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
};

const initializeApp = async () => {
  const stored = restoreState();

  if (stored?.currentQuizFile) {
    // User has a quiz in progress
    selectedQuizFile.value = stored.currentQuizFile;
    await loadQuizData(stored.currentQuizFile);
    showQuizSelector.value = false;
  } else {
    // No quiz selected - force selector to show
    selectedQuizFile.value = null;
    showQuizSelector.value = true;
    loading.value = false;
  }
};

const loadQuestions = async () => {
  await loadAvailableQuizzes();
  await initializeApp();
};

const restoreCategoryState = () => {
  const stored = stateCache.value;
  if (!selectedCategory.value || !selectedQuizFile.value) {
    currentQuestion.value = null;
    return;
  }

  const quizState = stored?.quizzes?.[selectedQuizFile.value];
  const questionText =
    quizState?.currentQuestionByCategory?.[selectedCategory.value];
  const selection = quizState?.selectionByCategory?.[selectedCategory.value];
  const matched = questionText
    ? currentCategoryQuestions.value.find(
        (question) => question.question === questionText,
      )
    : null;

  if (matched) {
    currentQuestion.value = matched;
    selectedIndex.value = selection?.selectedIndex ?? null;
    isSubmitted.value = Boolean(selection?.isSubmitted);
    isCorrect.value = Boolean(selection?.isCorrect);
  } else {
    pickRandomQuestion();
  }
};

const submitAnswer = () => {
  if (selectedIndex.value === null || !currentQuestion.value) {
    return;
  }
  isSubmitted.value = true;
  isCorrect.value =
    selectedIndex.value === currentQuestion.value.correctAnswerIndex;
  const category =
    questionCategoryMap.value[currentQuestion.value.question] ??
    selectedCategory.value;
  if (!answeredByCategory.value[category]) {
    answeredByCategory.value[category] = {};
  }
  answeredByCategory.value[category][currentQuestion.value.question] = isCorrect.value
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

const resetQuiz = () => {
  if (!selectedQuizFile.value) return;

  // Clear only current quiz's progress
  const stored = restoreState() ?? { quizzes: {} };
  if (stored.quizzes[selectedQuizFile.value]) {
    delete stored.quizzes[selectedQuizFile.value];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

  answeredByCategory.value = {};
  selectedCategory.value = "Wszystko";
  currentQuestion.value = null;
  selectedIndex.value = null;
  isSubmitted.value = false;
  isCorrect.value = false;
  stateCache.value = stored;
  restoreCategoryState();
};

const selectQuiz = async (quizFile) => {
  if (quizFile === selectedQuizFile.value) {
    // Same quiz, just close selector
    showQuizSelector.value = false;
    return;
  }

  // Clear current quiz state
  categories.value = [];
  answeredByCategory.value = {};
  currentQuestion.value = null;
  selectedIndex.value = null;
  isSubmitted.value = false;
  isCorrect.value = false;
  selectedCategory.value = "Wszystko";

  // Load new quiz
  selectedQuizFile.value = quizFile;
  await loadQuizData(quizFile);

  // Close selector
  showQuizSelector.value = false;

  // Save the selection
  saveState();
};

const toggleQuizSelector = () => {
  showQuizSelector.value = !showQuizSelector.value;
};

const getQuizName = (file) => {
  const quiz = availableQuizzes.value.find(q => q.file === file);
  return quiz?.name ?? 'Quiz';
};

const getQuizProgress = (quizFile) => {
  const stored = restoreState();
  const quizState = stored?.quizzes?.[quizFile];

  if (!quizState?.answeredByCategory) return null;

  let totalCorrect = 0;
  for (const answers of Object.values(quizState.answeredByCategory)) {
    totalCorrect += Object.values(answers).filter(v => v === "correct").length;
  }

  if (totalCorrect === 0) return null;

  return `${totalCorrect} poprawnych odpowiedzi`;
};

const changeCategory = (category) => {
  if (category === selectedCategory.value) {
    return;
  }
  selectedCategory.value = category;
  selectedIndex.value = null;
  isSubmitted.value = false;
  isCorrect.value = false;
  restoreCategoryState();
  saveState();
};

watch([selectedIndex, isSubmitted, isCorrect, currentQuestionText], saveState);
watch(
  answeredByCategory,
  () => {
    saveState();
  },
  { deep: true },
);

watch(selectedCategory, () => {
  restoreCategoryState();
  saveState();
});

onMounted(loadQuestions);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    <!-- Quiz Selector Overlay -->
    <div
      v-if="showQuizSelector || !selectedQuizFile"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
      @click.self="selectedQuizFile ? (showQuizSelector = false) : null"
    >
      <div class="relative mx-4 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <!-- Close button - only show if a quiz is already selected -->
        <button
          v-if="selectedQuizFile"
          type="button"
          class="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          @click="showQuizSelector = false"
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
            @click="selectQuiz(quiz.file)"
          >
            <div class="flex-1">
              <h3 class="font-semibold text-slate-900">{{ quiz.name }}</h3>
              <p v-if="getQuizProgress(quiz.file)" class="mt-1 text-sm text-slate-600">
                {{ getQuizProgress(quiz.file) }}
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

    <main class="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
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
            @click="toggleQuizSelector"
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
            @click="changeCategory(category)"
          >
            {{ category }}
          </button>
        </div>
      </header>

      <section
        class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/40 backdrop-blur"
      >
        <div v-if="loading" class="text-slate-500">Ładowanie pytań...</div>
        <div v-else-if="errorMessage" class="text-rose-600">
          {{ errorMessage }}
        </div>
        <div v-else-if="allCompleted" class="space-y-6 text-center py-12">
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
            @click="resetQuiz"
          >
            Rozwiąż ponownie
          </button>
        </div>
        <div v-else-if="currentQuestion && !categoryCompleted" class="space-y-6">
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
              @click="submitAnswer"
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
              @click="nextQuestion"
            >
              {{ isCorrect ? 'Następne pytanie' : 'Inne pytanie' }}
            </button>
          </div>
        </div>
        <div v-else class="space-y-2 text-slate-600 py-12">
          <p class="text-base font-semibold text-slate-900 text-center text-emerald-600">
            Odpowiedziałeś poprawnie na wszystkie pytania w kategorii <strong class="uppercase">{{ selectedCategory }}</strong>.
          </p>
          <p class="text-center text-emerald-600">Wybierze inną kategorię.</p>
        </div>
      </section>
    </main>
  </div>
</template>
