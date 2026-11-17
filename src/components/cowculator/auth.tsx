'use client'

import Link from 'next/link'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { clearUserCache } from '@/lib/client-cache'
import { CowMascot, Icon } from './shared'

export function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dietType, setDietType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [wantsMealPlan, setWantsMealPlan] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [continueToJourney, setContinueToJourney] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('ref')
    setContinueToJourney(params.get('next') === '/journey')
    if (!code) return

    if (/^[a-f0-9]{24}$/i.test(code)) {
      setReferralCode(code.toLowerCase())
    } else {
      setError('This friend invite link looks incomplete. You can still sign up without it.')
    }
  }, [])

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
            'Your saved quiz answers could not be read. Please retake the quiz before signing up.',
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
          ...(dietType ? { dietType } : {}),
          quizResponses,
          ...(referralCode ? { referralCodeUsed: referralCode } : {}),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.errors?.[0]?.message ||
            data.message ||
            'Unable to create your account. Please try again.',
        )
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
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
            Create your Cowculator account to save your progress, track your impact, and keep
            earning points for the planet.
          </p>
          {referralCode && (
            <p className="mt-3 border-l-4 border-[#A8B99A] bg-white/70 px-3 py-2 text-sm">
              You&apos;re joining with a friend invite. Points you earn from your swaps will also
              count toward their score this month.
            </p>
          )}

          {success ? (
            <div className="success-box mt-7">
              <Icon name="check" size={26} />
              <div>
                <b>Welcome to the herd!</b>
                <p>Your account was successfully created.</p>
                {referralCode && (
                  <p className="mt-2 text-sm">
                    Your swap points will also count toward your friend&apos;s monthly score.
                  </p>
                )}
                {continueToJourney && (
                  <Link
                    href="/login?next=%2Fjourney"
                    className="mt-3 inline-block font-bold underline"
                  >
                    Log in to start your plant-based journey
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <form className="mt-7 space-y-5" onSubmit={submit}>
              <div className="space-y-2">
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-bold tracking-wider text-[#3F382F]"
                >
                  USERNAME
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  minLength={2}
                  maxLength={32}
                  autoComplete="nickname"
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
                  htmlFor="signup-diet"
                  className="block text-xs font-bold tracking-wider text-[#3F382F]"
                >
                  CURRENT DIET (OPTIONAL)
                </label>
                <select
                  id="signup-diet"
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                  className="w-full rounded-sm border-2 border-[#3F382F]/25 bg-white px-4 py-3 text-sm text-[#3F382F] outline-none transition focus:border-[#A8B99A]"
                >
                  <option value="">Choose if you like</option>
                  <option value="vegan">Vegan / plant-based</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="omnivore">Omnivore</option>
                  <option value="other">Other</option>
                  <option value="not_sure">Not sure</option>
                </select>
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
                <p className="text-xs text-[#3F382F]/55">Use at least 8 characters.</p>
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
  const [continueTo, setContinueTo] = useState('/dashboard')

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
            'Incorrect email or password. Please try again.',
        )
      }

      clearUserCache()
      setContinueTo(
        new URLSearchParams(window.location.search).get('next') === '/journey'
          ? '/journey'
          : '/dashboard',
      )
      setSuccess(true)

      window.dispatchEvent(new Event('cowculator-auth-change'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
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
            Log in to Cowculator to revisit your progress, track your impact, and keep earning
            points for the planet.
          </p>

          {success ? (
            <div className="success-box mt-7">
              <Icon name="check" size={26} />
              <div>
                <b>You're back in the herd!</b>
                <p>You successfully logged in.</p>
                <Link href={continueTo} className="mt-2 inline-block font-bold underline">
                  Continue
                </Link>
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
