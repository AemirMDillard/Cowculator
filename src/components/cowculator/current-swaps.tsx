'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { isFullyPlantBased, type ImpactChoice } from '@/lib/impact-calculations'
import { isRelevantAnimalFood } from '@/lib/swap-helpers'

type Food = {
  id: number | string
  name: string
  foodOrigin: string
  foodCategory?: string | null
  isActive?: boolean | null
  animalProductCategory?: string | null
}

function isFood(value: unknown): value is Food {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const food = value as Record<string, unknown>
  return (
    (typeof food.id === 'number' || typeof food.id === 'string') &&
    typeof food.name === 'string' &&
    typeof food.foodOrigin === 'string'
  )
}

function displayChoice(choice: ImpactChoice, foodsById: Map<string, Food>) {
  if (choice.type === 'alternative') {
    return `→ ${foodsById.get(choice.foodId)?.name ?? 'Alternative unavailable'}`
  }
  if (choice.type === 'plant-alternative') {
    return `→ ${foodsById.get(choice.foodId)?.name ?? 'Alternative unavailable'}`
  }
  if (choice.type === 'considered') return 'Previously considered'
  if (choice.type === 'give-up') return 'No replacement'
  return `Your idea: ${choice.suggestion}`
}

function choiceFoodId(choice: ImpactChoice, key: string) {
  if (choice.type === 'plant-alternative') return choice.baseFoodId
  if (choice.type === 'considered') return choice.foodId
  return key
}

function editUrl(foodId: string) {
  return `/swaps?food=${encodeURIComponent(foodId)}`
}

export function CurrentSwaps({
  initialChoices,
  quizResponses,
}: {
  initialChoices: Record<string, ImpactChoice>
  quizResponses: unknown
}) {
  const [choices, setChoices] = useState(initialChoices)
  const [foods, setFoods] = useState<Food[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const isVegan = isFullyPlantBased(quizResponses)

  useEffect(() => {
    const controller = new AbortController()

    async function loadFoods() {
      try {
        const response = await fetch('/api/foods', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Unable to load foods for your swap list.')

        const result: unknown = await response.json()
        if (
          !result ||
          typeof result !== 'object' ||
          !('docs' in result) ||
          !Array.isArray(result.docs) ||
          !result.docs.every(isFood)
        ) {
          throw new Error('The foods response was invalid.')
        }

        setFoods(result.docs)
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : 'Unable to load foods.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadFoods()
    return () => controller.abort()
  }, [])

  const foodsById = useMemo(
    () => new Map(foods.map((food) => [String(food.id), food])),
    [foods],
  )

  const consideredFoodIds = useMemo(() => {
    const considered = new Set<string>()
    for (const [key, choice] of Object.entries(choices)) {
      considered.add(choiceFoodId(choice, key))
    }
    return considered
  }, [choices])

  const unconsideredFoods = useMemo(
    () =>
      foods
        .filter((food) => food.isActive !== false)
        .filter((food) =>
          isVegan
            ? food.foodOrigin === 'plant'
            : food.foodOrigin === 'animal' && isRelevantAnimalFood(food, quizResponses),
        )
        .filter((food) => !consideredFoodIds.has(String(food.id)))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [foods, isVegan, quizResponses, consideredFoodIds],
  )

  const availableFoods = useMemo(
    () => {
      const normalizedQuery = query.trim().toLowerCase()
      return unconsideredFoods.filter(
        (food) =>
          !normalizedQuery ||
          food.name.toLowerCase().includes(normalizedQuery) ||
          food.foodCategory?.toLowerCase().includes(normalizedQuery),
      )
    },
    [unconsideredFoods, query],
  )

  async function removeChoice(key: string) {
    const choice = choices[key]
    if (!choice) return

    const nextChoices = {
      ...choices,
      [key]: { type: 'considered' as const, foodId: choiceFoodId(choice, key) },
    }
    setSavingKey(key)
    setError('')

    try {
      const response = await fetch('/api/active-swaps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeSwaps: nextChoices }),
      })

      if (response.status !== 401 && !response.ok) {
        const result: unknown = await response.json().catch(() => null)
        const message =
          result && typeof result === 'object' && 'error' in result
            ? result.error
            : 'Could not remove this swap.'
        throw new Error(typeof message === 'string' ? message : 'Could not remove this swap.')
      }

      localStorage.setItem('cowculator-swaps', JSON.stringify(nextChoices))
      setChoices(nextChoices)
      window.dispatchEvent(new Event('cowculator:swaps-updated'))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not remove this swap.')
    } finally {
      setSavingKey(null)
    }
  }

  const activeChoices = Object.entries(choices).filter(([, choice]) => choice.type !== 'considered')
  const activeCount = activeChoices.filter(
    ([, choice]) => choice.type !== 'give-up',
  ).length

  return (
    <article className="dashboard-card">
      <div className="card-title">
        <div>
          <span className="pixel-label">YOUR ACTIVITY</span>
          <h2>Current swaps</h2>
        </div>
        <span className="estimate-label">{activeCount} ACTIVE</span>
      </div>

      {activeChoices.length > 0 ? (
        <ul className="mt-4 max-h-60 space-y-2 overflow-y-auto pr-1">
          {activeChoices.map(([key, choice]) => {
            const baseFoodId = choiceFoodId(choice, key)
            const baseFood = foodsById.get(baseFoodId)

            return (
              <li
                key={key}
                className="flex items-center justify-between gap-3 rounded-sm border border-[#3F382F]/15 bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {baseFood?.name ?? 'Food unavailable'}{' '}
                    <span className="font-normal text-[#3F382F]/70">
                      {displayChoice(choice, foodsById)}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs font-bold">
                  <Link href={editUrl(baseFoodId)} className="underline">
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={savingKey !== null}
                    onClick={() => removeChoice(key)}
                    className="underline disabled:opacity-50"
                  >
                    {savingKey === key ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[#3F382F]/65">No swaps saved yet. Browse foods to start.</p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <details className="mt-4 border-t border-[#3F382F]/15 pt-3">
        <summary className="cursor-pointer text-sm font-bold">
          Browse unconsidered foods ({loading ? '…' : availableFoods.length})
        </summary>
        <div className="mt-3">
          <label htmlFor="unconsidered-food-search" className="sr-only">
            Search unconsidered foods
          </label>
          <input
            id="unconsidered-food-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search foods"
            className="w-full rounded-sm border border-[#3F382F]/20 bg-white px-3 py-2 text-sm"
          />

          {loading ? (
            <p className="mt-3 text-sm text-[#3F382F]/65">Loading foods…</p>
          ) : availableFoods.length > 0 ? (
            <ul className="mt-3 grid max-h-52 grid-cols-2 gap-2 overflow-y-auto pr-1">
              {availableFoods.map((food) => (
                <li key={food.id}>
                  <Link
                    href={editUrl(String(food.id))}
                    className="flex h-full items-center justify-between gap-2 rounded-sm border border-[#3F382F]/15 bg-white px-3 py-2 text-sm hover:border-[#73866B]"
                  >
                    <span className="truncate font-bold">{food.name}</span>
                    <span className="shrink-0 text-xs underline">Explore</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[#3F382F]/65">
              {unconsideredFoods.length === 0
                ? isVegan
                  ? 'You have already considered all active plant foods.'
                  : 'You have already considered all foods matching your answers.'
                : 'No unconsidered foods match your search.'}{' '}
              <Link href="/calculator" className="font-bold underline">
                Update food habits
              </Link>
            </p>
          )}
        </div>
      </details>
    </article>
  )
}
