
import { getPayload } from 'payload'
import config from '@payload-config'
import foods from 'food.json'

const seedFoods = async () => {
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const food of foods) {
    const existing = await payload.find({
      collection: 'foods',
      where: {
        name: {
          equals: food.name,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      skipped++
      continue
    }

    await payload.create({
      collection: 'foods',
      data: food,
    })

    created++
    console.log(`Added: ${food.name}`)
  }

  console.log('\nFood import complete!')
  console.log(`Created: ${created}`)
  console.log(`Skipped: ${skipped}`)

  process.exit(0)
}

seedFoods().catch((error) => {
  console.error('Food import failed:', error)
  process.exit(1)
})
