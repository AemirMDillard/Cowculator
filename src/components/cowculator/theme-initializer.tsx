'use client'

import { useEffect } from 'react'

export type Theme = 'classic' | 'chicken' | 'spooky'

export const themeStorageKey = 'cowculator-theme'

export function isTheme(value: string | null): value is Theme {
  return value === 'classic' || value === 'chicken' || value === 'spooky'
}

export function ThemeInitializer() {
  useEffect(() => {
    const applySavedTheme = () => {
      try {
        const savedTheme = window.localStorage.getItem(themeStorageKey)
        if (isTheme(savedTheme)) {
          document.documentElement.dataset.theme = savedTheme
        } else {
          delete document.documentElement.dataset.theme
        }
      } catch (error) {
        console.error('Unable to load the saved theme.', error)
      }
    }

    applySavedTheme()
    window.addEventListener('storage', applySavedTheme)
    return () => window.removeEventListener('storage', applySavedTheme)
  }, [])

  return null
}
