"use client"

import { useCallback, useEffect, useState } from "react"
import type { Bucket, Category, Expense, FinanceState, Income } from "./types"
import { BUCKETS, DEFAULT_CATEGORIES, DEFAULT_TARGETS, SCHEMA_VERSION } from "./types"
import { buildExpensesCsv, downloadCsv } from "./export"
import { currentMonthKey } from "./format"

const STORAGE_KEY = "controle-financeiro-v1"

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = currentMonthKey()

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Grupos da antiga regra 50-30-20 mapeados para a regra 35-20-45.
const LEGACY_BUCKET_MAP: Record<string, Bucket> = {
  essenciais: "necessidades",
  dividas: "necessidades",
  pessoal: "necessidades",
  outros: "qualidade",
  investimentos: "patrimonio",
}

function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function toBucket(raw: string): Bucket {
  if ((BUCKETS as string[]).includes(raw)) return raw as Bucket
  return LEGACY_BUCKET_MAP[raw] ?? "necessidades"
}

function defaultCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((c) => ({ ...c, id: uid(), expenses: [] }))
}

// Base limpa do ano, já com as categorias padrão da regra 35-20-45.
function emptyState(year: number): FinanceState {
  return {
    categories: defaultCategories(),
    incomes: [],
    targets: { ...DEFAULT_TARGETS },
    year,
    schemaVersion: SCHEMA_VERSION,
  }
}

// Migra bases da regra 50-30-20: converte os grupos, adiciona as categorias
// padrão que faltarem (sem apagar as existentes) e aplica as metas 35-20-45.
function migrateLegacy(categories: Category[]): Category[] {
  const migrated = categories.map((c) => {
    const preset = DEFAULT_CATEGORIES.find((d) => normalizeName(d.name) === normalizeName(c.name))
    return { ...c, bucket: preset?.bucket ?? toBucket(c.bucket) }
  })
  const existing = new Set(migrated.map((c) => normalizeName(c.name)))
  const missing = DEFAULT_CATEGORIES.filter((d) => !existing.has(normalizeName(d.name))).map((d) => ({
    ...d,
    id: uid(),
    expenses: [],
  }))
  return [...migrated, ...missing]
}

function withExpenses(name: string, expenses: Omit<Expense, "id">[]): Category {
  const preset = DEFAULT_CATEGORIES.find((d) => d.name === name)!
  return { ...preset, id: uid(), expenses: expenses.map((e) => ({ ...e, id: uid() })) }
}

// Information about an automatic year-end rollover, surfaced to the UI.
export interface RolloverInfo {
  previousYear: number
  newYear: number
  fileName: string
  csv: string
}

const defaultState: FinanceState = {
  categories: DEFAULT_CATEGORIES.map((d) => {
    if (d.name === "Moradia")
      return withExpenses(d.name, [
        { name: "Aluguel", amount: 1800, date: "", paid: true },
        { name: "Energia", amount: 216, date: "", paid: false },
        { name: "Internet", amount: 122, date: "", paid: false },
      ])
    if (d.name === "Pessoal")
      return withExpenses(d.name, [
        { name: "Celular", amount: 185, date: "", paid: true },
        { name: "Academia", amount: 100, date: "", paid: false },
      ])
    if (d.name === "Dívidas")
      return withExpenses(d.name, [{ name: "IPTU", amount: 167, date: "2026-07-01", paid: false }])
    return withExpenses(d.name, [])
  }),
  incomes: [
    { id: uid(), name: "Salário", amount: 7800, month: CURRENT_MONTH },
    { id: uid(), name: "Pró-Labore", amount: 3200, month: CURRENT_MONTH },
  ],
  targets: { ...DEFAULT_TARGETS },
  year: CURRENT_YEAR,
  schemaVersion: SCHEMA_VERSION,
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
        const isLegacy = (parsed.schemaVersion ?? 1) < SCHEMA_VERSION
        // Ensure every expense has a `paid` flag (older data may lack it).
        const baseCategories = (parsed.categories ?? []).map((c) => ({
          ...c,
          bucket: toBucket(c.bucket),
          expenses: (c.expenses ?? []).map((e) => ({ ...e, paid: e.paid ?? false })),
        }))
        const storedTargets = parsed.targets as Partial<Record<Bucket, number>> | undefined
        const restored: FinanceState = {
          categories: isLegacy ? migrateLegacy(baseCategories) : baseCategories,
          // Receitas de bases antigas não tinham mês: atribui ao mês atual para
          // não perder o dado (a partir daqui cada receita vive no seu mês).
          incomes: (parsed.incomes ?? []).map((i) => ({ ...i, month: i.month ?? CURRENT_MONTH })),
          targets: isLegacy
            ? { ...DEFAULT_TARGETS }
            : Object.fromEntries(BUCKETS.map((b) => [b, storedTargets?.[b] ?? DEFAULT_TARGETS[b]])) as Record<
                Bucket,
                number
              >,
          year: storedYear,
          schemaVersion: SCHEMA_VERSION,
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

  const addIncome = useCallback((name: string, amount: number, month: string) => {
    setState((s) => ({ ...s, incomes: [...s.incomes, { id: uid(), name, amount, month }] }))
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
