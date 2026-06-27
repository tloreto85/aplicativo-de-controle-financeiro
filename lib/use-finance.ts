"use client"

import { useCallback, useEffect, useState } from "react"
import type { Bucket, Category, Expense, FinanceState, Income } from "./types"
import { buildExpensesCsv, downloadCsv } from "./export"

const STORAGE_KEY = "controle-financeiro-v1"

const CURRENT_YEAR = new Date().getFullYear()

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Default percentages used for a fresh base.
const DEFAULT_TARGETS: Record<Bucket, number> = {
  essenciais: 50,
  dividas: 30,
  pessoal: 0,
  investimentos: 20,
}

// A clean base (no categories/incomes) for a given year.
function emptyState(year: number): FinanceState {
  return { categories: [], incomes: [], targets: { ...DEFAULT_TARGETS }, year }
}

// Information about an automatic year-end rollover, surfaced to the UI.
export interface RolloverInfo {
  previousYear: number
  newYear: number
  fileName: string
  csv: string
}

const defaultState: FinanceState = {
  categories: [
    {
      id: uid(),
      name: "Despesas Essenciais",
      color: "var(--chart-1)",
      bucket: "essenciais",
      expenses: [
        { id: uid(), name: "Aluguel", amount: 1800, date: "" },
        { id: uid(), name: "Energia", amount: 216, date: "" },
        { id: uid(), name: "Internet", amount: 122, date: "" },
      ],
    },
    {
      id: uid(),
      name: "Pessoal",
      color: "var(--chart-5)",
      bucket: "pessoal",
      expenses: [
        { id: uid(), name: "Celular", amount: 185, date: "" },
        { id: uid(), name: "Academia", amount: 100, date: "" },
      ],
    },
    {
      id: uid(),
      name: "Dívidas",
      color: "var(--chart-3)",
      bucket: "dividas",
      expenses: [{ id: uid(), name: "IPTU", amount: 167, date: "2026-07-01" }],
    },
    {
      id: uid(),
      name: "Investimentos",
      color: "var(--chart-2)",
      bucket: "investimentos",
      expenses: [],
    },
  ],
  incomes: [
    { id: uid(), name: "Salário", amount: 7800 },
    { id: uid(), name: "Pró-Labore", amount: 3200 },
  ],
  targets: { essenciais: 50, dividas: 30, pessoal: 0, investimentos: 20 },
  year: CURRENT_YEAR,
}

export function useFinance() {
  const [state, setState] = useState<FinanceState>(defaultState)
  const [loaded, setLoaded] = useState(false)
  const [rollover, setRollover] = useState<RolloverInfo | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as FinanceState
        const storedYear = parsed.year ?? CURRENT_YEAR
        const restored: FinanceState = {
          categories: parsed.categories ?? [],
          incomes: parsed.incomes ?? [],
          targets: parsed.targets ?? defaultState.targets,
          year: storedYear,
        }

        // Year-end rollover: archive the previous year and start a clean base.
        if (storedYear < CURRENT_YEAR) {
          const fileName = `controle-financeiro-${storedYear}.csv`
          const csv = buildExpensesCsv(restored.categories)
          const fresh = emptyState(CURRENT_YEAR)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
          setState(fresh)
          setRollover({ previousYear: storedYear, newYear: CURRENT_YEAR, fileName, csv })
          // Best-effort automatic download (may require the manual button if blocked).
          try {
            downloadCsv(fileName, csv)
          } catch {
            // ignore — user can re-download from the dialog
          }
        } else {
          setState(restored)
        }
      }
    } catch {
      // ignore malformed data
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, loaded])

  const addCategory = useCallback((name: string, color: string, bucket: Bucket) => {
    setState((s) => ({
      ...s,
      categories: [...s.categories, { id: uid(), name, color, bucket, expenses: [] }],
    }))
  }, [])

  const updateCategory = useCallback((id: string, patch: Partial<Omit<Category, "id" | "expenses">>) => {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }, [])

  const removeCategory = useCallback((id: string) => {
    setState((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }))
  }, [])

  const addExpense = useCallback((categoryId: string, expense: Omit<Expense, "id">) => {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) =>
        c.id === categoryId ? { ...c, expenses: [...c.expenses, { ...expense, id: uid() }] } : c,
      ),
    }))
  }, [])

  const updateExpense = useCallback((categoryId: string, expenseId: string, patch: Partial<Omit<Expense, "id">>) => {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) =>
        c.id === categoryId
          ? { ...c, expenses: c.expenses.map((e) => (e.id === expenseId ? { ...e, ...patch } : e)) }
          : c,
      ),
    }))
  }, [])

  const removeExpense = useCallback((categoryId: string, expenseId: string) => {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) =>
        c.id === categoryId ? { ...c, expenses: c.expenses.filter((e) => e.id !== expenseId) } : c,
      ),
    }))
  }, [])

  const addIncome = useCallback((name: string, amount: number) => {
    setState((s) => ({ ...s, incomes: [...s.incomes, { id: uid(), name, amount }] }))
  }, [])

  const updateIncome = useCallback((id: string, patch: Partial<Omit<Income, "id">>) => {
    setState((s) => ({
      ...s,
      incomes: s.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }))
  }, [])

  const removeIncome = useCallback((id: string) => {
    setState((s) => ({ ...s, incomes: s.incomes.filter((i) => i.id !== id) }))
  }, [])

  const updateTargets = useCallback((targets: Record<Bucket, number>) => {
    setState((s) => ({ ...s, targets }))
  }, [])

  // Wipe all categories and incomes, keeping the current year and default rules.
  const clearAll = useCallback(() => {
    setState((s) => emptyState(s.year ?? CURRENT_YEAR))
  }, [])

  // Re-download the archived previous-year file from the rollover notice.
  const downloadRollover = useCallback(() => {
    if (rollover) downloadCsv(rollover.fileName, rollover.csv)
  }, [rollover])

  const dismissRollover = useCallback(() => setRollover(null), [])

  return {
    state,
    loaded,
    rollover,
    clearAll,
    downloadRollover,
    dismissRollover,
    addCategory,
    updateCategory,
    removeCategory,
    addExpense,
    updateExpense,
    removeExpense,
    addIncome,
    updateIncome,
    removeIncome,
    updateTargets,
  }
}
