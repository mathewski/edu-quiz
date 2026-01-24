# Component Architecture Documentation

This document describes the component structure and architecture of the Quiz Application after the refactoring to TypeScript and modular components.

## Overview

The application has been refactored from a monolithic 720-line `App.vue` into a clean, modular architecture consisting of:
- **5 Vue components** (80-150 lines each)
- **4 composable functions** for state management
- **TypeScript** for type safety
- **Vitest** for unit testing
- **Provide/Inject** pattern for state sharing

## Project Structure

```
app/src/
├── App.vue                          (~150 lines - main orchestrator)
├── types.ts                         (TypeScript type definitions)
├── components/
│   ├── QuizSelector.vue            (~120 lines - quiz selection modal)
│   ├── QuizHeader.vue              (~90 lines - header with categories)
│   ├── QuizStats.vue               (~100 lines - progress stats)
│   ├── QuizQuestion.vue            (~150 lines - question display)
│   └── QuizCompleted.vue           (~80 lines - completion screens)
└── composables/
    ├── useLocalStorage.ts          (~120 lines - persistence)
    ├── useQuestionPicker.ts        (~60 lines - question selection)
    ├── useQuizData.ts              (~130 lines - data loading)
    ├── useQuizState.ts             (~300 lines - main state)
    └── __tests__/                  (33 passing tests)
        ├── useLocalStorage.spec.ts
        ├── useQuestionPicker.spec.ts
        ├── useQuizData.spec.ts
        └── useQuizState.spec.ts
```

---

## Components

### 1. App.vue (Main Orchestrator)

**Responsibility:** Root component that initializes composables, provides state to children, and handles high-level event coordination.

**Key Features:**
- Imports and initializes composables
- Uses `provide()` to share state with child components
- Handles quiz selection, category changes, answer submission
- Manages quiz selector visibility
- Orchestrates the loading flow

**State Management:**
```typescript
const quizData = useQuizData()      // Quiz file loading and metadata
const quizState = useQuizState()    // Quiz state and logic
```

**Provides to children:**
```typescript
provide('quizData', quizData)
provide('quizState', quizState)
```

**Event Handlers:**
- `handleSelectQuiz(quizFile)` - Loads and switches to a different quiz
- `handleToggleSelector()` - Shows/hides quiz selector
- `handleChangeCategory(category)` - Changes active category
- `handleSubmitAnswer()` - Submits user's answer
- `handleNextQuestion()` - Moves to next question
- `handleResetQuiz()` - Resets current quiz progress

**Lines:** ~150

---

### 2. QuizSelector.vue

**Responsibility:** Modal overlay for selecting which quiz to play.

**Props:**
```typescript
{
  visible: boolean  // Whether the modal is visible
}
```

**Emits:**
```typescript
{
  selectQuiz: [quizFile: string]  // User selected a quiz
  close: []                       // User closed the modal
}
```

**Injected State:**
```typescript
quizData: {
  availableQuizzes: Ref<QuizMetadata[]>
  selectedQuizFile: Ref<string | null>
  getQuizProgressText: (file: string) => string | null
}
```

**Features:**
- Lists all available quizzes from `quizzes.json`
- Shows progress for each quiz ("X poprawnych odpowiedzi")
- Displays "Aktualny" badge for current quiz
- Close button only appears if a quiz is already selected
- Cannot close modal on first load (forced selection)

**Lines:** ~120

---

### 3. QuizHeader.vue

**Responsibility:** Displays quiz title, category filter buttons, and "Zmień quiz" button.

**Props:** None (uses injected state)

**Emits:**
```typescript
{
  changeCategory: [category: string]  // User clicked a category
  toggleSelector: []                  // User clicked "Zmień quiz"
}
```

**Injected State:**
```typescript
quizData: {
  selectedQuizFile: Ref<string | null>
  getQuizName: (file: string) => string
}
quizState: {
  uiCategories: ComputedRef<string[]>
  selectedCategory: Ref<string>
}
```

**Features:**
- Shows quiz name in small uppercase text
- Large "Sprawdź wiedzę" heading
- "Zmień quiz" button (only visible when quiz selected)
- Category buttons (Wszystko, Excel, Scratch, etc.)
- Active category highlighted with dark background

**Lines:** ~90

---

### 4. QuizStats.vue

**Responsibility:** Displays statistics cards and progress bar.

**Props:** None (uses injected state)

**Emits:** None (pure display component)

**Injected State:**
```typescript
quizState: {
  correctCount: ComputedRef<number>
  wrongCount: ComputedRef<number>
  remainingCount: ComputedRef<number>
  progressSegments: ComputedRef<ProgressSegments>
}
```

**Features:**
- Three stat cards:
  - Correct answers (emerald green)
  - Wrong answers (rose red)
  - Remaining questions (slate gray)
- Segmented progress bar showing proportions
- Responsive grid layout (1 column mobile, 3 columns desktop)

**Lines:** ~100

---

### 5. QuizQuestion.vue

**Responsibility:** Displays the current question, answer options, and action buttons.

**Props:** None (uses injected state)

**Emits:**
```typescript
{
  submitAnswer: []      // User clicked "Sprawdź odpowiedź"
  nextQuestion: []      // User clicked "Następne pytanie" / "Inne pytanie"
}
```

**Injected State:**
```typescript
quizState: {
  currentQuestion: Ref<Question | null>
  selectedIndex: Ref<number | null>
  isSubmitted: Ref<boolean>
  isCorrect: Ref<boolean>
  wasPreviouslyWrong: ComputedRef<boolean>
  canSubmit: ComputedRef<boolean>
  canNext: ComputedRef<boolean>
}
```

**Features:**
- Question text display
- Warning for previously wrong questions
- Radio button answer options
- Visual feedback on submission (green/red highlights)
- "Sprawdź odpowiedź" button (disabled until selection)
- "Następne pytanie" / "Inne pytanie" button
- Button text changes based on correctness

**Lines:** ~150

---

### 6. QuizCompleted.vue

**Responsibility:** Shows completion screens when all questions or category are completed.

**Props:**
```typescript
{
  type: 'all' | 'category'      // Type of completion
  categoryName?: string          // For category completion
}
```

**Emits:**
```typescript
{
  resetQuiz: []  // User clicked "Rozwiąż ponownie" (only for type='all')
}
```

**Features:**
- **Type 'all':**
  - Trophy icon
  - "Ukończyłeś quiz!" message
  - "Rozwiąż ponownie" button
- **Type 'category':**
  - Category completion message
  - "Wybierz inną kategorię" instruction

**Lines:** ~80

---

## Composables

### 1. useLocalStorage.ts

**Responsibility:** All localStorage operations and state persistence.

**Functions:**
```typescript
{
  restoreState(): StorageState | null
  saveState(state: StorageState): void
  clearQuizProgress(quizFile: string): StorageState | null
  getQuizProgress(quizFile: string): number
  migrateFromV1(): StorageState | null
}
```

**Features:**
- Handles v1 → v2 state migration automatically
- Stores quiz progress per quiz file
- Tracks selected quiz and category per quiz
- Manages `quiz_state_v2` localStorage key

**Storage Structure:**
```typescript
{
  currentQuizFile: "pytania.json",
  quizzes: {
    "pytania.json": {
      answeredByCategory: { 
        "Excel": { "Question 1": "correct" } 
      },
      selectedCategory: "Wszystko",
      currentQuestionByCategory: { "Excel": "Question 1" },
      selectionByCategory: { 
        "Excel": { 
          selectedIndex: 0, 
          isSubmitted: true, 
          isCorrect: true 
        } 
      }
    }
  }
}
```

**Lines:** ~120  
**Tests:** 7 passing

---

### 2. useQuestionPicker.ts

**Responsibility:** Question selection logic.

**Functions:**
```typescript
{
  getStatusForQuestion(
    questionText: string,
    categoryMap: Record<string, string>,
    answeredByCategory: Record<...>
  ): 'correct' | 'wrong' | undefined
  
  getQuestionPool(
    questions: Question[],
    categoryMap: Record<string, string>,
    answeredByCategory: Record<...>
  ): Question[]
  
  pickRandomQuestion(pool: Question[]): Question | null
}
```

**Features:**
- Filters out correctly answered questions
- Includes wrongly answered questions (for retry)
- Random selection from available pool

**Lines:** ~60  
**Tests:** 8 passing

---

### 3. useQuizData.ts

**Responsibility:** Loading quiz files and managing quiz metadata.

**State:**
```typescript
{
  availableQuizzes: Ref<QuizMetadata[]>
  selectedQuizFile: Ref<string | null>
  categories: Ref<Category[]>
  questionCategoryMap: Ref<Record<string, string>>
  loading: Ref<boolean>
  errorMessage: Ref<string>
}
```

**Functions:**
```typescript
{
  loadAvailableQuizzes(): Promise<void>
  loadQuizData(quizFile: string): Promise<void>
  initializeApp(): Promise<void>
  getQuizName(file: string): string
  getQuizProgressText(file: string): string | null
}
```

**Features:**
- Fetches `quizzes.json` for quiz list
- Loads individual quiz JSON files
- Builds question-to-category mapping
- Handles loading/error states
- Fallback to default quiz if `quizzes.json` missing

**Lines:** ~130  
**Tests:** 8 passing

---

### 4. useQuizState.ts

**Responsibility:** Main quiz state management and business logic.

**State:**
```typescript
{
  currentQuestion: Ref<Question | null>
  selectedIndex: Ref<number | null>
  isSubmitted: Ref<boolean>
  isCorrect: Ref<boolean>
  answeredByCategory: Ref<Record<...>>
  selectedCategory: Ref<string>
}
```

**Computed:**
```typescript
{
  currentQuestionText: ComputedRef<string | null>
  uiCategories: ComputedRef<string[]>
  allQuestions: ComputedRef<Question[]>
  currentCategoryQuestions: ComputedRef<Question[]>
  currentAnswered: ComputedRef<Record<string, 'correct' | 'wrong'>>
  totalCount: ComputedRef<number>
  correctCount: ComputedRef<number>
  wrongCount: ComputedRef<number>
  remainingCount: ComputedRef<number>
  allCompleted: ComputedRef<boolean>
  categoryCompleted: ComputedRef<boolean>
  progressSegments: ComputedRef<ProgressSegments>
  wasPreviouslyWrong: ComputedRef<boolean>
  canSubmit: ComputedRef<boolean>
  canNext: ComputedRef<boolean>
}
```

**Functions:**
```typescript
{
  submitAnswer(): void
  nextQuestion(): void
  changeCategory(category: string): void
  resetQuiz(): void
  restoreCategoryState(): void
  initializeQuizState(quizFile: string): void
}
```

**Features:**
- Tracks all quiz progress and state
- Auto-saves on changes (via watchers)
- Manages category switching with state restoration
- Computes statistics and completion status
- Integrates with useLocalStorage and useQuestionPicker

**Lines:** ~300  
**Tests:** 10 passing

---

## Data Flow Architecture

### Provide/Inject Hierarchy

```
App.vue (provides state)
├── quizData: { availableQuizzes, selectedQuizFile, ... }
└── quizState: { currentQuestion, selectedCategory, ... }
    │
    ├── QuizSelector (injects: quizData)
    ├── QuizHeader (injects: quizData, quizState)
    ├── QuizStats (injects: quizState)
    ├── QuizQuestion (injects: quizState)
    └── QuizCompleted (props only)
```

### Event Flow

```
User Action → Component Event → App.vue Handler → Composable Method → State Update
                                                                            ↓
                                                                    Reactive Update
                                                                            ↓
                                                              Components Re-render
```

**Example:** Answer Submission
```
1. User selects answer → QuizQuestion (selectedIndex.value = 2)
2. User clicks "Sprawdź" → QuizQuestion emits @submit-answer
3. App.vue handleSubmitAnswer() → calls quizState.submitAnswer()
4. quizState.submitAnswer() → updates answeredByCategory, isSubmitted, isCorrect
5. Auto-save triggered (watch) → useLocalStorage.saveState()
6. Reactive updates → QuizQuestion, QuizStats re-render with new state
```

---

## Type Definitions

Located in `src/types.ts`:

```typescript
interface Question {
  question: string
  answers: string[]
  correctAnswerIndex: number
}

interface Category {
  category: string
  questions: Question[]
}

interface QuizMetadata {
  file: string
  name: string
}

interface QuizState {
  answeredByCategory: Record<string, Record<string, 'correct' | 'wrong'>>
  selectedCategory: string
  currentQuestionByCategory: Record<string, string>
  selectionByCategory: Record<string, {...}>
}

interface StorageState {
  currentQuizFile: string
  quizzes: Record<string, QuizState>
}

interface ProgressSegments {
  correct: number
  wrong: number
  remaining: number
}
```

---

## Testing

**Test Framework:** Vitest with @vue/test-utils and happy-dom

**Coverage:**
- 33 tests, all passing
- 4 test suites (one per composable)
- Tests cover:
  - State management
  - localStorage operations
  - Question selection logic
  - Data loading
  - Progress calculations
  - Migration from v1 to v2

**Run Tests:**
```bash
npm run test        # Run once
npm run test:ui     # Interactive UI
```

---

## Development Workflow

### Adding a New Component

1. Create component in `src/components/ComponentName.vue`
2. Define props and emits with TypeScript
3. Use `inject()` to access shared state
4. Emit events for user actions
5. Import and use in App.vue

### Adding a New Composable

1. Create file in `src/composables/useFeatureName.ts`
2. Export a function that returns reactive state/methods
3. Add TypeScript types in `src/types.ts`
4. Write tests in `src/composables/__tests__/useFeatureName.spec.ts`
5. Import and use in App.vue or other composables

### Modifying State

1. Locate the appropriate composable (usually `useQuizState.ts`)
2. Add/modify state variables, computed properties, or methods
3. Update TypeScript types if needed
4. Add tests for new functionality
5. Update components that depend on the changed state

---

## Build & Deploy

**Development:**
```bash
npm run dev          # Start dev server
npm run test         # Run tests
npm run build        # Type-check and build
```

**Production Build:**
```bash
npm run build        # Creates dist/ folder
npm run preview      # Preview production build
```

**Type Checking:**
```bash
vue-tsc              # Run TypeScript compiler (no emit)
```

---

## Performance Considerations

1. **Provide/Inject:** Efficient state sharing without prop drilling
2. **Computed Properties:** Cached calculations, only recompute when dependencies change
3. **Component Splitting:** Smaller components = faster re-renders
4. **localStorage Auto-save:** Uses watchers, minimal overhead
5. **Lazy Loading:** Could add dynamic imports for quiz JSON files (future enhancement)

---

## Future Enhancements

### Potential Improvements

1. **Component Tests:** Add unit tests for Vue components (currently only composables tested)
2. **E2E Tests:** Add Playwright/Cypress for full user flow testing
3. **State Persistence:** Add export/import functionality for quiz progress
4. **Quiz Builder:** Admin interface to create new quizzes
5. **Analytics:** Track time spent, retry counts, difficulty per question
6. **Accessibility:** Add ARIA labels, keyboard navigation improvements
7. **Internationalization:** Support for multiple languages (i18n)
8. **Theming:** Dark mode support
9. **Progressive Web App:** Add service worker for offline support
10. **Quiz Recommendations:** Suggest quizzes based on performance

### Architecture Improvements

1. **Pinia Store:** If state management becomes more complex
2. **Vue Router:** If adding multiple pages/views
3. **Component Library:** Extract reusable UI components
4. **Storybook:** Component documentation and visual testing
5. **Error Boundaries:** Better error handling and user feedback

---

## Troubleshooting

### Common Issues

**Issue:** Components not receiving injected state  
**Solution:** Ensure App.vue is using `provide()` and components use correct injection keys

**Issue:** TypeScript errors in components  
**Solution:** Check that all injected state has proper type definitions

**Issue:** Tests failing after state changes  
**Solution:** Update test mocks to match new state structure

**Issue:** localStorage migration not working  
**Solution:** Check browser console for migration errors, verify `restoreState()` logic

---

## Maintainer Guide

### Code Style

- **TypeScript:** Use explicit types for function parameters and return values
- **Components:** Keep under 200 lines
- **Composables:** Single responsibility principle
- **Tests:** Test behavior, not implementation
- **Comments:** Explain "why", not "what"

### Pull Request Checklist

- [ ] All tests pass (`npm run test`)
- [ ] Build succeeds with no TS errors (`npm run build`)
- [ ] Components are properly typed
- [ ] New composables have tests
- [ ] Documentation updated (if needed)
- [ ] No console.log statements (use proper logging)
- [ ] Accessibility tested (keyboard navigation, screen readers)

---

## Summary

The refactored architecture provides:

✅ **Modularity:** Small, focused components and composables  
✅ **Type Safety:** Full TypeScript coverage  
✅ **Testability:** Comprehensive unit tests  
✅ **Maintainability:** Clear separation of concerns  
✅ **Scalability:** Easy to add new features  
✅ **Performance:** Efficient state management  

**Before:** 720-line monolithic App.vue  
**After:** 10 files, max 300 lines each, fully typed and tested
