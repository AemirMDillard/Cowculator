import { NextResponse } from 'next/server'
import {
  getCommunityPostForDeletion,
  getCommunitySession,
  parsePositiveId,
} from '@/lib/community'

export const dynamic = 'force-dynamic'

export async function DELETE(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const { session, response } = await getCommunitySession(request)
    if (!session) return response

    const { postId: rawPostId } = await context.params
    const postId = parsePositiveId(rawPostId)
    if (!postId) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    }

    const post = await getCommunityPostForDeletion(session.payload, postId)
    if (!post || post.status === 'deleted') {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    }
    if (post.authorId !== Number(session.user.id)) {
      return NextResponse.json({ error: 'You can only remove your own posts.' }, { status: 403 })
    }

    await session.payload.update({
      collection: 'community-posts',
      id: postId,
      data: { content: '', status: 'deleted' },
      overrideAccess: true,
    })

    return NextResponse.json({ deleted: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('DELETE /api/community/posts/[postId]:', error)
    return NextResponse.json({ error: 'Unable to remove the post.' }, { status: 500 })
  }
}
