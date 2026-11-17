'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useState } from 'react'
import { isTheme, themeStorageKey, type Theme } from './theme-initializer'

const themes: {
  id: Theme
  title: string
  icon: string
  description: string
}[] = [
  {
    id: 'classic',
    title: 'Classic',
    icon: '🐮',
    description: 'The original sunny pasture.',
  },
  {
    id: 'chicken',
    title: 'Chicken',
    icon: '🐔',
    description: 'Warm golden coop colors.',
  },
  {
    id: 'spooky',
    title: 'Spooky',
    icon: '👻',
    description: 'A dark, moonlit palette.',
  },
]

export function SettingsPage() {
  const [theme, setTheme] = useState<Theme>('classic')
  const [authenticated, setAuthenticated] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [savedUsername, setSavedUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(themeStorageKey)
      if (isTheme(savedTheme)) setTheme(savedTheme)
    } catch (loadError) {
      console.error('Unable to read the saved theme.', loadError)
    }

    let active = true

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.status === 401) return

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Could not load your profile.')
        }

        if (active && typeof data.name === 'string') {
          setUsername(data.name)
          setSavedUsername(data.name)
          setAuthenticated(true)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load your profile.')
        }
      } finally {
        if (active) setProfileLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  const chooseTheme = (nextTheme: Theme) => {
    try {
      window.localStorage.setItem(themeStorageKey, nextTheme)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? 'Your theme could not be saved in this browser.'
          : 'Your theme could not be saved.',
      )
      return
    }

    document.documentElement.dataset.theme = nextTheme
    setTheme(nextTheme)
    setError('')
  }

  const saveUsername = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Your username could not be updated.')
      }

      setUsername(data.name)
      setSavedUsername(data.name)
      setMessage('Username updated.')
      window.dispatchEvent(new Event('cowculator-profile-change'))
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Your username could not be updated.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-[900px] px-5 py-10 sm:py-14">
        <header className="mb-8">
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">SETTINGS</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#3F382F]/70">
            Pick a look for Cowculator and update the name friends see.
          </p>
        </header>

        <section className="dashboard-card" aria-labelledby="theme-heading">
          <div className="card-title">
            <div>
              <span className="pixel-label">MAKE IT YOURS</span>
              <h2 id="theme-heading">App theme</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {themes.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={theme === option.id}
                onClick={() => chooseTheme(option.id)}
                className={`rounded-sm border-2 p-4 text-left transition ${
                  theme === option.id
                    ? 'border-[#3F382F] bg-[#E9D48E] shadow-[3px_3px_0_#3F382F]'
                    : 'border-[#3F382F]/20 bg-white hover:border-[#3F382F]/50'
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {option.icon}
                </span>
                <span className="mt-2 block font-black">{option.title}</span>
                <span className="mt-1 block text-xs leading-5 text-[#3F382F]/65">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#3F382F]/60">Your theme is saved in this browser.</p>
        </section>

        <section className="dashboard-card mt-6" aria-labelledby="username-heading">
          <div className="card-title">
            <div>
              <span className="pixel-label">PROFILE</span>
              <h2 id="username-heading">Username</h2>
            </div>
          </div>

          {profileLoading ? (
            <p className="mt-4 text-sm text-[#3F382F]/65">Loading profile…</p>
          ) : authenticated ? (
            <form className="mt-5 max-w-lg space-y-4" onSubmit={saveUsername}>
              <div className="space-y-2">
                <label htmlFor="settings-username" className="block text-sm font-bold">
                  Name shown to friends and on the leaderboard
                </label>
                <input
                  id="settings-username"
                  name="username"
                  type="text"
                  autoComplete="nickname"
                  required
                  minLength={2}
                  maxLength={32}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-sm border-2 border-[#3F382F]/25 bg-white px-4 py-3 text-sm text-[#3F382F] outline-none transition focus:border-[#A8B99A]"
                />
              </div>

              {message && (
                <p role="status" className="text-sm font-bold text-green-800">
                  {message}
                </p>
              )}
              {error && (
                <p role="alert" className="error-box">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="pixel-button small"
                disabled={saving || !username.trim() || username.trim() === savedUsername}
              >
                {saving ? 'Saving…' : 'Save username'}
              </button>
            </form>
          ) : (
            <div className="mt-4">
              <p className="text-sm leading-6 text-[#3F382F]/70">
                Sign in to change the username shown to friends and on the leaderboard.
              </p>
              <Link href="/login" className="pixel-button small mt-4">
                Log in
              </Link>
            </div>
          )}
        </section>

        {error && !authenticated && !profileLoading && (
          <p role="alert" className="error-box mt-4">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}
