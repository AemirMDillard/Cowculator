import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

type Choice =
  | { type: 'alternative'; foodId: string; swapId: string }
  | { type: 'give-up' }
  | { type: 'custom'; suggestion: string; notes?: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isChoice(value: unknown): value is Choice {
  if (!isRecord(value)) return false

  if (value.type === 'give-up') return true

  if (value.type === 'alternative') {
    return typeof value.foodId === 'string' &&
      typeof value.swapId === 'string'
  }

  return value.type === 'custom' &&
    typeof value.suggestion === 'string' &&
    (value.notes === undefined || typeof value.notes === 'string')
}

function isChoices(value: unknown): value is Record<string, Choice> {
  return isRecord(value) && Object.values(value).every(isChoice)
}

type ScoredFood = {
  id: number | string
  foodOrigin?: string | null
  animalProductCategory?: string | null
  environmentalImpact?: {
    co2eKg?: number | null
    waterLiters?: number | null
    landM2?: number | null
    animalsPer100g?: number | null
    impactScorePer100g?: number | null
  } | null
}

type LeaderboardScores = {
  environmentalScore: number
  animalImpactScore: number
  plantBasedScore: number
  combinedScore: number
}

function positiveSavings(
  animalValue: number | null | undefined,
  plantValue: number | null | undefined,
) {
  if (
    animalValue == null ||
    plantValue == null ||
    !Number.isFinite(animalValue) ||
    !Number.isFinite(plantValue)
  ) {
    return 0
  }

  return Math.max(0, animalValue - plantValue)
}

type ProjectedImpact = {
  co2eSaved: number
  waterSaved: number
  landSaved: number
  animalsSpared: number
}

const questionByAnimalCategory: Record<string, string> = {
  beef: 'redMeat',
  pork: 'redMeat',
  poultry: 'poultry',
  fish: 'seafood',
  seafood: 'seafood',
  dairy: 'dairy',
  eggs: 'eggs',
}

function annualServings(
  category: string | null | undefined,
  quizResponses: unknown,
): number {
  if (!category || !isRecord(quizResponses)) return 0

  const question = questionByAnimalCategory[category]
  if (!question) return 0

  switch (quizResponses[question]) {
    case 'Daily':
      return 365
    case 'A few times a week':
      return 156
    case 'Occasionally':
      return 52
    default:
      return 0
  }
}

function calculateProjectedImpact(
  choices: Record<string, Choice>,
  foods: ScoredFood[],
  quizResponses: unknown,
): { projectedImpact: ProjectedImpact; qualifyingSwaps: number } {
  const foodsById = new Map(
    foods.map((food) => [String(food.id), food]),
  )

  const projectedImpact: ProjectedImpact = {
    co2eSaved: 0,
    waterSaved: 0,
    landSaved: 0,
    animalsSpared: 0,
  }

  let qualifyingSwaps = 0

  for (const [animalId, choice] of Object.entries(choices)) {
    if (choice.type !== 'alternative') continue

    const animal = foodsById.get(animalId)
    const plant = foodsById.get(choice.foodId)

    if (
      animal?.foodOrigin !== 'animal' ||
      plant?.foodOrigin !== 'plant'
    ) {
      continue
    }

    const servings = annualServings(
      animal.animalProductCategory,
      quizResponses,
    )
    if (servings === 0) continue

    qualifyingSwaps += 1

    projectedImpact.co2eSaved +=
      positiveSavings(
        animal.environmentalImpact?.co2eKg,
        plant.environmentalImpact?.co2eKg,
      ) * servings

    projectedImpact.waterSaved +=
      positiveSavings(
        animal.environmentalImpact?.waterLiters,
        plant.environmentalImpact?.waterLiters,
      ) * servings

    projectedImpact.landSaved +=
      positiveSavings(
        animal.environmentalImpact?.landM2,
        plant.environmentalImpact?.landM2,
      ) * servings

    projectedImpact.animalsSpared +=
      positiveSavings(
        animal.environmentalImpact?.animalsPer100g,
        plant.environmentalImpact?.animalsPer100g,
      ) * servings
  }

  return { projectedImpact, qualifyingSwaps }
}

function utcWeekStart(date: Date): string {
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
  const daysSinceMonday = (monday.getUTCDay() + 6) % 7

  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday)
  return monday.toISOString().slice(0, 10)
}

function updateWeeklyStreak(
  currentStreak: number | null | undefined,
  lastStreakWeek: string | null | undefined,
  hasQualifyingSwap: boolean,
  now: Date,
): { currentStreak: number; lastStreakWeek: string | null } {
  if (!hasQualifyingSwap) {
    return { currentStreak: 0, lastStreakWeek: null }
  }

  const thisWeek = utcWeekStart(now)
  const streak = Math.max(0, currentStreak ?? 0)

  if (lastStreakWeek === thisWeek) {
    return {
      currentStreak: Math.max(1, streak),
      lastStreakWeek: thisWeek,
    }
  }

  const previousWeek = new Date(`${thisWeek}T00:00:00.000Z`)
  previousWeek.setUTCDate(previousWeek.getUTCDate() - 7)

  if (lastStreakWeek === previousWeek.toISOString().slice(0, 10)) {
    return {
      currentStreak: streak + 1,
      lastStreakWeek: thisWeek,
    }
  }

  return { currentStreak: 1, lastStreakWeek: thisWeek }
}

function calculateLeaderboardScores(
  choices: Record<string, Choice>,
  foods: ScoredFood[],
): LeaderboardScores {
  const foodsById = new Map(
    foods.map((food) => [String(food.id), food]),
  )

  let co2eSavedPer100g = 0
  let animalsSparedPer100g = 0
  let plantBasedScore = 0
  let optimizationPoints = 0

  for (const [animalId, choice] of Object.entries(choices)) {
    if (choice.type !== 'alternative') continue

    const animal = foodsById.get(animalId)
    const plant = foodsById.get(choice.foodId)

    if (
      animal?.foodOrigin !== 'animal' ||
      plant?.foodOrigin !== 'plant'
    ) {
      continue
    }

    co2eSavedPer100g += positiveSavings(
      animal.environmentalImpact?.co2eKg,
      plant.environmentalImpact?.co2eKg,
    )

    animalsSparedPer100g += positiveSavings(
      animal.environmentalImpact?.animalsPer100g,
      plant.environmentalImpact?.animalsPer100g,
    )

    plantBasedScore += 10

    const animalImpactScore =
      animal.environmentalImpact?.impactScorePer100g
    const plantImpactScore =
      plant.environmentalImpact?.impactScorePer100g

    if (
      animalImpactScore != null &&
      plantImpactScore != null &&
      Number.isFinite(animalImpactScore) &&
      Number.isFinite(plantImpactScore)
    ) {
      const difference = Math.max(
        0,
        Number((animalImpactScore - plantImpactScore).toFixed(2)),
      )

      optimizationPoints += Math.round(difference * 10)
    }
  }

  const environmentalScore = Math.round(co2eSavedPer100g * 100)
  const animalImpactScore = Math.round(animalsSparedPer100g * 1000)

  return {
    environmentalScore,
    animalImpactScore,
    plantBasedScore,
    combinedScore:
      environmentalScore +
      animalImpactScore +
      plantBasedScore +
      optimizationPoints,
  }
}

async function getUser(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user || user.collection !== 'users') return null

  return { payload, user }
}

export async function GET(request: Request) {
  try {
    const session = await getUser(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const record = await session.payload.findByID({
      collection: 'users',
      id: session.user.id,
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json(
      { activeSwaps: isChoices(record.activeSwaps) ? record.activeSwaps : {} },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/active-swaps:', error)
    return NextResponse.json(
      { error: 'Unable to load saved swaps.' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getUser(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    if (!isRecord(body) || !isChoices(body.activeSwaps)) {
      return NextResponse.json(
        { error: 'Invalid activeSwaps data.' },
        { status: 400 },
      )
    }

    const foodIds = new Set<string>()

    for (const [animalId, choice] of Object.entries(body.activeSwaps)) {
      if (choice.type === 'alternative') {
        foodIds.add(animalId)
        foodIds.add(choice.foodId)
      }
    }

    const foodsResult = foodIds.size
      ? await session.payload.find({
          collection: 'foods',
          where: {
            id: { in: [...foodIds] },
            isActive: { equals: true },
          },
          limit: 1000,
          depth: 0,
          overrideAccess: true,
        })
      : { docs: [] }

        const userRecord = await session.payload.findByID({
      collection: 'users',
      id: session.user.id,
      depth: 0,
      overrideAccess: true,
    })

    const now = new Date()

    const impactCalculation = calculateProjectedImpact(
      body.activeSwaps,
      foodsResult.docs,
      userRecord.quizResponses,
    )

    const streak = updateWeeklyStreak(
      userRecord.currentStreak,
      userRecord.lastStreakWeek,
      impactCalculation.qualifyingSwaps > 0,
      now,
    )

    const scores = calculateLeaderboardScores(
      body.activeSwaps,
      foodsResult.docs,
    )

    await session.payload.update({
      collection: 'users',
      id: session.user.id,
      data: {
        activeSwaps: body.activeSwaps,
        projectedImpact: impactCalculation.projectedImpact,
        currentStreak: streak.currentStreak,
        lastStreakWeek: streak.lastStreakWeek,
        lastImpactUpdate: now.toISOString(),
      },
      overrideAccess: true,
    })

    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const existingEntries = await session.payload.find({
      collection: 'leaderboard',
      where: {
        user: { equals: session.user.id },
        month: { equals: month },
        year: { equals: year },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const scoreData = {
      displayName: session.user.name || 'Planet Pal',
      month,
      year,
      ...scores,
      lastUpdated: now.toISOString(),
    }

    const existingEntry = existingEntries.docs[0]

    if (existingEntry) {
      await session.payload.update({
        collection: 'leaderboard',
        id: existingEntry.id,
        data: scoreData,
        overrideAccess: true,
      })
    } else {
      await session.payload.create({
        collection: 'leaderboard',
        data: {
          user: session.user.id,
          ...scoreData,
        },
        overrideAccess: true,
      })
    }

    return NextResponse.json({
      activeSwaps: body.activeSwaps,
      scores,
    })
  } catch (error) {
    console.error('PATCH /api/active-swaps:', error)
    return NextResponse.json(
      { error: 'Unable to save swaps and update your leaderboard score.' },
      { status: 500 },
    )
  }
}