'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { veganOptimizationPointsPer100g } from '@/lib/impact-calculations'

type SourceReference =
  | number
  | {
      id: number
      title?: string
      url?: string | null
      doi?: string | null
    }

export type PlantFood = {
  id: number | string
  name: string
  description?: string | null
  foodOrigin: string
  swapCategory?: string | null
  isActive?: boolean | null
  foodCategory?: string | null
  nutrition?: {
    proteinG?: number | null
  } | null
  environmentalImpact?: {
    co2eKg?: number | null
    waterLiters?: number | null
    landM2?: number | null
    impactScorePer100g?: number | null
  } | null
  pricing?: {
    avgCostPer100g?: number | null
  } | null
  affiliateUrl?: string | null
  affiliateLabel?: string | null
  sources?: SourceReference[] | null
}

export type PlantFoodChoice = {
  type: 'plant-alternative'
  baseFoodId: string
  foodId: string
}

type PlantFoodChoices = Record<string, PlantFoodChoice | undefined>

function categoryName(category: string | null | undefined) {
  return category
    ? category.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Other'
}

function format(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value)
}

function formatDelta(value: number | null | undefined, unit = '') {
  if (value == null || !Number.isFinite(value)) return '—'
  const amount = unit === '$' ? `$${format(Math.abs(value))}` : `${format(Math.abs(value))}${unit}`
  return `${value > 0 ? '+' : value < 0 ? '−' : ''}${amount}`
}

function sourceLink(source: SourceReference) {
  if (typeof source === 'number') return null
  const href = source.url || (source.doi ? `https://doi.org/${source.doi}` : null)
  return href ? { href, title: source.title || 'Source' } : null
}

function affiliateLink(food: PlantFood) {
  if (!food.affiliateUrl || !food.affiliateLabel) return null

  try {
    const url = new URL(food.affiliateUrl)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return { href: url.toString(), label: food.affiliateLabel }
  } catch {
    return null
  }
}

function compareNullable(a: number | null | undefined, b: number | null | undefined) {
  if (a == null || !Number.isFinite(a)) return b == null || !Number.isFinite(b) ? 0 : 1
  if (b == null || !Number.isFinite(b)) return -1
  return a - b
}

export function PlantFoodExplorer({
  foods,
  choices,
  pointsMultiplier,
  onConsider,
  onChoose,
  onClear,
}: {
  foods: PlantFood[]
  choices: PlantFoodChoices
  pointsMultiplier: number
  onConsider: (baseFoodId: string) => void
  onChoose: (choice: PlantFoodChoice) => void
  onClear: (baseFoodId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('impact')
  const [currentFoodId, setCurrentFoodId] = useState('')
  const [page, setPage] = useState(0)
  const requestedFoodId = useRef<string | null>(null)
  const handledRequestedFood = useRef(false)
  const pageSize = 6

  const categories = useMemo(
    () => [...new Set(foods.map((food) => food.foodCategory || 'other'))].sort(),
    [foods],
  )

  useEffect(() => {
    if (!handledRequestedFood.current && foods.length > 0) {
      requestedFoodId.current = new URLSearchParams(window.location.search).get('food')
      handledRequestedFood.current = true

      if (requestedFoodId.current && foods.some((food) => String(food.id) === requestedFoodId.current)) {
        setCurrentFoodId(requestedFoodId.current)
        onConsider(requestedFoodId.current)
        setPage(0)
        return
      }
    }

    if (foods.some((food) => String(food.id) === currentFoodId)) return

    const savedChoice = Object.values(choices).find(
      (choice) =>
        choice?.type === 'plant-alternative' &&
        foods.some((food) => String(food.id) === choice.baseFoodId),
    )
    const nextFoodId = savedChoice?.baseFoodId ?? String(foods[0]?.id ?? '')
    setCurrentFoodId(nextFoodId)
    if (nextFoodId) onConsider(nextFoodId)
  }, [foods, choices, currentFoodId, onConsider])

  const currentFood = foods.find((food) => String(food.id) === currentFoodId)
  const selectedChoice = choices[`plant:${currentFoodId}`]
  const selectedFoodId =
    selectedChoice?.baseFoodId === currentFoodId ? selectedChoice.foodId : undefined

  const filteredFoods = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = foods
      .filter((food) => String(food.id) !== currentFoodId)
      .filter((food) => category === 'all' || (food.foodCategory || 'other') === category)
      .filter(
        (food) =>
          !normalizedQuery ||
          food.name.toLowerCase().includes(normalizedQuery) ||
          food.description?.toLowerCase().includes(normalizedQuery),
      )

    return filtered.sort((a, b) => {
      if (sort === 'cost') {
        return compareNullable(a.pricing?.avgCostPer100g, b.pricing?.avgCostPer100g)
      }
      if (sort === 'name') return a.name.localeCompare(b.name)
      return compareNullable(a.environmentalImpact?.co2eKg, b.environmentalImpact?.co2eKg)
    })
  }, [foods, currentFoodId, category, query, sort])

  const pageCount = Math.ceil(filteredFoods.length / pageSize)
  const currentPage = Math.min(page, Math.max(0, pageCount - 1))
  const pageFoods = filteredFoods.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  const hasAffiliateLinks = pageFoods.some((food) => affiliateLink(food))

  function chooseCategory(value: string) {
    setCategory(value)
    setPage(0)
  }

  return (
    <section aria-labelledby="plant-foods-heading" className="mt-5">
      <div className="mb-3">
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="plant-foods-heading" className="text-lg font-black sm:text-xl">
            Choose a swap
          </h2>
          <p className="text-[11px] text-[#3F382F]/60">
            Cost · CO₂e ·{' '}
            <span
              title="The point scale balances the average positive plant swap against the average eligible animal-to-plant swap."
            >
              ×{format(pointsMultiplier, 1)} point scale
            </span>
          </p>
        </div>
      </div>

      {foods.length > 0 ? (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <label className="min-w-0 text-[10px] font-bold">
              CURRENT FOOD
              <select
                value={currentFoodId}
                onChange={(event) => {
                  onConsider(event.target.value)
                  setCurrentFoodId(event.target.value)
                  setPage(0)
                }}
                className="mt-1 w-full min-w-0 rounded-sm border border-[#3F382F]/20 bg-white px-2 py-2 text-xs"
              >
                {foods.map((food) => (
                  <option key={food.id} value={String(food.id)}>
                    {food.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0 text-[10px] font-bold">
              SEARCH
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(0)
                }}
                placeholder="Tofu, lentils…"
                className="mt-1 w-full min-w-0 rounded-sm border border-[#3F382F]/20 bg-white px-2 py-2 text-xs"
              />
            </label>

            <label className="col-span-2 text-[10px] font-bold sm:col-span-1">
              SORT
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value)
                  setPage(0)
                }}
                className="mt-1 w-full rounded-sm border border-[#3F382F]/20 bg-white px-2 py-2 text-xs"
              >
                <option value="impact">Lowest footprint</option>
                <option value="cost">Lowest cost</option>
                <option value="name">Name A–Z</option>
              </select>
            </label>
          </div>

          <div className="mb-3 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by category">
            <button
              type="button"
              aria-pressed={category === 'all'}
              onClick={() => chooseCategory('all')}
              className={`leader-tab shrink-0 ${category === 'all' ? 'active' : ''}`}
            >
              All
            </button>
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={category === item}
                onClick={() => chooseCategory(item)}
                className={`leader-tab shrink-0 ${category === item ? 'active' : ''}`}
              >
                {categoryName(item)}
              </button>
            ))}
          </div>

          {selectedFoodId && currentFood && (
            <div className="mb-3 flex items-center justify-between gap-2 text-xs">
              <span className="truncate">
                Swapping <b>{currentFood.name}</b> for{' '}
                <b>{foods.find((food) => String(food.id) === selectedFoodId)?.name}</b>
              </span>
              <button
                type="button"
                onClick={() => onClear(currentFoodId)}
                className="shrink-0 underline"
              >
                Clear
              </button>
            </div>
          )}

          {pageFoods.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {pageFoods.map((food) => {
                const foodId = String(food.id)
                const points =
                  currentFood && veganOptimizationPointsPer100g(
                    currentFood,
                    food,
                    pointsMultiplier,
                  )
                const co2Delta =
                  currentFood?.environmentalImpact?.co2eKg == null ||
                  food.environmentalImpact?.co2eKg == null
                    ? null
                    : food.environmentalImpact.co2eKg - currentFood.environmentalImpact.co2eKg
                const costDelta =
                  currentFood?.pricing?.avgCostPer100g == null ||
                  food.pricing?.avgCostPer100g == null
                    ? null
                    : food.pricing.avgCostPer100g - currentFood.pricing.avgCostPer100g
                const sources = food.sources
                  ?.map(sourceLink)
                  .filter((source): source is { href: string; title: string } => source !== null)
                const retailer = affiliateLink(food)
                const isSelected = selectedFoodId === foodId

                return (
                  <article
                    key={food.id}
                    className="flex min-w-0 flex-col rounded-sm border border-[#3F382F]/15 bg-white p-2"
                  >
                    <span className="pixel-label truncate">{categoryName(food.foodCategory)}</span>
                    <h3 className="mt-1 min-h-8 line-clamp-2 text-sm font-black leading-4">
                      {food.name}
                    </h3>

                    <div className="mt-1.5 space-y-0.5 text-[11px] leading-4">
                      <p className="truncate">
                        <span className="text-[#3F382F]/60">CO₂e </span>
                        <b>{formatDelta(co2Delta, ' kg')}</b>
                      </p>
                      <p className="truncate">
                        <span className="text-[#3F382F]/60">Cost </span>
                        <b>{formatDelta(costDelta, '$')}</b>
                      </p>
                      <p className="truncate">
                        <span className="text-[#3F382F]/60">Points </span>
                        <b>{points ? `+${points}` : '0'}</b>
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!currentFood || isSelected}
                      onClick={() =>
                        onChoose({
                          type: 'plant-alternative',
                          baseFoodId: currentFoodId,
                          foodId,
                        })
                      }
                      className="pixel-button plant-food-swap-button mt-2 w-full justify-center px-2 py-1.5 text-xs disabled:opacity-55"
                    >
                      {isSelected ? 'Selected' : 'Swap'}
                    </button>

                    {(sources?.length || retailer) && (
                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                        {sources && sources.length > 0 ? (
                          <details className="min-w-0">
                            <summary className="cursor-pointer truncate underline">Sources</summary>
                            <ul className="mt-1 space-y-1">
                              {sources.map((source) => (
                                <li key={source.href}>
                                  <a
                                    href={source.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline"
                                  >
                                    {source.title}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          <span />
                        )}
                        {retailer && (
                          <a
                            href={retailer.href}
                            target="_blank"
                            rel="sponsored nofollow noreferrer"
                            className="truncate font-bold underline"
                          >
                            {retailer.label}
                          </a>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="rounded-sm border border-[#3F382F]/15 bg-white p-4 text-sm">
              No matches. Try another search.
            </p>
          )}

          {pageCount > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs">
              <span>
                {filteredFoods.length} foods · {currentPage + 1}/{pageCount}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                  className="leader-tab disabled:opacity-45"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setPage(currentPage + 1)}
                  className="leader-tab disabled:opacity-45"
                >
                  More
                </button>
              </div>
            </div>
          )}

          <p className="mt-3 text-[10px] leading-4 text-[#3F382F]/55">
            Negative deltas are lower. Estimates are category-level, not product-specific.
            {hasAffiliateLinks && ' Affiliate links may earn Cowculator a commission.'}
          </p>
        </>
      ) : (
        <p className="border border-[#3F382F]/15 bg-white p-4 text-sm">
          No plant foods are available right now.
        </p>
      )}
    </section>
  )
}
