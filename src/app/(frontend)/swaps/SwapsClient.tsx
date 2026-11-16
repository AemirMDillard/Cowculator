
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

type Food = {
  id: string
  name: string
  foodOrigin: string
  foodCategory: string
  animalProductCategory?: string
  impactGroup?: string
  environmentalScore?: number
  cost?: number
  costPerServing?: number
  protein?: number
  nutritionPer100g?: {
    protein?: number
  }
  description?: string
}

type Swap = {
  id: string
  name: string
  description?: string
  replaces: Food[]
  alternativeFoods: Food[]
  nutritionalNotes?: string
  sensoryMatchNotes?: string
  recommendationNotes?: string
}

type Choice =
  | { type: 'alternative'; foodId: string; swapId: string }
  | { type: 'give-up' }
  | { type: 'custom'; suggestion: string; notes?: string }

type Group = {
  food: Food
  alternatives: {
    food: Food
    swap: Swap
  }[]
}

const POINTS_PER_SWAP = 10

const questionForCategory: Record<string, string> = {
  beef: 'redMeat',
  pork: 'redMeat',
  poultry: 'poultry',
  fish: 'seafood',
  seafood: 'seafood',
  dairy: 'dairy',
  eggs: 'eggs',
}

const fallbackImpactGroup: Record<string, string> = {
  beef: 'red_meat',
  pork: 'red_meat',
  poultry: 'poultry',
  fish: 'seafood',
  seafood: 'seafood',
  dairy: 'dairy',
  eggs: 'eggs',
}

const ignoredFrequencies = ['Never', 'Almost never']

function isRelevant(
  food: Food,
  answers: Record<string, string>
) {
  if (answers.dietPattern === 'Fully plant-based (vegan)') {
    return false
  }

  const category = food.animalProductCategory
  if (!category) return false

  const question = questionForCategory[category]
  if (!question) return false

  const frequency = answers[question]

  return Boolean(
    frequency && !ignoredFrequencies.includes(frequency)
  )
}

function getImpactGroup(food: Food) {
  if (food.impactGroup) return food.impactGroup

  const name = food.name.toLowerCase()

  if (food.animalProductCategory === 'dairy') {
    if (
      name.includes('casein') ||
      name.includes('whey') ||
      name.includes('protein powder')
    ) {
      return 'dairy_protein'
    }

    if (name.includes('milk')) return 'milk'
    if (name.includes('cheese')) return 'cheese'
    if (name.includes('yogurt') || name.includes('yoghurt')) {
      return 'yogurt'
    }
    if (name.includes('butter')) return 'butter'

    return 'other_dairy'
  }

  return (
    fallbackImpactGroup[food.animalProductCategory || ''] ||
    food.animalProductCategory ||
    food.foodCategory
  )
}

function getProtein(food: Food) {
  return food.protein ?? food.nutritionPer100g?.protein
}

function formatMoney(value?: number) {
  if (value === undefined || value === null) return null
  return `$${value.toFixed(2)}`
}

export function SwapsClient() {
  const [swaps, setSwaps] = useState<Swap[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [choices, setChoices] = useState<Record<string, Choice>>({})
  const [pointsEarned, setPointsEarned] = useState<Record<string, number>>({})
  const [expandedFoods, setExpandedFoods] = useState<string[]>([])
  const [customText, setCustomText] = useState<Record<string, string>>({})
  const [customNotes, setCustomNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submittingFood, setSubmittingFood] = useState<string | null>(null)
  const [pointsAnimation, setPointsAnimation] = useState<number | null>(null)

  const masonryRef = useRef<HTMLDivElement>(null)

  // Ensures rapid selections are saved in order.
  const saveQueue = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem('cowculator-answers')
      const savedChoices = localStorage.getItem('cowculator-swaps')
      const savedPoints = localStorage.getItem('cowculator-points-earned')

      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers))
      }

      // Load local choices temporarily while the database is loading.
      if (savedChoices) {
        const parsed = JSON.parse(savedChoices)

        if (
          parsed &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed)
        ) {
          setChoices(parsed)
        }
      }

      if (savedPoints) {
        setPointsEarned(JSON.parse(savedPoints))
      } else if (savedChoices) {
        const parsed = JSON.parse(savedChoices)

        if (
          parsed &&
          typeof parsed === 'object' &&
          !Array.isArray(parsed)
        ) {
          const initialPoints: Record<string, number> = {}

          for (const [foodId, choice] of Object.entries(parsed)) {
            if (
              choice &&
              typeof choice === 'object' &&
              (choice as Choice).type === 'alternative'
            ) {
              initialPoints[foodId] = POINTS_PER_SWAP
            }
          }

          setPointsEarned(initialPoints)
        }
      }
    } catch (error) {
      console.error('Could not load local choices:', error)
    }

    async function loadSwaps() {
      try {
        const [swapsResponse, savedResponse] = await Promise.all([
          fetch(
            '/api/swaps?where[isActive][equals]=true&depth=2&limit=100'
          ),
          fetch('/api/active-swaps'),
        ])

        if (!swapsResponse.ok) {
          throw new Error('Could not load swaps.')
        }

        const swapsData = await swapsResponse.json()
        setSwaps(swapsData.docs ?? [])

        if (savedResponse.ok) {
  const savedData = await savedResponse.json()
  const savedChoices = savedData.activeSwaps

  if (
    savedChoices &&
    typeof savedChoices === 'object' &&
    !Array.isArray(savedChoices)
  ) {
    setChoices(savedChoices)

    localStorage.setItem(
      'cowculator-swaps',
      JSON.stringify(savedChoices)
    )

    const restoredPoints: Record<string, number> = {}

    for (const [foodId, choice] of Object.entries(savedChoices)) {
      if (
        choice &&
        typeof choice === 'object' &&
        (choice as Choice).type === 'alternative'
      ) {
        restoredPoints[foodId] = POINTS_PER_SWAP
      }
    }

    setPointsEarned(previous => ({
      ...previous,
      ...restoredPoints,
    }))
  }
} else if (savedResponse.status !== 401) {
  const errorBody = await savedResponse.text()

  console.error('Active swaps API error:', {
    status: savedResponse.status,
    body: errorBody,
  })

  throw new Error(
    `Could not load saved selections (${savedResponse.status}).`
  )
}
      } catch (error) {
        console.error('Loading swaps failed:', error)
        setError('We could not load your swaps. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadSwaps()
  }, [])

  // Keep local storage as a backup of the current selections.
  useEffect(() => {
    localStorage.setItem('cowculator-swaps', JSON.stringify(choices))
  }, [choices])

  useEffect(() => {
    localStorage.setItem(
      'cowculator-points-earned',
      JSON.stringify(pointsEarned)
    )
  }, [pointsEarned])

  // Save the complete selection object to the logged-in user's Payload record.
  function persistChoices(nextChoices: Record<string, Choice>) {
    localStorage.setItem(
      'cowculator-swaps',
      JSON.stringify(nextChoices)
    )

    const save = saveQueue.current.then(async () => {
      const response = await fetch('/api/active-swaps', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activeSwaps: nextChoices,
        }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(
          result.error || 'Could not save your selections.'
        )
      }

      setError('')
    })

    saveQueue.current = save.catch(error => {
      console.error('Saving swaps failed:', error)
      setError(
        'Your selection could not be saved. Check your connection and try again.'
      )
    })
  }

  const totalPoints = Object.values(pointsEarned).reduce(
    (sum, points) => sum + points,
    0
  )

  const groups = useMemo(() => {
    const foods = new Map<string, Group>()

    for (const swap of swaps) {
      for (const food of swap.replaces ?? []) {
        if (!food || typeof food === 'string') continue
        if (!isRelevant(food, answers)) continue

        if (!foods.has(food.id)) {
          foods.set(food.id, {
            food,
            alternatives: [],
          })
        }

        const group = foods.get(food.id)!

        for (const alternative of swap.alternativeFoods ?? []) {
          if (
            !alternative ||
            typeof alternative === 'string' ||
            alternative.foodOrigin !== 'plant'
          ) {
            continue
          }

          const alreadyAdded = group.alternatives.some(
            item => item.food.id === alternative.id
          )

          if (!alreadyAdded) {
            group.alternatives.push({
              food: alternative,
              swap,
            })
          }
        }
      }
    }

    const diverseGroups = new Map<string, Group>()

    for (const group of foods.values()) {
      if (group.alternatives.length === 0) continue

      const key = getImpactGroup(group.food)
      const existing = diverseGroups.get(key)

      if (
        !existing ||
        (group.food.environmentalScore ?? 0) >
          (existing.food.environmentalScore ?? 0)
      ) {
        diverseGroups.set(key, group)
      }
    }

    return Array.from(diverseGroups.values())
      .sort(
        (a, b) =>
          (b.food.environmentalScore ?? 0) -
          (a.food.environmentalScore ?? 0)
      )
      .slice(0, 6)
  }, [swaps, answers])

  // Recalculate masonry row spans whenever cards resize or expand.
  useEffect(() => {
    const container = masonryRef.current
    if (!container) return

    const ROW_HEIGHT = 1
    const ROW_GAP = 8

    const cards = container.querySelectorAll<HTMLElement>(
      '[data-masonry-card]'
    )

    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => {
        const card = entry.target as HTMLElement
        const height =
          entry.borderBoxSize?.[0]?.blockSize ??
          entry.contentRect.height

        const rowSpan = Math.ceil(
          (height + ROW_GAP) / (ROW_HEIGHT + ROW_GAP)
        )

        card.style.gridRowEnd = `span ${rowSpan}`
      })
    })

    cards.forEach(card => observer.observe(card))

    return () => observer.disconnect()
  }, [groups, expandedFoods])

  function toggleExpanded(foodId: string) {
    setExpandedFoods(previous =>
      previous.includes(foodId)
        ? previous.filter(id => id !== foodId)
        : [...previous, foodId]
    )
  }

  function choose(foodId: string, choice: Choice) {
    if (
      choice.type === 'alternative' &&
      !pointsEarned[foodId]
    ) {
      setPointsEarned(previous => ({
        ...previous,
        [foodId]: POINTS_PER_SWAP,
      }))

      setPointsAnimation(POINTS_PER_SWAP)

      window.setTimeout(() => {
        setPointsAnimation(null)
      }, 1200)
    }

    const nextChoices = {
      ...choices,
      [foodId]: choice,
    }

    setChoices(nextChoices)
    persistChoices(nextChoices)
  }

  async function submitCustom(foodId: string) {
    const suggestion = customText[foodId]?.trim()
    const notes = customNotes[foodId]?.trim() ?? ''

    if (!suggestion) return

    setSubmittingFood(foodId)
    setError('')

    try {
      const response = await fetch('/api/swap-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodBeingReplaced: foodId,
          suggestedAlternative: suggestion,
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error('Suggestion could not be submitted.')
      }

      choose(foodId, {
        type: 'custom',
        suggestion,
        notes,
      })

      setCustomText(previous => ({
        ...previous,
        [foodId]: '',
      }))

      setCustomNotes(previous => ({
        ...previous,
        [foodId]: '',
      }))
    } catch (error) {
      console.error('Submitting suggestion failed:', error)
      setError('Your suggestion could not be submitted. Please try again.')
    } finally {
      setSubmittingFood(null)
    }
  }

  const selectedCount = Object.keys(choices).length

  if (loading) {
    return (
      <main className="page-shell p-10">
        Loading your swaps...
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[1180px] px-5 py-10 lg:px-8 lg:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow">LEVEL 2 · POWER-UPS</span>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
              CHOOSE YOUR <span className="text-[#A8B99A]">SWAPS</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm text-[#3F382F]/65 sm:text-base">
              Small changes. Big movement.
            </p>
          </div>

          <div className="relative shrink-0">
            <div className="points-pill flex items-center gap-3">
              <span className="text-xl">★</span>
              <div>
                <b className="block text-2xl leading-none">
                  {totalPoints}
                </b>
                <span className="text-[10px] tracking-wider">
                  OPTIMIZATION PTS
                </span>
              </div>
            </div>

            {pointsAnimation !== null && (
              <div
                key={totalPoints}
                className="absolute -top-8 right-2 animate-bounce text-sm font-black text-[#73866B]"
              >
                +{pointsAnimation} PTS!
              </div>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {error}
          </p>
        )}

        {groups.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[#3F382F]/20 p-8">
            <h2 className="text-xl font-bold">
              No matching swaps yet
            </h2>
            <p className="mt-2 text-sm text-[#3F382F]/65">
              We couldn't find relevant alternatives based on your questionnaire answers.
            </p>
          </div>
        ) : (
          <div
            ref={masonryRef}
            className="mt-8 grid grid-cols-1 gap-x-4 sm:grid-cols-2"
            style={{
              gridAutoRows: '1px',
              gridAutoFlow: 'row dense',
              rowGap: '8px',
            }}
          >
            {groups.map(({ food, alternatives }) => {
              const choice = choices[food.id]
              const expanded = expandedFoods.includes(food.id)

              const selectedAlternative =
                choice?.type === 'alternative'
                  ? alternatives.find(
                      item => item.food.id === choice.foodId
                    )?.food.name
                  : null

              return (
                <article
                  key={food.id}
                  data-masonry-card
                  className={`swap-card min-w-0 self-start overflow-hidden transition-all duration-200 ${
                    expanded ? 'ring-2 ring-[#A8B99A]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="pixel-label">
                        FOOD TO EXPLORE
                      </span>

                      <h2 className="mt-1 truncate text-xl font-black sm:text-2xl">
                        {food.name}
                      </h2>

                      {choice?.type === 'alternative' && (
                        <p className="mt-1 truncate text-xs font-bold text-[#73866B]">
                          ↳ {selectedAlternative ?? 'Plant-based swap selected'}
                        </p>
                      )}

                      {choice?.type === 'give-up' && (
                        <p className="mt-1 text-xs font-bold text-[#73866B]">
                          Going without a replacement
                        </p>
                      )}

                      {choice?.type === 'custom' && (
                        <p className="mt-1 truncate text-xs font-bold text-[#73866B]">
                          Your idea: {choice.suggestion}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      className="select-toggle shrink-0"
                      onClick={() => toggleExpanded(food.id)}
                      aria-expanded={expanded}
                      aria-label={
                        expanded
                          ? 'Close swaps'
                          : `Explore swaps for ${food.name}`
                      }
                    >
                      {expanded ? '−' : '+'}
                    </button>
                  </div>

                  {expanded && (
                    <div className="mt-4 border-t border-dashed border-[#3F382F]/20 pt-4">
                      <h3 className="mb-3 text-xs font-black uppercase tracking-wider">
                        Choose an alternative
                      </h3>

                      <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                        {alternatives.map(({ food: alternative, swap }) => {
                          const isSelected =
                            choice?.type === 'alternative' &&
                            choice.foodId === alternative.id

                          const protein = getProtein(alternative)
                          const cost =
                            alternative.costPerServing ?? alternative.cost

                          return (
                            <button
                              key={`${swap.id}-${alternative.id}`}
                              type="button"
                              onClick={() =>
                                choose(food.id, {
                                  type: 'alternative',
                                  foodId: alternative.id,
                                  swapId: swap.id,
                                })
                              }
                              className={`w-full rounded-xl border p-3 text-left transition-colors ${
                                isSelected
                                  ? 'border-[#73866B] bg-[#A8B99A]/20'
                                  : 'border-[#3F382F]/15 hover:border-[#A8B99A] hover:bg-[#A8B99A]/10'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold">
                                  {alternative.name}
                                </span>

                                <span className="shrink-0 text-xs font-bold text-[#73866B]">
                                  {isSelected ? '✓ SELECTED' : 'SELECT'}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#3F382F]/65">
                                {cost !== undefined && (
                                  <span>
                                    Cost: {formatMoney(cost)}
                                    {alternative.costPerServing !== undefined
                                      ? ' / serving'
                                      : ''}
                                  </span>
                                )}

                                {protein !== undefined && (
                                  <span>
                                    Protein: {protein}g
                                  </span>
                                )}

                                {alternative.environmentalScore !== undefined && (
                                  <span>
                                    Impact score: {alternative.environmentalScore}
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3 border-t border-dashed border-[#3F382F]/20 pt-3">
                        <button
                          type="button"
                          onClick={() =>
                            choose(food.id, { type: 'give-up' })
                          }
                          className="text-xs font-bold underline underline-offset-2"
                        >
                          Go without it
                        </button>
                      </div>

                      <details className="mt-4">
                        <summary className="cursor-pointer text-xs font-bold">
                          Suggest your own alternative
                        </summary>

                        <div className="mt-3 space-y-2">
                          <input
                            value={customText[food.id] ?? ''}
                            onChange={event =>
                              setCustomText(previous => ({
                                ...previous,
                                [food.id]: event.target.value,
                              }))
                            }
                            placeholder="Alternative food"
                            maxLength={120}
                            className="w-full rounded-lg border border-[#3F382F]/20 bg-white p-3 text-sm"
                          />

                          <textarea
                            value={customNotes[food.id] ?? ''}
                            onChange={event =>
                              setCustomNotes(previous => ({
                                ...previous,
                                [food.id]: event.target.value,
                              }))
                            }
                            placeholder="Optional notes"
                            maxLength={500}
                            rows={2}
                            className="w-full resize-y rounded-lg border border-[#3F382F]/20 bg-white p-3 text-sm"
                          />

                          <button
                            type="button"
                            disabled={
                              !customText[food.id]?.trim() ||
                              submittingFood === food.id
                            }
                            onClick={() => submitCustom(food.id)}
                            className="pixel-button text-sm disabled:opacity-50"
                          >
                            {submittingFood === food.id
                              ? 'Submitting...'
                              : 'Submit idea'}
                          </button>
                        </div>
                      </details>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t-2 border-dashed border-[#3F382F]/20 pt-7 sm:flex-row">
          <div>
            <p className="text-sm font-bold">
              {selectedCount} foods decided
            </p>
            <p className="mt-1 text-xs text-[#3F382F]/55">
              {totalPoints} optimization points earned
            </p>
          </div>

          <Link href="/results" className="pixel-button">
            Reveal my impact
          </Link>
        </div>
      </div>
    </main>
  )
}
