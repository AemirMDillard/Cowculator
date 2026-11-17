'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type ReferralData = {
  inviteUrl: string
  referralPoints: number
  veganConversions: number
  friends: Array<{
    id: string
    displayName: string
    points: number
  }>
}

export function ReferralPanel({ className = '' }: { className?: string }) {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadReferrals() {
      try {
        const response = await fetch('/api/referrals', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        })

        if (response.status === 401) {
          setIsGuest(true)
          return
        }

        if (!response.ok) {
          throw new Error('Friend invites are temporarily unavailable.')
        }

        const result: ReferralData = await response.json()
        setData(result)
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name === 'AbortError') return
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Friend invites are temporarily unavailable.',
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadReferrals()
    return () => controller.abort()
  }, [])

  async function copyInvite() {
    if (!data) return

    try {
      await navigator.clipboard.writeText(data.inviteUrl)
      setCopied(true)
      setError('')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Copy was blocked by your browser. Select and copy the invite link instead.')
    }
  }

  return (
    <section className={`referral-card ${className}`}>
      <div className="referral-intro">
        <div className="referral-title-row">
          <span className="referral-mascot" aria-hidden="true">
            🐮
          </span>
          <div>
            <span className="pixel-label">INVITE YOUR HERD</span>
            <h2>Good things grow together.</h2>
          </div>
        </div>
        <p className="referral-description">
          Friends&apos; eligible swap points boost your monthly score. Plant-based signups grow your
          vegan tally.
        </p>
        <p className="referral-footnote">
          Swap points are game rewards, not impact estimates. Invite rewards don&apos;t multiply.
        </p>

        {data && (
          <div className="referral-stats" role="group" aria-label="Your invite results">
            <article>
              <span>FRIENDS</span>
              <strong>{data.friends.length}</strong>
            </article>
            <article>
              <span>SWAP PTS</span>
              <strong>{data.referralPoints.toLocaleString()}</strong>
            </article>
            <article>
              <span>VEGAN SIGNUPS</span>
              <strong>{data.veganConversions}</strong>
            </article>
          </div>
        )}
      </div>

      <div className="referral-share-card">
        {loading ? (
          <p role="status">Getting your invite ready…</p>
        ) : isGuest ? (
          <div className="referral-guest">
            <span className="pixel-label">YOUR OWN INVITE LINK</span>
            <p>Create an account to grow your herd and track your invites.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/signup" className="pixel-button">
                Create account
              </Link>
              <Link href="/login" className="pixel-button secondary">
                Log in
              </Link>
            </div>
          </div>
        ) : error && !data ? (
          <p className="referral-error" role="alert">
            {error}
          </p>
        ) : data ? (
          <>
            <div className="referral-share-layout">
              <div className="referral-qr-card">
                <QRCodeSVG
                  value={data.inviteUrl}
                  title="Scan to join Cowculator using your friend invite"
                  size={132}
                  level="M"
                  includeMargin
                />
                <span className="pixel-label">SCAN TO JOIN</span>
              </div>

              <div className="referral-link-panel">
                <label htmlFor="friend-invite-link" className="pixel-label">
                  YOUR SHARE LINK
                </label>
                <div className="referral-link-row">
                  <input
                    id="friend-invite-link"
                    readOnly
                    value={data.inviteUrl}
                    onFocus={(event) => event.currentTarget.select()}
                    aria-label="Your personal invite link"
                  />
                  <button
                    type="button"
                    className="pixel-button"
                    onClick={copyInvite}
                    aria-live="polite"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {error && (
                  <p className="referral-error" role="alert">
                    {error}
                  </p>
                )}

                {data.friends.length > 0 && (
                  <details className="referral-friends">
                    <summary>
                      Friends who joined <span>{data.friends.length}</span>
                    </summary>
                    <ul>
                      {data.friends.map((friend) => (
                        <li key={friend.id}>
                          <span>{friend.displayName}</span>
                          <b>{friend.points.toLocaleString()} pts</b>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
