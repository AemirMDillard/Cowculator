
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

type Food = {
  id: number | string
  name: string
  foodOrigin: string
  swapCategory: string
  animalProductCategory?: string | null
  isActive?: boolean | null
  nutrition?: { proteinG?: number | null }
  pricing?: { avgCostPer100g?: number | null }
  environmentalImpact?: { impactScorePer100g?: number | null }
}

type Alternative = { food: Food; swapId: string }

type Group = {
  food: Food
  alternatives: Alternative[]
}


type Choice =
  | { type: 'alternative'; foodId: string; swapId: string }
  | { type: 'give-up' }
  | { type: 'custom'; suggestion: string; notes?: string }


function isSavedChoice(value: unknown): value is Choice {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const choice = value as Record<string, unknown>

  if (choice.type === 'give-up') return true

  if (choice.type === 'alternative') {
    return (
      typeof choice.foodId === 'string' &&
      typeof choice.swapId === 'string'
    )
  }

  return (
    choice.type === 'custom' &&
    typeof choice.suggestion === 'string' &&
    (choice.notes === undefined || typeof choice.notes === 'string')
  )
}

function isSavedChoiceMap(value: unknown): value is Record<string, Choice> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value).every(isSavedChoice)
  )
}

const questionForCategory: Record<string, string> = {
  beef: 'redMeat',
  pork: 'redMeat',
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


function getProtein(food: Food) {
  return food.nutrition?.proteinG ?? null
}

function getOptimizationPoints(animal: Food, alternative: Food) {
  const animalScore = animal.environmentalImpact?.impactScorePer100g 
  const alternativeScore = alternative.environmentalImpact?.impactScorePer100g

  if (animalScore == null || alternativeScore == null) return 0

  return Math.max(0, Number((animalScore - alternativeScore).toFixed(2)))
}

function formatMoney(value?: number | null) {
  if (value === undefined || value === null) return null
  return `$${value.toFixed(2)}`
}

export function SwapsClient() {
  const [foods, setFoods] = useState<Food[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [choices, setChoices] = useState<Record<string, Choice>>({})
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


    async function loadSwaps() {
      try {
        const [foodsResponse, savedResponse] = await Promise.all([
          fetch('/api/foods'),
          fetch('/api/active-swaps'),
        ])

        if (!foodsResponse.ok) {
          throw new Error('Could not load foods.')
        }

        const foodsData = await foodsResponse.json()
        setFoods(foodsData.docs ?? [])

if (savedResponse.ok) {
  const savedData: unknown = await savedResponse.json()

  if (!savedData || typeof savedData !== 'object' || Array.isArray(savedData)) {
    throw new Error('The saved swaps response was invalid.')
  }

  const accountChoices = (
    savedData as { activeSwaps?: unknown }
  ).activeSwaps

  if (!isSavedChoiceMap(accountChoices)) {
    throw new Error('The saved swaps data was invalid.')
  }

  const localChoicesText = localStorage.getItem('cowculator-swaps')
  const parsedLocalChoices: unknown = localChoicesText
    ? JSON.parse(localChoicesText)
    : {}

  if (!isSavedChoiceMap(parsedLocalChoices)) {
    throw new Error('Your saved guest swaps were invalid.')
  }

  // Local choices win for the same food; account-only choices are preserved.
  const mergedChoices = { ...accountChoices, ...parsedLocalChoices }
  const hasGuestChanges = Object.entries(parsedLocalChoices).some(
    ([foodId, choice]) =>
      JSON.stringify(accountChoices[foodId]) !== JSON.stringify(choice),
  )

  setChoices(mergedChoices)
  localStorage.setItem('cowculator-swaps', JSON.stringify(mergedChoices))

  if (hasGuestChanges) {
    try {
      const syncResponse = await fetch('/api/active-swaps', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeSwaps: mergedChoices }),
      })

      if (!syncResponse.ok) {
        const details = await syncResponse.text()
        console.error('Guest swap sync failed:', {
          status: syncResponse.status,
          details,
        })
        setError('Your swaps are still saved on this device, but could not sync to your account.')
      } else {
        setError('')
      }
    } catch (syncError) {
      console.error('Guest swap sync failed:', syncError)
      setError('Your swaps are still saved on this device, but could not sync to your account.')
    }
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

    loadSwaps() } catch (error) {
  console.error('Could not load local choices:', error)
}
  }, []) 

  // Keep local storage as a backup of the current selections.
  useEffect(() => {
    localStorage.setItem('cowculator-swaps', JSON.stringify(choices))
  }, [choices])

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

    // Guests save locally, not in Payload.
    if (response.status === 401) {
      return
    }

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

  const pointsEarned = useMemo(() => {
  const foodsById = new Map<string, Food>()
  for (const food of foods) {
    foodsById.set(String(food.id), food)
  }

  const earned: Record<string, number> = {}

  for (const [animalId, choice] of Object.entries(choices)) {
    if (choice.type !== 'alternative') continue

    const animal = foodsById.get(animalId)
    const alternative = foodsById.get(choice.foodId)

    if (animal?.foodOrigin !== 'animal' || alternative?.foodOrigin !== 'plant') {
      continue
    }

    const points = getOptimizationPoints(animal, alternative)
    if (points > 0) earned[animalId] = points
  }

  return earned
}, [foods, choices])

  const totalPoints = Object.values(pointsEarned).reduce(
  (sum, points) => sum + Math.round(points * 10),
  0
)

const groups = useMemo(() => {
  const alternativesByCategory = new Map<string, Food[]>()

  for (const food of foods) {
    if (food.isActive === false || food.foodOrigin !== 'plant') continue

    const alternatives = alternativesByCategory.get(food.swapCategory) ?? []
    alternatives.push(food)
    alternativesByCategory.set(food.swapCategory, alternatives)
  }

  return foods
    .filter(
      food =>
        food.isActive !== false &&
        food.foodOrigin === 'animal' &&
        isRelevant(food, answers),
    )
    .flatMap(food => {
      const alternatives = alternativesByCategory.get(food.swapCategory) ?? []

      return alternatives.length
        ? [{
            food,
            alternatives: alternatives.map(alternative => ({
              food: alternative,
              swapId: `${food.swapCategory}:${food.id}:${alternative.id}`,
            })),
          }]
        : []
    })
}, [foods, answers])

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
    if (choice.type === 'alternative') {
      const animal = foods.find(food => String(food.id) === foodId)
      const alternative = foods.find(food => String(food.id) === choice.foodId)
      const newPoints =
        animal && alternative ? getOptimizationPoints(animal, alternative) : 0
      const increase = newPoints - (pointsEarned[foodId] ?? 0)

      if (increase > 0) {
        setPointsAnimation(increase)
        window.setTimeout(() => setPointsAnimation(null), 1200)
      }
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
              const foodId = String(food.id)
              const animalCost = food.pricing?.avgCostPer100g
              const animalImpact = food.environmentalImpact?.impactScorePer100g
              
              const choice = choices[foodId]    
              const expanded = expandedFoods.includes(foodId)

              const selectedAlternative =
                choice?.type === 'alternative'
                  ? alternatives.find(
                      item => String(item.food.id) === choice.foodId
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
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#3F382F]/65">
                        {animalCost != null && (
                          <span>Cost: {formatMoney(animalCost)} / 100 g</span>
                        )}
                        {animalImpact != null && (
                          <span>Impact score: {animalImpact}</span>
                        )}
                      </div>

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
                      onClick={() => toggleExpanded(foodId)}
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
                        {alternatives.map(({ food: alternative, swapId }) => {
                          const alternativeId = String(alternative.id)
                          const isSelected =
                            choice?.type === 'alternative' &&
                            choice.foodId === alternativeId

                          const protein = getProtein(alternative)
                          const cost =
                            alternative.pricing?.avgCostPer100g

                          return (
                            <button
                              key={`${swapId}-${alternative.id}`}
                              type="button"
                              onClick={() =>
                                choose(foodId, {
                                  type: 'alternative',
                                  foodId: alternativeId,
                                  swapId: swapId,
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
                                {cost != null && (
                                  <span>
                                  
                                    {cost != null && (
                                      <span>Cost: {formatMoney(cost)} / 100 g</span>
                                    )}
                                  </span>
                                )}

                                {protein != null && (
                                  <span>
                                    Protein: {protein}g
                                  </span>
                                )}

                                {alternative.environmentalImpact?.impactScorePer100g != null && (
                                  <span>
                                    Impact score: {alternative.environmentalImpact?.impactScorePer100g}
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
                            choose(foodId, { type: 'give-up' })
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
                            value={customText[foodId] ?? ''}
                            onChange={event =>
                              setCustomText(previous => ({
                                ...previous,
                                [foodId]: event.target.value,
                              }))
                            }
                            placeholder="Alternative food"
                            maxLength={120}
                            className="w-full rounded-lg border border-[#3F382F]/20 bg-white p-3 text-sm"
                          />

                          <textarea
                            value={customNotes[foodId] ?? ''}
                            onChange={event =>
                              setCustomNotes(previous => ({
                                ...previous,
                                [foodId]: event.target.value,
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
                              !customText[foodId]?.trim() ||
                              submittingFood === foodId
                            }
                            onClick={() => submitCustom(foodId)}
                            className="pixel-button text-sm disabled:opacity-50"
                          >
                            {submittingFood === foodId
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
