import dotenv from 'dotenv'
import swaps from './food.json'

dotenv.config({ path: '.env.local' })

type FoodDoc = {
  id: string | number
  name: string
  foodOrigin: string
}

type SwapInput = {
  name: string
  description?: string
  replaces: string[]
  alternativeFoods: string[]
  swapCategory: 'protein' | 'dairy' | 'eggs' | 'seafood' | 'other'
  nutrientBenefits?: string[]
  nutritionalNotes?: string
  sensoryMatchNotes?: string
  recommendationNotes?: string
  sources?: (string | number)[]
  sortOrder?: number
  isActive?: boolean
}

const seedSwaps = async () => {
  // Import Payload only after .env.local has been loaded.
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')

  const payload = await getPayload({ config })
  const swapRecords = swaps as SwapInput[]

  console.log('Loading existing foods...')

  const foodResult = await payload.find({
    collection: 'foods',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  const foodDocs = foodResult.docs as unknown as FoodDoc[]
  const foodByName = new Map<string, FoodDoc>(
    foodDocs.map((doc) => [doc.name, doc]),
  )

  // Validate every relationship before creating anything.
  const problems: string[] = []

  for (const swap of swapRecords) {
    for (const foodName of swap.replaces) {
      const food = foodByName.get(foodName)

      if (!food) {
        problems.push(`"${swap.name}": replacement food not found: "${foodName}"`)
      } else if (food.foodOrigin !== 'animal') {
        problems.push(`"${swap.name}": "${foodName}" is not marked as an animal-origin food`)
      }
    }

    for (const foodName of swap.alternativeFoods) {
      const food = foodByName.get(foodName)

      if (!food) {
        problems.push(`"${swap.name}": alternative food not found: "${foodName}"`)
      } else if (food.foodOrigin !== 'plant') {
        problems.push(`"${swap.name}": alternative "${foodName}" is not marked as plant-origin`)
      }
    }
  }

  if (problems.length > 0) {
    console.error('\nSwap import stopped. Fix these food records first:')
    for (const problem of problems) console.error(`- ${problem}`)
    process.exit(1)
  }

  console.log(`Found ${foodByName.size} foods. Checking existing swaps...`)

  const existingResult = await payload.find({
    collection: 'swaps',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  const existingSwaps = existingResult.docs as unknown as Array<{ name: string }>
  const existingNames = new Set(existingSwaps.map((doc) => doc.name))

  let created = 0
  let skipped = 0

  for (const swap of swapRecords) {
    if (existingNames.has(swap.name)) {
      skipped++
      console.log(`Skipped (already exists): ${swap.name}`)
      continue
    }

    const replaces = swap.replaces.map((foodName) => foodByName.get(foodName)!.id)
    const alternativeFoods = swap.alternativeFoods.map(
      (foodName) => foodByName.get(foodName)!.id,
    )

    await payload.create({
      collection: 'swaps',
      data: {
        ...swap,
        replaces,
        alternativeFoods,
      },
      overrideAccess: true,
    })

    created++
    console.log(`Added: ${swap.name}`)
  }

  console.log('\nSwap import complete!')
  console.log(`Created: ${created}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total in JSON: ${swapRecords.length}`)

  process.exit(0)
}

seedSwaps().catch((error) => {
  console.error('Swap import failed:', error)
  process.exit(1)
})
