import { NextResponse } from 'next/server'
import { getCommunitySession, makeCommunityBlockKey, parsePositiveId } from '@/lib/community'

export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { session, response } = await getCommunitySession(request)
    if (!session) return response

    const { userId: rawBlockedId } = await context.params
    const blockedId = parsePositiveId(rawBlockedId)
    if (!blockedId)
      return NextResponse.json({ error: 'Blocked member not found.' }, { status: 404 })

    const key = makeCommunityBlockKey(Number(session.user.id), blockedId)
    const result = await session.payload.find({
      collection: 'community-blocks',
      where: { blockKey: { equals: key } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const entry = result.docs[0]
    if (!entry) {
      return NextResponse.json({ error: 'Blocked member not found.' }, { status: 404 })
    }

    await session.payload.delete({
      collection: 'community-blocks',
      id: entry.id,
      overrideAccess: true,
    })
    return NextResponse.json({ unblocked: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('DELETE /api/community/blocks/[userId]:', error)
    return NextResponse.json({ error: 'Unable to unblock that member.' }, { status: 500 })
  }
}
