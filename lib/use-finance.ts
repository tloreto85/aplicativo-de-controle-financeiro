"use client"

import { useCallback, useEffect, useState } from "react"
import type { Bucket, Category, Expense, FinanceState, Income } from "./types"

const STORAGE_KEY = "controle-financeiro-v1"

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
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
}

export function useFinance() {
  const [state, setState] = useState<FinanceState>(defaultState)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as FinanceState
        setState({
          categories: parsed.categories ?? [],
          incomes: parsed.incomes ?? [],
          targets: parsed.targets ?? defaultState.targets,
        })
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

  return {
    state,
    loaded,
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
