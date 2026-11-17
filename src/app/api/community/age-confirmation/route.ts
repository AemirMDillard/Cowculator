import { NextResponse } from 'next/server'
import { getUserSession } from '@/lib/api-session'
import { isCommunityAgeConfirmed, readCommunityJson } from '@/lib/community'
import { isRecord } from '@/lib/guards'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Log in to join the Cowculator community.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      { confirmed: await isCommunityAgeConfirmed(session.payload, Number(session.user.id)) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/community/age-confirmation:', error)
    return NextResponse.json({ error: 'Unable to check community access.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Log in to confirm community access.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const parsed = await readCommunityJson(request)
    if ('error' in parsed) {
      return NextResponse.json(
        { error: parsed.error },
        { status: parsed.status, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    if (!isRecord(parsed.body) || parsed.body.isAtLeast13 !== true) {
      return NextResponse.json(
        { error: 'Community features are for members aged 13 and over.' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    await session.payload.update({
      collection: 'users',
      id: session.user.id,
      data: { communityAgeConfirmedAt: new Date().toISOString() },
      overrideAccess: true,
    })

    return NextResponse.json({ confirmed: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('POST /api/community/age-confirmation:', error)
    return NextResponse.json({ error: 'Unable to confirm community access.' }, { status: 500 })
  }
}
