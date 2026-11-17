'use client'

import Link from 'next/link'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { isRecord } from '@/lib/guards'
import {
  COMMUNITY_COMMENT_MAX_LENGTH,
  COMMUNITY_PAGE_SIZE,
  COMMUNITY_POST_MAX_LENGTH,
  COMMUNITY_REACTIONS,
  COMMUNITY_REPORT_MAX_LENGTH,
  COMMUNITY_REPORT_REASONS,
  isCommunityReportReason,
  parseReaction,
  type CommunityReaction,
} from '@/lib/community-shared'

type Cursor = { before: string; beforeId: string } | null
type ReactionCounts = Record<CommunityReaction, number>
type CommunityPost = {
  id: string
  content: string
  createdAt: string
  author: { id: string; displayName: string }
  isOwn: boolean
  reactions: ReactionCounts
  currentReaction: CommunityReaction | null
  commentsCount: number
}
type CommunityComment = {
  id: string
  content: string
  createdAt: string
  author: { id: string; displayName: string }
  isOwn: boolean
}
type CommentsState = {
  comments: CommunityComment[]
  nextCursor: Cursor
  loaded: boolean
  loading: boolean
  error: string
}
type ReportTarget = { type: 'post' | 'comment'; id: string }
type BlockedMember = { id: string; displayName: string }

const emptyComments: CommentsState = {
  comments: [],
  nextCursor: null,
  loaded: false,
  loading: false,
  error: '',
}

class CommunityApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

async function requestJson(path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(path, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
  })
  const body: unknown = await response.json().catch(() => null)
  if (!isRecord(body)) throw new Error('The community service returned an invalid response.')
  if (!response.ok) {
    throw new CommunityApiError(
      typeof body.error === 'string' ? body.error : 'The community request could not be completed.',
      response.status,
    )
  }
  return body
}

function parseCounts(value: unknown): ReactionCounts | null {
  if (!isRecord(value)) return null
  const counts = {} as ReactionCounts
  for (const reaction of COMMUNITY_REACTIONS) {
    const count = value[reaction]
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) return null
    counts[reaction] = count
  }
  return counts
}

function parsePost(value: unknown): CommunityPost | null {
  if (!isRecord(value) || !isRecord(value.author)) return null
  const reactions = parseCounts(value.reactions)
  const currentReaction =
    value.currentReaction === null ? null : parseReaction(value.currentReaction)
  if (
    typeof value.id !== 'string' ||
    typeof value.content !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.author.id !== 'string' ||
    typeof value.author.displayName !== 'string' ||
    typeof value.isOwn !== 'boolean' ||
    !reactions ||
    (value.currentReaction !== null && !currentReaction) ||
    typeof value.commentsCount !== 'number' ||
    !Number.isSafeInteger(value.commentsCount) ||
    value.commentsCount < 0
  ) {
    return null
  }
  return {
    id: value.id,
    content: value.content,
    createdAt: value.createdAt,
    author: { id: value.author.id, displayName: value.author.displayName },
    isOwn: value.isOwn,
    reactions,
    currentReaction,
    commentsCount: value.commentsCount,
  }
}

function parseComment(value: unknown): CommunityComment | null {
  if (!isRecord(value) || !isRecord(value.author)) return null
  if (
    typeof value.id !== 'string' ||
    typeof value.content !== 'string' ||
    typeof value.createdAt !== 'string' ||
    typeof value.author.id !== 'string' ||
    typeof value.author.displayName !== 'string' ||
    typeof value.isOwn !== 'boolean'
  ) {
    return null
  }
  return {
    id: value.id,
    content: value.content,
    createdAt: value.createdAt,
    author: { id: value.author.id, displayName: value.author.displayName },
    isOwn: value.isOwn,
  }
}

function parseCursor(value: unknown): Cursor | undefined {
  if (value === null) return null
  if (!isRecord(value) || typeof value.before !== 'string' || typeof value.beforeId !== 'string') {
    return undefined
  }
  return { before: value.before, beforeId: value.beforeId }
}

function timestamp(value: string) {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function postCursorUrl(path: string, cursor: Cursor) {
  if (!cursor) return path
  const params = new URLSearchParams({ before: cursor.before, beforeId: cursor.beforeId })
  return `${path}?${params.toString()}`
}

export function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [nextCursor, setNextCursor] = useState<Cursor>(null)
  const [comments, setComments] = useState<Record<string, CommentsState>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [postDraft, setPostDraft] = useState('')
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const [reportReason, setReportReason] =
    useState<(typeof COMMUNITY_REPORT_REASONS)[number]>('other')
  const [reportDetails, setReportDetails] = useState('')
  const [blockedMembers, setBlockedMembers] = useState<BlockedMember[]>([])
  const [blockedListOpen, setBlockedListOpen] = useState(false)
  const [loadingBlockedMembers, setLoadingBlockedMembers] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [posting, setPosting] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)
  const [ageRequired, setAgeRequired] = useState(false)
  const [ageChecked, setAgeChecked] = useState(false)
  const [confirmingAge, setConfirmingAge] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadFeed(cursor: Cursor = null, append = false) {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError('')
    try {
      const body = await requestJson(postCursorUrl('/api/community/posts', cursor))
      if (!Array.isArray(body.posts)) throw new Error('The community feed returned invalid posts.')
      const loadedPosts = body.posts.map(parsePost)
      const validPosts = loadedPosts.filter((post): post is CommunityPost => post !== null)
      if (validPosts.length !== loadedPosts.length) {
        throw new Error('The community feed returned an invalid post.')
      }
      const next = parseCursor(body.nextCursor)
      if (next === undefined) throw new Error('The community feed returned an invalid page cursor.')
      setPosts((current) => (append ? [...current, ...validPosts] : validPosts))
      setNextCursor(next)
    } catch (loadError) {
      if (loadError instanceof CommunityApiError && loadError.status === 401) {
        setAuthRequired(true)
      } else if (loadError instanceof CommunityApiError && loadError.status === 403) {
        setAgeRequired(true)
      } else {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load the feed.')
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    let active = true
    async function checkAccess() {
      try {
        const body = await requestJson('/api/community/age-confirmation')
        if (!active) return
        setAuthRequired(false)
        if (body.confirmed !== true) {
          setAgeRequired(true)
          setLoading(false)
          return
        }
        await loadFeed()
      } catch (accessError) {
        if (!active) return
        setLoading(false)
        if (accessError instanceof CommunityApiError && accessError.status === 401) {
          setAuthRequired(true)
        } else {
          setError(
            accessError instanceof Error
              ? accessError.message
              : 'Unable to check community access.',
          )
        }
      }
    }
    checkAccess()
    return () => {
      active = false
    }
  }, [])

  async function confirmAge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!ageChecked) {
      setError('Please confirm that you are at least 13 years old.')
      return
    }
    setConfirmingAge(true)
    try {
      await requestJson('/api/community/age-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAtLeast13: true }),
      })
      setAgeRequired(false)
      await loadFeed()
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : 'Unable to confirm access.')
    } finally {
      setConfirmingAge(false)
    }
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setPosting(true)
    try {
      const body = await requestJson('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postDraft }),
      })
      const post = parsePost(body.post)
      if (!post) throw new Error('The community service returned an invalid post.')
      setPosts((current) => [post, ...current])
      setPostDraft('')
      setMessage('Your post is in the meadow.')
    } catch (postError) {
      setError(postError instanceof Error ? postError.message : 'Unable to publish your post.')
    } finally {
      setPosting(false)
    }
  }

  async function deletePost(post: CommunityPost) {
    if (!window.confirm('Remove this post? It will disappear from the community feed.')) return
    setError('')
    try {
      await requestJson(`/api/community/posts/${encodeURIComponent(post.id)}`, { method: 'DELETE' })
      setPosts((current) => current.filter((entry) => entry.id !== post.id))
      setMessage('Your post was removed.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to remove the post.')
    }
  }

  async function toggleReaction(post: CommunityPost, reaction: CommunityReaction) {
    setError('')
    try {
      const body = await requestJson(
        `/api/community/posts/${encodeURIComponent(post.id)}/reactions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reaction: post.currentReaction === reaction ? null : reaction,
          }),
        },
      )
      const counts = parseCounts(body.counts)
      const activeReaction = body.reaction === null ? null : parseReaction(body.reaction)
      if (!counts || (body.reaction !== null && !activeReaction)) {
        throw new Error('The community service returned invalid reaction data.')
      }
      setPosts((current) =>
        current.map((entry) =>
          entry.id === post.id
            ? {
                ...entry,
                reactions: counts,
                currentReaction: activeReaction,
              }
            : entry,
        ),
      )
    } catch (reactionError) {
      setError(reactionError instanceof Error ? reactionError.message : 'Unable to save reaction.')
    }
  }

  async function loadComments(postId: string, cursor: Cursor = null, append = false) {
    setComments((current) => ({
      ...current,
      [postId]: { ...(current[postId] ?? emptyComments), loading: true, error: '' },
    }))
    try {
      const body = await requestJson(
        postCursorUrl(`/api/community/posts/${encodeURIComponent(postId)}/comments`, cursor),
      )
      if (!Array.isArray(body.comments))
        throw new Error('Comments were returned in an invalid format.')
      const loadedComments = body.comments.map(parseComment)
      const validComments = loadedComments.filter(
        (comment): comment is CommunityComment => comment !== null,
      )
      if (validComments.length !== loadedComments.length) {
        throw new Error('A comment was returned in an invalid format.')
      }
      const next = parseCursor(body.nextCursor)
      if (next === undefined) throw new Error('The comments service returned an invalid cursor.')
      setComments((current) => ({
        ...current,
        [postId]: {
          comments: append
            ? [...(current[postId]?.comments ?? []), ...validComments]
            : validComments,
          nextCursor: next,
          loaded: true,
          loading: false,
          error: '',
        },
      }))
    } catch (commentError) {
      setComments((current) => ({
        ...current,
        [postId]: {
          ...(current[postId] ?? emptyComments),
          loading: false,
          error: commentError instanceof Error ? commentError.message : 'Unable to load comments.',
        },
      }))
    }
  }

  function toggleComments(postId: string) {
    const opening = !openComments[postId]
    setOpenComments((current) => ({ ...current, [postId]: opening }))
    if (opening && !comments[postId]?.loaded && !comments[postId]?.loading) {
      void loadComments(postId)
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault()
    const content = commentDrafts[postId] ?? ''
    setError('')
    try {
      const body = await requestJson(
        `/api/community/posts/${encodeURIComponent(postId)}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        },
      )
      const comment = parseComment(body.comment)
      if (!comment) throw new Error('The community service returned an invalid comment.')
      setCommentDrafts((current) => ({ ...current, [postId]: '' }))
      setComments((current) => {
        const previous = current[postId] ?? emptyComments
        return {
          ...current,
          [postId]: {
            ...previous,
            comments: previous.loaded ? [comment, ...previous.comments] : previous.comments,
          },
        }
      })
      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post,
        ),
      )
      setMessage('Your comment was added.')
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : 'Unable to add comment.')
    }
  }

  async function deleteComment(postId: string, comment: CommunityComment) {
    if (!window.confirm('Remove this comment?')) return
    setError('')
    try {
      await requestJson(`/api/community/comments/${encodeURIComponent(comment.id)}`, {
        method: 'DELETE',
      })
      setComments((current) => ({
        ...current,
        [postId]: {
          ...(current[postId] ?? emptyComments),
          comments: (current[postId]?.comments ?? []).filter((entry) => entry.id !== comment.id),
        },
      }))
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) }
            : post,
        ),
      )
      setMessage('Your comment was removed.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to remove comment.')
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reportTarget) return
    setError('')
    try {
      await requestJson('/api/community/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: reportTarget.type,
          targetId: reportTarget.id,
          reason: reportReason,
          details: reportDetails,
        }),
      })
      setReportTarget(null)
      setReportDetails('')
      setMessage('Thank you. Your report was sent for moderator review.')
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : 'Unable to submit your report.')
    }
  }

  async function blockMember(memberId: string, displayName: string) {
    if (
      !window.confirm(
        `Block ${displayName}? Their community posts and interactions will be hidden from you.`,
      )
    ) {
      return
    }
    setError('')
    try {
      await requestJson('/api/community/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: memberId }),
      })
      setComments({})
      setReportTarget(null)
      await loadFeed()
      setMessage(`${displayName} is now blocked in the community.`)
    } catch (blockError) {
      setError(blockError instanceof Error ? blockError.message : 'Unable to block that member.')
    }
  }

  async function toggleBlockedList() {
    const opening = !blockedListOpen
    setBlockedListOpen(opening)
    if (!opening) return
    setError('')
    setLoadingBlockedMembers(true)
    try {
      const body = await requestJson('/api/community/blocks')
      if (!Array.isArray(body.blocks)) throw new Error('Your blocked list is invalid.')
      const list = body.blocks.filter(
        (entry): entry is Record<string, unknown> =>
          isRecord(entry) && typeof entry.id === 'string' && typeof entry.displayName === 'string',
      )
      setBlockedMembers(
        list.map((entry) => ({
          id: String(entry.id),
          displayName: String(entry.displayName),
        })),
      )
    } catch (blockError) {
      setError(blockError instanceof Error ? blockError.message : 'Unable to load blocked members.')
    } finally {
      setLoadingBlockedMembers(false)
    }
  }

  async function unblockMember(member: BlockedMember) {
    setError('')
    try {
      await requestJson(`/api/community/blocks/${encodeURIComponent(member.id)}`, {
        method: 'DELETE',
      })
      setBlockedMembers((current) => current.filter((entry) => entry.id !== member.id))
      setMessage(`${member.displayName} was unblocked.`)
      await loadFeed()
    } catch (unblockError) {
      setError(unblockError instanceof Error ? unblockError.message : 'Unable to unblock member.')
    }
  }

  function reportForm(type: 'post' | 'comment', id: string) {
    if (reportTarget?.type !== type || reportTarget.id !== id) return null
    return (
      <form
        onSubmit={submitReport}
        className="mt-4 rounded-xl border border-[#3F382F]/15 bg-[#F5F1E8] p-4"
      >
        <label className="block text-xs font-bold" htmlFor={`report-reason-${type}-${id}`}>
          WHY ARE YOU REPORTING THIS?
        </label>
        <select
          id={`report-reason-${type}-${id}`}
          value={reportReason}
          onChange={(event) => {
            if (isCommunityReportReason(event.target.value)) setReportReason(event.target.value)
          }}
          className="mt-2 w-full rounded-lg border border-[#3F382F]/20 bg-white px-3 py-2 text-sm"
        >
          <option value="harassment">Harassment or bullying</option>
          <option value="hate">Hate or discrimination</option>
          <option value="personal-information">Personal or unsafe information</option>
          <option value="spam">Spam or advertising</option>
          <option value="other">Other concern</option>
        </select>
        <label className="mt-3 block text-xs font-bold" htmlFor={`report-details-${type}-${id}`}>
          OPTIONAL DETAILS
        </label>
        <textarea
          id={`report-details-${type}-${id}`}
          value={reportDetails}
          onChange={(event) => setReportDetails(event.target.value)}
          maxLength={COMMUNITY_REPORT_MAX_LENGTH}
          rows={3}
          className="mt-2 w-full resize-y rounded-lg border border-[#3F382F]/20 bg-white px-3 py-2 text-sm"
        />
        <div className="mt-3 flex gap-2">
          <button type="submit" className="pixel-button small">
            Send report
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-bold underline"
            onClick={() => setReportTarget(null)}
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-7">
          <span className="eyebrow">THE COWCULATOR MEADOW</span>
          <h1 className="mt-3 text-4xl font-black sm:text-6xl">
            GROW <span className="text-[#A8B99A]">TOGETHER</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#3F382F]/70 sm:text-base">
            Share a meal discovery, ask a question, or celebrate a small plant-based step. This
            space is for curious eaters, new vegans, and seasoned plant-powered folks alike.
          </p>
        </header>

        <aside className="mb-6 rounded-2xl border border-[#3F382F]/15 bg-white/70 p-4 text-sm leading-6 text-[#3F382F]/75 sm:p-5">
          <strong className="text-[#3F382F]">A kind, safer meadow:</strong> posts are visible to
          signed-in members, not just friends. Use a display name, keep personal contact details
          private, and remember that there are no direct messages. You can report content or block a
          member at any time.
        </aside>

        {authRequired ? (
          <section className="dashboard-card">
            <h2 className="text-xl font-black">Join the conversation</h2>
            <p className="mt-2 text-sm text-[#3F382F]/65">
              The community feed is for signed-in members. Your posts are not shown to anonymous
              visitors.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/login" className="pixel-button small">
                Log in
              </Link>
              <Link href="/signup" className="pixel-button small">
                Create an account
              </Link>
            </div>
          </section>
        ) : ageRequired ? (
          <section className="dashboard-card">
            <h2 className="text-xl font-black">A quick age check</h2>
            <p className="mt-2 text-sm leading-6 text-[#3F382F]/70">
              Community posting is for members aged 13 and over. We save only the time you confirm,
              not your birth date. This is a self-confirmation, not an identity or age-verification
              service.
            </p>
            <form onSubmit={confirmAge} className="mt-4">
              <label className="flex items-start gap-3 rounded-xl bg-[#F5F1E8] p-3 text-sm leading-5">
                <input
                  type="checkbox"
                  checked={ageChecked}
                  onChange={(event) => setAgeChecked(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#73866B]"
                />
                <span>I am at least 13 years old.</span>
              </label>
              <button
                type="submit"
                disabled={confirmingAge}
                className="pixel-button small mt-4 disabled:opacity-50"
              >
                {confirmingAge ? 'Checking…' : 'Continue to the meadow'}
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="dashboard-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">Plant a thought</h2>
                  <p className="mt-1 text-xs leading-5 text-[#3F382F]/60">
                    Plain text only · up to {COMMUNITY_POST_MAX_LENGTH} characters · no impact
                    points are awarded for posts or claims.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleBlockedList}
                  className="text-sm font-bold underline underline-offset-2"
                >
                  {blockedListOpen ? 'Hide blocked list' : 'Manage blocked members'}
                </button>
              </div>
              {blockedListOpen && (
                <div className="mt-4 rounded-xl bg-[#F5F1E8] p-4">
                  <h3 className="font-bold">Members you blocked</h3>
                  {loadingBlockedMembers ? (
                    <p role="status" className="mt-2 text-sm text-[#3F382F]/65">
                      Loading your list…
                    </p>
                  ) : blockedMembers.length === 0 ? (
                    <p className="mt-2 text-sm text-[#3F382F]/65">Your blocked list is empty.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-[#3F382F]/10">
                      {blockedMembers.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <span className="text-sm font-bold">{member.displayName}</span>
                          <button
                            type="button"
                            onClick={() => void unblockMember(member)}
                            className="text-xs font-bold underline"
                          >
                            Unblock
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <form onSubmit={submitPost} className="mt-4">
                <label htmlFor="community-post" className="sr-only">
                  Write a post
                </label>
                <textarea
                  id="community-post"
                  value={postDraft}
                  onChange={(event) => setPostDraft(event.target.value)}
                  maxLength={COMMUNITY_POST_MAX_LENGTH}
                  rows={4}
                  placeholder="What kind thing did you discover today?"
                  className="w-full resize-y rounded-xl border border-[#3F382F]/20 bg-white px-4 py-3 text-sm leading-6"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-[#3F382F]/55" aria-live="polite">
                    {postDraft.length}/{COMMUNITY_POST_MAX_LENGTH}
                  </span>
                  <button
                    type="submit"
                    disabled={posting || !postDraft.trim()}
                    className="pixel-button small disabled:opacity-50"
                  >
                    {posting ? 'Sharing…' : 'Share with the meadow'}
                  </button>
                </div>
              </form>
            </section>

            {message && (
              <p role="status" className="mt-4 text-sm font-bold text-[#52634A]">
                {message}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-700">
                {error}
              </p>
            )}

            <section aria-label="Community posts" className="mt-6 space-y-4">
              {loading ? (
                <div className="dashboard-card text-center text-sm text-[#3F382F]/65" role="status">
                  Gathering the meadow…
                </div>
              ) : posts.length === 0 ? (
                <div className="dashboard-card text-center">
                  <h2 className="text-xl font-black">A quiet meadow—for now</h2>
                  <p className="mt-2 text-sm text-[#3F382F]/65">
                    Share a question, a useful food find, or a small win to start the conversation.
                  </p>
                </div>
              ) : (
                posts.map((post) => {
                  const commentState = comments[post.id] ?? emptyComments
                  return (
                    <article key={post.id} className="dashboard-card">
                      <header className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{post.author.displayName}</p>
                          <time
                            dateTime={post.createdAt}
                            className="mt-1 block text-xs text-[#3F382F]/55"
                          >
                            {timestamp(post.createdAt)}
                          </time>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          {post.isOwn ? (
                            <button
                              type="button"
                              onClick={() => void deletePost(post)}
                              className="font-bold underline"
                            >
                              Delete
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setReportTarget({ type: 'post', id: post.id })
                                  setReportDetails('')
                                }}
                                className="font-bold underline"
                              >
                                Report
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void blockMember(post.author.id, post.author.displayName)
                                }
                                className="font-bold underline"
                                aria-label={`Block ${post.author.displayName}`}
                              >
                                Block
                              </button>
                            </>
                          )}
                        </div>
                      </header>
                      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-[#3F382F]/85">
                        {post.content}
                      </p>
                      {reportForm('post', post.id)}
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#3F382F]/10 pt-3">
                        {COMMUNITY_REACTIONS.map((reaction) => (
                          <button
                            key={reaction}
                            type="button"
                            aria-pressed={post.currentReaction === reaction}
                            onClick={() => void toggleReaction(post, reaction)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                              post.currentReaction === reaction
                                ? 'border-[#73866B] bg-[#D8E2CE]'
                                : 'border-[#3F382F]/15 bg-white'
                            }`}
                          >
                            {reaction === 'support'
                              ? 'Support'
                              : reaction === 'heart'
                                ? 'Heart'
                                : 'Leaf'}
                            <span className="ml-1.5 tabular-nums">{post.reactions[reaction]}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          aria-expanded={Boolean(openComments[post.id])}
                          onClick={() => toggleComments(post.id)}
                          className="ml-auto rounded-full px-3 py-1.5 text-xs font-bold underline"
                        >
                          {openComments[post.id] ? 'Hide comments' : 'Comments'}
                          <span className="ml-1.5 tabular-nums">{post.commentsCount}</span>
                        </button>
                      </div>

                      {openComments[post.id] && (
                        <div className="mt-4 border-t border-[#3F382F]/10 pt-4">
                          {commentState.loading && (
                            <p role="status" className="text-sm text-[#3F382F]/60">
                              Gathering comments…
                            </p>
                          )}
                          {commentState.error && (
                            <p role="alert" className="text-sm text-red-700">
                              {commentState.error}
                            </p>
                          )}
                          {commentState.loaded && commentState.comments.length === 0 && (
                            <p className="text-sm text-[#3F382F]/60">
                              No comments yet. Be kind and start the conversation.
                            </p>
                          )}
                          <div className="space-y-3">
                            {commentState.comments.map((comment) => (
                              <div key={comment.id} className="rounded-xl bg-[#F5F1E8] p-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <span className="text-sm font-bold">
                                      {comment.author.displayName}
                                    </span>
                                    <time
                                      dateTime={comment.createdAt}
                                      className="ml-2 text-xs text-[#3F382F]/55"
                                    >
                                      {timestamp(comment.createdAt)}
                                    </time>
                                  </div>
                                  <div className="flex gap-3 text-xs">
                                    {comment.isOwn ? (
                                      <button
                                        type="button"
                                        onClick={() => void deleteComment(post.id, comment)}
                                        className="font-bold underline"
                                      >
                                        Delete
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReportTarget({ type: 'comment', id: comment.id })
                                            setReportDetails('')
                                          }}
                                          className="font-bold underline"
                                        >
                                          Report
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void blockMember(
                                              comment.author.id,
                                              comment.author.displayName,
                                            )
                                          }
                                          className="font-bold underline"
                                          aria-label={`Block ${comment.author.displayName}`}
                                        >
                                          Block
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5">
                                  {comment.content}
                                </p>
                                {reportForm('comment', comment.id)}
                              </div>
                            ))}
                          </div>
                          {commentState.nextCursor && (
                            <button
                              type="button"
                              disabled={commentState.loading}
                              onClick={() =>
                                void loadComments(post.id, commentState.nextCursor, true)
                              }
                              className="mt-3 text-xs font-bold underline disabled:opacity-50"
                            >
                              Load older comments
                            </button>
                          )}
                          <form
                            onSubmit={(event) => void submitComment(event, post.id)}
                            className="mt-4"
                          >
                            <label htmlFor={`comment-${post.id}`} className="sr-only">
                              Add a comment
                            </label>
                            <textarea
                              id={`comment-${post.id}`}
                              value={commentDrafts[post.id] ?? ''}
                              onChange={(event) =>
                                setCommentDrafts((current) => ({
                                  ...current,
                                  [post.id]: event.target.value,
                                }))
                              }
                              maxLength={COMMUNITY_COMMENT_MAX_LENGTH}
                              rows={2}
                              placeholder="Add a thoughtful comment…"
                              className="w-full resize-y rounded-lg border border-[#3F382F]/20 bg-white px-3 py-2 text-sm"
                            />
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-[#3F382F]/50">
                                {(commentDrafts[post.id] ?? '').length}/
                                {COMMUNITY_COMMENT_MAX_LENGTH}
                              </span>
                              <button
                                type="submit"
                                disabled={!(commentDrafts[post.id] ?? '').trim()}
                                className="pixel-button small disabled:opacity-50"
                              >
                                Add comment
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </article>
                  )
                })
              )}
            </section>

            {!loading && nextCursor && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void loadFeed(nextCursor, true)}
                  className="pixel-button small disabled:opacity-50"
                >
                  {loadingMore ? 'Gathering more posts…' : `Load ${COMMUNITY_PAGE_SIZE} more posts`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
