import { NextResponse } from 'next/server'
import { getUserSession } from '@/lib/api-session'
import { isRecord } from '@/lib/guards'
import { numberOrZero } from '@/lib/numbers'
import {
  calculatePer100gImpact,
  calculateProjectedImpact,
  hasAnimalFrequencyAnswers,
  isImpactChoiceMap,
  isFullyPlantBased,
} from '@/lib/impact-calculations'

export const dynamic = 'force-dynamic'

function getImpactValues(value: unknown) {
  const impact = isRecord(value) ? value : {}

  return {
    co2eSaved: numberOrZero(impact.co2eSaved),
    waterSaved: numberOrZero(impact.waterSaved),
    landSaved: numberOrZero(impact.landSaved),
    animalsSpared: 0,
  }
}

function countSelectedSwaps(value: unknown): number {
  if (Array.isArray(value)) {
    return value.filter(isSelectedChoice).length
  }

  if (!isRecord(value)) return 0
  return Object.values(value).filter(isSelectedChoice).length
}

function isSelectedChoice(value: unknown): boolean {
  return (
    isRecord(value) && ['alternative', 'plant-alternative', 'custom'].includes(String(value.type))
  )
}

export async function GET(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to view your impact.' },
        { status: 401 },
      )
    }
    const { payload, user } = session

    const userRecord = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
      overrideAccess: true,
    })

    const choices = isImpactChoiceMap(userRecord.activeSwaps) ? userRecord.activeSwaps : {}
    const foodIds = Object.entries(choices)
      .filter(([, choice]) => choice.type === 'alternative')
      .flatMap(([animalId, choice]) =>
        choice.type === 'alternative' ? [animalId, choice.foodId] : [],
      )
    const foods = foodIds.length
      ? await payload.find({
          collection: 'foods',
          where: {
            id: { in: foodIds },
            isActive: { equals: true },
          },
          limit: 1000,
          depth: 0,
          overrideAccess: true,
        })
      : { docs: [] }
    const quizResponses = userRecord.quizResponses
    const isVegan = isFullyPlantBased(quizResponses)
    const hasFrequencies = hasAnimalFrequencyAnswers(quizResponses)
    const impactResult = isVegan
      ? {
          projectedImpact: { co2eSaved: 0, waterSaved: 0, landSaved: 0, animalsSpared: 0 },
          qualifyingSwaps: 0,
        }
      : hasFrequencies
        ? calculateProjectedImpact(choices, foods.docs, quizResponses)
        : calculatePer100gImpact(choices, foods.docs)
    const projectedImpact = impactResult.projectedImpact

    const cumulativeImpact = {
      ...getImpactValues(userRecord.cumulativeImpact),
      plantBasedDays: numberOrZero(userRecord.cumulativeImpact?.plantBasedDays),
    }

    // Use the latest monthly leaderboard score if one exists.
    // This is a monthly score, not an all-time score.
    const leaderboard = await payload.find({
      collection: 'leaderboard',
      where: {
        user: {
          equals: user.id,
        },
      },
      sort: '-year,-month',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const latestEntry = leaderboard.docs[0]
    const legacyPersonalPoints =
      latestEntry?.combinedScore == null
        ? null
        : Math.max(
            0,
            numberOrZero(latestEntry.combinedScore) -
              numberOrZero(latestEntry.environmentalScore) -
              numberOrZero(latestEntry.animalImpactScore) -
              numberOrZero(latestEntry.plantBasedScore) -
              numberOrZero(latestEntry.referralPoints),
          )
    const personalPoints = latestEntry?.optimizationPoints ?? legacyPersonalPoints
    const referralPoints = numberOrZero(latestEntry?.referralPoints)
    return NextResponse.json(
      {
        projectedImpact,
        cumulativeImpact,
        estimateBasis: isVegan ? 'not-applicable' : hasFrequencies ? 'annual' : 'per-100g',
        currentStreak: numberOrZero(userRecord.currentStreak),
        selectedSwapCount: countSelectedSwaps(userRecord.activeSwaps),
        quantifiedSwapCount: impactResult.qualifyingSwaps,
        activeSwaps: choices,
        quizResponses,
        points:
          personalPoints === null || personalPoints === undefined
            ? null
            : numberOrZero(personalPoints) + referralPoints,
        personalPoints:
          personalPoints === null || personalPoints === undefined
            ? null
            : numberOrZero(personalPoints),
        referralPoints,
        displayName: userRecord.name || 'Planet Pal',
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    console.error('GET /api/impact error:', error)

    return NextResponse.json({ error: 'Unable to load your impact data.' }, { status: 500 })
  }
}
