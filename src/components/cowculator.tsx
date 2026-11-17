'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'

const colors = {
  brown: '#3F382F',
  cream: '#F5F0DF',
  green: '#A8B99A',
  pink: '#E9B8B0',
  yellow: '#E9D48E',
  lcd: '#D8E2CE',
}

type IconName =
  | 'arrow'
  | 'drop'
  | 'leaf'
  | 'spark'
  | 'trophy'
  | 'user'
  | 'water'
  | 'paw'
  | 'mail'
  | 'chart'
  | 'check'
  | 'lock'

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
    drop: <path d="M12 2S6 9 6 14a6 6 0 0 0 12 0c0-5-6-12-6-12Z" />,
    leaf: (
      <>
        <path d="M20 4C12 4 5 8 5 15c0 2 1 4 3 5 7-1 11-7 12-16Z" />
        <path d="M5 21c3-5 7-8 12-11" />
      </>
    ),
    spark: <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" />,
    trophy: (
      <>
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
        <path d="M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 1v5m-4 2h8" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    water: (
      <>
        <path d="M12 3S5 11 5 16a7 7 0 0 0 14 0c0-5-7-13-7-13Z" />
        <path d="M9 17c.5 1.5 1.5 2 3 2" />
      </>
    ),
    paw: (
      <>
        <circle cx="8" cy="8" r="2" />
        <circle cx="16" cy="8" r="2" />
        <circle cx="5" cy="13" r="2" />
        <circle cx="19" cy="13" r="2" />
        <path d="M12 12c-3 0-5 3-5 6 0 2 2 3 5 1 3 2 5 1 5-1 0-3-2-6-5-6Z" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10m6 10V4m6 16v-7m5 7H2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
  }
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      {paths[name]}
    </svg>
  )
}

function PixelLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2" aria-label="Cowculator home">
      <img
        src="/images/cowculator-logo.png"
        alt="Cowculator"
        className="w-12 h-12 object-contain"
      />
      <span
        className={`${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-black tracking-[-.04em]`}
      >
        COWCULATOR
      </span>
    </Link>
  )
}

const nav = [
  ['How it works', '/#how-it-works'],
  ['Swaps', '/swaps'],
  ['Leaderboard', '/leaderboard'],
  ['My impact', '/dashboard'],
]


export function SiteHeader() {
  const path = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)

  useEffect(() => {
    let active = true

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
        })

        const data = await response.json()

        if (active) {
          setIsLoggedIn(Boolean(response.ok && data.user))
        }
      } catch {
        if (active) {
          setIsLoggedIn(false)
        }
      }
    }

    checkAuth()

    window.addEventListener('cowculator-auth-change', checkAuth)

    return () => {
      active = false
      window.removeEventListener('cowculator-auth-change', checkAuth)
    }
  }, [])

  const logout = async () => {
    try {
      const response = await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        setIsLoggedIn(false)
        setAccountMenuOpen(false)
        window.location.href = '/'
      }
    } catch {
      console.error('Unable to log out.')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[#3F382F]/15 bg-[#F5F0DF]/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 lg:px-8">
        <PixelLogo compact />

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Main navigation"
        >
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${path === href ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {isLoggedIn ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="pixel-button small flex items-center gap-2"
            >
              <Icon name="user" size={16} />
              My Account
              <Icon name="arrow" size={14} />
            </button>

            {accountMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-sm border-2 border-[#3F382F]/20 bg-[#F5F0DF] p-2 shadow-lg">
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-sm font-bold text-[#3F382F] hover:bg-[#A8B99A]/25"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  My Dashboard
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="block w-full px-3 py-2 text-left text-sm font-bold text-[#3F382F] hover:bg-[#A8B99A]/25"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-bold text-[#3F382F] hover:text-[#8B9B7C]"
            >
              Log in
            </Link>

            <Link href="/signup" className="pixel-button small">
              Sign up <Icon name="arrow" size={16} />
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}


export function SiteFooter() {
  return (
    <footer className="border-t-2 border-[#3F382F] bg-[#3F382F] text-[#F5F0DF]">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-10 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <PixelLogo />
          <p className="mt-3 max-w-sm text-sm text-[#F5F0DF]/70">
            Tiny changes at the dinner table save lives and the planet...
          </p>
        </div>
        <div>
          <p className="pixel-label text-[#E9D48E]">EXPLORE</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/calculator">Cowculate impact</Link>
            <Link href="/swaps">Sustainable swaps</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </div>
        </div>
        <div>
          <p className="pixel-label text-[#E9D48E]">DISCLAIMER</p>
          <p className="mt-3 text-xs leading-5 text-[#F5F0DF]/60">
            All figures are based on peer-reviewed research estimates, not exact personal savings. Your actual
            impact may vary.
          </p>
        </div>
      </div>
    </footer>
  )
}

function CowMascot({ children, small = false }: { children?: ReactNode; small?: boolean }) {
  return (
    <div className={`cow-wrap ${small ? 'cow-small' : ''}`}>
      <div className="horn horn-l" />
      <div className="horn horn-r" />
      <div className="ear ear-l" />
      <div className="ear ear-r" />
      <div className="cow-body">
        <div className="spot spot-a" />
        <div className="spot spot-b" />
        <div className="spot spot-c" />
        <div className="cow-face">
          <span className="eye" />
          <span className="eye" />
          <span className="muzzle">
            <i />
            <i />
          </span>
        </div>
        <div className="cow-screen">
          {children ?? (
            <>
              <span className="screen-kicker">YOUR IMPACT</span>
              <strong>READY?</strong>
              <Link href="/calculator" className="screen-kicker">
                Let's begin. <Icon name="arrow" />
              </Link>
            </>
          )}
        </div>
        <div className="cow-keys" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <div className="collar">
          <span className="bell" />
        </div>
      </div>
    </div>
  )
}

function Flower({ className = '' }: { className?: string }) {
  return (
    <span className={`flower ${className}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
      <b />
    </span>
  )
}

export function LandingPage() {
  return (
    <main className="overflow-hidden">
      <section className="hero-grid relative">
        <div className="absolute left-[5%] top-[18%] text-[#E9D48E]">
          <Icon name="spark" size={32} />
        </div>
        <div className="absolute right-[8%] top-[14%] text-[#E9B8B0]">
          <Icon name="spark" size={24} />
        </div>
        <div className="mx-auto grid min-h-[720px] max-w-[1180px] items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_.95fr] lg:px-8">
          <div className="relative z-10">
            <div className="eyebrow">
              <span className="inline-block h-2 w-2 bg-[#A8B99A]" /> THE COWPASSIONATE FOOD
              COWCULATOR
            </div>
            <h1 className="mt-6 max-w-2xl text-[clamp(3.6rem,8vw,7.4rem)] font-black leading-[.82] tracking-[-.07em]">
              BEE IN A
              <br />
              <span className="text-[#A8B99A]">BIG MOO-</span>
              <br />
              VEMENT.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#3F382F]/75">
              Discover the footprint of your plate, choose food swaps, and rack up
              points for the planet.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/calculator" className="pixel-button">
                Cowculate my impact <Icon name="arrow" />
              </Link>
              <Link href="#how-it-works" className="pixel-button secondary">
                How it works
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm font-bold">
              <span className="flex -space-x-2">
                {['M', 'S', 'J'].map((x, i) => (
                  <i
                    key={x}
                    className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#F5F0DF] text-xs not-italic"
                    style={{ background: [colors.pink, colors.yellow, colors.green][i] }}
                  >
                    {x}
                  </i>
                ))}
              </span>
              Join the moo-vement for a kinder planet!
            </div>
          </div>
          <div className="relative flex min-h-[520px] items-center justify-center">
            <div className="sun-disc" />
            <CowMascot />
            <Flower className="absolute bottom-8 left-5" />
            <Flower className="absolute right-2 top-20 scale-75" />
          </div>
        </div>
        <div className="pixel-grass" />
      </section>

      <section id="how-it-works" className="bg-white px-5 py-24 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">HOW IT WORKS</span>
            <h2 className="section-title">
              FROM COMPASSION TO <span>ACTION</span>
            </h2>
            <p className="mt-4 text-[#3F382F]/65">
              Can you make at least 2 dietary changes to minimize harm?
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              [
                '01',
                'Tell us what you eat',
                'Tap through a few quick questions inside our cowculator.',
              ],
              [
                '02',
                'Pick your power-ups',
                'Choose realistic swaps you would actually enjoy making.',
              ],
              ['03', 'See your impact', 'Unlock your estimated savings, points and achievements.'],
            ].map(([n, title, copy], i) => (
              <article className="step-card" key={n}>
                <span className="step-number">{n}</span>
                <div className={`step-icon step-${i}`}>
                  <Icon name={i === 0 ? 'chart' : i === 1 ? 'leaf' : 'trophy'} size={34} />
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-24 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] items-center gap-14 md:grid-cols-2">
          <div className="impact-preview">
            <div className="pixel-label mb-4">A TINY SWAP CAN SAVE</div>
            <div className="impact-number">
              1,248<span>L</span>
            </div>
            <div className="lcd-rule" />
            <div className="flex justify-between text-xs font-black">
              <span>WATER / MONTH</span>
              <span>ESTIMATED</span>
            </div>
          </div>
          <div>
            <span className="eyebrow">WHY IT MATTERS</span>
            <h2 className="section-title text-left">
              Heavy is the hand that wields the <span>fork...</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-[#3F382F]/70">
              Food choices impact animals, carbon, water, and land use. Cowculator turns complex science into
              a game!
            </p>
            <Link
              href="/calculator"
              className="mt-8 inline-flex items-center gap-2 font-black underline decoration-2 underline-offset-8"
            >
              Find my first swap <Icon name="arrow" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}


type Question = {
  id: string
  category: string
  question: string
  detail: string
  options: string[]
}

const dietPatternQuestion: Question = {
  id: 'dietPattern',
  category: 'START HERE',
  question: 'Which best describes how you eat right now?',
  detail: 'There is no right or wrong answer. Choose what feels closest.',
  options: [
    'Fully plant-based (vegan)',
    'Mostly plant-based',
    'Vegetarian',
    'A mix of plant and animal foods',
    'Something else / not sure',
  ],
}

const plantBasedQuestions: Question[] = [
  {
    id: 'plantBasedGoal',
    category: 'YOUR GOALS',
    question: 'What would you like to explore?',
    detail: 'Cowculator can help even if you already eat entirely plant-based.',
    options: [
      'Discover more plant-based foods',
      'Explore nutritional variety',
      'Understand my environmental impact',
      'Explore animal welfare impact',
      'Just looking around',
    ],
  },
]

const vegetarianQuestions: Question[] = [
  {
    id: 'dairy',
    category: 'DAIRY',
    question: 'How often do you consume dairy?',
    detail: 'Think milk, cheese, yogurt, butter and other dairy products.',
    options: ['Daily', 'A few times a week', 'Occasionally', 'Never'],
  },
  {
    id: 'eggs',
    category: 'EGGS',
    question: 'How often do you eat eggs?',
    detail: 'Include eggs in breakfasts, baking and other meals.',
    options: ['Daily', 'A few times a week', 'Occasionally', 'Never'],
  },
]

const animalFoodQuestions: Question[] = [
  {
    id: 'redMeat',
    category: 'MEAT',
    question: 'How often do you eat red meat?',
    detail: 'Think beef, lamb, burgers and steaks.',
    options: ['Daily', 'A few times a week', 'Occasionally', 'Never'],
  },
  {
    id: 'poultry',
    category: 'POULTRY',
    question: 'How often do you eat poultry?',
    detail: 'Think chicken and turkey.',
    options: ['Daily', 'A few times a week', 'Occasionally', 'Never'],
  },
  {
    id: 'seafood',
    category: 'SEAFOOD',
    question: 'How often do you eat fish or seafood?',
    detail: 'Include fish, shrimp, shellfish and other seafood.',
    options: ['Daily', 'A few times a week', 'Occasionally', 'Never'],
  },
  {
    id: 'dairy',
    category: 'DAIRY',
    question: 'How often do you consume dairy?',
    detail: 'Think milk, cheese, yogurt, butter and other dairy products.',
    options: ['Daily', 'A few times a week', 'Occasionally', 'Never'],
  },
  {
    id: 'eggs',
    category: 'EGGS',
    question: 'How often do you eat eggs?',
    detail: 'Include eggs in breakfasts, baking and other meals.',
    options: ['Daily', 'A few times a week', 'Occasionally', 'Never'],
  },
]

const plantMealQuestion: Question = {
  id: 'plantMeals',
  category: 'PLANT-BASED FOODS',
  question: 'How often do you eat fully plant-based meals?',
  detail: 'Think meals built around beans, lentils, tofu, vegetables or grains.',
  options: [
    'Almost never',
    '1–3 times a week',
    '4–6 times a week',
    'Every day',
  ],
}

function getQuestions(dietPattern?: string): Question[] {
  if (!dietPattern) return [dietPatternQuestion]

  if (dietPattern === 'Fully plant-based (vegan)') {
    return [dietPatternQuestion, ...plantBasedQuestions]
  }

  if (dietPattern === 'Vegetarian') {
    return [
      dietPatternQuestion,
      ...vegetarianQuestions,
      plantMealQuestion,
    ]
  }

  return [
    dietPatternQuestion,
    ...animalFoodQuestions,
    plantMealQuestion,
  ]
}


export function CalculatorPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const questions = getQuestions(answers.dietPattern)
  const q = questions[step]
  const selectedAnswer = answers[q.id]

  const select = (answer: string) => {
    const next =
      q.id === 'dietPattern'
        ? { dietPattern: answer }
        : { ...answers, [q.id]: answer }

    setAnswers(next)
    localStorage.setItem('cowculator-answers', JSON.stringify(next))
  }

  return (
    <main className="page-shell calculator-bg">
      <div className="mx-auto max-w-[1050px] px-5 py-12">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <span className="eyebrow">LEVEL 1 · CURRENT CONSUMPTION</span>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              WHAT&apos;S ON YOUR PLATE?
            </h1>
          </div>

          <div className="hidden text-right sm:block">
            <span className="pixel-label">
              QUESTION {step + 1} / {questions.length}
            </span>
            <div className="mt-2 flex gap-1">
              {questions.map((_, i) => (
                <i
                  key={i}
                  className={`h-2 w-7 ${
                    i <= step ? 'bg-[#E9B8B0]' : 'bg-[#3F382F]/15'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="calculator-stage">
          <CowMascot>
            <div className="w-full">
              <span className="screen-kicker">
                {q.category} · {String(step + 1).padStart(2, '0')}
              </span>
              <strong className="question-text">{q.question}</strong>
              <span className="screen-line">{q.detail}</span>
            </div>
          </CowMascot>

          <div className="answer-panel">
            <div className="sm:hidden">
              <span className="pixel-label">
                QUESTION {step + 1} / {questions.length}
              </span>
              <div className="mt-2 flex gap-1">
                {questions.map((_, i) => (
                  <i
                    key={i}
                    className={`h-2 flex-1 ${
                      i <= step ? 'bg-[#E9B8B0]' : 'bg-[#3F382F]/15'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="pixel-label mt-6 sm:mt-0">CHOOSE ONE</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {q.options.map((option, i) => (
                <button
                  key={option}
                  className={`answer-button ${
                    selectedAnswer === option ? 'selected' : ''
                  }`}
                  onClick={() => select(option)}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {option}
                  {selectedAnswer === option && (
                    <Icon name="check" size={17} />
                  )}
                </button>
              ))}
            </div>

            <p className="mt-5 text-sm text-[#3F382F]/55">
              There are no correct answers! Honest estimates give you better swaps.
            </p>

            <div className="mt-8 flex justify-between gap-3">
              <button
                className="pixel-button secondary"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Previous
              </button>

              {step < questions.length - 1 ? (
                <button
                  className="pixel-button"
                  disabled={!selectedAnswer}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Next <Icon name="arrow" />
                </button>
              ) : (
                <Link
                  className={`pixel-button ${
                    !selectedAnswer ? 'pointer-events-none opacity-40' : ''
                  }`}
                  href="/swaps"
                >
                  See my swaps <Icon name="arrow" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Keep using your existing Icon, IconName, and colors definitions.

type ImpactValues = {
  co2eSaved: number
  waterSaved: number
  landSaved: number
  animalsSpared: number
}

type ImpactResponse = {
  estimateBasis?: 'annual' | 'per-100g'
  projectedImpact: ImpactValues
  cumulativeImpact: ImpactValues & {
    plantBasedDays: number
  }
  currentStreak: number
  selectedSwapCount: number
  points: number | null
  displayName: string
}

type LeaderboardEntry = {
  id: string
  displayName: string
  month: number
  year: number
  animalImpactScore: number
  environmentalScore: number
  plantBasedScore: number
  combinedScore: number
  rank: number
}

type LeaderboardResponse = {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

const emptyImpact: ImpactResponse = {
  projectedImpact: {
    co2eSaved: 0,
    waterSaved: 0,
    landSaved: 0,
    animalsSpared: 0,
  },
  cumulativeImpact: {
    co2eSaved: 0,
    waterSaved: 0,
    landSaved: 0,
    animalsSpared: 0,
    plantBasedDays: 0,
  },
  currentStreak: 0,
  selectedSwapCount: 0,
  points: null,
  displayName: 'Planet Pal',
}

type GuestFood = {
  id: number | string
  foodOrigin: string
  environmentalImpact?: {
    co2eKg?: number | null
    waterLiters?: number | null
    landM2?: number | null
    animalsPer100g?: number | null
    impactScorePer100g?: number | null
  } | null
}

type GuestChoice = {
  type?: string
  foodId?: string
}

function positiveDifference(
  animalValue: number | null | undefined,
  plantValue: number | null | undefined,
) {
  if (
    animalValue == null ||
    plantValue == null ||
    !Number.isFinite(animalValue) ||
    !Number.isFinite(plantValue)
  ) {
    return 0
  }

  return Math.max(0, animalValue - plantValue)
}

function calculateGuestImpact(
  foods: GuestFood[],
  choices: Record<string, GuestChoice>,
): ImpactResponse {
  const foodsById = new Map(
    foods.map((food) => [String(food.id), food]),
  )

  const projectedImpact: ImpactValues = {
    co2eSaved: 0,
    waterSaved: 0,
    landSaved: 0,
    animalsSpared: 0,
  }

  let selectedSwapCount = 0
  let points = 0

  for (const [animalId, choice] of Object.entries(choices)) {
    if (!choice || typeof choice !== 'object') continue

    if (choice.type === 'custom') {
      selectedSwapCount += 1
      continue
    }

    if (choice.type !== 'alternative') continue

    selectedSwapCount += 1

    if (typeof choice.foodId !== 'string') continue

    const animal = foodsById.get(animalId)
    const plant = foodsById.get(choice.foodId)

    if (
      animal?.foodOrigin !== 'animal' ||
      plant?.foodOrigin !== 'plant'
    ) {
      continue
    }

    const animalImpact = animal.environmentalImpact
    const plantImpact = plant.environmentalImpact

    projectedImpact.co2eSaved += positiveDifference(
      animalImpact?.co2eKg,
      plantImpact?.co2eKg,
    )
    projectedImpact.waterSaved += positiveDifference(
      animalImpact?.waterLiters,
      plantImpact?.waterLiters,
    )
    projectedImpact.landSaved += positiveDifference(
      animalImpact?.landM2,
      plantImpact?.landM2,
    )
    projectedImpact.animalsSpared += positiveDifference(
      animalImpact?.animalsPer100g,
      plantImpact?.animalsPer100g,
    )

    if (
      animalImpact?.impactScorePer100g != null &&
      plantImpact?.impactScorePer100g != null
    ) {
      const scoreDifference = Math.max(
        0,
        Number(
          (
            animalImpact.impactScorePer100g -
            plantImpact.impactScorePer100g
          ).toFixed(2),
        ),
      )

      points += Math.round(scoreDifference * 10)
    }
  }

  return {
    projectedImpact,
    cumulativeImpact: {
      co2eSaved: 0,
      waterSaved: 0,
      landSaved: 0,
      animalsSpared: 0,
      plantBasedDays: 0,
    },
    currentStreak: 0,
    selectedSwapCount,
    points,
    displayName: 'Planet Pal',
    estimateBasis: 'per-100g',
  }
}

function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value)
}

function formatCarbon(value: number) {
  if (value >= 1000) {
    return `${formatNumber(value / 1000, 2)} t`
  }

  return `${formatNumber(value, 1)} kg`
}

function formatWater(value: number) {
  if (value >= 1000) {
    return `${formatNumber(value / 1000, 2)} kL`
  }

  return `${formatNumber(value, 1)} L`
}

function formatLand(value: number) {
  return `${formatNumber(value, 2)} m²`
}

function formatAnimals(value: number) {
  return formatNumber(value, 2)
}

function StatCard({
  icon,
  value,
  unit,
  label,
  color,
}: {
  icon: IconName
  value: string
  unit: string
  label: string
  color: string
}) {
  return (
    <article
      className="stat-card"
      style={{ '--accent': color } as React.CSSProperties}
    >
      <span className="stat-icon">
        <Icon name={icon} size={28} />
      </span>

      <span className="pixel-label">{label}</span>

      <strong>
        {value}
        <small>{unit}</small>
      </strong>

      <span className="estimate-label">ESTIMATED / YEAR</span>
    </article>
  )
}

function useImpactData() {
  const [data, setData] = useState<ImpactResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadImpact() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/impact', {
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-store',
        })

        if (response.status === 401) {
          const foodsResponse = await fetch('/api/foods', {
            signal: controller.signal,
            cache: 'no-store',
          })

          if (!foodsResponse.ok) {
            throw new Error('Unable to load foods for your guest results.')
          }

          const foodsResult = (await foodsResponse.json()) as {
            docs?: GuestFood[]
          }

          if (!Array.isArray(foodsResult.docs)) {
            throw new Error('The foods response was invalid.')
          }

          const savedChoicesText = localStorage.getItem('cowculator-swaps')
          let savedChoices: Record<string, GuestChoice> = {}

          if (savedChoicesText) {
            const parsed: unknown = JSON.parse(savedChoicesText)

            if (
              !parsed ||
              typeof parsed !== 'object' ||
              Array.isArray(parsed)
            ) {
              throw new Error('Your saved guest swaps are invalid.')
            }

            savedChoices = parsed as Record<string, GuestChoice>
          }

          setData(calculateGuestImpact(foodsResult.docs, savedChoices))
          return
        }

        if (!response.ok) {
          throw new Error('Unable to load your impact data.')
        }

        const result: ImpactResponse = await response.json()
        setData({ ...result, estimateBasis: 'annual' })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        setError(
          err instanceof Error ? err.message : 'Something went wrong.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadImpact()

    return () => controller.abort()
  }, [])

  return { data, loading, error }
}

function LoadingMessage() {
  return (
    <div className="py-16 text-center">
      <Icon name="spark" size={28} />
      <p className="mt-3">Loading your impact...</p>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="my-8 border-2 border-[#3F382F] bg-white p-5">
      <p className="font-bold">We couldn't load this information.</p>
      <p className="mt-2 text-sm">{message}</p>
      <button
        className="pixel-button mt-4"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </div>
  )
}

// RESULTS PAGE

export function ResultsPage() {
  const { data, loading, error } = useImpactData()

  if (loading) {
    return (
      <main className="page-shell results-bg">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <LoadingMessage />
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="page-shell results-bg">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <ErrorMessage message={error || 'Impact data is unavailable.'} />
        </div>
      </main>
    )
  }

  const impact = data.projectedImpact
  const hasImpact =
    impact.co2eSaved > 0 ||
    impact.waterSaved > 0 ||
    impact.landSaved > 0 ||
    impact.animalsSpared > 0

  return (
    <main className="page-shell results-bg">
      <div className="mx-auto max-w-[1180px] px-5 py-14 lg:px-8">
        <div className="result-banner">
          <div>
            <span className="pixel-label text-[#E9D48E]">
              SWAPS COMPLETE
            </span>

            <h1>
              LOOK AT YOU,
              <br />
              PLANET PAL!
            </h1>

            <p>
              Your selected swaps have the potential to make a difference.
            </p>
          </div>

          <div className="result-score">
            <span>TOTAL SCORE</span>

            <b>
              {data.points === null
                ? '—'
                : data.points.toLocaleString()}
            </b>

            <small>OPTIMIZATION POINTS</small>
          </div>

          <div className="confetti c1" />
          <div className="confetti c2" />
          <div className="confetti c3" />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">
            YOUR POTENTIAL YEARLY IMPACT
          </h2>

          <span className="estimate-label">
            RESEARCH-BASED ESTIMATE
          </span>
        </div>

        {hasImpact ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon="leaf"
              value={formatNumber(impact.co2eSaved, 1)}
              unit="kg"
              label="CO₂e REDUCED"
              color={colors.green}
            />

            <StatCard
              icon="water"
              value={formatNumber(impact.waterSaved / 1000, 2)}
              unit="kL"
              label="WATER REDUCED"
              color="#AFC7CE"
            />

            <StatCard
              icon="chart"
              value={formatNumber(impact.landSaved, 2)}
              unit="m²"
              label="LAND USE REDUCED"
              color={colors.yellow}
            />

            <StatCard
              icon="paw"
              value={formatAnimals(impact.animalsSpared)}
              unit=""
              label="ESTIMATED ANIMAL IMPACT"
              color={colors.pink}
            />
          </div>
        ) : (
          <div className="mt-5 border-2 border-[#3F382F] bg-white p-8 text-center">
            <Icon name="sprout" size={36} />
            <h3 className="mt-3 text-xl font-black">
              Your impact is taking shape!
            </h3>
            <p className="mt-2 text-[#3F382F]/65">
              Select eligible swaps with researched impact data to see
              your projected annual impact here.
            </p>
            <div className="mt-7 flex justify-center">
            <Link href="/swaps" className="pixel-button">
              Explore more swaps
              <Icon name="arrow" />
            </Link>
          </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <article className="achievement-card">
            <div className="achievement-medal">
              <Icon name="trophy" size={36} />
            </div>

            <div>
              <span className="pixel-label">YOUR PROGRESS</span>
              <h3>{data.selectedSwapCount} swaps selected</h3>
              <p>
                Every selected plant-based alternative is another
                opportunity to change your food footprint.
              </p>
            </div>
          </article>

          <article className="reality-card">
            <Icon name="spark" />

            <div>
              <h3>Potential, not a promise</h3>
              <p>
                These figures represent estimated annual reductions
                if you consistently follow your selected swaps.
                They are not measurements of impact already achieved.
              </p>
            </div>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link className="pixel-button" href="/signup">
            Get my free meal plan <Icon name="mail" />
          </Link>

          <Link className="pixel-button secondary" href="/dashboard">
            View my dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}

// LEADERBOARD PAGE

export function LeaderboardPage() {
  const [tab, setTab] = useState<'Global' | 'Friends' | 'This month'>(
    'Global'
  )

  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadLeaderboard() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/leaderboard?period=${encodeURIComponent(tab)}`,
          {
            credentials: 'include',
            signal: controller.signal,
            cache: 'no-store',
          }
        )

        if (!response.ok) {
          throw new Error('Unable to load the leaderboard.')
        }

        const result = await response.json()

        setData({
          entries: Array.isArray(result.entries)
            ? result.entries
            : [],
          currentUserId: result.currentUserId,
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return

        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong.'
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadLeaderboard()

    return () => controller.abort()
  }, [tab])

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[1050px] px-5 py-14">
        <div className="text-center">
          <span className="eyebrow">HIGH SCORES</span>

          <h1 className="mt-3 text-4xl font-black sm:text-6xl">
            PLANET PAL{' '}
            <span className="text-[#E9B8B0]">LEADERBOARD</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[#3F382F]/65">
            See how our herd is changing the game.
          </p>
        </div>

        <div className="mx-auto mt-9 flex w-fit border-2 border-[#3F382F] bg-white p-1">
          {(['Global', 'Friends', 'This month'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`leader-tab ${tab === item ? 'active' : ''}`}
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingMessage />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <div className="mt-8 overflow-hidden border-2 border-[#3F382F] bg-white shadow-[8px_8px_0_#3F382F]">
            <div className="leader-head">
              <span>RANK / PLAYER</span>
              <span>ENVIRONMENTAL SCORE</span>
              <span>ANIMAL SCORE</span>
              <span>POINTS</span>
            </div>

            {(Array.isArray(data?.entries) && data.entries.length > 0) ? (
              data.entries.map((entry) => {
                const isYou = entry.id === data.currentUserId

                return (
                  <div
                    key={entry.id}
                    className={`leader-row ${isYou ? 'you' : ''}`}
                  >
                    <span className="rank">{entry.rank}</span>

                    <span className="player">
                      <i
                        style={{
                          background: isYou
                            ? colors.pink
                            : colors.green,
                        }}
                      >
                        {entry.displayName.charAt(0).toUpperCase()}
                      </i>

                      <b>{entry.displayName}</b>

                      {entry.rank <= 3 && (
                        <Icon name="trophy" size={16} />
                      )}
                    </span>

                    <span>
                      {formatNumber(entry.environmentalScore)}
                    </span>

                    <span>
                      {formatNumber(entry.animalImpactScore)}
                    </span>

                    <strong>
                      {formatNumber(entry.combinedScore)}
                    </strong>
                  </div>
                )
              })
            ) : (
              <div className="p-10 text-center">
                <Icon name="users" size={32} />
                <h3 className="mt-3 font-black">
                  No rankings yet
                </h3>
                <p className="mt-2 text-sm text-[#3F382F]/65">
                  There are no leaderboard records for this view yet.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="community-strip">
          <div>
            <Icon name="user" size={28} />
            <span>JOIN OTHER MOOTHEMATICIANS</span>
          </div>

          <div>
            <Icon name="leaf" size={28} />
            <span>
              <b>COMMUNITY</b> IMPACT
            </span>
          </div>

          <div>
            <Icon name="spark" size={28} />
            <span>
              <b>COMMUNITY</b> POINTS
            </span>
          </div>
        </div>

        {tab === 'Friends' && (
          <p className="mt-4 text-center text-sm text-[#3F382F]/60">
            We're working on friend connections. Check back soon!
          </p>
        )}
      </div>
    </main>
  )
}

// DASHBOARD PAGE

export function DashboardPage() {
  const { data, loading, error } = useImpactData()

  const [view, setView] = useState<'projected' | 'cumulative'>(
    'projected'
  )

  if (loading) {
    return (
      <main className="page-shell">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <LoadingMessage />
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="page-shell">
        <div className="mx-auto max-w-[1180px] px-5 py-14">
          <ErrorMessage message={error || 'Dashboard data is unavailable.'} />
        </div>
      </main>
    )
  }

  const impact =
    view === 'projected'
      ? data.projectedImpact
      : data.cumulativeImpact

  const isProjected = view === 'projected'

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[1180px] px-5 py-12 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">PLAYER DASHBOARD</span>

            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              WELCOME BACK,{' '}
              <span className="text-[#A8B99A]">
                MOO-MATICIAN.
              </span>
            </h1>
          </div>

          <div className="flex flex-col gap-2">
            <label className="pixel-label" htmlFor="impact-view">
              IMPACT VIEW
            </label>

            <select
              id="impact-view"
              aria-label="Impact view"
              value={view}
              onChange={(e) =>
                setView(e.target.value as 'projected' | 'cumulative')
              }
              className="period-select"
            >
              <option value="projected">Projected annually</option>
              <option value="cumulative">Tracked totals</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <article className="dashboard-score">
            <div>
              <span className="pixel-label text-[#F5F0DF]/70">
                YOUR OPTIMIZATION SCORE
              </span>

              <strong>
                {data.points === null
                  ? '—'
                  : data.points.toLocaleString()}
              </strong>

              <p>
                {data.selectedSwapCount} selected swaps
              </p>
            </div>

            <div className="level-badge">
              <span>STREAK</span>
              <b>{data.currentStreak}</b>
              <small>WEEKS</small>
            </div>
          </article>

          <article className="streak-card">
            <Icon name="spark" size={34} />

            <div>
              <span className="pixel-label">CURRENT STREAK</span>
              <strong>
                {data.currentStreak} WEEKS
              </strong>
              <p>Keep building your plant-based habits.</p>
            </div>
          </article>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <article className="dashboard-card">
            <div className="card-title">
              <div>
                <span className="pixel-label">IMPACT TRACKER</span>
                <h2>
                  {isProjected
                    ? 'Your potential annual impact'
                    : 'Your tracked impact'}
                </h2>
              </div>

              <span className="estimate-label">
                {isProjected ? 'PROJECTED' : 'CUMULATIVE'}
              </span>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <span className="pixel-label">CO₂e</span>
                <h3 className="mt-2 text-3xl font-black">
                  {formatCarbon(impact.co2eSaved)}
                </h3>
              </div>

              <div>
                <span className="pixel-label">WATER</span>
                <h3 className="mt-2 text-3xl font-black">
                  {formatWater(impact.waterSaved)}
                </h3>
              </div>

              <div>
                <span className="pixel-label">LAND</span>
                <h3 className="mt-2 text-3xl font-black">
                  {formatLand(impact.landSaved)}
                </h3>
              </div>

              <div>
                <span className="pixel-label">ANIMAL IMPACT</span>
                <h3 className="mt-2 text-3xl font-black">
                  {formatAnimals(impact.animalsSpared)}
                </h3>
              </div>
            </div>

            <div className="mt-6 border-t border-[#3F382F]/15 pt-5">
              <span className="pixel-label">
                {isProjected
                  ? 'BASED ON YOUR SELECTED SWAPS'
                  : 'BASED ON TRACKED PLANT-BASED DAYS'}
              </span>

              {!isProjected && (
                <p className="mt-2 text-sm text-[#3F382F]/65">
                  {data.cumulativeImpact.plantBasedDays} tracked
                  plant-based days.
                </p>
              )}
            </div>
          </article>

          <article className="dashboard-card">
            <div className="card-title">
              <div>
                <span className="pixel-label">YOUR ACTIVITY</span>
                <h2>Swap progress</h2>
              </div>
            </div>

            <div className="mt-6 text-center">
              <strong className="text-6xl font-black">
                {data.selectedSwapCount}
              </strong>

              <p className="mt-2 text-[#3F382F]/65">
                Currently selected swaps
              </p>
            </div>

            <div className="mt-7 flex justify-center">
            <Link href="/swaps" className="pixel-button">
              Explore more swaps
              <Icon name="arrow" />
            </Link>
          </div>
          </article>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="dashboard-card">
            <span className="pixel-label">PLANT-BASED PROGRESS</span>

            <h2 className="mt-2 text-2xl font-black">
              {data.cumulativeImpact.plantBasedDays} days
            </h2>

            <p className="mt-2 text-sm text-[#3F382F]/65">
              Total tracked plant-based days.
            </p>
          </article>

          <article className="dashboard-card">
            <span className="pixel-label">YOUR NEXT STEP</span>

            <h2 className="mt-2 text-2xl font-black">
              Keep exploring alternatives
            </h2>

            <p className="mt-2 text-sm text-[#3F382F]/65">
              Find another plant-based alternative that works for you.
            </p>

            <Link
              href="/swaps"
              className="mt-4 inline-flex items-center gap-2 font-bold underline"
            >
              Browse swaps <Icon name="arrow" />
            </Link>
          </article>
        </div>
      </div>
    </main>
  )
}



export function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [wantsMealPlan, setWantsMealPlan] = useState(false)

  
const submit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    // Retrieve the user's saved sustainability quiz answers.
    const savedAnswers = localStorage.getItem('cowculator-answers')

    let quizResponses = null

    if (savedAnswers) {
      try {
        quizResponses = JSON.parse(savedAnswers)
      } catch {
        throw new Error(
          'Your saved quiz answers could not be read. Please retake the quiz before signing up.'
        )
      }
    }

    // Create the user's account and save their quiz responses.
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        wantsMealPlan,
        quizResponses,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.errors?.[0]?.message ||
        data.message ||
        'Unable to create your account. Please try again.'
      )
    }

    setSuccess(true)
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Something went wrong. Please try again.'
    )
  } finally {
    setLoading(false)
  }
}


  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="signup-card mx-auto w-full max-w-5xl">
        <div className="signup-art">
          <CowMascot small />
          <div className="paper-sheet">
            <span>JOIN THE</span>
            <b>
              PLANET
              <br />
              HERD
            </b>
            <i>FREE</i>
          </div>
        </div>

        <div className="signup-copy min-w-0 px-6 py-8 sm:px-9 sm:py-10">
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            JOIN THE
            <br />
            <span className="text-[#A8B99A]">MOO-VEMENT.</span>
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#3F382F]/70 sm:text-base">
            Create your Cowculator account to save your progress,
            track your impact, and keep earning points for the planet.
          </p>

          {success ? (
            <div className="success-box mt-7">
              <Icon name="check" size={26} />
              <div>
                <b>Welcome to the herd!</b>
                <p>Your account was successfully created.</p>
              </div>
            </div>
          ) : (
            <form className="mt-7 space-y-5" onSubmit={submit}>
              <div className="space-y-2">
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-bold tracking-wider text-[#3F382F]"
                >
                  YOUR NAME
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  className="w-full rounded-sm border-2 border-[#3F382F]/25 bg-white px-4 py-3 text-sm text-[#3F382F] outline-none transition focus:border-[#A8B99A]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-bold tracking-wider text-[#3F382F]"
                >
                  EMAIL ADDRESS
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-sm border-2 border-[#3F382F]/25 bg-white px-4 py-3 text-sm text-[#3F382F] outline-none transition focus:border-[#A8B99A]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-bold tracking-wider text-[#3F382F]"
                >
                  PASSWORD
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-sm border-2 border-[#3F382F]/25 bg-white px-4 py-3 text-sm text-[#3F382F] outline-none transition focus:border-[#A8B99A]"
                />
                <p className="text-xs text-[#3F382F]/55">
                  Use at least 8 characters.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-[#3F382F]/15 bg-[#F5F1E8] p-3">
                <input
                  type="checkbox"
                  checked={wantsMealPlan}
                  onChange={(e) => setWantsMealPlan(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#A8B99A]"
                />
                <span className="text-xs leading-5 text-[#3F382F]/80 sm:text-sm">
                  Send me the free seven-day plant-forward meal plan by email!
                </span>
              </label>

              {error && (
                <div role="alert" className="error-box">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="pixel-button flex w-full items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create my account'}
                {!loading && <Icon name="arrow" />}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[#3F382F]/55">
                <Icon name="lock" size={13} />
                Your password is securely handled by Payload.
              </p>
            </form>
          )}

          <div className="mt-7 border-t border-[#3F382F]/15 pt-5">
            <Link
              href="/calculator"
              className="block text-center text-sm font-bold text-[#3F382F] underline underline-offset-4 transition hover:text-[#8B9B7C]"
            >
              Continue without an account
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}


export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.errors?.[0]?.message ||
          data.message ||
          'Incorrect email or password. Please try again.'
        )
      }

      setSuccess(true)

      window.dispatchEvent(new Event('cowculator-auth-change'))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="signup-card mx-auto w-full max-w-5xl">
        <div className="signup-art">
          <CowMascot small />
          <div className="paper-sheet">
            <span>WELCOME</span>
            <b>
              BACK TO
              <br />
              THE HERD
            </b>
            <i>HI!</i>
          </div>
        </div>

        <div className="signup-copy min-w-0 px-6 py-8 sm:px-9 sm:py-10">
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
            WELCOME
            <br />
            <span className="text-[#A8B99A]">BACK.</span>
          </h1>

          <p className="mt-4 text-sm leading-6 text-[#3F382F]/70 sm:text-base">
            Log in to Cowculator to revisit your progress,
            track your impact, and keep earning points for the planet.
          </p>

          {success ? (
            <div className="success-box mt-7">
              <Icon name="check" size={26} />
              <div>
                <b>You're back in the herd!</b>
                <p>You successfully logged in.</p>
              </div>
            </div>
          ) : (
            <form className="mt-7 space-y-5" onSubmit={submit}>
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold tracking-wider text-[#3F382F]"
                >
                  EMAIL ADDRESS
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-sm border-2 border-[#3F382F]/25 bg-white px-4 py-3 text-sm text-[#3F382F] outline-none transition focus:border-[#A8B99A]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold tracking-wider text-[#3F382F]"
                >
                  PASSWORD
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-sm border-2 border-[#3F382F]/25 bg-white px-4 py-3 text-sm text-[#3F382F] outline-none transition focus:border-[#A8B99A]"
                />
              </div>

              {error && (
                <div role="alert" className="error-box">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="pixel-button flex w-full items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log in'}
                {!loading && <Icon name="arrow" />}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[#3F382F]/55">
                <Icon name="lock" size={13} />
                Your account is securely authenticated by Payload.
              </p>
            </form>
          )}

          <div className="mt-7 border-t border-[#3F382F]/15 pt-5">
            <Link
              href="/signup"
              className="block text-center text-sm font-bold text-[#3F382F] underline underline-offset-4 transition hover:text-[#8B9B7C]"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}


