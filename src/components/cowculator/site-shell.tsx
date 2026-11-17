'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { clearUserCache } from '@/lib/client-cache'
import { Icon, PixelLogo } from './shared'

const nav = [
  ['How it works', '/#how-it-works'],
  ['Swaps', '/swaps'],
  ['Friends', '/friends'],
  ['Leaderboard', '/leaderboard'],
  ['My impact', '/dashboard'],
]

export function SiteHeader() {
  const path = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)

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

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [path])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
        mobileMenuButtonRef.current?.focus()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenuOpen])

  const logout = async () => {
    try {
      const response = await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        clearUserCache()
        setIsLoggedIn(false)
        setAccountMenuOpen(false)
        setMobileMenuOpen(false)
        window.location.href = '/'
      }
    } catch {
      console.error('Unable to log out.')
    }
  }

  return (
    <header className="site-header sticky top-0 z-50 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 lg:px-8">
        <PixelLogo compact />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className={`nav-link ${path === href ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <div className="relative">
              <button
                ref={mobileMenuButtonRef}
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="pixel-button small flex items-center gap-2"
                aria-expanded={accountMenuOpen}
              >
                <Icon name="user" size={16} />
                My Account
                <Icon name="arrow" size={14} />
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-sm border-2 border-[#3F382F]/20 bg-[#F5F0DF] p-2 shadow-lg">
                  <Link
                    href="/friends"
                    className="block px-3 py-2 text-sm font-bold text-[#3F382F] hover:bg-[#A8B99A]/25"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    Friends
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-sm font-bold text-[#3F382F] hover:bg-[#A8B99A]/25"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    My Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-3 py-2 text-sm font-bold text-[#3F382F] hover:bg-[#A8B99A]/25"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    Settings
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
            <>
              <Link
                href="/settings"
                className="text-sm font-bold text-[#3F382F] hover:text-[#8B9B7C]"
              >
                Settings
              </Link>
              <Link href="/login" className="text-sm font-bold text-[#3F382F] hover:text-[#8B9B7C]">
                Log in
              </Link>

              <Link href="/signup" className="pixel-button small">
                Sign up <Icon name="arrow" size={16} />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="mobile-menu-toggle grid place-items-center md:hidden"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span className={`mobile-menu-icon ${mobileMenuOpen ? 'open' : ''}`} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      <nav
        id="mobile-navigation"
        className="mobile-navigation md:hidden"
        aria-label="Mobile navigation"
        hidden={!mobileMenuOpen}
      >
        <div className="mobile-nav-links">
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? 'page' : undefined}
              className={path === href ? 'active' : ''}
              onClick={() => setMobileMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="mobile-nav-actions">
          {isLoggedIn ? (
            <>
              <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                Settings
              </Link>
              <button type="button" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                Settings
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="pixel-button"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer border-t-2">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-10 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <PixelLogo />
          <p className="mt-3 max-w-sm text-sm text-[#F5F0DF]/70">
            Tiny changes at the dinner table save lives and the planet...
          </p>
          <p className="pixel-label mt-5 text-[#E9D48E]">SAY HELLO</p>
          <div className="mt-3 flex flex-col items-start gap-2 text-sm">
            <a
              href="https://www.instagram.com/trycowculator/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-[#E9D48E]"
            >
              Instagram · @trycowculator
            </a>
            <a
              href="https://www.tiktok.com/@trycowculator"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-[#E9D48E]"
            >
              TikTok · @trycowculator
            </a>
            <a
              href="mailto:trycowculator@gmail.com"
              className="underline underline-offset-4 hover:text-[#E9D48E]"
            >
              trycowculator@gmail.com
            </a>
          </div>
        </div>
        <div>
          <p className="pixel-label text-[#E9D48E]">EXPLORE</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/calculator">Cowculate impact</Link>
            <Link href="/swaps">Sustainable swaps</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/friends">Find friends</Link>
            <Link href="/journey">Plant-based journey</Link>
            <Link href="/settings">Settings</Link>
          </div>
        </div>
        <div>
          <p className="pixel-label text-[#E9D48E]">DISCLAIMER</p>
          <p className="mt-3 text-xs leading-5 text-[#F5F0DF]/60">
            All figures are based on peer-reviewed research estimates, not exact personal savings.
            Your actual impact may vary.
          </p>
        </div>
      </div>
    </footer>
  )
}
