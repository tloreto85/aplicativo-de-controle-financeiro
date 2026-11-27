export interface Contribution {
  id: string
  date: string
  amount: number
  note?: string
}

export interface Investment {
  id: string
  name: string
  objective: string
  targetAmount: number
  monthlyContribution: number
  active: boolean
  createdAt: string
  contributions: Contribution[]
}

export type InvestmentInput = Omit<Investment, "id" | "createdAt" | "contributions">

export function restoreInvestments(raw: unknown): Investment[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item): Investment[] => {
    if (!item || typeof item !== "object") return []
    const value = item as Partial<Investment>
    if (
      typeof value.id !== "string" ||
      typeof value.name !== "string" ||
      typeof value.objective !== "string" ||
      typeof value.targetAmount !== "number" ||
      typeof value.monthlyContribution !== "number"
    ) return []
    return [{
      id: value.id,
      name: value.name,
      objective: value.objective,
      targetAmount: Math.max(0, value.targetAmount),
      monthlyContribution: Math.max(0, value.monthlyContribution),
      active: value.active !== false,
      createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
      contributions: Array.isArray(value.contributions)
        ? value.contributions.filter((item): item is Contribution =>
            !!item && typeof item.id === "string" && typeof item.date === "string" && Number.isFinite(item.amount) && item.amount > 0,
          )
        : [],
    }]
  })
}

export function investmentTotal(investment: Investment): number {
  return investment.contributions.reduce((total, contribution) => total + contribution.amount, 0)
}
