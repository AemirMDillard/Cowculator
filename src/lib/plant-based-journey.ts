import { isRecord } from './guards'

export type JourneyProgress = {
  pledgeDate: string | null
  checkInDates: string[]
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function getJourneyProgress(quizResponses: unknown): JourneyProgress {
  if (!isRecord(quizResponses) || !isRecord(quizResponses.__cowculator)) {
    return { pledgeDate: null, checkInDates: [] }
  }

  const stored = quizResponses.__cowculator.plantBasedJourney
  if (!isRecord(stored)) return { pledgeDate: null, checkInDates: [] }

  return {
    pledgeDate: isDateKey(stored.pledgeDate) ? stored.pledgeDate : null,
    checkInDates: Array.isArray(stored.checkInDates)
      ? [...new Set(stored.checkInDates.filter(isDateKey))].sort()
      : [],
  }
}
