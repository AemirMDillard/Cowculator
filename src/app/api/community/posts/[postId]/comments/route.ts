import { NextResponse } from 'next/server'
import { sql } from '@payloadcms/db-postgres'
import { isRecord } from '@/lib/guards'
import {
  COMMUNITY_COMMENT_MAX_LENGTH,
  COMMUNITY_PAGE_SIZE,
  communityRateLimitResponse,
  consumeCommunityRateLimit,
  getCommunitySession,
  getPublishedCommunityPost,
  isCommunityBlocked,
  normalizeCommunityText,
  parseCommunityCursor,
  parsePositiveId,
  readCommunityJson,
} from '@/lib/community'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const { session, response } = await getCommunitySession(request)
    if (!session) return response

    const { postId: rawPostId } = await context.params
    const postId = parsePositiveId(rawPostId)
    if (!postId) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })

    const post = await getPublishedCommunityPost(session.payload, postId)
    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    const userId = Number(session.user.id)
    if (await isCommunityBlocked(session.payload, userId, post.authorId)) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    }
    const rate = await consumeCommunityRateLimit(session.payload, userId, 'commentsRead')
    if (!rate.allowed) return communityRateLimitResponse(rate.retryAfter)

    const params = new URL(request.url).searchParams
    const parsedCursor = parseCommunityCursor(params.get('before'), params.get('beforeId'))
    if (!parsedCursor.valid) {
      return NextResponse.json(
        { error: 'That comment position is invalid.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    const before = parsedCursor.cursor
      ? sql`AND (c."created_at", c."id") < (${parsedCursor.cursor.createdAt}, ${parsedCursor.cursor.id})`
      : sql``

    const result = await session.payload.db.drizzle.execute(sql`
      SELECT c."id", c."content", c."created_at" AS "createdAt",
        c."author_id" AS "authorId", u."name" AS "authorName"
      FROM "community_comments" c
      INNER JOIN "users" u ON u."id" = c."author_id"
      WHERE c."post_id" = ${postId}
        AND c."status" = 'published'
        AND NOT EXISTS (
          SELECT 1 FROM "community_blocks" b
          WHERE (b."blocker_id" = ${userId} AND b."blocked_id" = c."author_id")
             OR (b."blocker_id" = c."author_id" AND b."blocked_id" = ${userId})
        )
        ${before}
      ORDER BY c."created_at" DESC, c."id" DESC
      LIMIT ${COMMUNITY_PAGE_SIZE + 1}
    `)

    const hasMore = result.rows.length > COMMUNITY_PAGE_SIZE
    const pageRows = result.rows.slice(0, COMMUNITY_PAGE_SIZE)
    const comments = pageRows.map((comment) => ({
      id: String(comment.id),
      content: String(comment.content),
      createdAt: new Date(String(comment.createdAt)).toISOString(),
      author: {
        id: String(comment.authorId),
        displayName: String(comment.authorName),
      },
      isOwn: Number(comment.authorId) === userId,
    }))
    const lastComment = pageRows.at(-1)

    return NextResponse.json(
      {
        comments,
        nextCursor:
          hasMore && lastComment
            ? {
                before: new Date(String(lastComment.createdAt)).toISOString(),
                beforeId: String(lastComment.id),
              }
            : null,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/community/posts/[postId]/comments:', error)
    return NextResponse.json({ error: 'Unable to load comments.' }, { status: 500 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const { session, response } = await getCommunitySession(request)
    if (!session) return response

    const { postId: rawPostId } = await context.params
    const postId = parsePositiveId(rawPostId)
    if (!postId) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })

    const post = await getPublishedCommunityPost(session.payload, postId)
    if (!post) return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    const userId = Number(session.user.id)
    if (await isCommunityBlocked(session.payload, userId, post.authorId)) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    }

    const parsed = await readCommunityJson(request)
    if ('error' in parsed) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    if (!isRecord(parsed.body)) {
      return NextResponse.json({ error: 'Write a comment before posting it.' }, { status: 400 })
    }
    const content = normalizeCommunityText(parsed.body.content, COMMUNITY_COMMENT_MAX_LENGTH)
    if (!content) {
      return NextResponse.json(
        { error: `Comments must be 1–${COMMUNITY_COMMENT_MAX_LENGTH} characters.` },
        { status: 400 },
      )
    }
    const rate = await consumeCommunityRateLimit(session.payload, userId, 'comment')
    if (!rate.allowed) return communityRateLimitResponse(rate.retryAfter)

    const comment = await session.payload.create({
      collection: 'community-comments',
      data: { post: postId, author: userId, content, status: 'published' },
      overrideAccess: true,
    })

    return NextResponse.json(
      {
        comment: {
          id: String(comment.id),
          content: String(comment.content),
          createdAt: comment.createdAt,
          author: { id: String(userId), displayName: session.user.name },
          isOwn: true,
        },
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('POST /api/community/posts/[postId]/comments:', error)
    return NextResponse.json({ error: 'Unable to post your comment.' }, { status: 500 })
  }
}
