import { NextResponse } from 'next/server'
import { isUsernameTaken } from '@/lib/usernames'
import { getUserSession } from '@/lib/api-session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    }

    const user = await session.payload.findByID({
      collection: 'users',
      id: session.user.id,
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json({ name: user.name }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('GET /api/profile error:', error)
    return NextResponse.json({ error: 'Unable to load your profile.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
    }

    const body: unknown = await request.json()
    if (typeof body !== 'object' || body === null || !('name' in body)) {
      return NextResponse.json({ error: 'Enter a username.' }, { status: 400 })
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (name.length < 2 || name.length > 32) {
      return NextResponse.json(
        { error: 'Username must be between 2 and 32 characters.' },
        { status: 400 },
      )
    }

    if (await isUsernameTaken(session.payload, name, session.user.id)) {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 })
    }

    const user = await session.payload.update({
      collection: 'users',
      id: session.user.id,
      data: { name },
      depth: 0,
      overrideAccess: true,
    })

    await session.payload.update({
      collection: 'leaderboard',
      where: { user: { equals: session.user.id } },
      data: { displayName: name },
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json({ name: user.name })
  } catch (error) {
    console.error('PATCH /api/profile error:', error)
    return NextResponse.json({ error: 'Unable to update your username.' }, { status: 500 })
  }
}
