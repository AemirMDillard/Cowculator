import { NextResponse } from 'next/server'
import { isRecord } from '@/lib/guards'
import {
  communityRateLimitResponse,
  consumeCommunityRateLimit,
  getCommunitySession,
  makeCommunityBlockKey,
  parsePositiveId,
  readCommunityJson,
} from '@/lib/community'
import { getRelationId } from '@/lib/payload-relations'

export const dynamic = 'force-dynamic'
const MAX_BLOCKED_MEMBERS = 500

export async function GET(request: Request) {
  try {
    const { session, response } = await getCommunitySession(request)
    if (!session) return response

    const blocked = await session.payload.find({
      collection: 'community-blocks',
      where: { blocker: { equals: Number(session.user.id) } },
      sort: '-createdAt',
      limit: MAX_BLOCKED_MEMBERS,
      depth: 1,
      overrideAccess: true,
    })
    return NextResponse.json(
      {
        blocks: blocked.docs.flatMap((entry) => {
          const id = getRelationId(entry.blocked)
          if (!id) return []
          return [
            {
              id,
              displayName:
                entry.blocked && typeof entry.blocked === 'object' && 'name' in entry.blocked
                  ? String(entry.blocked.name)
                  : 'Cowculator member',
            },
          ]
        }),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/community/blocks:', error)
    return NextResponse.json({ error: 'Unable to load your blocked members.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { session, response } = await getCommunitySession(request)
    if (!session) return response

    const parsed = await readCommunityJson(request)
    if ('error' in parsed) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    if (!isRecord(parsed.body)) {
      return NextResponse.json({ error: 'Choose a member to block.' }, { status: 400 })
    }

    const userId = Number(session.user.id)
    const blockedId = parsePositiveId(parsed.body.blockedUserId)
    if (!blockedId || blockedId === userId) {
      return NextResponse.json({ error: 'Choose a valid member to block.' }, { status: 400 })
    }

    const key = makeCommunityBlockKey(userId, blockedId)
    const existing = await session.payload.find({
      collection: 'community-blocks',
      where: { blockKey: { equals: key } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      return NextResponse.json({ blocked: true }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const count = await session.payload.count({
      collection: 'community-blocks',
      where: { blocker: { equals: userId } },
      overrideAccess: true,
    })
    if (count.totalDocs >= MAX_BLOCKED_MEMBERS) {
      return NextResponse.json(
        { error: 'Your blocked-member list is full. Unblock someone before adding another.' },
        { status: 409 },
      )
    }

    const member = await session.payload.find({
      collection: 'users',
      where: { id: { equals: blockedId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (!member.docs[0]) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })

    const rate = await consumeCommunityRateLimit(session.payload, userId, 'block')
    if (!rate.allowed) return communityRateLimitResponse(rate.retryAfter)

    await session.payload.create({
      collection: 'community-blocks',
      data: { blocker: userId, blocked: blockedId, blockKey: key },
      overrideAccess: true,
    })

    return NextResponse.json(
      { blocked: true },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('POST /api/community/blocks:', error)
    return NextResponse.json({ error: 'Unable to block that member.' }, { status: 500 })
  }
}
