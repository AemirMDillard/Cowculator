'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

export const colors = {
  brown: '#3F382F',
  cream: '#F5F0DF',
  green: '#A8B99A',
  pink: '#E9B8B0',
  yellow: '#E9D48E',
  lcd: '#D8E2CE',
}

export type IconName =
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
  | 'sprout'
  | 'users'

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
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
    sprout: <path d="M12 21v-9m0 4c-4 0-7-2-7-6 4 0 7 2 7 6Zm0-3c0-4 3-7 7-7 0 4-3 7-7 7Z" />,
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
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

export function PixelLogo({ compact = false }: { compact?: boolean }) {
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

export function CowMascot({ children, small = false }: { children?: ReactNode; small?: boolean }) {
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

export function Flower({ className = '' }: { className?: string }) {
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
