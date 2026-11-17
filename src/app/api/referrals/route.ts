import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getUserSession } from '@/lib/api-session'
import { isRecord } from '@/lib/guards'
import { getRelationId } from '@/lib/payload-relations'
import { numberOrZero } from '@/lib/numbers'

export const dynamic = 'force-dynamic'

function optimizationPoints(entry: {
  optimizationPoints?: number | null
  combinedScore?: number | null
  environmentalScore?: number | null
  animalImpactScore?: number | null
  plantBasedScore?: number | null
  referralPoints?: number | null
}): number {
  if (entry.optimizationPoints != null) return Math.max(0, numberOrZero(entry.optimizationPoints))
  return Math.max(
    0,
    numberOrZero(entry.combinedScore) -
      numberOrZero(entry.environmentalScore) -
      numberOrZero(entry.animalImpactScore) -
      numberOrZero(entry.plantBasedScore) -
      numberOrZero(entry.referralPoints),
  )
}

export async function GET(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Log in to create a friend invite.' }, { status: 401 })
    }
    const { payload, user } = session

    const userRecord = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
      overrideAccess: true,
    })
    const referralCode = userRecord.referralCode || randomBytes(12).toString('hex')

    if (!userRecord.referralCode) {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { referralCode },
        overrideAccess: true,
      })
    }

    const friends = await payload.find({
      collection: 'users',
      where: { referralCodeUsed: { equals: referralCode } },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
      select: { id: true, name: true, dietType: true, quizResponses: true },
    })
    const veganConversions = friends.docs.filter((friend) => {
      const responses = isRecord(friend.quizResponses) ? friend.quizResponses : {}
      const metadata = isRecord(responses.__cowculator) ? responses.__cowculator : {}
      return metadata.veganReferralAtSignup === true || friend.dietType === 'vegan'
    }).length
    const now = new Date()
    const friendIds = friends.docs.map((friend) => friend.id)
    const entries = friendIds.length
      ? await payload.find({
          collection: 'leaderboard',
          where: {
            user: { in: friendIds },
            month: { equals: now.getMonth() + 1 },
            year: { equals: now.getFullYear() },
          },
          limit: 1000,
          depth: 0,
          overrideAccess: true,
        })
      : { docs: [] }

    const pointsByFriend = new Map<string, number>()
    for (const entry of entries.docs) {
      const friendId = getRelationId(entry.user)
      if (friendId && !pointsByFriend.has(friendId)) {
        pointsByFriend.set(friendId, optimizationPoints(entry))
      }
    }

    const invitedFriends = friends.docs.map((friend) => ({
      id: String(friend.id),
      displayName: friend.name || 'Planet Pal',
      points: pointsByFriend.get(String(friend.id)) ?? 0,
    }))
    const referralPoints = invitedFriends.reduce((sum, friend) => sum + friend.points, 0)
    const ownEntries = await payload.find({
      collection: 'leaderboard',
      where: {
        user: { equals: user.id },
        month: { equals: now.getMonth() + 1 },
        year: { equals: now.getFullYear() },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const ownEntry = ownEntries.docs[0]

    if (ownEntry) {
      const plantBasedScore = numberOrZero(ownEntry.plantBasedScore)
      const personalPoints = optimizationPoints(ownEntry)
      const currentReferralPoints = numberOrZero(ownEntry.referralPoints)

      const currentCombinedScore = plantBasedScore + personalPoints + referralPoints
      if (
        currentReferralPoints !== referralPoints ||
        ownEntry.animalImpactScore !== 0 ||
        numberOrZero(ownEntry.combinedScore) !== currentCombinedScore
      ) {
        await payload.update({
          collection: 'leaderboard',
          id: ownEntry.id,
          data: {
            animalImpactScore: 0,
            optimizationPoints: personalPoints,
            referralPoints,
            combinedScore: currentCombinedScore,
            lastUpdated: now.toISOString(),
          },
          overrideAccess: true,
        })
      }
    } else if (referralPoints > 0) {
      await payload.create({
        collection: 'leaderboard',
        data: {
          user: user.id,
          displayName: userRecord.name || 'Planet Pal',
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          environmentalScore: 0,
          animalImpactScore: 0,
          plantBasedScore: 0,
          optimizationPoints: 0,
          referralPoints,
          combinedScore: referralPoints,
          lastUpdated: now.toISOString(),
        },
        overrideAccess: true,
      })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
    const inviteUrl = new URL(
      `/plant-a-seed/${encodeURIComponent(referralCode)}`,
      siteUrl,
    ).toString()

    return NextResponse.json(
      { referralCode, inviteUrl, referralPoints, veganConversions, friends: invitedFriends },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/referrals:', error)
    return NextResponse.json({ error: 'Unable to load friend invites.' }, { status: 500 })
  }
}
