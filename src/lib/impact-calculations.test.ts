import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculatePer100gImpact,
  calculateLeaderboardScores,
  calculateProjectedImpact,
  calculateVeganPointsMultiplier,
  isImpactChoice,
  isImpactChoiceMap,
  type ImpactFood,
  veganOptimizationPointsPer100g,
} from './impact-calculations'

const foods: ImpactFood[] = [
  {
    id: 'beef',
    foodOrigin: 'animal',
    swapCategory: 'beef',
    environmentalImpact: { impactScorePer100g: 50 },
  },
  {
    id: 'lentils',
    foodOrigin: 'plant',
    swapCategory: 'beef',
    environmentalImpact: { impactScorePer100g: 10 },
  },
  {
    id: 'beans',
    foodOrigin: 'plant',
    swapCategory: 'beef',
    environmentalImpact: { impactScorePer100g: 0 },
  },
]

test('amplifies average positive plant swaps to match average animal swap points', () => {
  const multiplier = calculateVeganPointsMultiplier(foods)
  const veganPoints = veganOptimizationPointsPer100g(foods[1], foods[2], multiplier)
  const veganScore = calculateLeaderboardScores(
    {
      'plant:lentils': {
        type: 'plant-alternative',
        baseFoodId: 'lentils',
        foodId: 'beans',
      },
    },
    foods,
  )

  assert.equal(multiplier, 4.6)
  assert.equal(veganPoints, 460)
  assert.equal(veganScore.optimizationPoints, 460)
  assert.equal(veganScore.combinedScore, 460)
})

test('does not award vegan impact points when the alternative has no CO2e improvement', () => {
  const higherImpactFood: ImpactFood = {
    id: 'higher-impact',
    foodOrigin: 'plant',
    swapCategory: 'beef',
    environmentalImpact: { impactScorePer100g: 20 },
  }

  assert.equal(
    veganOptimizationPointsPer100g(
      foods[1],
      higherImpactFood,
      calculateVeganPointsMultiplier(foods),
    ),
    0,
  )
})

test('considered foods do not count as active swaps or earn points', () => {
  const scores = calculateLeaderboardScores(
    {
      beef: { type: 'considered', foodId: 'beef' },
      'plant:lentils': { type: 'considered', foodId: 'lentils' },
    },
    foods,
  )

  assert.equal(scores.plantBasedScore, 0)
  assert.equal(scores.optimizationPoints, 0)
  assert.equal(scores.combinedScore, 0)
})

test('validates impact choices consistently before they are used', () => {
  assert.equal(isImpactChoice({ type: 'alternative', foodId: 'tofu', swapId: 'beef' }), true)
  assert.equal(
    isImpactChoice({ type: 'plant-alternative', baseFoodId: 'beans', foodId: 'tofu' }),
    true,
  )
  assert.equal(isImpactChoice({ type: 'custom', suggestion: 'Try lentils', notes: 42 }), false)
  assert.equal(
    isImpactChoiceMap({
      beef: { type: 'alternative', foodId: 'tofu', swapId: 'beef' },
      'plant:beans': { type: 'plant-alternative', baseFoodId: 'beans', foodId: 'tofu' },
    }),
    true,
  )
  assert.equal(isImpactChoiceMap({ beef: { type: 'considered' } }), false)
  assert.equal(isImpactChoiceMap([]), false)
})

test('shares swap comparison logic while preserving annual and per-100g scales', () => {
  const comparisonFoods: ImpactFood[] = [
    {
      id: 'beef',
      foodOrigin: 'animal',
      animalProductCategory: 'beef',
      servingSize: 200,
      servingUnit: 'g',
      environmentalImpact: { co2eKg: 30, waterLiters: 40, landM2: 50 },
    },
    {
      id: 'beans',
      foodOrigin: 'plant',
      environmentalImpact: { co2eKg: 10, waterLiters: 15, landM2: 20 },
    },
  ]
  const choices = {
    beef: { type: 'alternative' as const, foodId: 'beans', swapId: 'beef' },
  }

  const projected = calculateProjectedImpact(choices, comparisonFoods, { redMeat: 'Daily' })
  const per100g = calculatePer100gImpact(choices, comparisonFoods)

  assert.equal(projected.qualifyingSwaps, 1)
  assert.equal(projected.projectedImpact.co2eSaved, 14600)
  assert.equal(projected.projectedImpact.waterSaved, 18250)
  assert.equal(projected.projectedImpact.landSaved, 21900)
  assert.equal(per100g.qualifyingSwaps, 1)
  assert.equal(per100g.projectedImpact.co2eSaved, 20)
  assert.equal(per100g.projectedImpact.waterSaved, 25)
  assert.equal(per100g.projectedImpact.landSaved, 30)
})
