import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

type Choice =
  | { type: 'alternative'; foodId: string; swapId: string }
  | { type: 'give-up' }
  | { type: 'custom'; suggestion: string; notes?: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isChoice(value: unknown): value is Choice {
  if (!isRecord(value)) return false

  if (value.type === 'give-up') return true

  if (value.type === 'alternative') {
    return typeof value.foodId === 'string' &&
      typeof value.swapId === 'string'
  }

  return value.type === 'custom' &&
    typeof value.suggestion === 'string' &&
    (value.notes === undefined || typeof value.notes === 'string')
}

function isChoices(value: unknown): value is Record<string, Choice> {
  return isRecord(value) && Object.values(value).every(isChoice)
}

async function getUser(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user || user.collection !== 'users') return null

  return { payload, user }
}

export async function GET(request: Request) {
  try {
    const session = await getUser(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const record = await session.payload.findByID({
      collection: 'users',
      id: session.user.id,
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json(
      { activeSwaps: isChoices(record.activeSwaps) ? record.activeSwaps : {} },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/active-swaps:', error)
    return NextResponse.json(
      { error: 'Unable to load saved swaps.' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getUser(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: unknown = await request.json()
    if (!isRecord(body) || !isChoices(body.activeSwaps)) {
      return NextResponse.json(
        { error: 'Invalid activeSwaps data.' },
        { status: 400 },
      )
    }

    await session.payload.update({
      collection: 'users',
      id: session.user.id,
      data: { activeSwaps: body.activeSwaps },
      overrideAccess: true,
    })

    return NextResponse.json({ activeSwaps: body.activeSwaps })
  } catch (error) {
    console.error('PATCH /api/active-swaps:', error)
    return NextResponse.json(
      { error: 'Unable to save swaps.' },
      { status: 500 },
    )
  }
}