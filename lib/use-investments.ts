"use client"

import { useCallback } from "react"
import { usePersistedState } from "@/lib/use-persisted-state"
import { investmentTotal, restoreInvestments } from "@/lib/investment-types"
import type { Contribution, Investment, InvestmentInput } from "@/lib/investment-types"

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useInvestments() {
  const [investments, setInvestments, loaded] = usePersistedState<Investment[]>("investments", {
    restore: restoreInvestments,
    create: () => [],
  })

  const createInvestment = useCallback((input: InvestmentInput) => {
    const investment: Investment = {
      ...input,
      id: createId(),
      createdAt: new Date().toISOString(),
      contributions: [],
    }
    setInvestments((current) => [...current, investment])
    return investment.id
  }, [setInvestments])

  const addContribution = useCallback((investmentId: string, contribution: Omit<Contribution, "id">) => {
    setInvestments((current) => current.map((investment) =>
      investment.id === investmentId
        ? { ...investment, contributions: [...investment.contributions, { ...contribution, id: createId() }] }
        : investment,
    ))
  }, [setInvestments])

  const toggleActive = useCallback((investmentId: string) => {
    setInvestments((current) => current.map((investment) =>
      investment.id === investmentId ? { ...investment, active: !investment.active } : investment,
    ))
  }, [setInvestments])

  const deleteInvestment = useCallback((investmentId: string) => {
    setInvestments((current) => current.filter((investment) => investment.id !== investmentId))
  }, [setInvestments])

  const all = investments ?? []
  const active = all.filter((investment) => investment.active)
  const total = all.reduce((sum, investment) => sum + investmentTotal(investment), 0)
  const monthly = active.reduce((sum, investment) => sum + investment.monthlyContribution, 0)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const contributedThisMonth = all.reduce((sum, investment) => sum + investment.contributions
    .filter((contribution) => contribution.date.slice(0, 7) === currentMonth)
    .reduce((sub, contribution) => sub + contribution.amount, 0), 0)

  return {
    investments: all,
    activeInvestments: active,
    loaded,
    total,
    monthly,
    contributedThisMonth,
    createInvestment,
    addContribution,
    toggleActive,
    deleteInvestment,
  }
}
