import { createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  useEffect(() => {
    // Selalu paksa tema ke 'light' mode untuk menyederhanakan arsitektur
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('z-exam-theme', 'light')
  }, [])

  const toggle = () => {
    // Tidak melakukan apa-apa karena mode malam telah dinonaktifkan
  }

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
