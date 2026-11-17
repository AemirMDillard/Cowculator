import assert from 'node:assert/strict'
import test from 'node:test'
import {
  COMMUNITY_COMMENT_MAX_LENGTH,
  COMMUNITY_POST_MAX_LENGTH,
  isCommunityReportReason,
  makeCommunityBlockKey,
  makeCommunityReactionKey,
  makeCommunityReportKey,
  normalizeCommunityText,
  parseCommunityCursor,
  parsePositiveId,
  parseReaction,
  readCommunityJson,
} from './community-shared'

test('normalizes plain text and enforces post and comment boundaries', () => {
  assert.equal(
    normalizeCommunityText('  hello\u0000\nmeadow  ', COMMUNITY_POST_MAX_LENGTH),
    'hello\nmeadow',
  )
  assert.equal(normalizeCommunityText(' \t ', COMMUNITY_POST_MAX_LENGTH), null)
  assert.equal(
    normalizeCommunityText('x'.repeat(COMMUNITY_POST_MAX_LENGTH), COMMUNITY_POST_MAX_LENGTH)
      ?.length,
    COMMUNITY_POST_MAX_LENGTH,
  )
  assert.equal(
    normalizeCommunityText('x'.repeat(COMMUNITY_POST_MAX_LENGTH + 1), COMMUNITY_POST_MAX_LENGTH),
    null,
  )
  assert.equal(
    normalizeCommunityText(
      'x'.repeat(COMMUNITY_COMMENT_MAX_LENGTH + 1),
      COMMUNITY_COMMENT_MAX_LENGTH,
    ),
    null,
  )
  assert.equal(normalizeCommunityText(null, COMMUNITY_POST_MAX_LENGTH), null)
})

test('validates pagination cursors as stable timestamp and positive-id pairs', () => {
  const parsed = parseCommunityCursor('2026-11-17T07:20:00.000Z', '42')
  assert.equal(parsed.valid, true)
  assert.equal(parsed.cursor?.id, 42)
  assert.equal(parsed.cursor?.createdAt.toISOString(), '2026-11-17T07:20:00.000Z')

  assert.deepEqual(parseCommunityCursor(null, null), { valid: true, cursor: null })
  assert.equal(parseCommunityCursor('2026-11-17T07:20:00.000Z', null).valid, false)
  assert.equal(parseCommunityCursor('not-a-date', '42').valid, false)
  assert.equal(parseCommunityCursor('2026-11-17T07:20:00.000Z', '1e2').valid, false)
})

test('accepts only positive decimal ids and supported community reactions', () => {
  assert.equal(parsePositiveId('17'), 17)
  assert.equal(parsePositiveId(17), 17)
  assert.equal(parsePositiveId('0'), null)
  assert.equal(parsePositiveId('-2'), null)
  assert.equal(parsePositiveId('1.5'), null)
  assert.equal(parsePositiveId('1e2'), null)
  assert.equal(parseReaction('leaf'), 'leaf')
  assert.equal(parseReaction('laugh'), null)
  assert.equal(isCommunityReportReason('harassment'), true)
  assert.equal(isCommunityReportReason('other'), true)
  assert.equal(isCommunityReportReason('not-a-reason'), false)
})

test('creates distinct keys for block directions, reactions, and report targets', () => {
  assert.notEqual(makeCommunityBlockKey(1, 2), makeCommunityBlockKey(2, 1))
  assert.notEqual(makeCommunityReactionKey(1, 2), makeCommunityReactionKey(2, 1))
  assert.notEqual(makeCommunityReportKey(1, 'post', 2), makeCommunityReportKey(1, 'comment', 2))
})

test('reads bounded JSON request bodies and rejects malformed or oversized bodies', async () => {
  const valid = await readCommunityJson(
    new Request('http://localhost', { method: 'POST', body: '{"content":"hello"}' }),
  )
  assert.deepEqual(valid, { body: { content: 'hello' } })

  const malformed = await readCommunityJson(
    new Request('http://localhost', { method: 'POST', body: '{invalid' }),
  )
  assert.deepEqual(malformed, { error: 'Invalid request body.', status: 400 })

  const oversized = await readCommunityJson(
    new Request('http://localhost', { method: 'POST', body: 'x'.repeat(32) }),
    16,
  )
  assert.deepEqual(oversized, { error: 'Request body is too large.', status: 413 })
})
