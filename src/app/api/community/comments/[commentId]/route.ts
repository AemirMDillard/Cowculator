import { NextResponse } from 'next/server'
import {
  getCommunityCommentForDeletion,
  getCommunitySession,
  parsePositiveId,
} from '@/lib/community'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ commentId: string }> },
) {
  try {
    const { session, response } = await getCommunitySession(request)
    if (!session) return response

    const { commentId: rawCommentId } = await context.params
    const commentId = parsePositiveId(rawCommentId)
    if (!commentId) return NextResponse.json({ error: 'Comment not found.' }, { status: 404 })

    const comment = await getCommunityCommentForDeletion(session.payload, commentId)
    if (!comment || comment.status === 'deleted') {
      return NextResponse.json({ error: 'Comment not found.' }, { status: 404 })
    }
    if (comment.authorId !== Number(session.user.id)) {
      return NextResponse.json({ error: 'You can only remove your own comments.' }, { status: 403 })
    }

    await session.payload.update({
      collection: 'community-comments',
      id: commentId,
      data: { content: '', status: 'deleted' },
      overrideAccess: true,
    })
    return NextResponse.json({ deleted: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('DELETE /api/community/comments/[commentId]:', error)
    return NextResponse.json({ error: 'Unable to remove the comment.' }, { status: 500 })
  }
}
