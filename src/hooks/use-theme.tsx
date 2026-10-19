import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = 'portal-viabilize-theme'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') {
      return saved
    }
  } catch {
    // localStorage might be unavailable/restricted
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore storage write errors
    }
  }, [theme])

  // Listen to system preference changes if no manual override is saved
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved) {
          setThemeState(e.matches ? 'dark' : 'light')
        }
      } catch {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
