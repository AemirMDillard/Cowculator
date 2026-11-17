import { NextResponse } from 'next/server'
import { sql } from '@payloadcms/db-postgres'
import { isRecord } from '@/lib/guards'
import {
  COMMUNITY_REACTIONS,
  communityRateLimitResponse,
  consumeCommunityRateLimit,
  getCommunitySession,
  getPublishedCommunityPost,
  isCommunityBlocked,
  makeCommunityReactionKey,
  parsePositiveId,
  parseReaction,
  readCommunityJson,
} from '@/lib/community'

export const dynamic = 'force-dynamic'

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
    if (
      !isRecord(parsed.body) ||
      (parsed.body.reaction !== null && !parseReaction(parsed.body.reaction))
    ) {
      return NextResponse.json(
        { error: `Choose one of these reactions: ${COMMUNITY_REACTIONS.join(', ')}.` },
        { status: 400 },
      )
    }
    const requestedReaction = parseReaction(parsed.body.reaction)
    const rate = await consumeCommunityRateLimit(session.payload, userId, 'reaction')
    if (!rate.allowed) return communityRateLimitResponse(rate.retryAfter)

    const reactionKey = makeCommunityReactionKey(postId, userId)
    const existing = await session.payload.db.drizzle.execute(sql`
      SELECT "reaction"
      FROM "community_reactions"
      WHERE "reaction_key" = ${reactionKey}
      LIMIT 1
    `)
    const currentReaction = existing.rows[0]?.reaction

    if (requestedReaction === null || currentReaction === requestedReaction) {
      await session.payload.db.drizzle.execute(sql`
        DELETE FROM "community_reactions"
        WHERE "reaction_key" = ${reactionKey}
      `)
    } else {
      await session.payload.db.drizzle.execute(sql`
        INSERT INTO "community_reactions"
          ("post_id", "author_id", "reaction", "reaction_key")
        VALUES (${postId}, ${userId}, ${requestedReaction}, ${reactionKey})
        ON CONFLICT ("reaction_key") DO UPDATE
        SET "reaction" = EXCLUDED."reaction", "updated_at" = now()
      `)
    }

    const counts = await session.payload.db.drizzle.execute(sql`
      SELECT r."reaction", COUNT(*)::int AS "count",
        BOOL_OR(r."author_id" = ${userId}) AS "reactedByMe"
      FROM "community_reactions" r
      WHERE r."post_id" = ${postId}
        AND NOT EXISTS (
          SELECT 1 FROM "community_blocks" b
          WHERE (b."blocker_id" = ${userId} AND b."blocked_id" = r."author_id")
             OR (b."blocker_id" = r."author_id" AND b."blocked_id" = ${userId})
        )
      GROUP BY r."reaction"
    `)
    const reactionCounts: Record<string, number> = { support: 0, heart: 0, leaf: 0 }
    let activeReaction: string | null = null
    for (const row of counts.rows) {
      reactionCounts[String(row.reaction)] = Number(row.count)
      if (row.reactedByMe) activeReaction = String(row.reaction)
    }

    return NextResponse.json(
      { reaction: activeReaction, counts: reactionCounts },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('POST /api/community/posts/[postId]/reactions:', error)
    return NextResponse.json({ error: 'Unable to save your reaction.' }, { status: 500 })
  }
}
