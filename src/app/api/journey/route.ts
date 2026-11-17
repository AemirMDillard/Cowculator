import { NextResponse } from 'next/server'
import { getUserSession } from '@/lib/api-session'
import { isRecord } from '@/lib/guards'

export const dynamic = 'force-dynamic'

type JourneyProgress = {
  pledgeDate: string | null
  checkInDates: string[]
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function getJourneyProgress(quizResponses: unknown): JourneyProgress {
  if (!isRecord(quizResponses) || !isRecord(quizResponses.__cowculator)) {
    return { pledgeDate: null, checkInDates: [] }
  }

  const stored = quizResponses.__cowculator.plantBasedJourney
  if (!isRecord(stored)) return { pledgeDate: null, checkInDates: [] }

  return {
    pledgeDate: isDateKey(stored.pledgeDate) ? stored.pledgeDate : null,
    checkInDates: Array.isArray(stored.checkInDates)
      ? [...new Set(stored.checkInDates.filter(isDateKey))].sort()
      : [],
  }
}

function getGoal(value: unknown): number {
  const goal = Number(value)
  return Number.isInteger(goal) && goal >= 1 && goal <= 7 ? goal : 7
}

function isAllowedDate(value: unknown): value is string {
  if (!isDateKey(value)) return false
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return value <= tomorrow.toISOString().slice(0, 10)
}

function responseData(pledgeDate: string | null, checkInDates: string[], goalDaysPerWeek: number) {
  return { pledged: Boolean(pledgeDate), pledgeDate, checkInDates, goalDaysPerWeek }
}

export async function GET(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Log in to save your plant-based journey.' },
        { status: 401 },
      )
    }

    const user = await session.payload.findByID({
      collection: 'users',
      id: session.user.id,
      depth: 0,
      overrideAccess: true,
    })
    const journey = getJourneyProgress(user.quizResponses)

    return NextResponse.json(
      responseData(
        journey.pledgeDate,
        journey.checkInDates,
        getGoal(user.plantBasedGoalDaysPerWeek),
      ),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('GET /api/journey error:', error)
    return NextResponse.json({ error: 'Unable to load your journey.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getUserSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Log in to save your plant-based journey.' },
        { status: 401 },
      )
    }

    const body: unknown = await request.json()
    if (!isRecord(body) || typeof body.action !== 'string') {
      return NextResponse.json({ error: 'Choose a journey update.' }, { status: 400 })
    }

    const user = await session.payload.findByID({
      collection: 'users',
      id: session.user.id,
      depth: 0,
      overrideAccess: true,
    })
    const responses = isRecord(user.quizResponses) ? user.quizResponses : {}
    const metadata = isRecord(responses.__cowculator) ? responses.__cowculator : {}
    const journey = getJourneyProgress(responses)
    let pledgeDate = journey.pledgeDate
    let checkInDates = journey.checkInDates
    let goalDaysPerWeek = getGoal(user.plantBasedGoalDaysPerWeek)

    if (body.action === 'pledge') {
      if (
        !Number.isInteger(body.goalDaysPerWeek) ||
        Number(body.goalDaysPerWeek) < 1 ||
        Number(body.goalDaysPerWeek) > 7
      ) {
        return NextResponse.json(
          { error: 'Choose a weekly goal from 1 to 7 days.' },
          { status: 400 },
        )
      }
      if (!isAllowedDate(body.date)) {
        return NextResponse.json({ error: 'The pledge date is invalid.' }, { status: 400 })
      }

      pledgeDate = pledgeDate ?? body.date
      goalDaysPerWeek = Number(body.goalDaysPerWeek)
    } else if (body.action === 'goal') {
      if (!pledgeDate) {
        return NextResponse.json(
          { error: 'Make your pledge before changing your goal.' },
          { status: 409 },
        )
      }
      if (
        !Number.isInteger(body.goalDaysPerWeek) ||
        Number(body.goalDaysPerWeek) < 1 ||
        Number(body.goalDaysPerWeek) > 7
      ) {
        return NextResponse.json(
          { error: 'Choose a weekly goal from 1 to 7 days.' },
          { status: 400 },
        )
      }

      goalDaysPerWeek = Number(body.goalDaysPerWeek)
    } else if (body.action === 'check-in' || body.action === 'remove-check-in') {
      if (!pledgeDate) {
        return NextResponse.json(
          { error: 'Make your pledge before tracking days.' },
          { status: 409 },
        )
      }
      if (!isAllowedDate(body.date) || body.date < pledgeDate) {
        return NextResponse.json(
          { error: 'Choose a valid day on or after your pledge.' },
          { status: 400 },
        )
      }

      checkInDates =
        body.action === 'check-in'
          ? [...new Set([...checkInDates, body.date])].sort()
          : checkInDates.filter((date) => date !== body.date)
    } else {
      return NextResponse.json({ error: 'Unknown journey update.' }, { status: 400 })
    }

    // Keep progress under a reserved key in the existing JSON field, avoiding a schema migration.
    const nextResponses = {
      ...responses,
      __cowculator: {
        ...metadata,
        plantBasedJourney: { pledgeDate, checkInDates },
      },
    }

    await session.payload.update({
      collection: 'users',
      id: session.user.id,
      data: {
        quizResponses: nextResponses,
        plantBasedGoalDaysPerWeek: goalDaysPerWeek,
      },
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json(responseData(pledgeDate, checkInDates, goalDaysPerWeek))
  } catch (error) {
    console.error('PATCH /api/journey error:', error)
    return NextResponse.json({ error: 'Unable to save your journey update.' }, { status: 500 })
  }
}
