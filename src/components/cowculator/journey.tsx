'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Icon } from './shared'

type Journey = {
  pledged: boolean
  pledgeDate: string | null
  checkInDates: string[]
  goalDaysPerWeek: number
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function weekStart(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

function weekDays(date: Date) {
  const monday = weekStart(date)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + index)
    return day
  })
}

function countDaysInWeek(checkInDates: string[], start: Date) {
  const startKey = dateKey(start)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  const endKey = dateKey(end)
  return checkInDates.filter((date) => date >= startKey && date < endKey).length
}

function formatPledgeDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function JourneyPage() {
  const [journey, setJourney] = useState<Journey | null>(null)
  const [goal, setGoal] = useState(7)
  const [today, setToday] = useState('')
  const [authRequired, setAuthRequired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setToday(dateKey(new Date()))
    let active = true

    async function loadJourney() {
      try {
        const response = await fetch('/api/journey', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.status === 401) {
          if (active) setAuthRequired(true)
          return
        }

        const result: Journey | { error?: string } = await response.json()
        if (!response.ok) {
          throw new Error(('error' in result && result.error) || 'Unable to load your journey.')
        }

        const savedJourney = result as Journey
        if (active) {
          setJourney(savedJourney)
          setGoal(savedJourney.goalDaysPerWeek)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load your journey.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadJourney()
    return () => {
      active = false
    }
  }, [])

  const daysThisWeek = useMemo(() => {
    if (!journey || !today) return 0
    return countDaysInWeek(journey.checkInDates, weekStart(new Date(`${today}T12:00:00`)))
  }, [journey, today])

  const chartWeeks = useMemo(() => {
    if (!journey || !today) return []
    const currentMonday = weekStart(new Date(`${today}T12:00:00`))

    return Array.from({ length: 4 }, (_, index) => {
      const start = new Date(currentMonday)
      start.setDate(start.getDate() - (3 - index) * 7)
      return {
        label: index === 3 ? 'This week' : `Week ${index + 1}`,
        count: countDaysInWeek(journey.checkInDates, start),
      }
    })
  }, [journey, today])

  async function updateJourney(update: Record<string, unknown>) {
    setError('')
    setSaving(true)

    try {
      const response = await fetch('/api/journey', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      })
      const result: Journey | { error?: string } = await response.json()

      if (!response.ok) {
        throw new Error(
          ('error' in result && result.error) || 'Unable to save your journey update.',
        )
      }

      const savedJourney = result as Journey
      setJourney(savedJourney)
      setGoal(savedJourney.goalDaysPerWeek)
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to save your journey update.',
      )
    } finally {
      setSaving(false)
    }
  }

  const pledge = () => updateJourney({ action: 'pledge', date: today, goalDaysPerWeek: goal })

  const toggleCheckIn = (date: string) => {
    if (!journey) return
    const checked = journey.checkInDates.includes(date)
    void updateJourney({ action: checked ? 'remove-check-in' : 'check-in', date })
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[980px] px-5 py-9 sm:py-12">
        <header className="journey-hero mb-6">
          <div className="min-w-0">
            <span className="eyebrow">ONE DAY AT A TIME</span>
            <h1 className="mt-2 text-3xl font-black sm:text-5xl">YOUR PLANT-BASED JOURNEY</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#3F382F]/70">
              Set a kind goal, celebrate each plant-based day, and watch your momentum grow.
            </p>
          </div>
          <div className="journey-mascots" aria-label="Cows, chickens, and Earth">
            <span aria-hidden="true">🐄</span>
            <span aria-hidden="true">🐔</span>
            <span aria-hidden="true">🌍</span>
          </div>
        </header>

        {loading ? (
          <section className="dashboard-card" role="status">
            Loading your journey…
          </section>
        ) : authRequired ? (
          <section className="dashboard-card journey-pledge-card">
            <div className="journey-icon" aria-hidden="true">
              🌱
            </div>
            <div>
              <span className="pixel-label">YOUR NEXT CHAPTER</span>
              <h2 className="mt-2 text-2xl font-black">Make it your journey</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#3F382F]/70">
                Create a free account to make your pledge and keep your daily progress in one place.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/signup?next=%2Fjourney" className="pixel-button">
                  Join the journey
                </Link>
                <Link href="/login?next=%2Fjourney" className="pixel-button secondary">
                  Log in
                </Link>
              </div>
            </div>
          </section>
        ) : journey && !journey.pledged ? (
          <section className="dashboard-card journey-pledge-card">
            <div className="journey-icon" aria-hidden="true">
              🌱
            </div>
            <div className="w-full">
              <span className="pixel-label">YOUR PLEDGE</span>
              <h2 className="mt-2 text-2xl font-black">Choose a goal that feels doable</h2>
              <p className="mt-2 text-sm leading-6 text-[#3F382F]/70">
                Progress is personal. Start with one plant-based day or aim for all seven.
              </p>
              <label className="mt-5 flex max-w-sm items-center justify-between gap-4 text-sm font-bold">
                Days per week
                <span className="period-select-wrap">
                  <select
                    className="period-select"
                    value={goal}
                    onChange={(event) => setGoal(Number(event.target.value))}
                    aria-label="Plant-based days goal per week"
                  >
                    {Array.from({ length: 7 }, (_, index) => index + 1).map((days) => (
                      <option key={days} value={days}>
                        {days} {days === 1 ? 'day' : 'days'}
                      </option>
                    ))}
                  </select>
                  <span className="period-select-chevron" aria-hidden="true" />
                </span>
              </label>
              <button
                type="button"
                className="pixel-button mt-5"
                onClick={pledge}
                disabled={saving || !today}
              >
                {saving ? 'Saving…' : 'I pledge to begin'}
              </button>
            </div>
          </section>
        ) : journey ? (
          <>
            <section className="journey-progress-card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="pixel-label">YOUR PLEDGE</span>
                  <h2 className="mt-2 text-2xl font-black">Small steps. Real momentum.</h2>
                  <p className="mt-1 text-sm">
                    Started {journey.pledgeDate ? formatPledgeDate(journey.pledgeDate) : 'today'}
                  </p>
                  <p className="mt-2 text-xs font-bold">
                    {journey.checkInDates.length} plant-based days logged
                  </p>
                </div>
                <label className="journey-goal">
                  <span className="pixel-label">WEEKLY GOAL</span>
                  <span className="period-select-wrap mt-2">
                    <select
                      className="period-select"
                      value={goal}
                      disabled={saving}
                      onChange={(event) => {
                        const nextGoal = Number(event.target.value)
                        setGoal(nextGoal)
                        void updateJourney({ action: 'goal', goalDaysPerWeek: nextGoal })
                      }}
                      aria-label="Update your plant-based days goal"
                    >
                      {Array.from({ length: 7 }, (_, index) => index + 1).map((days) => (
                        <option key={days} value={days}>
                          {days} {days === 1 ? 'day' : 'days'}
                        </option>
                      ))}
                    </select>
                    <span className="period-select-chevron" aria-hidden="true" />
                  </span>
                </label>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-[1.1fr_.9fr]">
                <div className="journey-week">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="pixel-label">THIS WEEK</span>
                      <p className="mt-2 text-3xl font-black">
                        {daysThisWeek}
                        <span className="ml-1 text-base font-bold">
                          / {journey.goalDaysPerWeek} days
                        </span>
                      </p>
                    </div>
                    <span className="journey-week-emoji" aria-hidden="true">
                      {daysThisWeek >= journey.goalDaysPerWeek ? '🌍' : '🌱'}
                    </span>
                  </div>
                  <div
                    className="journey-progress-track mt-4"
                    role="progressbar"
                    aria-label="This week's plant-based progress"
                    aria-valuemin={0}
                    aria-valuemax={journey.goalDaysPerWeek}
                    aria-valuenow={Math.min(daysThisWeek, journey.goalDaysPerWeek)}
                  >
                    <span
                      style={{
                        width: `${Math.min(100, (daysThisWeek / journey.goalDaysPerWeek) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#3F382F]/65">
                    {daysThisWeek >= journey.goalDaysPerWeek
                      ? 'You reached your goal this week. Keep going if it feels good.'
                      : `${journey.goalDaysPerWeek - daysThisWeek} more ${
                          journey.goalDaysPerWeek - daysThisWeek === 1 ? 'day' : 'days'
                        } to reach your goal.`}
                  </p>
                  <div className="journey-day-grid mt-5">
                    {weekDays(new Date(`${today}T12:00:00`)).map((day) => {
                      const key = dateKey(day)
                      const future = key > today
                      const beforePledge = Boolean(journey.pledgeDate && key < journey.pledgeDate)
                      const checked = journey.checkInDates.includes(key)
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`journey-day ${checked ? 'checked' : ''}`}
                          aria-pressed={checked}
                          aria-label={`${day.toLocaleDateString(undefined, { weekday: 'long' })}, ${checked ? 'plant-based day checked in' : 'not checked in'}`}
                          disabled={future || beforePledge || saving}
                          onClick={() => toggleCheckIn(key)}
                        >
                          <span>{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                          <b>{day.getDate()}</b>
                          <i>{checked ? '✓' : ''}</i>
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-3 text-xs text-[#3F382F]/60">
                    Tap a day to log or update your plant-based progress.
                  </p>
                </div>

                <div className="journey-chart-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="pixel-label">YOUR RHYTHM</span>
                      <h3 className="mt-2 text-lg font-black">Plant-based days</h3>
                    </div>
                    <span aria-hidden="true" className="text-xl">
                      🐔
                    </span>
                  </div>
                  <svg
                    className="journey-chart mt-4"
                    viewBox="0 0 320 152"
                    role="img"
                    aria-label="Plant-based days per week over the last four weeks"
                  >
                    <line x1="20" y1="118" x2="308" y2="118" className="journey-chart-axis" />
                    {chartWeeks.map((week, index) => {
                      const x = 38 + index * 72
                      const height = Math.max(week.count ? 8 : 3, (week.count / 7) * 82)
                      return (
                        <g key={week.label}>
                          <rect
                            x={x}
                            y={118 - height}
                            width="34"
                            height={height}
                            rx="8"
                            className={
                              index === 3 ? 'journey-chart-bar current' : 'journey-chart-bar'
                            }
                          />
                          <text
                            x={x + 17}
                            y="137"
                            textAnchor="middle"
                            className="journey-chart-label"
                          >
                            {index === 3 ? 'Now' : `-${3 - index}w`}
                          </text>
                          <text
                            x={x + 17}
                            y={Math.max(20, 108 - height)}
                            textAnchor="middle"
                            className="journey-chart-value"
                          >
                            {week.count}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                  <p className="mt-1 text-xs leading-5 text-[#3F382F]/65">
                    Every check-in is self-reported progress—not an emissions estimate.
                  </p>
                </div>
              </div>
            </section>

            <p className="mt-4 text-center text-xs leading-5 text-[#3F382F]/65">
              Every kind choice counts. Want to explore food-impact estimates?{' '}
              <Link href="/dashboard" className="font-bold underline">
                Visit your impact dashboard
              </Link>
              .
            </p>
          </>
        ) : null}

        {error && (
          <p role="alert" className="error-box mt-4">
            {error}
          </p>
        )}

        {journey?.pledged && (
          <p className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-[#3F382F]/60">
            <Icon name="leaf" size={15} />
            Cows, chickens, and the planet are cheering you on.
          </p>
        )}
      </div>
    </main>
  )
}
