import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

function getNumber(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function getRelatedUserId(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id

    if (typeof id === 'string' || typeof id === 'number') {
      return String(id)
    }
  }

  return null
}

export async function GET(request: Request) {
  try {
    const period = new URL(request.url).searchParams.get('period') ?? 'Global'

    if (!['Global', 'Friends', 'This month'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid leaderboard period.' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    const loggedInUserId =
      user?.collection === 'users' ? String(user.id) : undefined

    // Friend relationships are not implemented yet.
    if (period === 'Friends') {
      return NextResponse.json(
        { entries: [] },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const now = new Date()
    const result = await payload.find({
      collection: 'leaderboard',
      ...(period === 'This month'
        ? {
            where: {
              year: { equals: now.getFullYear() },
              month: { equals: now.getMonth() + 1 },
            },
          }
        : {}),
      sort:
        period === 'This month'
          ? '-lastUpdated,-combinedScore'
          : '-year,-month,-lastUpdated,-combinedScore',
      limit: 1000,
      depth: 0,
      // Leaderboard reads are public, but only the selected fields below are returned.
      overrideAccess: true,
    })

    const latestEntryByUser = new Map<
      string,
      (typeof result.docs)[number]
    >()

    for (const entry of result.docs) {
      const relatedUserId = getRelatedUserId(entry.user)

      if (relatedUserId && !latestEntryByUser.has(relatedUserId)) {
        latestEntryByUser.set(relatedUserId, entry)
      }
    }

    const rankedEntries = [...latestEntryByUser.values()].sort(
      (a, b) =>
        getNumber(b.combinedScore) - getNumber(a.combinedScore) ||
        a.displayName.localeCompare(b.displayName),
    )

    const currentEntry = loggedInUserId
      ? rankedEntries.find(
          (entry) => getRelatedUserId(entry.user) === loggedInUserId,
        )
      : undefined

    const entries = rankedEntries.map((entry, index) => ({
      id: String(entry.id),
      displayName: entry.displayName || 'Planet Pal',
      month: getNumber(entry.month),
      year: getNumber(entry.year),
      animalImpactScore: getNumber(entry.animalImpactScore),
      environmentalScore: getNumber(entry.environmentalScore),
      plantBasedScore: getNumber(entry.plantBasedScore),
      combinedScore: getNumber(entry.combinedScore),
      rank: index + 1,
    }))

    return NextResponse.json(
      {
        entries,
        // The current page compares this to entry.id, so return the leaderboard record ID.
        currentUserId: currentEntry ? String(currentEntry.id) : undefined,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/leaderboard error:', error)

    return NextResponse.json(
      { error: 'Unable to load the leaderboard.' },
      { status: 500 },
    )
  }
}