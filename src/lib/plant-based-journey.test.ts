import assert from 'node:assert/strict'
import test from 'node:test'
import { getJourneyProgress, isDateKey } from './plant-based-journey'

test('accepts real calendar dates and rejects malformed dates', () => {
  assert.equal(isDateKey('2024-02-29'), true)
  assert.equal(isDateKey('2023-02-29'), false)
  assert.equal(isDateKey('2024-2-09'), false)
  assert.equal(isDateKey(null), false)
})

test('counts unique valid check-in dates from journey metadata', () => {
  const progress = getJourneyProgress({
    __cowculator: {
      plantBasedJourney: {
        pledgeDate: '2025-01-01',
        checkInDates: ['2025-01-02', '2025-01-01', '2025-01-02', 'invalid'],
      },
    },
  })

  assert.deepEqual(progress, {
    pledgeDate: '2025-01-01',
    checkInDates: ['2025-01-01', '2025-01-02'],
  })
})

test('returns empty progress for missing or malformed journey metadata', () => {
  assert.deepEqual(getJourneyProgress(null), { pledgeDate: null, checkInDates: [] })
  assert.deepEqual(getJourneyProgress({ __cowculator: { plantBasedJourney: 'invalid' } }), {
    pledgeDate: null,
    checkInDates: [],
  })
})
