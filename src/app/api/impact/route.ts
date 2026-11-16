
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

function getNumber(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function getImpactValues(value: unknown) {
  const impact =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {}

  return {
    co2eSaved: getNumber(impact.co2eSaved),
    waterSaved: getNumber(impact.waterSaved),
    landSaved: getNumber(impact.landSaved),
    animalsSpared: getNumber(impact.animalsSpared),
  }
}

function countSelectedSwaps(value: unknown): number {
  if (Array.isArray(value)) {
    return value.filter(
      (choice) =>
        choice &&
        typeof choice === 'object' &&
        ['alternative', 'custom'].includes(
          (choice as Record<string, unknown>).type as string
        )
    ).length
  }

  if (!value || typeof value !== 'object') {
    return 0
  }

  return Object.values(value as Record<string, unknown>).filter(
    (choice) =>
      choice &&
      typeof choice === 'object' &&
      ['alternative', 'custom'].includes(
        (choice as Record<string, unknown>).type as string
      )
  ).length
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })

    // Authenticate the request using the user's session cookie.
    const { user } = await payload.auth({
      headers: request.headers,
    })

    if (!user || user.collection !== 'users') {
      return NextResponse.json(
        { error: 'You must be logged in to view your impact.' },
        { status: 401 }
      )
    }

    // Retrieve the authenticated user's own record.
    const userRecord = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
      overrideAccess: true,
    })

    const projectedImpact = getImpactValues(
      userRecord.projectedImpact
    )

    const cumulativeImpact = {
      ...getImpactValues(userRecord.cumulativeImpact),
      plantBasedDays: getNumber(
        userRecord.cumulativeImpact?.plantBasedDays
      ),
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

    const latestScore = leaderboard.docs[0]?.combinedScore

    return NextResponse.json(
      {
        projectedImpact,
        cumulativeImpact,
        currentStreak: getNumber(userRecord.currentStreak),
        selectedSwapCount: countSelectedSwaps(
          userRecord.activeSwaps
        ),
        points:
          latestScore === null || latestScore === undefined
            ? null
            : getNumber(latestScore),
        displayName: userRecord.name || 'Planet Pal',
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('GET /api/impact error:', error)

    return NextResponse.json(
      { error: 'Unable to load your impact data.' },
      { status: 500 }
    )
  }
}
