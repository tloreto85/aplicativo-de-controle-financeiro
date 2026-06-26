export type Bucket = "essenciais" | "dividas" | "pessoal" | "investimentos"

export interface Expense {
  id: string
  name: string
  amount: number
  // ISO date string (yyyy-mm-dd) or empty when not informed
  date: string
}

export interface Category {
  id: string
  name: string
  // accent color token: one of the chart colors
  color: string
  // which 50-30-20 bucket this category contributes to
  bucket: Bucket
  expenses: Expense[]
}

export interface Income {
  id: string
  name: string
  amount: number
}

export interface FinanceState {
  categories: Category[]
  incomes: Income[]
  // target percentages per bucket (sum should be ~100)
  targets: Record<Bucket, number>
}

export const BUCKET_LABELS: Record<Bucket, string> = {
  essenciais: "Essenciais",
  dividas: "Dívidas/Cartões",
  pessoal: "Pessoal",
  investimentos: "Investimentos",
}

export const ACCENT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]
