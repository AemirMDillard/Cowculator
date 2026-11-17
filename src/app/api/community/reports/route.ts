import { NextResponse } from 'next/server'
import { isRecord } from '@/lib/guards'
import {
  COMMUNITY_REPORT_MAX_LENGTH,
  communityRateLimitResponse,
  consumeCommunityRateLimit,
  getCommunitySession,
  getPublishedCommunityComment,
  getPublishedCommunityPost,
  isCommunityReportReason,
  isCommunityBlocked,
  makeCommunityReportKey,
  normalizeCommunityText,
  parsePositiveId,
  readCommunityJson,
} from '@/lib/community'

export const dynamic = 'force-dynamic'

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
    const body = parsed.body
    if (
      !isRecord(body) ||
      (body.targetType !== 'post' && body.targetType !== 'comment') ||
      !isCommunityReportReason(body.reason)
    ) {
      return NextResponse.json({ error: 'Choose a reason for your report.' }, { status: 400 })
    }
    const targetId = parsePositiveId(body.targetId)
    if (!targetId) return NextResponse.json({ error: 'Content not found.' }, { status: 404 })

    let target: { authorId: number; postAuthorId?: number } | null
    if (body.targetType === 'post') {
      target = await getPublishedCommunityPost(session.payload, targetId)
    } else {
      const comment = await getPublishedCommunityComment(session.payload, targetId)
      target = comment ? { authorId: comment.authorId, postAuthorId: comment.postAuthorId } : null
    }
    if (!target) return NextResponse.json({ error: 'Content not found.' }, { status: 404 })

    const reporterId = Number(session.user.id)
    if (target.authorId === reporterId) {
      return NextResponse.json({ error: 'You cannot report your own content.' }, { status: 400 })
    }
    if (
      (await isCommunityBlocked(session.payload, reporterId, target.authorId)) ||
      (target.postAuthorId !== undefined &&
        (await isCommunityBlocked(session.payload, reporterId, target.postAuthorId)))
    ) {
      return NextResponse.json({ error: 'Content not found.' }, { status: 404 })
    }

    let details: string | undefined
    if (body.details !== undefined && body.details !== '') {
      details = normalizeCommunityText(body.details, COMMUNITY_REPORT_MAX_LENGTH) ?? undefined
      if (!details) {
        return NextResponse.json(
          { error: `Report details must be 1–${COMMUNITY_REPORT_MAX_LENGTH} characters.` },
          { status: 400 },
        )
      }
    }

    const rate = await consumeCommunityRateLimit(session.payload, reporterId, 'report')
    if (!rate.allowed) return communityRateLimitResponse(rate.retryAfter)

    const reportKey = makeCommunityReportKey(reporterId, body.targetType, targetId)
    const previous = await session.payload.find({
      collection: 'community-reports',
      where: { reportKey: { equals: reportKey } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (previous.docs[0]) {
      return NextResponse.json(
        { reported: true, alreadyReported: true },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }

    await session.payload.create({
      collection: 'community-reports',
      data: {
        reporter: reporterId,
        ...(body.targetType === 'post' ? { post: targetId } : { comment: targetId }),
        reason: body.reason,
        ...(details ? { details } : {}),
        reportKey,
        status: 'open',
      },
      overrideAccess: true,
    })

    return NextResponse.json(
      { reported: true },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('POST /api/community/reports:', error)
    return NextResponse.json({ error: 'Unable to submit your report.' }, { status: 500 })
  }
}
