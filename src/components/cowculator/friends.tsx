'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Person = {
  id: string
  displayName: string
  requestId?: string
}

type SearchResult = Person & {
  status: 'none' | 'declined' | 'friends' | 'pending-sent' | 'pending-received'
}

type FriendRequest = {
  requestId: string
  person: Person
}

type FriendData = {
  friends: Person[]
  incomingRequests: FriendRequest[]
  outgoingRequests: FriendRequest[]
}

const emptyData: FriendData = {
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
}

async function readJson(response: Response) {
  const result: unknown = await response.json().catch(() => null)
  if (!result || typeof result !== 'object') {
    throw new Error('The friends service returned an invalid response.')
  }
  return result as Record<string, unknown>
}

export function FriendsPage() {
  const [data, setData] = useState<FriendData>(emptyData)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [searchVersion, setSearchVersion] = useState(0)
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadFriends() {
      try {
        setLoading(true)
        const response = await fetch('/api/friends', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        })
        const result = await readJson(response)
        if (response.status === 401) {
          setAuthRequired(true)
          return
        }
        if (!response.ok) throw new Error('Unable to load your friends.')

        setAuthRequired(false)
        setData({
          friends: Array.isArray(result.friends) ? (result.friends as Person[]) : [],
          incomingRequests: Array.isArray(result.incomingRequests)
            ? (result.incomingRequests as FriendRequest[])
            : [],
          outgoingRequests: Array.isArray(result.outgoingRequests)
            ? (result.outgoingRequests as FriendRequest[])
            : [],
        })
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load your friends.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadFriends()
    return () => controller.abort()
  }, [refreshVersion])

  useEffect(() => {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2 || authRequired) {
      setResults([])
      setSearching(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        setSearching(true)
        setError('')
        const response = await fetch(`/api/friends?query=${encodeURIComponent(normalizedQuery)}`, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        })
        const result = await readJson(response)
        if (response.status === 401) {
          setAuthRequired(true)
          setResults([])
          return
        }
        if (!response.ok) throw new Error('Unable to search for friends.')
        setResults(Array.isArray(result.results) ? (result.results as SearchResult[]) : [])
      } catch (searchError) {
        if (searchError instanceof Error && searchError.name === 'AbortError') return
        setError(
          searchError instanceof Error ? searchError.message : 'Unable to search for friends.',
        )
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, searchVersion, authRequired])

  async function sendRequest(person: SearchResult) {
    setBusyId(person.id)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: person.id }),
      })
      const result = await readJson(response)
      if (!response.ok)
        throw new Error(
          typeof result.error === 'string' ? result.error : 'Unable to send friend request.',
        )
      setMessage(`Friend request sent to ${person.displayName}.`)
      setRefreshVersion((version) => version + 1)
      setSearchVersion((version) => version + 1)
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : 'Unable to send friend request.',
      )
    } finally {
      setBusyId(null)
    }
  }

  async function updateRequest(
    requestId: string,
    method: 'PATCH' | 'DELETE',
    status?: 'accepted' | 'declined',
  ) {
    setBusyId(requestId)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/friends/requests/${encodeURIComponent(requestId)}`, {
        method,
        credentials: 'include',
        headers: method === 'PATCH' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'PATCH' ? JSON.stringify({ status }) : undefined,
      })
      const result = await readJson(response)
      if (!response.ok) {
        throw new Error(
          typeof result.error === 'string' ? result.error : 'Unable to update friend request.',
        )
      }
      setMessage(method === 'DELETE' ? 'Friend connection removed.' : 'Friend request updated.')
      setRefreshVersion((version) => version + 1)
      setSearchVersion((version) => version + 1)
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : 'Unable to update friend request.',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[1050px] px-5 py-12">
        <header className="mb-8">
          <span className="eyebrow">YOUR COMMUNITY</span>
          <h1 className="mt-3 text-4xl font-black sm:text-6xl">
            FIND YOUR <span className="text-[#A8B99A]">PEOPLE</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#3F382F]/65 sm:text-base">
            Search by public display name, send a request, and compare monthly game points with
            people who accept. Friend requests are separate from invite links and referral rewards.
          </p>
        </header>

        {authRequired ? (
          <section className="dashboard-card">
            <h2 className="text-xl font-black">Log in to find friends</h2>
            <p className="mt-2 text-sm text-[#3F382F]/65">
              Friend search and requests are only available to signed-in members.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/login" className="pixel-button small">
                Log in
              </Link>
              <Link href="/signup" className="pixel-button small">
                Sign up
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="dashboard-card">
              <label htmlFor="friend-search" className="text-xs font-bold">
                SEARCH PUBLIC DISPLAY NAMES
              </label>
              <input
                id="friend-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type at least 2 characters"
                autoComplete="off"
                className="mt-2 w-full rounded-sm border-2 border-[#3F382F]/20 bg-white px-3 py-3 text-sm"
              />
              <p className="mt-2 text-xs leading-5 text-[#3F382F]/55">
                Search results show display names only; email addresses are never shown.
              </p>

              {query.trim().length >= 2 && (
                <div className="mt-4 divide-y divide-[#3F382F]/10">
                  {searching ? (
                    <p className="py-3 text-sm">Searching…</p>
                  ) : results.length > 0 ? (
                    results.map((person) => (
                      <div key={person.id} className="flex items-center justify-between gap-4 py-3">
                        <span className="font-bold">{person.displayName}</span>
                        {person.status === 'friends' ? (
                          <span className="text-xs font-bold text-[#73866B]">Friends</span>
                        ) : person.status === 'pending-sent' ? (
                          <span className="text-xs font-bold">Request sent</span>
                        ) : person.status === 'pending-received' ? (
                          <button
                            type="button"
                            disabled={!person.requestId || busyId === person.requestId}
                            onClick={() =>
                              person.requestId &&
                              updateRequest(person.requestId, 'PATCH', 'accepted')
                            }
                            className="pixel-button small disabled:opacity-50"
                          >
                            Accept request
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === person.id}
                            onClick={() => sendRequest(person)}
                            className="pixel-button small disabled:opacity-50"
                          >
                            {busyId === person.id ? 'Sending…' : 'Add friend'}
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="py-3 text-sm text-[#3F382F]/65">
                      No members found with that display name.
                    </p>
                  )}
                </div>
              )}
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

            {loading ? (
              <p className="py-10 text-center text-sm">Loading your friends…</p>
            ) : (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <section className="dashboard-card">
                  <h2 className="text-xl font-black">Friend requests</h2>
                  {data.incomingRequests.length === 0 && data.outgoingRequests.length === 0 ? (
                    <p className="mt-3 text-sm text-[#3F382F]/65">No pending requests.</p>
                  ) : (
                    <div className="mt-3 space-y-4">
                      {data.incomingRequests.map(({ requestId, person }) => (
                        <div key={requestId} className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold">{person.displayName}</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busyId === requestId}
                              onClick={() => updateRequest(requestId, 'PATCH', 'accepted')}
                              className="pixel-button small disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={busyId === requestId}
                              onClick={() => updateRequest(requestId, 'PATCH', 'declined')}
                              className="text-xs font-bold underline disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                      {data.outgoingRequests.map(({ requestId, person }) => (
                        <div key={requestId} className="flex items-center justify-between gap-3">
                          <span className="text-sm">{person.displayName} · waiting</span>
                          <button
                            type="button"
                            disabled={busyId === requestId}
                            onClick={() => updateRequest(requestId, 'DELETE')}
                            className="text-xs font-bold underline disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="dashboard-card">
                  <h2 className="text-xl font-black">Your friends</h2>
                  {data.friends.length === 0 ? (
                    <p className="mt-3 text-sm text-[#3F382F]/65">
                      Search by name and add someone to start comparing scores.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-[#3F382F]/10">
                      {data.friends.map((friend) => (
                        <li
                          key={friend.id}
                          className="flex items-center justify-between gap-3 py-3"
                        >
                          <span className="text-sm font-bold">{friend.displayName}</span>
                          {friend.requestId && (
                            <button
                              type="button"
                              disabled={busyId === friend.requestId}
                              onClick={() =>
                                friend.requestId && updateRequest(friend.requestId, 'DELETE')
                              }
                              className="text-xs font-bold underline disabled:opacity-50"
                            >
                              Remove
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/leaderboard"
                    className="mt-4 inline-block text-sm font-bold underline"
                  >
                    Compare friends&apos; points
                  </Link>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
