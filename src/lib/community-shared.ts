export const COMMUNITY_POST_MAX_LENGTH = 1000
export const COMMUNITY_COMMENT_MAX_LENGTH = 500
export const COMMUNITY_REPORT_MAX_LENGTH = 500
export const COMMUNITY_PAGE_SIZE = 20
export const COMMUNITY_REACTIONS = ['support', 'heart', 'leaf'] as const
export const COMMUNITY_REPORT_REASONS = [
  'harassment',
  'hate',
  'personal-information',
  'spam',
  'other',
] as const

export type CommunityReaction = (typeof COMMUNITY_REACTIONS)[number]
export type CommunityCursor = { createdAt: Date; id: number }

export const communityRatePolicies = {
  feedRead: { limit: 60, windowMs: 60 * 1000 },
  commentsRead: { limit: 120, windowMs: 60 * 1000 },
  post: { limit: 5, windowMs: 10 * 60 * 1000 },
  comment: { limit: 20, windowMs: 10 * 60 * 1000 },
  reaction: { limit: 60, windowMs: 10 * 60 * 1000 },
  report: { limit: 5, windowMs: 60 * 60 * 1000 },
  block: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const

export function normalizeCommunityText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
  if (!normalized || normalized.length > maxLength) return null
  return normalized
}

export function makeCommunityBlockKey(blockerId: number, blockedId: number): string {
  return `${blockerId}:${blockedId}`
}

export function makeCommunityReactionKey(postId: number, userId: number): string {
  return `${postId}:${userId}`
}

export function makeCommunityReportKey(
  reporterId: number,
  targetType: 'post' | 'comment',
  targetId: number,
): string {
  return `${reporterId}:${targetType}:${targetId}`
}

export function parseCommunityCursor(
  createdAtValue: string | null,
  idValue: string | null,
): { valid: boolean; cursor: CommunityCursor | null } {
  if (createdAtValue === null && idValue === null) return { valid: true, cursor: null }
  if (
    !createdAtValue ||
    !idValue ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(createdAtValue)
  ) {
    return { valid: false, cursor: null }
  }
  const createdAt = new Date(createdAtValue)
  const id = parsePositiveId(idValue)
  if (!Number.isFinite(createdAt.getTime()) || !id) return { valid: false, cursor: null }
  return { valid: true, cursor: { createdAt, id } }
}

export function parsePositiveId(value: unknown): number | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (typeof value === 'string' && !/^[1-9]\d*$/.test(value)) return null
  const id = typeof value === 'number' ? value : Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export function parseReaction(value: unknown): CommunityReaction | null {
  if (typeof value !== 'string') return null
  return COMMUNITY_REACTIONS.find((reaction) => reaction === value) ?? null
}

export function isCommunityReportReason(
  value: unknown,
): value is (typeof COMMUNITY_REPORT_REASONS)[number] {
  return typeof value === 'string' && COMMUNITY_REPORT_REASONS.some((reason) => reason === value)
}

export async function readCommunityJson(
  request: Request,
  maxBytes = 8192,
): Promise<{ body: unknown } | { error: string; status: 400 | 413 }> {
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { error: 'Request body is too large.', status: 413 }
  }

  if (!request.body) return { error: 'Invalid request body.', status: 400 }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel()
        return { error: 'Request body is too large.', status: 413 }
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return { body: JSON.parse(new TextDecoder().decode(bytes)) as unknown }
  } catch {
    return { error: 'Invalid request body.', status: 400 }
  }
}
