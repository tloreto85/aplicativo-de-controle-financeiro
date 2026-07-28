export type Bucket = "essenciais" | "dividas" | "pessoal" | "investimentos" | "outros"

export interface Expense {
  id: string
  name: string
  amount: number
  // ISO date string (yyyy-mm-dd) or empty when not informed
  date: string
  // whether the expense has already been paid (true) or is still open (false).
  // Open expenses feed "Estimativa de Despesa"; paid ones feed "Despesas Consolidadas".
  paid: boolean
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
  // "yyyy-mm" — mês ao qual a receita pertence. Receitas valem apenas para o
  // seu mês; ao mudar de mês, o novo mês começa sem receitas.
  month: string
}

export interface FinanceState {
  categories: Category[]
  incomes: Income[]
  // target percentages per bucket (sum should be ~100)
  targets: Record<Bucket, number>
  // calendar year this base belongs to; used to roll over at year-end
  year: number
}

export const BUCKET_LABELS: Record<Bucket, string> = {
  essenciais: "Essenciais",
  dividas: "Dívidas/Cartões",
  pessoal: "Pessoal",
  investimentos: "Investimentos",
  outros: "Outros",
}

export const ACCENT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
]
