import { isRecord } from './guards'

export type ImpactValues = {
  co2eSaved: number
  waterSaved: number
  landSaved: number
  animalsSpared: number
}

export type ImpactChoice =
  | { type: 'alternative'; foodId: string; swapId: string }
  | { type: 'plant-alternative'; baseFoodId: string; foodId: string }
  | { type: 'considered'; foodId: string }
  | { type: 'give-up' }
  | { type: 'custom'; suggestion: string; notes?: string }

// Keep validation shared across API, browser-cache, and impact-view boundaries.
export function isImpactChoice(value: unknown): value is ImpactChoice {
  if (!isRecord(value)) return false
  const choice = value

  if (choice.type === 'give-up') return true

  if (choice.type === 'alternative') {
    return typeof choice.foodId === 'string' && typeof choice.swapId === 'string'
  }

  if (choice.type === 'plant-alternative') {
    return typeof choice.baseFoodId === 'string' && typeof choice.foodId === 'string'
  }

  if (choice.type === 'considered') {
    return typeof choice.foodId === 'string'
  }

  return (
    choice.type === 'custom' &&
    typeof choice.suggestion === 'string' &&
    (choice.notes === undefined || typeof choice.notes === 'string')
  )
}

export function isImpactChoiceMap(value: unknown): value is Record<string, ImpactChoice> {
  return isRecord(value) && Object.values(value).every(isImpactChoice)
}

export type ImpactFood = {
  id: number | string
  isActive?: boolean | null
  foodOrigin?: string | null
  swapCategory?: string | null
  animalProductCategory?: string | null
  servingSize?: number | null
  servingUnit?: string | null
  environmentalImpact?: {
    co2eKg?: number | null
    waterLiters?: number | null
    landM2?: number | null
    impactScorePer100g?: number | null
  } | null
}

export type LeaderboardScores = {
  environmentalScore: number
  animalImpactScore: number
  plantBasedScore: number
  optimizationPoints: number
  referralPoints: number
  combinedScore: number
}

const questionByAnimalCategory: Record<string, string> = {
  beef: 'redMeat',
  pork: 'redMeat',
  poultry: 'poultry',
  fish: 'seafood',
  seafood: 'seafood',
  dairy: 'dairy',
  eggs: 'eggs',
}

export function hasAnimalFrequencyAnswers(value: unknown): boolean {
  if (!isRecord(value)) return false
  const answers = value
  return ['redMeat', 'poultry', 'seafood', 'dairy', 'eggs'].some(
    (key) => typeof answers[key] === 'string',
  )
}

export function isFullyPlantBased(value: unknown): boolean {
  return isRecord(value) && value.dietPattern === 'Fully plant-based (vegan)'
}

export function annualServings(
  category: string | null | undefined,
  quizResponses: unknown,
): number {
  if (!category || !isRecord(quizResponses)) return 0

  const question = questionByAnimalCategory[category]
  if (!question) return 0

  const answer = quizResponses[question]

  // Weekly ranges use their midpoint to estimate annual servings.
  switch (answer) {
    case 'Daily':
      return 365
    case '3–4 times a week':
      return 182
    case '1–2 times a week':
      return 78
    case 'About once a month':
      return 12
    case 'A few times a week':
      return 156
    case 'Occasionally':
      return 52
    default:
      return 0
  }
}

function finiteDifference(
  animalValue: number | null | undefined,
  plantValue: number | null | undefined,
): number {
  if (
    animalValue == null ||
    plantValue == null ||
    !Number.isFinite(animalValue) ||
    !Number.isFinite(plantValue)
  ) {
    return 0
  }

  return animalValue - plantValue
}

function portionScale(food: ImpactFood): number | null {
  if (food.servingUnit && food.servingUnit !== 'g') return null
  if (food.servingSize == null) return 1
  if (!Number.isFinite(food.servingSize) || food.servingSize <= 0) return null
  return food.servingSize / 100
}

// Both estimate bases share the same food checks and impact differences; only their scale varies.
function calculateAnimalSwapImpact(
  choices: Record<string, ImpactChoice>,
  foods: ImpactFood[],
  getScale: (animal: ImpactFood) => number | null,
): { projectedImpact: ImpactValues; qualifyingSwaps: number } {
  const foodsById = new Map(foods.map((food) => [String(food.id), food]))
  const projectedImpact: ImpactValues = {
    co2eSaved: 0,
    waterSaved: 0,
    landSaved: 0,
    animalsSpared: 0,
  }
  let qualifyingSwaps = 0

  for (const [animalId, choice] of Object.entries(choices)) {
    if (choice.type !== 'alternative') continue

    const animal = foodsById.get(animalId)
    const plant = foodsById.get(choice.foodId)
    if (animal?.foodOrigin !== 'animal' || plant?.foodOrigin !== 'plant') continue

    const scale = getScale(animal)
    if (scale === null) continue

    qualifyingSwaps += 1
    projectedImpact.co2eSaved +=
      finiteDifference(animal.environmentalImpact?.co2eKg, plant.environmentalImpact?.co2eKg) *
      scale
    projectedImpact.waterSaved +=
      finiteDifference(
        animal.environmentalImpact?.waterLiters,
        plant.environmentalImpact?.waterLiters,
      ) * scale
    projectedImpact.landSaved +=
      finiteDifference(animal.environmentalImpact?.landM2, plant.environmentalImpact?.landM2) *
      scale
  }

  return { projectedImpact, qualifyingSwaps }
}

export function calculateProjectedImpact(
  choices: Record<string, ImpactChoice>,
  foods: ImpactFood[],
  quizResponses: unknown,
): { projectedImpact: ImpactValues; qualifyingSwaps: number } {
  return calculateAnimalSwapImpact(choices, foods, (animal) => {
    const servings = annualServings(animal.animalProductCategory, quizResponses)
    const portion = portionScale(animal)

    return servings === 0 || portion === null ? null : servings * portion
  })
}

export function calculatePer100gImpact(
  choices: Record<string, ImpactChoice>,
  foods: ImpactFood[],
): { projectedImpact: ImpactValues; qualifyingSwaps: number } {
  return calculateAnimalSwapImpact(choices, foods, () => 1)
}

export function optimizationPointsPer100g(animal: ImpactFood, plant: ImpactFood): number {
  const difference = finiteDifference(
    animal.environmentalImpact?.impactScorePer100g,
    plant.environmentalImpact?.impactScorePer100g,
  )

  return Math.max(0, Math.round(difference * 10))
}

// Balance average plant-to-plant optimization points against positive animal-to-plant options.
export function calculateVeganPointsMultiplier(foods: ImpactFood[]): number {
  const activeFoods = foods.filter((food) => food.isActive !== false)
  const animals = activeFoods.filter((food) => food.foodOrigin === 'animal')
  const plants = activeFoods.filter((food) => food.foodOrigin === 'plant')
  const animalSwapPoints: number[] = []
  const plantSwapImpactPoints: number[] = []

  for (const animal of animals) {
    for (const plant of plants) {
      if (!animal.swapCategory || animal.swapCategory !== plant.swapCategory) continue

      const points = optimizationPointsPer100g(animal, plant)
      if (points > 0) animalSwapPoints.push(points + 10)
    }
  }

  for (const baseFood of plants) {
    for (const alternative of plants) {
      if (String(baseFood.id) === String(alternative.id)) continue

      const impactPoints =
        finiteDifference(
          baseFood.environmentalImpact?.impactScorePer100g,
          alternative.environmentalImpact?.impactScorePer100g,
        ) * 10
      if (impactPoints > 0) plantSwapImpactPoints.push(impactPoints)
    }
  }

  const averageAnimalSwapPoints =
    animalSwapPoints.reduce((sum, points) => sum + points, 0) / animalSwapPoints.length
  const averagePlantImpactPoints =
    plantSwapImpactPoints.reduce((sum, points) => sum + points, 0) / plantSwapImpactPoints.length

  if (
    animalSwapPoints.length === 0 ||
    plantSwapImpactPoints.length === 0 ||
    !Number.isFinite(averageAnimalSwapPoints) ||
    !Number.isFinite(averagePlantImpactPoints) ||
    averagePlantImpactPoints <= 0
  ) {
    return 1
  }

  return averageAnimalSwapPoints / averagePlantImpactPoints
}

export function veganOptimizationPointsPer100g(
  baseFood: ImpactFood,
  alternative: ImpactFood,
  multiplier: number,
): number {
  if (
    baseFood.foodOrigin !== 'plant' ||
    alternative.foodOrigin !== 'plant' ||
    String(baseFood.id) === String(alternative.id) ||
    baseFood.isActive === false ||
    alternative.isActive === false
  ) {
    return 0
  }

  const impactPoints =
    finiteDifference(
      baseFood.environmentalImpact?.impactScorePer100g,
      alternative.environmentalImpact?.impactScorePer100g,
    ) * 10
  if (impactPoints <= 0) return 0

  const safeMultiplier = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1
  return Math.max(1, Math.round(impactPoints * safeMultiplier))
}

export function calculateLeaderboardScores(
  choices: Record<string, ImpactChoice>,
  foods: ImpactFood[],
): LeaderboardScores {
  const foodsById = new Map(foods.map((food) => [String(food.id), food]))
  let co2eSavedPer100g = 0
  let plantBasedScore = 0
  let optimizationPoints = 0
  let veganMultiplier: number | undefined

  for (const [choiceId, choice] of Object.entries(choices)) {
    if (choice.type === 'plant-alternative') {
      if (choiceId !== `plant:${choice.baseFoodId}`) continue

      const baseFood = foodsById.get(choice.baseFoodId)
      const alternative = foodsById.get(choice.foodId)
      if (!baseFood || !alternative) continue

      veganMultiplier ??= calculateVeganPointsMultiplier(foods)
      optimizationPoints += veganOptimizationPointsPer100g(baseFood, alternative, veganMultiplier)
      continue
    }

    if (choice.type !== 'alternative') continue

    const animal = foodsById.get(choiceId)
    const plant = foodsById.get(choice.foodId)
    if (animal?.foodOrigin !== 'animal' || plant?.foodOrigin !== 'plant') continue

    co2eSavedPer100g += Math.max(
      0,
      finiteDifference(animal.environmentalImpact?.co2eKg, plant.environmentalImpact?.co2eKg),
    )
    plantBasedScore += 10
    optimizationPoints += optimizationPointsPer100g(animal, plant)
  }

  const environmentalScore = Math.round(co2eSavedPer100g * 100)
  const referralPoints = 0

  return {
    environmentalScore,
    animalImpactScore: 0,
    plantBasedScore,
    optimizationPoints,
    referralPoints,
    combinedScore: plantBasedScore + optimizationPoints + referralPoints,
  }
}
