"use client"

import { useCallback } from "react"
import type { Bucket, Category, Expense, FinanceState, Income, RuleId } from "./types"
import { BUCKETS, DEFAULT_CATEGORIES, DEFAULT_RULE, RULES, SCHEMA_VERSION, ruleOf } from "./types"
import { loadAppData } from "@/app/actions/app-data"
import { usePersistedState } from "./use-persisted-state"
import { monthInYear, useYear } from "./year-context"

const LEGACY_STORAGE_KEY = "controle-financeiro-v1"

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Grupos da antiga estrutura (essenciais, dívidas...) mapeados para os atuais.
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

// Base limpa do ano, com as categorias padrão e as metas da regra escolhida.
function emptyState(year: number, rule: RuleId = DEFAULT_RULE): FinanceState {
  return {
    categories: defaultCategories(),
    incomes: [],
    targets: { ...RULES[rule].targets },
    year,
    rule,
    schemaVersion: SCHEMA_VERSION,
  }
}

// Migra bases antigas: converte os grupos e adiciona as categorias padrão que
// faltarem (sem apagar as existentes).
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

function restoreFinance(raw: unknown, year: number): FinanceState {
  const parsed = (raw ?? {}) as FinanceState
  const isLegacy = (parsed.schemaVersion ?? 1) < SCHEMA_VERSION
  const rule = ruleOf(parsed)
  const baseCategories = (parsed.categories ?? []).map((c) => ({
    ...c,
    bucket: toBucket(c.bucket),
    expenses: (c.expenses ?? []).map((e) => ({ ...e, paid: e.paid ?? false })),
  }))
  const storedTargets = parsed.targets as Partial<Record<Bucket, number>> | undefined
  return {
    categories: isLegacy ? migrateLegacy(baseCategories) : baseCategories,
    // Receitas de bases antigas não tinham mês: atribui ao mês atual do ano.
    incomes: (parsed.incomes ?? []).map((i) => ({ ...i, month: i.month ?? monthInYear(year) })),
    targets: isLegacy
      ? { ...RULES[rule].targets }
      : (Object.fromEntries(BUCKETS.map((b) => [b, storedTargets?.[b] ?? RULES[rule].targets[b]])) as Record<
          Bucket,
          number
        >),
    year,
    rule,
    schemaVersion: SCHEMA_VERSION,
  }
}

// Ano novo: reaproveita categorias, metas e regra do ano anterior (sem despesas
// nem receitas). Sem ano anterior, começa com as categorias padrão.
async function createFinance(year: number): Promise<FinanceState> {
  try {
    const prev = await loadAppData(`finance:${year - 1}`)
    if (prev.found) {
      const p = restoreFinance(prev.data, year - 1)
      return {
        ...p,
        year,
        incomes: [],
        categories: p.categories.map((c) => ({ ...c, expenses: [] })),
      }
    }
  } catch {
    // sem base anterior acessível: usa o padrão
  }
  return emptyState(year)
}

// Importa a base antiga salva no navegador (antes do banco de dados) para o
// ano a que ela pertence.
function legacyFinance(year: number): FinanceState | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FinanceState
    const storedYear = parsed.year ?? new Date().getFullYear()
    return storedYear === year ? restoreFinance(parsed, year) : null
  } catch {
    return null
  }
}

export function useFinance() {
  const { year } = useYear()
  const [persisted, setState, loaded] = usePersistedState<FinanceState>(year ? `finance:${year}` : null, {
    restore: (raw) => restoreFinance(raw, year as number),
    create: () => createFinance(year as number),
    legacy: () => legacyFinance(year as number),
  })

  const workingYear = year ?? new Date().getFullYear()
  const state: FinanceState = persisted ?? emptyState(workingYear)
  const rule = ruleOf(state)

  const addCategory = useCallback(
    (name: string, color: string, bucket: Bucket) => {
      setState((s) => ({
        ...s,
        categories: [...s.categories, { id: uid(), name, color, bucket, expenses: [] }],
      }))
    },
    [setState],
  )

  const updateCategory = useCallback(
    (id: string, patch: Partial<Omit<Category, "id" | "expenses">>) => {
      setState((s) => ({
        ...s,
        categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }))
    },
    [setState],
  )

  const removeCategory = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }))
    },
    [setState],
  )

  const addExpense = useCallback(
    (categoryId: string, expense: Omit<Expense, "id">) => {
      setState((s) => ({
        ...s,
        categories: s.categories.map((c) =>
          c.id === categoryId ? { ...c, expenses: [...c.expenses, { ...expense, id: uid() }] } : c,
        ),
      }))
    },
    [setState],
  )

  const updateExpense = useCallback(
    (categoryId: string, expenseId: string, patch: Partial<Omit<Expense, "id">>) => {
      setState((s) => ({
        ...s,
        categories: s.categories.map((c) =>
          c.id === categoryId
            ? { ...c, expenses: c.expenses.map((e) => (e.id === expenseId ? { ...e, ...patch } : e)) }
            : c,
        ),
      }))
    },
    [setState],
  )

  const removeExpense = useCallback(
    (categoryId: string, expenseId: string) => {
      setState((s) => ({
        ...s,
        categories: s.categories.map((c) =>
          c.id === categoryId ? { ...c, expenses: c.expenses.filter((e) => e.id !== expenseId) } : c,
        ),
      }))
    },
    [setState],
  )

  const addIncome = useCallback(
    (name: string, amount: number, month: string) => {
      setState((s) => ({ ...s, incomes: [...s.incomes, { id: uid(), name, amount, month }] }))
    },
    [setState],
  )

  const updateIncome = useCallback(
    (id: string, patch: Partial<Omit<Income, "id">>) => {
      setState((s) => ({
        ...s,
        incomes: s.incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      }))
    },
    [setState],
  )

  const removeIncome = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, incomes: s.incomes.filter((i) => i.id !== id) }))
    },
    [setState],
  )

  const updateTargets = useCallback(
    (targets: Record<Bucket, number>) => {
      setState((s) => ({ ...s, targets }))
    },
    [setState],
  )

  // Troca a regra de distribuição e aplica as metas padrão dela.
  const updateRule = useCallback(
    (next: RuleId) => {
      setState((s) => ({ ...s, rule: next, targets: { ...RULES[next].targets } }))
    },
    [setState],
  )

  // Apaga categorias e receitas do ano, mantendo a regra escolhida.
  const clearAll = useCallback(() => {
    setState((s) => emptyState(s.year, ruleOf(s)))
  }, [setState])

  return {
    state,
    rule,
    year: workingYear,
    loaded,
    clearAll,
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
    updateRule,
  }
}
