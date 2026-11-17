import { NextResponse } from 'next/server'
import type { Payload } from 'payload'
import { getUserSession } from '@/lib/api-session'
import { isRecord } from '@/lib/guards'
import {
  calculateLeaderboardScores,
  calculateProjectedImpact,
  isFullyPlantBased,
  isImpactChoiceMap,
} from '@/lib/impact-calculations'

export const dynamic = 'force-dynamic'

function utcWeekStart(date: Date): string {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
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

async function getReferralPoints(
  payload: Payload,
  referralCode: string | null | undefined,
  month: number,
  year: number,
): Promise<number> {
  if (!referralCode) return 0

  const referrals = await payload.find({
    collection: 'users',
    where: { referralCodeUsed: { equals: referralCode } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  if (referrals.docs.length === 0) return 0

  const entries = await payload.find({
    collection: 'leaderboard',
    where: {
      user: { in: referrals.docs.map((referral) => referral.id) },
      month: { equals: month },
      year: { equals: year },
    },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  return entries.docs.reduce((sum, entry) => {
    const points =
      entry.optimizationPoints ??
      Math.max(
        0,
        Number(entry.combinedScore ?? 0) -
          Number(entry.environmentalScore ?? 0) -
          Number(entry.animalImpactScore ?? 0) -
          Number(entry.plantBasedScore ?? 0) -
          Number(entry.referralPoints ?? 0),
      )
    return sum + (Number.isFinite(points) ? Math.max(0, points) : 0)
  }, 0)
}

async function updateReferrerLeaderboard(
  payload: Payload,
  referredByCode: string | null | undefined,
  month: number,
  year: number,
  now: Date,
) {
  if (!referredByCode) return

  const referrers = await payload.find({
    collection: 'users',
    where: { referralCode: { equals: referredByCode } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const referrer = referrers.docs[0]
  if (!referrer) return

  const referralPoints = await getReferralPoints(payload, referrer.referralCode, month, year)
  const entries = await payload.find({
    collection: 'leaderboard',
    where: {
      user: { equals: referrer.id },
      month: { equals: month },
      year: { equals: year },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const entry = entries.docs[0]
  const environmentalScore = entry?.environmentalScore ?? 0
  const plantBasedScore = entry?.plantBasedScore ?? 0
  const optimizationPoints = entry?.optimizationPoints ?? 0
  const scoreData = {
    displayName: referrer.name || 'Planet Pal',
    month,
    year,
    environmentalScore,
    animalImpactScore: 0,
    plantBasedScore,
    optimizationPoints,
    referralPoints,
    combinedScore: plantBasedScore + optimizationPoints + referralPoints,
    lastUpdated: now.toISOString(),
  }

  if (entry) {
    await payload.update({
      collection: 'leaderboard',
      id: entry.id,
      data: scoreData,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'leaderboard',
      data: { user: referrer.id, ...scoreData },
      overrideAccess: true,
    })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getUserSession(request)
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
      {
        activeSwaps: isImpactChoiceMap(record.activeSwaps) ? record.activeSwaps : {},
        quizResponses: record.quizResponses ?? null,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/active-swaps:', error)
    return NextResponse.json({ error: 'Unable to load saved swaps.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    if (!isRecord(body) || !isImpactChoiceMap(body.activeSwaps)) {
      return NextResponse.json({ error: 'Invalid activeSwaps data.' }, { status: 400 })
    }

    const hasPlantFoodChoice = Object.values(body.activeSwaps).some(
      (choice) => choice.type === 'plant-alternative',
    )
    const foodIds = new Set<string>()

    for (const [animalId, choice] of Object.entries(body.activeSwaps)) {
      if (choice.type === 'alternative') {
        foodIds.add(animalId)
        foodIds.add(choice.foodId)
      } else if (choice.type === 'plant-alternative') {
        foodIds.add(choice.baseFoodId)
        foodIds.add(choice.foodId)
      } else if (choice.type === 'considered') {
        foodIds.add(choice.foodId)
      }
    }

    const foodsResult = foodIds.size
      ? await session.payload.find({
          collection: 'foods',
          where: hasPlantFoodChoice
            ? { isActive: { equals: true } }
            : {
                id: { in: [...foodIds] },
                isActive: { equals: true },
              },
          limit: 1000,
          depth: 0,
          overrideAccess: true,
        })
      : { docs: [] }

    const foodsById = new Map(foodsResult.docs.map((food) => [String(food.id), food]))

    for (const [choiceId, choice] of Object.entries(body.activeSwaps)) {
      if (choice.type === 'plant-alternative') {
        const currentFood = foodsById.get(choice.baseFoodId)
        const alternativeFood = foodsById.get(choice.foodId)
        if (
          choiceId !== `plant:${choice.baseFoodId}` ||
          choice.baseFoodId === choice.foodId ||
          currentFood?.foodOrigin !== 'plant' ||
          alternativeFood?.foodOrigin !== 'plant'
        ) {
          return NextResponse.json(
            { error: 'Plant food swaps must compare two different plant foods.' },
            { status: 400 },
          )
        }
      } else if (choice.type === 'considered') {
        const food = foodsById.get(choice.foodId)
        const isPlant = choiceId === `plant:${choice.foodId}` && food?.foodOrigin === 'plant'
        const isAnimal = choiceId === choice.foodId && food?.foodOrigin === 'animal'
        if (!isPlant && !isAnimal) {
          return NextResponse.json(
            { error: 'Considered foods must reference the matching active food.' },
            { status: 400 },
          )
        }
      }
    }

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

    const shouldPreservePlantBasedStreak =
      impactCalculation.qualifyingSwaps === 0 &&
      (hasPlantFoodChoice ||
        Object.values(body.activeSwaps).some((choice) => choice.type === 'considered') ||
        isFullyPlantBased(userRecord.quizResponses))
    const streak = shouldPreservePlantBasedStreak
      ? {
          currentStreak: userRecord.currentStreak ?? 0,
          lastStreakWeek: userRecord.lastStreakWeek ?? null,
        }
      : updateWeeklyStreak(
          userRecord.currentStreak,
          userRecord.lastStreakWeek,
          impactCalculation.qualifyingSwaps > 0,
          now,
        )

    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const personalScores = calculateLeaderboardScores(body.activeSwaps, foodsResult.docs)
    const referralPoints = await getReferralPoints(
      session.payload,
      userRecord.referralCode,
      month,
      year,
    )
    const scores = {
      ...personalScores,
      referralPoints,
      combinedScore: personalScores.combinedScore + referralPoints,
    }

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
      displayName: userRecord.name || 'Planet Pal',
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

    await updateReferrerLeaderboard(session.payload, userRecord.referralCodeUsed, month, year, now)

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
