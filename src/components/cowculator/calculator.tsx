'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CowMascot, Icon } from './shared'

type Question = {
  id: string
  category: string
  question: string
  detail: string
  options: string[]
}

const frequencyOptions = [
  'Daily',
  '3–4 times a week',
  '1–2 times a week',
  'About once a month',
  'Never',
]

const dietPatternQuestion: Question = {
  id: 'dietPattern',
  category: 'START HERE',
  question: 'Which best describes how you eat right now?',
  detail: '',
  options: [
    'Fully plant-based (vegan)',
    'Mostly plant-based',
    'Vegetarian',
    'A mix of plant and animal foods',
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
    ],
  },
]

const plantIngredientQuestions: Question[] = [
  {
    id: 'avocados',
    category: 'PLANT-BASED FOODS',
    question: 'How often do you eat avocados?',
    detail: 'Include avocado in meals, snacks, spreads, or drinks.',
    options: frequencyOptions,
  },
  {
    id: 'palmOil',
    category: 'PLANT-BASED FOODS',
    question: 'How often do you eat foods containing palm oil?',
    detail:
      'As best you can estimate—palm oil can be in packaged snacks, baked goods, and spreads.',
    options: frequencyOptions,
  },
  {
    id: 'almondMilk',
    category: 'PLANT-BASED FOODS',
    question: 'How often do you drink almond milk?',
    detail: 'Include almond milk in drinks, cereal, cooking, or baking.',
    options: frequencyOptions,
  },
]

const vegetarianQuestions: Question[] = [
  {
    id: 'dairy',
    category: 'DAIRY',
    question: 'How often do you consume dairy?',
    detail: 'Think milk, cheese, yogurt, butter and other dairy products.',
    options: frequencyOptions,
  },
  {
    id: 'eggs',
    category: 'EGGS',
    question: 'How often do you eat eggs?',
    detail: 'Include eggs in breakfasts, baking and other meals.',
    options: frequencyOptions,
  },
]

const animalFoodQuestions: Question[] = [
  {
    id: 'redMeat',
    category: 'MEAT',
    question: 'How often do you eat red meat?',
    detail: 'Think beef, lamb, burgers and steaks.',
    options: frequencyOptions,
  },
  {
    id: 'poultry',
    category: 'POULTRY',
    question: 'How often do you eat poultry?',
    detail: 'Think chicken and turkey.',
    options: frequencyOptions,
  },
  {
    id: 'seafood',
    category: 'SEAFOOD',
    question: 'How often do you eat fish or seafood?',
    detail: 'Include fish, shrimp, shellfish and other seafood.',
    options: frequencyOptions,
  },
  {
    id: 'dairy',
    category: 'DAIRY',
    question: 'How often do you consume dairy?',
    detail: 'Think milk, cheese, yogurt, butter and other dairy products.',
    options: frequencyOptions,
  },
  {
    id: 'eggs',
    category: 'EGGS',
    question: 'How often do you eat eggs?',
    detail: 'Include eggs in breakfasts, baking and other meals.',
    options: frequencyOptions,
  },
]

const plantMealQuestion: Question = {
  id: 'plantMeals',
  category: 'PLANT-BASED FOODS',
  question: 'How often do you eat fully plant-based meals?',
  detail: 'Think meals built around beans, lentils, tofu, vegetables or grains.',
  options: ['Almost never', '1–3 times a week', '4–6 times a week', 'Every day'],
}

function getQuestions(dietPattern?: string): Question[] {
  if (!dietPattern) return [dietPatternQuestion]

  if (dietPattern === 'Fully plant-based (vegan)') {
    return [dietPatternQuestion, ...plantBasedQuestions, ...plantIngredientQuestions]
  }

  if (dietPattern === 'Vegetarian') {
    return [
      dietPatternQuestion,
      ...vegetarianQuestions,
      ...plantIngredientQuestions,
      plantMealQuestion,
    ]
  }

  if (dietPattern === 'Mostly plant-based') {
    return [
      dietPatternQuestion,
      ...animalFoodQuestions,
      ...plantIngredientQuestions,
      plantMealQuestion,
    ]
  }

  return [dietPatternQuestion, ...animalFoodQuestions, plantMealQuestion]
}

export function CalculatorPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const router = useRouter()

  const questions = getQuestions(answers.dietPattern)
  const q = questions[step]
  const selectedAnswer = answers[q.id]

  const select = (answer: string) => {
    const next = q.id === 'dietPattern' ? { dietPattern: answer } : { ...answers, [q.id]: answer }

    setAnswers(next)
    localStorage.setItem('cowculator-answers', JSON.stringify(next))
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return

      const target = event.target instanceof Element ? event.target : null
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
      ) {
        return
      }
      if (
        target &&
        target !== document.body &&
        target !== document.documentElement &&
        !target.closest('.calculator-stage')
      ) {
        return
      }

      const optionIndex = event.key.toUpperCase().charCodeAt(0) - 65
      const answer = q.options[optionIndex]
      if (!answer) return

      event.preventDefault()
      select(answer)

      const nextDietPattern = q.id === 'dietPattern' ? answer : answers.dietPattern
      if (step < getQuestions(nextDietPattern).length - 1) {
        setStep(step + 1)
      } else {
        router.push('/swaps')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [q, questions.length, router, step])

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

            <div className="mt-6 flex items-baseline justify-between gap-3 sm:mt-0">
              <p className="pixel-label">CHOOSE ONE</p>
              <span className="text-[11px] text-[#3F382F]/55">
                Press A-{String.fromCharCode(64 + q.options.length)} to choose and continue
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {q.options.map((option, i) => (
                <button
                  key={option}
                  className={`answer-button ${selectedAnswer === option ? 'selected' : ''}`}
                  aria-keyshortcuts={String.fromCharCode(65 + i)}
                  onClick={() => select(option)}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {option}
                  {selectedAnswer === option && <Icon name="check" size={17} />}
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
