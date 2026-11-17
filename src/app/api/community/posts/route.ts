import { NextResponse } from 'next/server'
import { sql } from '@payloadcms/db-postgres'
import { isRecord } from '@/lib/guards'
import {
  COMMUNITY_PAGE_SIZE,
  COMMUNITY_POST_MAX_LENGTH,
  communityRateLimitResponse,
  consumeCommunityRateLimit,
  getCommunitySession,
  normalizeCommunityText,
  parseCommunityCursor,
  readCommunityJson,
} from '@/lib/community'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { session, response } = await getCommunitySession(request)
    if (!session) return response

    const userId = Number(session.user.id)
    const rate = await consumeCommunityRateLimit(session.payload, userId, 'feedRead')
    if (!rate.allowed) return communityRateLimitResponse(rate.retryAfter)

    const params = new URL(request.url).searchParams
    const parsedCursor = parseCommunityCursor(params.get('before'), params.get('beforeId'))
    if (!parsedCursor.valid) {
      return NextResponse.json(
        { error: 'That feed position is invalid.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const before = parsedCursor.cursor
      ? sql`AND (p."created_at", p."id") < (${parsedCursor.cursor.createdAt}, ${parsedCursor.cursor.id})`
      : sql``
    const result = await session.payload.db.drizzle.execute(sql`
      SELECT
        p."id",
        p."content",
        p."created_at" AS "createdAt",
        u."id" AS "authorId",
        u."name" AS "authorName"
      FROM "community_posts" p
      INNER JOIN "users" u ON u."id" = p."author_id"
      WHERE p."status" = 'published'
        AND NOT EXISTS (
          SELECT 1
          FROM "community_blocks" b
          WHERE (b."blocker_id" = ${userId} AND b."blocked_id" = p."author_id")
             OR (b."blocker_id" = p."author_id" AND b."blocked_id" = ${userId})
        )
        ${before}
      ORDER BY p."created_at" DESC, p."id" DESC
      LIMIT ${COMMUNITY_PAGE_SIZE + 1}
    `)

    const hasMore = result.rows.length > COMMUNITY_PAGE_SIZE
    const pageRows = result.rows.slice(0, COMMUNITY_PAGE_SIZE)
    const ids = pageRows.map((post) => Number(post.id))
    const reactions = new Map<number, Record<string, number>>()
    const currentReactions = new Map<number, string>()
    const commentCounts = new Map<number, number>()

    if (ids.length > 0) {
      const idList = sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `,
      )
      const reactionRows = await session.payload.db.drizzle.execute(sql`
        SELECT r."post_id" AS "postId", r."reaction", COUNT(*)::int AS "count",
          BOOL_OR(r."author_id" = ${userId}) AS "reactedByMe"
        FROM "community_reactions" r
        WHERE r."post_id" IN (${idList})
          AND NOT EXISTS (
            SELECT 1 FROM "community_blocks" b
            WHERE (b."blocker_id" = ${userId} AND b."blocked_id" = r."author_id")
               OR (b."blocker_id" = r."author_id" AND b."blocked_id" = ${userId})
          )
        GROUP BY r."post_id", r."reaction"
      `)
      for (const row of reactionRows.rows) {
        const postId = Number(row.postId)
        const counts = reactions.get(postId) ?? { support: 0, heart: 0, leaf: 0 }
        counts[String(row.reaction)] = Number(row.count)
        reactions.set(postId, counts)
        if (row.reactedByMe) currentReactions.set(postId, String(row.reaction))
      }

      const commentRows = await session.payload.db.drizzle.execute(sql`
        SELECT c."post_id" AS "postId", COUNT(*)::int AS "count"
        FROM "community_comments" c
        WHERE c."post_id" IN (${idList})
          AND c."status" = 'published'
          AND NOT EXISTS (
            SELECT 1 FROM "community_blocks" b
            WHERE (b."blocker_id" = ${userId} AND b."blocked_id" = c."author_id")
               OR (b."blocker_id" = c."author_id" AND b."blocked_id" = ${userId})
          )
        GROUP BY c."post_id"
      `)
      for (const row of commentRows.rows) {
        commentCounts.set(Number(row.postId), Number(row.count))
      }
    }

    const posts = pageRows.map((post) => {
      const id = Number(post.id)
      return {
        id: String(id),
        content: String(post.content),
        createdAt: new Date(String(post.createdAt)).toISOString(),
        author: {
          id: String(post.authorId),
          displayName: String(post.authorName),
        },
        isOwn: Number(post.authorId) === userId,
        reactions: reactions.get(id) ?? { support: 0, heart: 0, leaf: 0 },
        currentReaction: currentReactions.get(id) ?? null,
        commentsCount: commentCounts.get(id) ?? 0,
      }
    })
    const lastPost = pageRows.at(-1)

    return NextResponse.json(
      {
        posts,
        nextCursor:
          hasMore && lastPost
            ? {
                before: new Date(String(lastPost.createdAt)).toISOString(),
                beforeId: String(lastPost.id),
              }
            : null,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/community/posts:', error)
    return NextResponse.json({ error: 'Unable to load the community feed.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Write a post before sharing it.' }, { status: 400 })
    }
    const content = normalizeCommunityText(parsed.body.content, COMMUNITY_POST_MAX_LENGTH)
    if (!content) {
      return NextResponse.json(
        { error: `Posts must be 1–${COMMUNITY_POST_MAX_LENGTH} characters.` },
        { status: 400 },
      )
    }

    const userId = Number(session.user.id)
    const rate = await consumeCommunityRateLimit(session.payload, userId, 'post')
    if (!rate.allowed) return communityRateLimitResponse(rate.retryAfter)

    const post = await session.payload.create({
      collection: 'community-posts',
      data: { author: userId, content, status: 'published' },
      overrideAccess: true,
    })

    return NextResponse.json(
      {
        post: {
          id: String(post.id),
          content: String(post.content),
          createdAt: post.createdAt,
          author: { id: String(userId), displayName: session.user.name },
          isOwn: true,
          reactions: { support: 0, heart: 0, leaf: 0 },
          currentReaction: null,
          commentsCount: 0,
        },
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('POST /api/community/posts:', error)
    return NextResponse.json({ error: 'Unable to publish your post.' }, { status: 500 })
  }
}
