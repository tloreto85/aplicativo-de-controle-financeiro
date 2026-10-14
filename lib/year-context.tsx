"use client"

import { createContext, useCallback, useContext, useMemo } from "react"
import { usePersistedState } from "./use-persisted-state"

interface Settings {
  year: number
}

interface YearContextValue {
  /** Ano de trabalho escolhido; null enquanto as preferências carregam. */
  year: number | null
  setYear: (year: number) => void
}

const YearContext = createContext<YearContextValue | null>(null)

export const MIN_YEAR = 2000
export const MAX_YEAR = 2100

function currentYear() {
  return new Date().getFullYear()
}

function restoreSettings(raw: unknown): Settings {
  const year = Number((raw as Partial<Settings> | null)?.year)
  return { year: Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR ? year : currentYear() }
}

// Ano de trabalho compartilhado por Controle Financeiro, Dívidas e Calendário.
// A escolha fica salva no banco, então vale em qualquer computador.
export function YearProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = usePersistedState<Settings>("settings", {
    restore: restoreSettings,
    create: () => ({ year: currentYear() }),
  })

  const setYear = useCallback(
    (year: number) => {
      if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) return
      setSettings((s) => ({ ...s, year }))
    },
    [setSettings],
  )

  const value = useMemo(() => ({ year: settings?.year ?? null, setYear }), [settings?.year, setYear])

  return <YearContext.Provider value={value}>{children}</YearContext.Provider>
}

export function useYear() {
  const ctx = useContext(YearContext)
  if (!ctx) throw new Error("useYear deve ser usado dentro de YearProvider")
  return ctx
}

/** "yyyy-mm" do mês corrente transposto para o ano escolhido. */
export function monthInYear(year: number) {
  return `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
}
