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

export function isRelevantAnimalFood(
  food: { animalProductCategory?: string | null },
  answers: unknown,
): boolean {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return false

  const answerMap = answers as Record<string, unknown>
  if (answerMap.dietPattern === 'Fully plant-based (vegan)') return false

  const category = food.animalProductCategory
  const question = category ? questionForCategory[category] : undefined
  if (!question) return false

  const frequency = answerMap[question]
  return typeof frequency === 'string' && !ignoredFrequencies.includes(frequency)
}
