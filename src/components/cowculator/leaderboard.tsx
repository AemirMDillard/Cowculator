'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icon, colors } from './shared'
import { ErrorMessage, LoadingMessage, formatNumber, type LeaderboardResponse } from './impact'

export function LeaderboardPage() {
  const [tab, setTab] = useState<'Global' | 'Friends' | 'This month'>('Global')

  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadLeaderboard() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/leaderboard?period=${encodeURIComponent(tab)}`, {
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Unable to load the leaderboard.')
        }

        const result = await response.json()

        setData({
          entries: Array.isArray(result.entries) ? result.entries : [],
          currentUserId: result.currentUserId,
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        setError(err instanceof Error ? err.message : 'Something went wrong.')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadLeaderboard()

    return () => controller.abort()
  }, [tab])

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[1050px] px-5 py-14">
        <div className="text-center">
          <span className="eyebrow">HIGH SCORES</span>

          <h1 className="mt-3 text-4xl font-black sm:text-6xl">
            PLANET PAL <span className="text-[#E9B8B0]">LEADERBOARD</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[#3F382F]/65">
            Game points reward swaps and your invited friends&apos; swap points. They are not
            environmental measurements. See{' '}
            <Link href="/impact" className="underline">
              your impact estimates
            </Link>{' '}
            separately.
          </p>
        </div>

        <div className="mx-auto mt-9 flex w-fit border-2 border-[#3F382F] bg-white p-1">
          {(['Global', 'Friends', 'This month'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`leader-tab ${tab === item ? 'active' : ''}`}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingMessage />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <div className="mt-8 overflow-hidden border-2 border-[#3F382F] bg-white shadow-[8px_8px_0_#3F382F]">
            <div className="leader-head">
              <span>RANK / PLAYER</span>
              <span>SWAP PTS</span>
              <span>INVITE PTS</span>
              <span>TOTAL PTS</span>
            </div>

            {Array.isArray(data?.entries) && data.entries.length > 0 ? (
              data.entries.map((entry) => {
                const isYou = entry.id === data.currentUserId

                return (
                  <div key={entry.id} className={`leader-row ${isYou ? 'you' : ''}`}>
                    <span className="rank">{entry.rank}</span>

                    <span className="player">
                      <i
                        style={{
                          background: isYou ? colors.pink : colors.green,
                        }}
                      >
                        {entry.displayName.charAt(0).toUpperCase()}
                      </i>

                      <b>{entry.displayName}</b>

                      {entry.rank <= 3 && <Icon name="trophy" size={16} />}
                    </span>

                    <span>{formatNumber(entry.optimizationPoints + entry.plantBasedScore)}</span>

                    <span>{formatNumber(entry.referralPoints)}</span>

                    <strong>{formatNumber(entry.combinedScore)}</strong>
                  </div>
                )
              })
            ) : (
              <div className="p-10 text-center">
                <Icon name="users" size={32} />
                <h3 className="mt-3 font-black">No rankings yet</h3>
                <p className="mt-2 text-sm text-[#3F382F]/65">
                  {tab === 'Friends'
                    ? 'Add friends to compare monthly scores. Invited friends and referral points are tracked separately.'
                    : 'There are no leaderboard records for this view yet.'}
                </p>
                {tab === 'Friends' && (
                  <Link href="/friends" className="pixel-button mt-4 inline-block">
                    Find friends
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        <div className="community-strip">
          <div>
            <Icon name="user" size={28} />
            <span>JOIN OTHER MOOTHEMATICIANS</span>
          </div>

          <div>
            <Icon name="leaf" size={28} />
            <span>
              <b>COMMUNITY</b> IMPACT
            </span>
          </div>

          <div>
            <Icon name="spark" size={28} />
            <span>
              <b>COMMUNITY</b> POINTS
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
