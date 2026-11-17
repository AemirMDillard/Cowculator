import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'foods',
      where: { isActive: { equals: true } },
      sort: 'name',
      limit: 1000,
      depth: 1,
    })

    return NextResponse.json({ docs: result.docs }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('GET /api/foods:', error)
    return NextResponse.json({ error: 'Unable to load foods.' }, { status: 500 })
  }
}
