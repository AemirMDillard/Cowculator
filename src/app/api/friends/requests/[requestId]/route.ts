import { NextResponse } from 'next/server'
import { getUserSession } from '@/lib/api-session'
import { getRelationId } from '@/lib/payload-relations'

export const dynamic = 'force-dynamic'

async function getRequest(request: Request, requestId: string) {
  const session = await getUserSession(request)
  if (!session) return null
  const { payload, user } = session

  const id = Number(requestId)
  if (!Number.isSafeInteger(id) || id <= 0) return { payload, user, friendship: null }

  const result = await payload.find({
    collection: 'friendships',
    where: { id: { equals: id } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  return { payload, user, friendship: result.docs[0] ?? null }
}

export async function PATCH(request: Request, context: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await context.params
    const session = await getRequest(request, requestId)
    if (!session) {
      return NextResponse.json({ error: 'Log in to manage friend requests.' }, { status: 401 })
    }
    if (!session.friendship) {
      return NextResponse.json({ error: 'Friend request not found.' }, { status: 404 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }
    if (
      !body ||
      typeof body !== 'object' ||
      !('status' in body) ||
      (body.status !== 'accepted' && body.status !== 'declined')
    ) {
      return NextResponse.json({ error: 'Choose accept or decline.' }, { status: 400 })
    }

    if (
      getRelationId(session.friendship.recipient) !== String(session.user.id) ||
      session.friendship.status !== 'pending'
    ) {
      return NextResponse.json({ error: 'This request can no longer be changed.' }, { status: 403 })
    }

    const updated = await session.payload.update({
      collection: 'friendships',
      id: session.friendship.id,
      data: { status: body.status },
      overrideAccess: true,
    })

    return NextResponse.json({ status: updated.status })
  } catch (error) {
    console.error('PATCH /api/friends/requests:', error)
    return NextResponse.json({ error: 'Unable to update friend request.' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ requestId: string }> },
) {
  try {
    const { requestId } = await context.params
    const session = await getRequest(request, requestId)
    if (!session) {
      return NextResponse.json({ error: 'Log in to manage friends.' }, { status: 401 })
    }
    if (!session.friendship) {
      return NextResponse.json({ error: 'Friend request not found.' }, { status: 404 })
    }

    const userId = String(session.user.id)
    const requesterId = getRelationId(session.friendship.requester)
    const recipientId = getRelationId(session.friendship.recipient)
    const isFriend = session.friendship.status === 'accepted'
    const canCancelPending = session.friendship.status === 'pending' && requesterId === userId
    const canRemoveFriend = isFriend && (requesterId === userId || recipientId === userId)

    if (!canCancelPending && !canRemoveFriend) {
      return NextResponse.json({ error: 'You cannot remove this request.' }, { status: 403 })
    }

    await session.payload.delete({
      collection: 'friendships',
      id: session.friendship.id,
      overrideAccess: true,
    })

    return NextResponse.json({ removed: true })
  } catch (error) {
    console.error('DELETE /api/friends/requests:', error)
    return NextResponse.json({ error: 'Unable to remove friend.' }, { status: 500 })
  }
}
