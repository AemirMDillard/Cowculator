'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './shared'
import { CurrentSwaps } from './current-swaps'
import {
  ErrorMessage,
  LoadingMessage,
  formatCarbon,
  formatLand,
  formatSignedNumber,
  formatWater,
  useImpactData,
} from './impact'
import { ImpactGuide } from './impact-guide'
import { ReferralPanel } from './referrals'

function ImpactViewDropdown({
  value,
  projectedLabel,
  onChange,
}: {
  value: 'projected' | 'cumulative'
  projectedLabel: string
  onChange: (value: 'projected' | 'cumulative') => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const controlId = useId()
  const controlRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const options = [
    { value: 'projected' as const, label: projectedLabel },
    { value: 'cumulative' as const, label: 'Tracked totals' },
  ]
  const selectedLabel = options.find((option) => option.value === value)?.label ?? projectedLabel

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !controlRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  function chooseView(nextView: 'projected' | 'cumulative') {
    onChange(nextView)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className="impact-view-control">
      <span id={`${controlId}-label`} className="pixel-label impact-view-label">
        IMPACT VIEW
      </span>
      <div ref={controlRef} className="impact-view-dropdown">
        <button
          ref={triggerRef}
          type="button"
          className="impact-view-trigger"
          aria-labelledby={`${controlId}-label ${controlId}-value`}
          aria-expanded={isOpen}
          aria-controls={`${controlId}-options`}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span id={`${controlId}-value`}>{selectedLabel}</span>
          <span className={`impact-view-chevron ${isOpen ? 'open' : ''}`} aria-hidden="true" />
        </button>
        <div
          id={`${controlId}-options`}
          className={`impact-view-options ${isOpen ? 'open' : ''}`}
          role="group"
          aria-label="Choose impact view"
          aria-hidden={!isOpen}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              tabIndex={isOpen ? 0 : -1}
              onClick={() => chooseView(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { data, loading, error } = useImpactData()

  const [view, setView] = useState<'projected' | 'cumulative'>('projected')

  if (loading) {
    return (
      <main className="page-shell">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <LoadingMessage />
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="page-shell">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <ErrorMessage message={error || 'Dashboard data is unavailable.'} />
        </div>
      </main>
    )
  }

  const impact = view === 'projected' ? data.projectedImpact : data.cumulativeImpact

  const isProjected = view === 'projected'

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[1180px] px-5 py-12 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">PLAYER DASHBOARD</span>

            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              WELCOME BACK, <span className="text-[#A8B99A]">MOO-MATICIAN.</span>
            </h1>
          </div>

          {data.estimateBasis !== 'not-applicable' && (
            <ImpactViewDropdown
              value={view}
              projectedLabel={
                data.estimateBasis === 'per-100g' ? 'Projected per 100 g' : 'Projected annually'
              }
              onChange={setView}
            />
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Link href="/journey" className="pixel-button small secondary">
            Track my plant-based journey <Icon name="leaf" size={16} />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <article className="dashboard-score">
            <div>
              <span className="pixel-label text-[#F5F0DF]/70">OPTIMIZATION POINTS</span>

              <strong>{data.points === null ? '—' : data.points.toLocaleString()}</strong>

              <p>
                {data.personalPoints ?? 0} from your swaps
                {data.referralPoints > 0 ? ` · ${data.referralPoints} from friends` : ''}
              </p>
            </div>

            <div className="level-badge">
              <span>STREAK</span>
              <b>{data.currentStreak}</b>
              <small>WEEKS</small>
            </div>
          </article>

          <article className="streak-card">
            <Icon name="spark" size={34} />

            <div>
              <span className="pixel-label">CURRENT STREAK</span>
              <strong>{data.currentStreak} WEEKS</strong>
              <p>Keep building your plant-based habits.</p>
            </div>
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <article className="dashboard-card">
            <div className="card-title">
              <div>
                <span className="pixel-label">IMPACT TRACKER</span>
                <h2>
                  {data.estimateBasis === 'not-applicable'
                    ? 'Your food choices'
                    : isProjected
                      ? data.estimateBasis === 'per-100g'
                        ? 'Impact comparison per 100 g'
                        : 'Potential annual change'
                      : 'Your tracked impact'}
                </h2>
              </div>

              <span className="estimate-label">{isProjected ? 'PROJECTED' : 'CUMULATIVE'}</span>
            </div>

            {data.estimateBasis === 'not-applicable' ? (
              <div className="mt-6">
                <p className="text-sm leading-6 text-[#3F382F]/65">
                  Because you already eat fully plant-based, Cowculator does not invent avoided
                  impact. Compare plant foods in your current swaps.
                </p>
              </div>
            ) : isProjected && data.quantifiedSwapCount === 0 ? (
              <p className="mt-6 text-sm leading-6 text-[#3F382F]/65">
                No comparable estimates are available yet. Select an alternative with environmental
                data; annual comparisons also need a frequency answer and a gram-based serving size.
              </p>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <span className="pixel-label">CO₂e {isProjected ? 'CHANGE' : ''}</span>
                  <h3 className="mt-2 text-3xl font-black">
                    {isProjected
                      ? `${formatSignedNumber(impact.co2eSaved)} kg`
                      : formatCarbon(impact.co2eSaved)}
                  </h3>
                </div>

                <div>
                  <span className="pixel-label">WATER {isProjected ? 'CHANGE' : ''}</span>
                  <h3 className="mt-2 text-3xl font-black">
                    {isProjected
                      ? `${formatSignedNumber(impact.waterSaved, 0)} L`
                      : formatWater(impact.waterSaved)}
                  </h3>
                </div>

                <div>
                  <span className="pixel-label">LAND {isProjected ? 'CHANGE' : ''}</span>
                  <h3 className="mt-2 text-3xl font-black">
                    {isProjected
                      ? `${formatSignedNumber(impact.landSaved, 2)} m²`
                      : formatLand(impact.landSaved)}
                  </h3>
                </div>
              </div>
            )}

            {data.estimateBasis !== 'not-applicable' &&
              (!isProjected || data.quantifiedSwapCount > 0) && (
                <div className="mt-6 border-t border-[#3F382F]/15 pt-5">
                  <span className="pixel-label">
                    {isProjected
                      ? data.estimateBasis === 'per-100g'
                        ? 'ONE COMPARISON PER 100 G'
                        : 'RECORDED GRAM PORTION PER REPORTED OCCASION'
                      : 'BASED ON TRACKED PLANT-BASED DAYS'}
                  </span>

                  {!isProjected && (
                    <p className="mt-2 text-sm text-[#3F382F]/65">
                      {data.cumulativeImpact.plantBasedDays} tracked plant-based days.
                    </p>
                  )}
                </div>
              )}
          </article>

          <CurrentSwaps
            initialChoices={data.activeSwaps ?? {}}
            quizResponses={data.quizResponses}
          />
        </div>

        <div className="mt-6">
          <article className="dashboard-card max-w-md">
            <span className="pixel-label">PLANT-BASED PROGRESS</span>

            <h2 className="mt-2 text-2xl font-black">
              {data.cumulativeImpact.plantBasedDays} days
            </h2>

            <p className="mt-2 text-sm text-[#3F382F]/65">Total tracked plant-based days.</p>
          </article>
        </div>

        <ReferralPanel className="mt-8" />
        <ImpactGuide className="mt-10 border-t border-[#3F382F]/15 pt-5" />
      </div>
    </main>
  )
}
