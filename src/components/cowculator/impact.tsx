'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon, colors, type IconName } from './shared'
import { isRecord } from '@/lib/guards'
import {
  calculateLeaderboardScores,
  calculatePer100gImpact,
  calculateProjectedImpact,
  hasAnimalFrequencyAnswers,
  isImpactChoiceMap,
  isFullyPlantBased,
  type ImpactChoice,
  type ImpactFood,
  type ImpactValues,
} from '@/lib/impact-calculations'

export type ImpactResponse = {
  estimateBasis?: 'annual' | 'per-100g' | 'not-applicable'
  projectedImpact: ImpactValues
  cumulativeImpact: ImpactValues & {
    plantBasedDays: number
  }
  currentStreak: number
  selectedSwapCount: number
  quantifiedSwapCount: number
  points: number | null
  personalPoints: number | null
  referralPoints: number
  displayName: string
  activeSwaps?: Record<string, ImpactChoice>
  quizResponses?: unknown
}

export type LeaderboardEntry = {
  id: string
  displayName: string
  month: number
  year: number
  animalImpactScore: number
  environmentalScore: number
  plantBasedScore: number
  optimizationPoints: number
  referralPoints: number
  combinedScore: number
  rank: number
}

export type LeaderboardResponse = {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

const emptyImpact: ImpactResponse = {
  projectedImpact: {
    co2eSaved: 0,
    waterSaved: 0,
    landSaved: 0,
    animalsSpared: 0,
  },
  cumulativeImpact: {
    co2eSaved: 0,
    waterSaved: 0,
    landSaved: 0,
    animalsSpared: 0,
    plantBasedDays: 0,
  },
  currentStreak: 0,
  selectedSwapCount: 0,
  quantifiedSwapCount: 0,
  points: null,
  personalPoints: null,
  referralPoints: 0,
  displayName: 'Planet Pal',
}

function calculateGuestImpact(
  foods: ImpactFood[],
  choices: Record<string, ImpactChoice>,
  quizResponses: unknown,
): ImpactResponse {
  const isVegan = isFullyPlantBased(quizResponses)
  const hasFrequencies = hasAnimalFrequencyAnswers(quizResponses)
  const result = isVegan
    ? {
        projectedImpact: { co2eSaved: 0, waterSaved: 0, landSaved: 0, animalsSpared: 0 },
        qualifyingSwaps: 0,
      }
    : hasFrequencies
      ? calculateProjectedImpact(choices, foods, quizResponses)
      : calculatePer100gImpact(choices, foods)
  const scores = calculateLeaderboardScores(choices, foods)

  return {
    projectedImpact: result.projectedImpact,
    cumulativeImpact: {
      co2eSaved: 0,
      waterSaved: 0,
      landSaved: 0,
      animalsSpared: 0,
      plantBasedDays: 0,
    },
    currentStreak: 0,
    selectedSwapCount: Object.values(choices).filter(
      (choice) =>
        choice.type === 'alternative' ||
        choice.type === 'plant-alternative' ||
        choice.type === 'custom',
    ).length,
    quantifiedSwapCount: result.qualifyingSwaps,
    points: scores.optimizationPoints,
    personalPoints: scores.optimizationPoints,
    referralPoints: 0,
    displayName: 'Planet Pal',
    estimateBasis: isVegan ? 'not-applicable' : hasFrequencies ? 'annual' : 'per-100g',
    activeSwaps: choices,
    quizResponses,
  }
}

export function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value)
}

export function formatSignedNumber(value: number, decimals = 1) {
  const formatted = formatNumber(value, decimals)
  return value > 0 ? `+${formatted}` : formatted
}

export function formatCarbon(value: number) {
  if (value >= 1000) {
    return `${formatNumber(value / 1000, 2)} t`
  }

  return `${formatNumber(value, 1)} kg`
}

export function formatWater(value: number) {
  if (value >= 1000) {
    return `${formatNumber(value / 1000, 2)} kL`
  }

  return `${formatNumber(value, 1)} L`
}

export function formatLand(value: number) {
  return `${formatNumber(value, 2)} m²`
}

export function StatCard({
  icon,
  value,
  unit,
  label,
  color,
  basis,
}: {
  icon: IconName
  value: string
  unit: string
  label: string
  color: string
  basis: 'annual' | 'per-100g'
}) {
  return (
    <article className="stat-card" style={{ '--accent': color } as React.CSSProperties}>
      <span className="stat-icon">
        <Icon name={icon} size={28} />
      </span>

      <span className="pixel-label">{label}</span>

      <strong>
        {value}
        <small>{unit}</small>
      </strong>

      <span className="estimate-label">ESTIMATE / {basis === 'annual' ? 'YEAR' : '100 G'}</span>
    </article>
  )
}

export function useImpactData() {
  const [data, setData] = useState<ImpactResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const hasLoaded = useRef(false)

  useEffect(() => {
    const refresh = () => setRefreshVersion((version) => version + 1)
    window.addEventListener('cowculator:swaps-updated', refresh)
    return () => window.removeEventListener('cowculator:swaps-updated', refresh)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadImpact() {
      try {
        if (!hasLoaded.current) setLoading(true)
        setError(null)

        const response = await fetch('/api/impact', {
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-store',
        })

        if (response.status === 401) {
          const foodsResponse = await fetch('/api/foods', {
            signal: controller.signal,
            cache: 'no-store',
          })

          if (!foodsResponse.ok) {
            throw new Error('Unable to load foods for your guest results.')
          }

          const foodsResult = (await foodsResponse.json()) as { docs?: ImpactFood[] }

          if (!Array.isArray(foodsResult.docs)) {
            throw new Error('The foods response was invalid.')
          }

          const savedChoicesText = localStorage.getItem('cowculator-swaps')
          let savedChoices: Record<string, ImpactChoice> = {}

          if (savedChoicesText) {
            const parsed: unknown = JSON.parse(savedChoicesText)

            if (!isImpactChoiceMap(parsed)) {
              throw new Error('Your saved guest swaps are invalid.')
            }

            savedChoices = parsed
          }

          const savedAnswersText = localStorage.getItem('cowculator-answers')
          const savedAnswers: unknown = savedAnswersText ? JSON.parse(savedAnswersText) : null
          if (savedAnswersText && !isRecord(savedAnswers)) {
            throw new Error('Your saved calculator answers are invalid.')
          }

          setData(calculateGuestImpact(foodsResult.docs, savedChoices, savedAnswers))
          return
        }

        if (!response.ok) {
          throw new Error('Unable to load your impact data.')
        }

        const result: ImpactResponse = await response.json()
        setData({ ...result, estimateBasis: result.estimateBasis ?? 'annual' })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        setError(err instanceof Error ? err.message : 'Something went wrong.')
      } finally {
        if (!controller.signal.aborted) {
          hasLoaded.current = true
          setLoading(false)
        }
      }
    }

    loadImpact()

    return () => controller.abort()
  }, [refreshVersion])

  return { data, loading, error }
}

export function LoadingMessage() {
  return (
    <div className="py-16 text-center">
      <Icon name="spark" size={28} />
      <p className="mt-3">Loading your impact...</p>
    </div>
  )
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="my-8 border-2 border-[#3F382F] bg-white p-5">
      <p className="font-bold">We couldn't load this information.</p>
      <p className="mt-2 text-sm">{message}</p>
      <button className="pixel-button mt-4" onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  )
}
