import { NextResponse } from 'next/server'
import { type Payload } from 'payload'
import { getUserSession } from '@/lib/api-session'
import { getRelationId } from '@/lib/payload-relations'

export const dynamic = 'force-dynamic'

type FriendshipStatus = 'pending' | 'accepted' | 'declined'

function person(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const id = getRelationId(value)
  if (!id) return null
  const name = 'name' in value && typeof value.name === 'string' ? value.name : 'Friend'
  return { id, displayName: name }
}

async function getRelationships(payload: Payload, userId: number) {
  const result = await payload.find({
    collection: 'friendships',
    where: {
      or: [{ requester: { equals: userId } }, { recipient: { equals: userId } }],
    },
    sort: '-updatedAt',
    limit: 2000,
    depth: 1,
    overrideAccess: true,
  })
  return result.docs
}

export async function GET(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Log in to find and add friends.' }, { status: 401 })
    }

    const userId = String(session.user.id)
    const relationships = await getRelationships(session.payload, Number(session.user.id))
    const query = new URL(request.url).searchParams.get('query')?.trim() ?? ''

    if (query) {
      if (query.length < 2) {
        return NextResponse.json({ results: [] }, { headers: { 'Cache-Control': 'no-store' } })
      }

      const users = await session.payload.find({
        collection: 'users',
        where: { name: { contains: query.slice(0, 60) } },
        sort: 'name',
        limit: 25,
        depth: 0,
        overrideAccess: true,
      })
      const states = new Map<string, { status: string; requestId?: string }>()

      for (const relationship of relationships) {
        const requesterId = getRelationId(relationship.requester)
        const recipientId = getRelationId(relationship.recipient)
        const otherId = requesterId === userId ? recipientId : requesterId

        if (!otherId || otherId === userId || states.has(otherId)) continue
        let status = relationship.status as FriendshipStatus
        if (status === 'accepted') {
          states.set(otherId, { status: 'friends' })
        } else if (status === 'pending') {
          states.set(otherId, {
            status: requesterId === userId ? 'pending-sent' : 'pending-received',
            requestId: String(relationship.id),
          })
        } else {
          states.set(otherId, { status: 'declined' })
        }
      }

      const results = users.docs
        .filter((candidate) => String(candidate.id) !== userId)
        .map((candidate) => ({
          id: String(candidate.id),
          displayName: candidate.name,
          status: states.get(String(candidate.id))?.status ?? 'none',
          requestId: states.get(String(candidate.id))?.requestId,
        }))

      return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const friends = new Map<string, { id: string; displayName: string; requestId: string }>()
    const incomingRequests: Array<{
      requestId: string
      person: { id: string; displayName: string }
    }> = []
    const outgoingRequests: Array<{
      requestId: string
      person: { id: string; displayName: string }
    }> = []

    for (const relationship of relationships) {
      const requesterId = getRelationId(relationship.requester)
      const recipientId = getRelationId(relationship.recipient)
      const isRequester = requesterId === userId
      const other = person(isRequester ? relationship.recipient : relationship.requester)
      if (!other || other.id === userId) continue

      if (relationship.status === 'accepted') {
        friends.set(other.id, { ...other, requestId: String(relationship.id) })
      } else if (relationship.status === 'pending') {
        const entry = { requestId: String(relationship.id), person: other }
        if (isRequester) outgoingRequests.push(entry)
        else incomingRequests.push(entry)
      }
    }

    return NextResponse.json(
      {
        friends: [...friends.values()],
        incomingRequests,
        outgoingRequests,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/friends:', error)
    return NextResponse.json({ error: 'Unable to load friends.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Log in to add a friend.' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }
    if (!body || typeof body !== 'object' || !('recipientId' in body)) {
      return NextResponse.json({ error: 'Choose a friend to add.' }, { status: 400 })
    }

    const recipientId = Number(body.recipientId)
    const requesterId = Number(session.user.id)
    if (!Number.isSafeInteger(recipientId) || recipientId <= 0 || recipientId === requesterId) {
      return NextResponse.json({ error: 'Choose a valid friend.' }, { status: 400 })
    }

    const recipient = await session.payload.find({
      collection: 'users',
      where: { id: { equals: recipientId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (!recipient.docs[0]) {
      return NextResponse.json({ error: 'That account could not be found.' }, { status: 404 })
    }

    const pair = await session.payload.find({
      collection: 'friendships',
      where: {
        or: [
          {
            and: [{ requester: { equals: requesterId } }, { recipient: { equals: recipientId } }],
          },
          {
            and: [{ requester: { equals: recipientId } }, { recipient: { equals: requesterId } }],
          },
        ],
      },
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const existing = pair.docs[0]

    if (existing?.status === 'accepted') {
      return NextResponse.json({ status: 'friends' })
    }
    if (existing?.status === 'pending') {
      return NextResponse.json(
        {
          status:
            getRelationId(existing.requester) === String(requesterId)
              ? 'pending-sent'
              : 'pending-received',
          requestId: String(existing.id),
        },
        { status: 200 },
      )
    }

    const saved = existing
      ? await session.payload.update({
          collection: 'friendships',
          id: existing.id,
          data: {
            requester: requesterId,
            recipient: recipientId,
            status: 'pending',
          },
          overrideAccess: true,
        })
      : await session.payload.create({
          collection: 'friendships',
          data: {
            requester: requesterId,
            recipient: recipientId,
            status: 'pending',
          },
          overrideAccess: true,
        })

    return NextResponse.json({ status: 'pending-sent', requestId: String(saved.id) })
  } catch (error) {
    console.error('POST /api/friends:', error)
    return NextResponse.json({ error: 'Unable to send friend request.' }, { status: 500 })
  }
}
