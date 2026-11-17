import { NextResponse } from 'next/server'
import { getPayloadSession } from '@/lib/api-session'
import { numberOrZero } from '@/lib/numbers'
import { getRelationId } from '@/lib/payload-relations'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const period = new URL(request.url).searchParams.get('period') ?? 'Global'

    if (!['Global', 'Friends', 'This month'].includes(period)) {
      return NextResponse.json({ error: 'Invalid leaderboard period.' }, { status: 400 })
    }

    const { payload, user } = await getPayloadSession(request)
    const loggedInUserId = user ? String(user.id) : undefined

    const now = new Date()
    let result

    if (period === 'Friends') {
      if (!user) {
        return NextResponse.json({ error: 'Log in to see your friends.' }, { status: 401 })
      }

      const friendships = await payload.find({
        collection: 'friendships',
        where: {
          status: { equals: 'accepted' },
          or: [{ requester: { equals: user.id } }, { recipient: { equals: user.id } }],
        },
        limit: 2000,
        depth: 0,
        overrideAccess: true,
      })
      const friendIds = [
        ...new Set(
          friendships.docs
            .map((friendship) => {
              const requesterId = getRelationId(friendship.requester)
              const recipientId = getRelationId(friendship.recipient)
              return requesterId === String(user.id) ? recipientId : requesterId
            })
            .filter((id): id is string => id !== null && id !== String(user.id)),
        ),
      ]

      if (friendIds.length === 0) {
        return NextResponse.json({ entries: [] }, { headers: { 'Cache-Control': 'no-store' } })
      }

      result = await payload.find({
        collection: 'leaderboard',
        where: {
          user: { in: friendIds },
          year: { equals: now.getFullYear() },
          month: { equals: now.getMonth() + 1 },
        },
        sort: '-lastUpdated,-combinedScore',
        limit: 1000,
        depth: 0,
        overrideAccess: true,
      })
    } else {
      result = await payload.find({
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
    }

    const latestEntryByUser = new Map<string, (typeof result.docs)[number]>()

    for (const entry of result.docs) {
      const relatedUserId = getRelationId(entry.user)

      if (relatedUserId && !latestEntryByUser.has(relatedUserId)) {
        latestEntryByUser.set(relatedUserId, entry)
      }
    }

    const getOptimizationPoints = (entry: (typeof result.docs)[number]) =>
      entry.optimizationPoints ??
      Math.max(
        0,
        numberOrZero(entry.combinedScore) -
          numberOrZero(entry.environmentalScore) -
          numberOrZero(entry.animalImpactScore) -
          numberOrZero(entry.plantBasedScore) -
          numberOrZero(entry.referralPoints),
      )
    const getCurrentScore = (entry: (typeof result.docs)[number]) =>
      numberOrZero(entry.plantBasedScore) +
      getOptimizationPoints(entry) +
      numberOrZero(entry.referralPoints)

    const rankedEntries = [...latestEntryByUser.values()].sort(
      (a, b) =>
        getCurrentScore(b) - getCurrentScore(a) || a.displayName.localeCompare(b.displayName),
    )

    const currentEntry = loggedInUserId
      ? rankedEntries.find((entry) => getRelationId(entry.user) === loggedInUserId)
      : undefined

    const entries = rankedEntries.map((entry, index) => ({
      id: String(entry.id),
      displayName: entry.displayName || 'Planet Pal',
      month: numberOrZero(entry.month),
      year: numberOrZero(entry.year),
      animalImpactScore: 0,
      environmentalScore: numberOrZero(entry.environmentalScore),
      plantBasedScore: numberOrZero(entry.plantBasedScore),
      optimizationPoints: getOptimizationPoints(entry),
      referralPoints: numberOrZero(entry.referralPoints),
      combinedScore: getCurrentScore(entry),
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

    return NextResponse.json({ error: 'Unable to load the leaderboard.' }, { status: 500 })
  }
}
