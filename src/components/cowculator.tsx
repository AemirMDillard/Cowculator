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
      <span className="logo-cow" aria-hidden="true">
        <i />
        <b />
      </span>
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
  return (
    <header className="sticky top-0 z-50 border-b-2 border-[#3F382F]/15 bg-[#F5F0DF]/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 lg:px-8">
        <PixelLogo compact />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className={`nav-link ${path === href ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
        </nav>
        <Link href="/calculator" className="pixel-button small">
          Start calculating <Icon name="arrow" size={16} />
        </Link>
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
            <Link href="/calculator">Calculate impact</Link>
            <Link href="/swaps">Sustainable swaps</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </div>
        </div>
        <div>
          <p className="pixel-label text-[#E9D48E]">DISCLAIMER</p>
          <p className="mt-3 text-xs leading-5 text-[#F5F0DF]/60">
            All figures are based of peer-reviewed research estimates, not exact personal savings. Your actual
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
                Do moothematics <Icon name="arrow" />
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
              Join heros for the planet globally!
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
              The age of performative animal and planet lovers is over. Can you make at least 2 changes to minimize your impact?
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

const questions = [
  {
    category: 'MEAT',
    question: 'How often do you eat red meat?',
    detail: 'Think beef, lamb, burgers and steaks.',
    options: ['Daily', 'A few times a week', 'Occasionally', 'Never'],
  },
  {
    category: 'DAIRY',
    question: 'How often do you have dairy milk?',
    detail: 'In drinks, cereal, cooking or on its own.',
    options: ['Daily', 'A few times a week', 'Occasionally', 'Never'],
  },
  {
    category: 'EGGS',
    question: 'How often do eggs land on your plate?',
    detail: 'Breakfasts, baking and meals all count.',
    options: ['Daily', 'A few times a week', 'Occasionally', 'Never'],
  },
  {
    category: 'POULTRY',
    question: 'How often do you eat chicken?',
    detail: 'Include meals at home and eating out.',
    options: ['Daily', 'A few times a week', 'Occasionally', 'Never'],
  },
  {
    category: 'PLANTS',
    question: 'How many plant-based meals do you eat?',
    detail: 'Meals built around beans, tofu or vegetables.',
    options: ['Almost none', '1–3 per week', '4–6 per week', 'Every day'],
  },
]

export function CalculatorPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const q = questions[step]
  const select = (answer: string) => {
    const next = { ...answers, [step]: answer }
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
                  className={`h-2 w-7 ${i <= step ? 'bg-[#E9B8B0]' : 'bg-[#3F382F]/15'}`}
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
                    className={`h-2 flex-1 ${i <= step ? 'bg-[#E9B8B0]' : 'bg-[#3F382F]/15'}`}
                  />
                ))}
              </div>
            </div>
            <p className="pixel-label mt-6 sm:mt-0">CHOOSE ONE</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {q.options.map((option, i) => (
                <button
                  key={option}
                  className={`answer-button ${answers[step] === option ? 'selected' : ''}`}
                  onClick={() => select(option)}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {option}
                  {answers[step] === option && <Icon name="check" size={17} />}
                </button>
              ))}
            </div>
            <p className="mt-5 text-sm text-[#3F382F]/55">
              There are no correct answers! honest estimates give you better swaps.
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
                  disabled={!answers[step]}
                  onClick={() => setStep((s) => s + 1)}
                >
                  Next <Icon name="arrow" />
                </button>
              ) : (
                <Link
                  className={`pixel-button ${!answers[step] ? 'pointer-events-none opacity-40' : ''}`}
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

const swapData = [
  {
    from: 'Beef burger',
    to: 'Smoky tofu burger',
    icon: 'B→T',
    carbon: '18.2 kg',
    water: '1,740 L',
    points: 480,
    color: 'pink',
  },
  {
    from: 'Dairy milk',
    to: 'Soy milk',
    icon: 'M→S',
    carbon: '5.6 kg',
    water: '628 L',
    points: 240,
    color: 'green',
  },
  {
    from: 'Chicken',
    to: 'Plant protein',
    icon: 'C→P',
    carbon: '4.1 kg',
    water: '390 L',
    points: 180,
    color: 'yellow',
  },
  {
    from: 'Dairy yogurt',
    to: 'Soy yogurt',
    icon: 'Y→S',
    carbon: '2.8 kg',
    water: '212 L',
    points: 120,
    color: 'pink',
  },
]

export function SwapsPage() {
  const [selected, setSelected] = useState<number[]>([0, 1])
  const toggle = (i: number) =>
    setSelected((x) => (x.includes(i) ? x.filter((v) => v !== i) : [...x, i]))
  useEffect(() => {
    localStorage.setItem('cowculator-swaps', JSON.stringify(selected))
  }, [selected])
  const points = selected.reduce((sum, i) => sum + swapData[i].points, 0)
  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[1180px] px-5 py-14 lg:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <span className="eyebrow">LEVEL 2 · POWER-UPS</span>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
              CHOOSE YOUR <span className="text-[#A8B99A]">SWAPS</span>
            </h1>
            <p className="mt-4 max-w-2xl text-[#3F382F]/65">
              Pick upgrades that feel doable. Your estimated monthly savings update as you go.
            </p>
          </div>
          <div className="points-pill">
            <Icon name="spark" />
            <span>
              <b>{points}</b> OPTIMIZATION PTS
            </span>
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {swapData.map((swap, i) => (
            <article
              key={swap.from}
              className={`swap-card ${selected.includes(i) ? 'chosen' : ''}`}
            >
              <div className={`swap-icon ${swap.color}`}>{swap.icon}</div>
              <div className="min-w-0 flex-1">
                <span className="pixel-label">SWAP {String(i + 1).padStart(2, '0')}</span>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xl font-black">
                  <s className="text-[#3F382F]/40">{swap.from}</s>
                  <Icon name="arrow" size={18} />
                  <span>{swap.to}</span>
                </div>
                <div className="mt-5 flex gap-5 text-sm">
                  <span>
                    <Icon name="leaf" size={16} />
                    <b>{swap.carbon}</b> CO₂e
                  </span>
                  <span>
                    <Icon name="water" size={16} />
                    <b>{swap.water}</b> water
                  </span>
                </div>
              </div>
              <button
                aria-label={`${selected.includes(i) ? 'Remove' : 'Select'} ${swap.from} swap`}
                onClick={() => toggle(i)}
                className="select-toggle"
              >
                {selected.includes(i) ? <Icon name="check" /> : '+'}
              </button>
              <div className="point-tag">+{swap.points} PTS</div>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t-2 border-dashed border-[#3F382F]/20 pt-8 sm:flex-row">
          <p className="text-sm">
            <b>{selected.length} power-ups selected</b>
            <br />
            <span className="text-[#3F382F]/55">You can always change these later.</span>
          </p>
          <Link href="/results" className="pixel-button">
            Reveal my impact <Icon name="spark" />
          </Link>
        </div>
      </div>
    </main>
  )
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
    <article className="stat-card" style={{ '--accent': color } as React.CSSProperties}>
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

export function ResultsPage() {
  const [points, setPoints] = useState(720)
  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem('cowculator-swaps') || '[0,1]') as number[]
      setPoints(ids.reduce((sum, i) => sum + (swapData[i]?.points || 0), 0))
    } catch {}
  }, [])
  return (
    <main className="page-shell results-bg">
      <div className="mx-auto max-w-[1180px] px-5 py-14 lg:px-8">
        <div className="result-banner">
          <div>
            <span className="pixel-label text-[#E9D48E]">LEVEL COMPLETE</span>
            <h1>
              LOOK AT YOU,
              <br />
              PLANET PAL!
            </h1>
            <p>Your chosen swaps have some serious potential.</p>
          </div>
          <div className="result-score">
            <span>TOTAL SCORE</span>
            <b>{points.toLocaleString()}</b>
            <small>OPTIMIZATION POINTS</small>
          </div>
          <div className="confetti c1" />
          <div className="confetti c2" />
          <div className="confetti c3" />
        </div>
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-2xl font-black">YOUR POTENTIAL YEARLY IMPACT</h2>
          <span className="estimate-label">RESEARCH-BASED ESTIMATE</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon="leaf" value="286" unit="kg" label="CARBON AVOIDED" color={colors.green} />
          <StatCard icon="water" value="28.4" unit="kL" label="WATER SAVED" color="#AFC7CE" />
          <StatCard icon="chart" value="72" unit="m²" label="LAND REDUCED" color={colors.yellow} />
          <StatCard icon="paw" value="14" unit="" label="ANIMALS SPARED" color={colors.pink} />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <article className="achievement-card">
            <div className="achievement-medal">
              <Icon name="trophy" size={36} />
            </div>
            <div>
              <span className="pixel-label">ACHIEVEMENT UNLOCKED</span>
              <h3>Udderly Impressive</h3>
              <p>You chose at least two high-impact food swaps.</p>
            </div>
            <span className="reward">+100 BONUS</span>
          </article>
          <article className="reality-card">
            <Icon name="spark" />
            <div>
              <h3>Potential, not a promise</h3>
              <p>
                These are projected savings if you keep your swaps. Track them over time to turn
                potential into progress.
              </p>
            </div>
          </article>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link className="pixel-button" href="/meal-plan">
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

export function MealPlanPage() {
  const [sent, setSent] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSent(true)
  }
  return (
    <main className="page-shell grid place-items-center px-5 py-20">
      <div className="signup-card">
        <div className="signup-art">
          <CowMascot small />
          <div className="paper-sheet">
            <span>7-DAY</span>
            <b>
              MEAL
              <br />
              PLAN
            </b>
            <i>FREE</i>
          </div>
        </div>
        <div className="signup-copy">
          <span className="eyebrow">YOUR NEXT POWER-UP</span>
          <h1>
            DINNER PLANS,
            <br />
            <span>SORTED.</span>
          </h1>
          <p>
            Get a free 7-day plant-forward meal plan tailored to your chosen swaps. Delicious,
            doable, and delivered to your inbox.
          </p>
          {sent ? (
            <div className="success-box">
              <Icon name="check" size={26} />
              <div>
                <b>Meal plan unlocked!</b>
                <p>Check your inbox for your first tasty swap.</p>
              </div>
            </div>
          ) : (
            <form className="mt-7" onSubmit={submit}>
              <label htmlFor="email">EMAIL ADDRESS</label>
              <div className="email-row">
                <span>
                  <Icon name="mail" />
                </span>
                <input required id="email" type="email" placeholder="you@example.com" />
                <button type="submit">
                  Send my plan <Icon name="arrow" size={18} />
                </button>
              </div>
              <small>
                <Icon name="lock" size={13} /> No spam. Just good food and tiny wins. Unsubscribe
                anytime.
              </small>
            </form>
          )}
          <Link
            href="/results"
            className="mt-8 inline-block text-sm font-bold underline underline-offset-4"
          >
            No thanks, back to my results
          </Link>
        </div>
      </div>
    </main>
  )
}

const leaders = [
  ['1', 'Moo-dy Judy', '12,840', '2.4t', '6'],
  ['2', 'Planty McPlantface', '11,620', '2.1t', '8'],
  ['3', 'Bean There', '10,950', '1.9t', '4'],
  ['4', 'Greta Greens', '9,840', '1.7t', '5'],
  ['5', 'Tofu Fighter', '8,720', '1.5t', '3'],
  ['18', 'You', '3,480', '286kg', '2'],
]

export function LeaderboardPage() {
  const [tab, setTab] = useState('Global')
  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[1050px] px-5 py-14">
        <div className="text-center">
          <span className="eyebrow">HIGH SCORES</span>
          <h1 className="mt-3 text-4xl font-black sm:text-6xl">
            PLANET PAL <span className="text-[#E9B8B0]">LEADERBOARD</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[#3F382F]/65">
            Every point represents a better choice. See how our herd is changing the game.
          </p>
        </div>
        <div className="mx-auto mt-9 flex w-fit border-2 border-[#3F382F] bg-white p-1">
          {['Global', 'Friends', 'This month'].map((x) => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={`leader-tab ${tab === x ? 'active' : ''}`}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="mt-8 overflow-hidden border-2 border-[#3F382F] bg-white shadow-[8px_8px_0_#3F382F]">
          <div className="leader-head">
            <span>RANK / PLAYER</span>
            <span>IMPACT</span>
            <span>REFERRALS</span>
            <span>POINTS</span>
          </div>
          {leaders.map((row, i) => (
            <div key={row[1]} className={`leader-row ${row[1] === 'You' ? 'you' : ''}`}>
              <span className="rank">{row[0]}</span>
              <span className="player">
                <i
                  style={{
                    background: [
                      colors.yellow,
                      colors.pink,
                      colors.green,
                      '#B7C9D1',
                      '#D2B9A4',
                      colors.pink,
                    ][i],
                  }}
                >
                  {row[1][0]}
                </i>
                <b>{row[1]}</b>
                {i < 3 && <Icon name="trophy" size={16} />}
              </span>
              <span>{row[3]} CO₂e</span>
              <span>{row[4]} pals</span>
              <strong>{row[2]}</strong>
            </div>
          ))}
        </div>
        <div className="community-strip">
          <div>
            <Icon name="user" size={28} />
            <span>
              JOIN OTHER MOOTHEMATICIANS
            </span>
          </div>
          <div>
            <Icon name="leaf" size={28} />
            <span>
              <b>428 TONNES</b> COMMUNITY CO₂e
            </span>
          </div>
          <div>
            <Icon name="spark" size={28} />
            <span>
              <b>4.2M</b> TOTAL POINTS
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}

export function DashboardPage() {
  const [period, setPeriod] = useState('This month')
  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[1180px] px-5 py-12 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">PLAYER DASHBOARD</span>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              WELCOME BACK, <span className="text-[#A8B99A]">PLANET PAL.</span>
            </h1>
          </div>
          <select
            aria-label="Time period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="period-select"
          >
            <option>This month</option>
            <option>Last month</option>
            <option>All time</option>
          </select>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <article className="dashboard-score">
            <div>
              <span className="pixel-label text-[#F5F0DF]/70">YOUR OPTIMIZATION SCORE</span>
              <strong>3,480</strong>
              <p>Top 18% of all planet pals</p>
            </div>
            <div className="level-badge">
              <span>LEVEL</span>
              <b>07</b>
              <small>SPROUT SCOUT</small>
            </div>
          </article>
          <article className="streak-card">
            <Icon name="spark" size={34} />
            <div>
              <span className="pixel-label">CURRENT STREAK</span>
              <strong>4 WEEKS</strong>
              <p>Best: 6 weeks</p>
            </div>
          </article>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <article className="dashboard-card">
            <div className="card-title">
              <div>
                <span className="pixel-label">IMPACT TRACKER</span>
                <h2>Your progress</h2>
              </div>
              <span className="estimate-label">{period.toUpperCase()}</span>
            </div>
            <div className="chart-area">
              <div className="chart-bars">
                {[38, 50, 45, 66, 58, 80, 74, 92].map((h, i) => (
                  <i key={i} style={{ height: `${h}%` }}>
                    <b>{i === 7 ? '286' : ''}</b>
                  </i>
                ))}
              </div>
              <div className="chart-labels">
                <span>W1</span>
                <span>W2</span>
                <span>W3</span>
                <span>W4</span>
                <span>NOW</span>
              </div>
            </div>
            <div className="mini-stats">
              <span>
                <Icon name="leaf" />
                <b>286 kg</b> CO₂e avoided
              </span>
              <span>
                <Icon name="water" />
                <b>28.4 kL</b> water saved
              </span>
              <span>
                <Icon name="paw" />
                <b>14</b> animals spared
              </span>
            </div>
          </article>
          <article className="dashboard-card">
            <div className="card-title">
              <div>
                <span className="pixel-label">ACHIEVEMENTS</span>
                <h2>Badge cabinet</h2>
              </div>
              <span>5 / 12</span>
            </div>
            <div className="badge-grid">
              {[
                ['trophy', 'Early Adopter'],
                ['leaf', 'Leaf Legend'],
                ['water', 'Water Wizard'],
                ['spark', 'Swap Star'],
                ['user', 'Herd Hero'],
                ['lock', 'Locked'],
              ].map(([icon, label], i) => (
                <div key={label} className={i === 5 ? 'locked' : ''}>
                  <i>
                    <Icon name={icon as IconName} />
                  </i>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="referral-card">
            <div>
              <span className="pixel-label">GROW THE HERD</span>
              <h2>Your referral pasture</h2>
              <p>2 friends joined · 48 kg combined CO₂e avoided</p>
              <button onClick={() => navigator.clipboard?.writeText('cowculator.app/join/MOOPAL7')}>
                Copy invite link
              </button>
            </div>
            <div className="qr" aria-label="Referral QR code">
              <i />
              <i />
              <i />
              <span>MOOPAL7</span>
            </div>
          </article>
          <article className="next-swap">
            <div className="swap-icon green">M→S</div>
            <div>
              <span className="pixel-label">NEXT RECOMMENDED SWAP</span>
              <h2>Try oat milk twice this week</h2>
              <p>Potential reward: +80 points</p>
            </div>
            <Link href="/swaps" aria-label="View swaps">
              <Icon name="arrow" />
            </Link>
          </article>
        </div>
      </div>
    </main>
  )
}
