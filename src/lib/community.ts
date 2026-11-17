import { NextResponse } from 'next/server'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { getUserSession } from '@/lib/api-session'
import { communityRatePolicies } from '@/lib/community-shared'

export * from '@/lib/community-shared'

export type CommunitySession = NonNullable<Awaited<ReturnType<typeof getUserSession>>>

export async function getCommunitySession(
  request: Request,
): Promise<
  { session: CommunitySession; response: null } | { session: null; response: NextResponse }
> {
  const session = await getUserSession(request)
  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: 'Log in to join the Cowculator community.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      ),
    }
  }
  if (!(await isCommunityAgeConfirmed(session.payload, Number(session.user.id)))) {
    return {
      session: null,
      response: NextResponse.json(
        {
          error: 'Confirm that you are at least 13 to use the community.',
          code: 'AGE_CONFIRMATION_REQUIRED',
        },
        { status: 403, headers: { 'Cache-Control': 'no-store' } },
      ),
    }
  }
  return { session, response: null }
}

export async function consumeCommunityRateLimit(
  payload: Payload,
  userId: number,
  action: keyof typeof communityRatePolicies,
) {
  const policy = communityRatePolicies[action]
  const now = Date.now()
  const windowStart = new Date(Math.floor(now / policy.windowMs) * policy.windowMs)
  const result = await payload.db.drizzle.execute(sql`
    INSERT INTO "community_rate_limits" ("user_id", "action", "window_start", "request_count")
    VALUES (${userId}, ${action}, ${windowStart}, 1)
    ON CONFLICT ("user_id", "action") DO UPDATE
    SET
      "window_start" = EXCLUDED."window_start",
      "request_count" = CASE
        WHEN "community_rate_limits"."window_start" = EXCLUDED."window_start"
          THEN LEAST("community_rate_limits"."request_count" + 1, ${policy.limit + 1})
        ELSE 1
      END
    RETURNING "request_count"
  `)
  const count = Number(result.rows[0]?.request_count ?? 0)
  const retryAfter = Math.max(1, Math.ceil((windowStart.getTime() + policy.windowMs - now) / 1000))
  return { allowed: count <= policy.limit, retryAfter }
}

export function communityRateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: 'You are doing that a little too quickly. Please try again soon.' },
    {
      status: 429,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': String(retryAfter) },
    },
  )
}

export async function isCommunityAgeConfirmed(
  payload: Payload,
  userId: number,
): Promise<boolean> {
  const result = await payload.db.drizzle.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM "users"
      WHERE "id" = ${userId} AND "community_age_confirmed_at" IS NOT NULL
    ) AS "confirmed"
  `)
  return Boolean(result.rows[0]?.confirmed)
}

export async function isCommunityBlocked(
  payload: Payload,
  firstId: number,
  secondId: number,
): Promise<boolean> {
  const result = await payload.db.drizzle.execute(sql`
    SELECT EXISTS (
      SELECT 1
      FROM "community_blocks"
      WHERE ("blocker_id" = ${firstId} AND "blocked_id" = ${secondId})
         OR ("blocker_id" = ${secondId} AND "blocked_id" = ${firstId})
    ) AS "blocked"
  `)
  return Boolean(result.rows[0]?.blocked)
}

export async function getPublishedCommunityPost(
  payload: Payload,
  postId: number,
): Promise<{ authorId: number } | null> {
  const result = await payload.db.drizzle.execute(sql`
    SELECT "author_id" AS "authorId"
    FROM "community_posts"
    WHERE "id" = ${postId} AND "status" = 'published'
    LIMIT 1
  `)
  const post = result.rows[0]
  return post ? { authorId: Number(post.authorId) } : null
}

export async function getCommunityPostForDeletion(
  payload: Payload,
  postId: number,
): Promise<{ authorId: number; status: string } | null> {
  const result = await payload.db.drizzle.execute(sql`
    SELECT "author_id" AS "authorId", "status"
    FROM "community_posts"
    WHERE "id" = ${postId}
    LIMIT 1
  `)
  const post = result.rows[0]
  return post
    ? { authorId: Number(post.authorId), status: String(post.status) }
    : null
}

export async function getPublishedCommunityComment(
  payload: Payload,
  commentId: number,
): Promise<{ authorId: number; postId: number; postAuthorId: number } | null> {
  const result = await payload.db.drizzle.execute(sql`
    SELECT c."author_id" AS "authorId", c."post_id" AS "postId",
      p."author_id" AS "postAuthorId"
    FROM "community_comments" c
    INNER JOIN "community_posts" p ON p."id" = c."post_id"
    WHERE c."id" = ${commentId}
      AND c."status" = 'published'
      AND p."status" = 'published'
    LIMIT 1
  `)
  const comment = result.rows[0]
  return comment
    ? {
        authorId: Number(comment.authorId),
        postId: Number(comment.postId),
        postAuthorId: Number(comment.postAuthorId),
      }
    : null
}

export async function getCommunityCommentForDeletion(
  payload: Payload,
  commentId: number,
): Promise<{ authorId: number; status: string } | null> {
  const result = await payload.db.drizzle.execute(sql`
    SELECT "author_id" AS "authorId", "status"
    FROM "community_comments"
    WHERE "id" = ${commentId}
    LIMIT 1
  `)
  const comment = result.rows[0]
  return comment
    ? { authorId: Number(comment.authorId), status: String(comment.status) }
    : null
}
