import type { QuizMetadata } from '@/types'

export interface ParsedQuiz extends QuizMetadata {
  /** Etykieta klasy, np. "7" albo "1 LO" */
  grade: string
  /** Nazwa przedmiotu z ewentualnym dopiskiem poziomu dla LO */
  subject: string
}

/**
 * Rozbija nazwę w formacie "Przedmiot - Klasa[ (poziom ...)]" na klasę i przedmiot.
 * Przedmioty licealne bez podanego poziomu oznaczane są jako poziom podstawowy.
 */
export function parseQuizName(quiz: QuizMetadata): ParsedQuiz {
  const match = quiz.name.match(/^(.*\S)\s+-\s+(.+?)\s*(\((?:poziom|zakres)[^)]*\))?\s*$/i)
  if (!match) {
    return { ...quiz, grade: 'Inne', subject: quiz.name }
  }
  const [, subjectName, grade, level] = match
  const isHighSchool = /\bLO\b/i.test(grade)
  const subject = isHighSchool ? `${subjectName} ${level ?? '(poziom podstawowy)'}` : subjectName
  return { ...quiz, grade, subject }
}

function gradeSortKey(grade: string): [number, number, string] {
  const num = parseInt(grade, 10)
  const stage = /\bLO\b/i.test(grade) ? 1 : Number.isNaN(num) ? 2 : 0
  return [stage, Number.isNaN(num) ? 0 : num, grade]
}

/** Klasy w kolejności: szkoła podstawowa rosnąco, potem LO rosnąco, potem pozostałe. */
export function sortGrades(grades: string[]): string[] {
  return [...new Set(grades)].sort((a, b) => {
    const [sa, na, ta] = gradeSortKey(a)
    const [sb, nb, tb] = gradeSortKey(b)
    return sa - sb || na - nb || ta.localeCompare(tb, 'pl')
  })
}
