import { describe, it, expect } from 'vitest'
import { parseQuizName, sortGrades } from '../parseQuizName'

describe('parseQuizName', () => {
  it('parses primary school quiz', () => {
    expect(parseQuizName({ file: 'a.json', name: 'Wiedza o Społeczeństwie - 8' })).toMatchObject({
      grade: '8',
      subject: 'Wiedza o Społeczeństwie',
    })
  })

  it('keeps level for high school quiz', () => {
    expect(parseQuizName({ file: 'a.json', name: 'Informatyka - 2 LO (poziom rozszerzony)' })).toMatchObject({
      grade: '2 LO',
      subject: 'Informatyka (poziom rozszerzony)',
    })
  })

  it('defaults high school quiz without level to basic level', () => {
    expect(parseQuizName({ file: 'a.json', name: 'Biologia - 1 LO' })).toMatchObject({
      grade: '1 LO',
      subject: 'Biologia (poziom podstawowy)',
    })
  })

  it('falls back for unparseable names', () => {
    expect(parseQuizName({ file: 'a.json', name: 'Quiz' })).toMatchObject({ grade: 'Inne', subject: 'Quiz' })
  })
})

describe('sortGrades', () => {
  it('orders primary school before high school and dedupes', () => {
    expect(sortGrades(['2 LO', '8', 'Inne', '1 LO', '7', '8'])).toEqual(['7', '8', '1 LO', '2 LO', 'Inne'])
  })
})
