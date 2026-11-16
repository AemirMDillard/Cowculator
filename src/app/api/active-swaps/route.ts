
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

type Choice =
  | { type: 'alternative'; foodId: string; swapId: string }
  | { type: 'give-up' }
  | { type: 'custom'; suggestion: string; notes?: string }

function isValidChoice(value: unknown): value is Choice {
  if (!value || typeof value !== 'object') return false

  const choice = value as Record<string, unknown>

  if (choice.type === 'give-up') return true

  if (choice.type === 'alternative') {
    return (
      typeof choice.foodId === 'string' &&
      typeof choice.swapId === 'string'
    )
  }

  if (choice.type === 'custom') {
    return (
      typeof choice.suggestion === 'string' &&
      (choice.notes === undefined || typeof choice.notes === 'string')
    )
  }

  return false
}

async function authenticate(request: Request) {
  const payload = await getPayload({ config })

  const { user } = await payload.auth({
    headers: request.headers,
  })

  if (!user || user.collection !== 'users') {
    return { payload, user: null }
  }

  return { payload, user }
}

export async function GET(request: Request) {
  try {
    const { payload, user } = await authenticate(request)

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      )
    }

    const record = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json({
      activeSwaps: record.activeSwaps ?? {},
    })
  } catch (error) {
    console.error('GET /api/active-swaps:', error)

    return NextResponse.json(
      { error: 'Unable to load saved swaps.' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { payload, user } = await authenticate(request)

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (
      !body.activeSwaps ||
      typeof body.activeSwaps !== 'object' ||
      Array.isArray(body.activeSwaps)
    ) {
      return NextResponse.json(
        { error: 'Invalid swaps data.' },
        { status: 400 }
      )
    }

    const activeSwaps = Object.fromEntries(
      Object.entries(body.activeSwaps).filter(
        ([foodId, choice]) =>
          Boolean(foodId) && isValidChoice(choice)
      )
    )

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        activeSwaps,
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      success: true,
      activeSwaps,
    })
  } catch (error) {
    console.error('PATCH /api/active-swaps:', error)

    return NextResponse.json(
      { error: 'Unable to save swaps.' },
      { status: 500 }
    )
  }
}
