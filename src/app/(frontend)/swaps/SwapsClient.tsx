'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  calculateVeganPointsMultiplier,
  isImpactChoiceMap,
  optimizationPointsPer100g,
  veganOptimizationPointsPer100g,
  type ImpactChoice,
} from '@/lib/impact-calculations'
import { isRecord } from '@/lib/guards'
import { isRelevantAnimalFood } from '@/lib/swap-helpers'
import { ImpactGuide } from '@/components/cowculator/impact-guide'
import { PlantFoodExplorer, type PlantFood, type PlantFoodChoice } from './PlantFoodExplorer'

type Food = PlantFood & {
  id: number | string
  name: string
  foodOrigin: string
  swapCategory: string
  animalProductCategory?: string | null
  isActive?: boolean | null
  nutrition?: {
    proteinG?: number | null
    fiberG?: number | null
    ironMg?: number | null
    calciumMg?: number | null
  } | null
  pricing?: { avgCostPer100g?: number | null }
  environmentalImpact?: {
    co2eKg?: number | null
    waterLiters?: number | null
    landM2?: number | null
    impactScorePer100g?: number | null
  } | null
}

type Alternative = { food: Food; swapId: string }

type Group = {
  food: Food
  alternatives: Alternative[]
}

type Choice = ImpactChoice

function isSavedAnswers(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((answer) => typeof answer === 'string')
}

function getProtein(food: Food) {
  return food.nutrition?.proteinG ?? null
}

function getOptimizationPoints(animal: Food, alternative: Food) {
  return optimizationPointsPer100g(animal, alternative)
}

function formatMoney(value?: number | null) {
  if (value === undefined || value === null) return null
  return `$${value.toFixed(2)}`
}

function formatEstimate(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return null
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value)
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
  const [pointsAnimation, setPointsAnimation] = useState<number | null>(null)

  const masonryRef = useRef<HTMLDivElement>(null)
  const openedFoodFromQuery = useRef(false)

  // Ensures rapid selections are saved in order.
  const saveQueue = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem('cowculator-answers')
      const savedChoices = localStorage.getItem('cowculator-swaps')

      if (savedAnswers) {
        const parsedAnswers: unknown = JSON.parse(savedAnswers)
        if (!isSavedAnswers(parsedAnswers)) {
          throw new Error('Your saved questionnaire answers were invalid.')
        }
        setAnswers(parsedAnswers)
      }

      // Load local choices temporarily while the database is loading.
      if (savedChoices) {
        const parsed = JSON.parse(savedChoices)

        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
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

            const accountData = savedData as {
              activeSwaps?: unknown
              quizResponses?: unknown
            }
            const accountChoices = accountData.activeSwaps

            if (!isImpactChoiceMap(accountChoices)) {
              throw new Error('The saved swaps data was invalid.')
            }

            const localChoicesText = localStorage.getItem('cowculator-swaps')
            const parsedLocalChoices: unknown = localChoicesText ? JSON.parse(localChoicesText) : {}

            if (!isImpactChoiceMap(parsedLocalChoices)) {
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

            const localAnswersText = localStorage.getItem('cowculator-answers')
            const parsedLocalAnswers: unknown = localAnswersText
              ? JSON.parse(localAnswersText)
              : null
            if (localAnswersText && !isSavedAnswers(parsedLocalAnswers)) {
              throw new Error('Your saved questionnaire answers were invalid.')
            }
            if (
              (!isSavedAnswers(parsedLocalAnswers) ||
                Object.keys(parsedLocalAnswers).length === 0) &&
              isSavedAnswers(accountData.quizResponses)
            ) {
              setAnswers(accountData.quizResponses)
              localStorage.setItem('cowculator-answers', JSON.stringify(accountData.quizResponses))
            }

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
                  setError(
                    'Your swaps are still saved on this device, but could not sync to your account.',
                  )
                } else {
                  setError('')
                }
              } catch (syncError) {
                console.error('Guest swap sync failed:', syncError)
                setError(
                  'Your swaps are still saved on this device, but could not sync to your account.',
                )
              }
            }
          } else if (savedResponse.status !== 401) {
            const errorBody = await savedResponse.text()

            console.error('Active swaps API error:', {
              status: savedResponse.status,
              body: errorBody,
            })

            throw new Error(`Could not load saved selections (${savedResponse.status}).`)
          }
        } catch (error) {
          console.error('Loading swaps failed:', error)
          setError('We could not load your swaps. Please try again.')
        } finally {
          setLoading(false)
        }
      }

      loadSwaps()
    } catch (error) {
      console.error('Could not load local choices:', error)
      setError('Your saved preferences could not be read. Clear them or retake the questionnaire.')
      setLoading(false)
    }
  }, [])

  // Keep local storage as a backup of the current selections.
  useEffect(() => {
    localStorage.setItem('cowculator-swaps', JSON.stringify(choices))
  }, [choices])

  // Save the complete selection object to the logged-in user's Payload record.
  function persistChoices(nextChoices: Record<string, Choice>) {
    localStorage.setItem('cowculator-swaps', JSON.stringify(nextChoices))

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
        throw new Error(result.error || 'Could not save your selections.')
      }

      setError('')
    })

    saveQueue.current = save.catch((error) => {
      console.error('Saving swaps failed:', error)
      setError('Your selection could not be saved. Check your connection and try again.')
    })
  }

  function markConsidered(foodId: string) {
    if (choices[foodId]) return

    const nextChoices = {
      ...choices,
      [foodId]: { type: 'considered' as const, foodId },
    }
    setChoices(nextChoices)
    persistChoices(nextChoices)
  }

  function markPlantFoodConsidered(foodId: string) {
    const choiceId = `plant:${foodId}`
    if (choices[choiceId]) return

    const nextChoices = {
      ...choices,
      [choiceId]: { type: 'considered' as const, foodId },
    }
    setChoices(nextChoices)
    persistChoices(nextChoices)
  }

  const veganPointsMultiplier = useMemo(() => calculateVeganPointsMultiplier(foods), [foods])

  const pointsEarned = useMemo(() => {
    const foodsById = new Map<string, Food>()
    for (const food of foods) {
      foodsById.set(String(food.id), food)
    }

    const earned: Record<string, number> = {}

    for (const [choiceId, choice] of Object.entries(choices)) {
      if (choice.type === 'plant-alternative') {
        const baseFood = foodsById.get(choice.baseFoodId)
        const alternative = foodsById.get(choice.foodId)
        if (baseFood && alternative) {
          const points = veganOptimizationPointsPer100g(
            baseFood,
            alternative,
            veganPointsMultiplier,
          )
          if (points > 0) earned[choiceId] = points
        }
        continue
      }

      if (choice.type === 'alternative') {
        const animal = foodsById.get(choiceId)
        const alternative = foodsById.get(choice.foodId)

        if (animal?.foodOrigin !== 'animal' || alternative?.foodOrigin !== 'plant') {
          continue
        }

        const points = getOptimizationPoints(animal, alternative)
        if (points > 0) earned[choiceId] = points
      }
    }

    return earned
  }, [foods, choices, veganPointsMultiplier])

  const totalPoints = Object.values(pointsEarned).reduce((sum, points) => sum + points, 0)
  const plantChoices = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(choices).filter(
          (entry): entry is [string, PlantFoodChoice] => entry[1].type === 'plant-alternative',
        ),
      ),
    [choices],
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
        (food) =>
          food.isActive !== false &&
          food.foodOrigin === 'animal' &&
          isRelevantAnimalFood(food, answers),
      )
      .flatMap((food) => {
        const alternatives = alternativesByCategory.get(food.swapCategory) ?? []

        return alternatives.length
          ? [
              {
                food,
                alternatives: alternatives.map((alternative) => ({
                  food: alternative,
                  swapId: `${food.swapCategory}:${food.id}:${alternative.id}`,
                })),
              },
            ]
          : []
      })
  }, [foods, answers])

  // Recalculate masonry row spans whenever cards resize or expand.
  useEffect(() => {
    const container = masonryRef.current
    if (!container) return

    const ROW_HEIGHT = 1
    const ROW_GAP = 8

    const cards = container.querySelectorAll<HTMLElement>('[data-masonry-card]')

    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const card = entry.target as HTMLElement
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height

        const rowSpan = Math.ceil((height + ROW_GAP) / (ROW_HEIGHT + ROW_GAP))

        card.style.gridRowEnd = `span ${rowSpan}`
      })
    })

    cards.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [groups, expandedFoods])

  function toggleExpanded(foodId: string) {
    if (!expandedFoods.includes(foodId)) {
      markConsidered(foodId)
    }

    setExpandedFoods((previous) =>
      previous.includes(foodId) ? previous.filter((id) => id !== foodId) : [...previous, foodId],
    )
  }

  function choose(foodId: string, choice: Choice) {
    if (choice.type === 'alternative' || choice.type === 'plant-alternative') {
      const baseFood =
        choice.type === 'plant-alternative'
          ? foods.find((food) => String(food.id) === choice.baseFoodId)
          : foods.find((food) => String(food.id) === foodId)
      const alternative = foods.find((food) => String(food.id) === choice.foodId)
      const newPoints =
        baseFood && alternative
          ? choice.type === 'plant-alternative'
            ? veganOptimizationPointsPer100g(baseFood, alternative, veganPointsMultiplier)
            : getOptimizationPoints(baseFood, alternative)
          : 0
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

  function choosePlantFood(choice: PlantFoodChoice) {
    choose(`plant:${choice.baseFoodId}`, choice)
  }

  function clearPlantFoodChoice(baseFoodId: string) {
    const nextChoices = {
      ...choices,
      [`plant:${baseFoodId}`]: { type: 'considered' as const, foodId: baseFoodId },
    }
    setChoices(nextChoices)
    persistChoices(nextChoices)
  }

  function submitCustom(foodId: string) {
    const suggestion = customText[foodId]?.trim()
    const notes = customNotes[foodId]?.trim() ?? ''

    if (!suggestion) return

    choose(foodId, { type: 'custom', suggestion, notes })
    setCustomText((previous) => ({ ...previous, [foodId]: '' }))
    setCustomNotes((previous) => ({ ...previous, [foodId]: '' }))
  }

  const selectedCount = Object.values(choices).filter(
    (choice) => choice.type !== 'plant-alternative' && choice.type !== 'considered',
  ).length
  const isVegan = answers.dietPattern === 'Fully plant-based (vegan)'
  const plantFoods = foods.filter((food) => food.isActive !== false && food.foodOrigin === 'plant')

  useEffect(() => {
    if (loading || isVegan) return
    if (openedFoodFromQuery.current) return

    const foodId = new URLSearchParams(window.location.search).get('food')
    openedFoodFromQuery.current = true
    if (!foodId) return

    setExpandedFoods([foodId])
    markConsidered(foodId)
    window.requestAnimationFrame(() => {
      document.getElementById(`swap-food-${foodId}`)?.scrollIntoView({ block: 'center' })
    })
  }, [loading, isVegan])

  if (loading) {
    return <main className="page-shell p-10">Loading your swaps...</main>
  }

  return (
    <main className="page-shell">
      <div
        className={`mx-auto px-4 ${
          isVegan ? 'max-w-[980px] py-5 sm:py-6' : 'max-w-[1180px] py-10 lg:px-8 lg:py-14'
        }`}
      >
        <div
          className={`flex flex-col justify-between sm:flex-row sm:items-end ${
            isVegan ? 'gap-3 sm:gap-4' : 'gap-5'
          }`}
        >
          <div>
            <span className="eyebrow">{isVegan ? 'PLANT-BASED' : 'LEVEL 2 · POWER-UPS'}</span>

            <h1
              className={`mt-2 font-black tracking-tight ${
                isVegan ? 'text-3xl' : 'text-4xl sm:text-6xl'
              }`}
            >
              {isVegan ? (
                <>
                  PLANT-FOOD <span className="text-[#A8B99A]">SWAPS</span>
                </>
              ) : (
                <>
                  CHOOSE YOUR <span className="text-[#A8B99A]">SWAPS</span>
                </>
              )}
            </h1>

            <p
              className={`max-w-xl text-[#3F382F]/65 ${isVegan ? 'mt-1 text-xs' : 'mt-2 text-sm'}`}
            >
              {isVegan
                ? 'Compare plant foods by estimated cost and CO₂e.'
                : 'Small changes. Big movement.'}
            </p>
          </div>

          {isVegan ? (
            <div
              aria-live="polite"
              className="relative shrink-0 rounded-sm border border-[#3F382F]/20 bg-white px-3 py-2 text-xs"
            >
              <b>{totalPoints}</b> game points
              {pointsAnimation !== null && (
                <span className="ml-2 font-bold text-[#73866B]">+{pointsAnimation}</span>
              )}
            </div>
          ) : (
            <div className="relative shrink-0">
              <div className="points-pill flex items-center gap-3">
                <span className="text-xl">★</span>
                <div>
                  <b className="block text-2xl leading-none">{totalPoints}</b>
                  <span className="text-[10px] tracking-wider">OPTIMIZATION PTS</span>
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
          )}
        </div>

        {error && (
          <p role="alert" className="mt-5 text-sm text-red-700">
            {error}
          </p>
        )}

        {isVegan ? (
          <>
            <PlantFoodExplorer
              foods={plantFoods}
              choices={plantChoices}
              pointsMultiplier={veganPointsMultiplier}
              onConsider={markPlantFoodConsidered}
              onChoose={choosePlantFood}
              onClear={clearPlantFoodChoice}
            />
            <ImpactGuide className="mt-6" />
          </>
        ) : groups.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[#3F382F]/20 p-8">
            <h2 className="text-xl font-bold">No matching swaps yet</h2>
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
              const animalCo2 = formatEstimate(food.environmentalImpact?.co2eKg)

              const choice = choices[foodId]
              const expanded = expandedFoods.includes(foodId)

              const selectedAlternative =
                choice?.type === 'alternative'
                  ? alternatives.find((item) => String(item.food.id) === choice.foodId)?.food.name
                  : null

              return (
                <article
                  key={food.id}
                  id={`swap-food-${foodId}`}
                  data-masonry-card
                  className={`swap-card min-w-0 self-start overflow-hidden transition-all duration-200 ${
                    expanded ? 'ring-2 ring-[#A8B99A]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="pixel-label">FOOD TO EXPLORE</span>

                      <h2 className="mt-1 truncate text-xl font-black sm:text-2xl">{food.name}</h2>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#3F382F]/65">
                        {animalCost != null && <span>Cost: {formatMoney(animalCost)} / 100 g</span>}
                        {animalCo2 != null && (
                          <span>Climate footprint: {animalCo2} kg CO₂e / 100 g</span>
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
                      aria-label={expanded ? 'Close swaps' : `Explore swaps for ${food.name}`}
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
                            choice?.type === 'alternative' && choice.foodId === alternativeId

                          const protein = getProtein(alternative)
                          const cost = alternative.pricing?.avgCostPer100g

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
                                <span className="text-sm font-bold">{alternative.name}</span>

                                <span className="shrink-0 text-xs font-bold text-[#73866B]">
                                  {isSelected ? '✓ SELECTED' : 'SELECT'}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#3F382F]/65">
                                {cost != null && (
                                  <span>
                                    {cost != null && <span>Cost: {formatMoney(cost)} / 100 g</span>}
                                  </span>
                                )}

                                {protein != null && <span>Protein: {protein}g</span>}

                                {alternative.environmentalImpact?.co2eKg != null && (
                                  <span>
                                    Climate footprint:{' '}
                                    {formatEstimate(alternative.environmentalImpact.co2eKg)} kg CO₂e
                                    / 100 g
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
                          onClick={() => choose(foodId, { type: 'give-up' })}
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
                            onChange={(event) =>
                              setCustomText((previous) => ({
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
                            onChange={(event) =>
                              setCustomNotes((previous) => ({
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
                            disabled={!customText[foodId]?.trim()}
                            onClick={() => submitCustom(foodId)}
                            className="pixel-button text-sm disabled:opacity-50"
                          >
                            Use my idea
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

        {isVegan ? (
          <div className="mt-7 flex justify-center border-t-2 border-dashed border-[#3F382F]/20 pt-5">
            <Link href="/dashboard" className="pixel-button">
              View my dashboard
            </Link>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t-2 border-dashed border-[#3F382F]/20 pt-7 sm:flex-row">
            <div>
              <p className="text-sm font-bold">{selectedCount} foods decided</p>
              <p className="mt-1 text-xs text-[#3F382F]/55">
                {totalPoints} optimization points earned
              </p>
            </div>

            <Link href="/results" className="pixel-button">
              Reveal my impact
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
