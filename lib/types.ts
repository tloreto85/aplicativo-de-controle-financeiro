export type Bucket = "necessidades" | "qualidade" | "patrimonio"

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
  // which 35-20-45 bucket this category contributes to
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
  // 2 = regra 35-20-45. Bases sem versão usam a antiga regra 50-30-20.
  schemaVersion?: number
}

export const SCHEMA_VERSION = 2

export const BUCKETS: Bucket[] = ["necessidades", "qualidade", "patrimonio"]

export const BUCKET_LABELS: Record<Bucket, string> = {
  necessidades: "Necessidades/Obrigações",
  qualidade: "Qualidade de vida/Lazer",
  patrimonio: "Patrimônio/Objetivos",
}

export const BUCKET_COLORS: Record<Bucket, string> = {
  necessidades: "var(--chart-4)",
  qualidade: "var(--chart-3)",
  patrimonio: "var(--chart-2)",
}

export const DEFAULT_TARGETS: Record<Bucket, number> = {
  necessidades: 35,
  qualidade: 20,
  patrimonio: 45,
}

export const DEFAULT_CATEGORIES: { name: string; color: string; bucket: Bucket }[] = [
  { name: "Moradia", color: "var(--chart-1)", bucket: "necessidades" },
  { name: "Pessoal", color: "var(--chart-5)", bucket: "necessidades" },
  { name: "Filho", color: "var(--chart-8)", bucket: "necessidades" },
  { name: "Dívidas", color: "var(--chart-4)", bucket: "necessidades" },
  { name: "Carro", color: "var(--chart-6)", bucket: "necessidades" },
  { name: "Alimentação/Supermercado", color: "var(--chart-7)", bucket: "necessidades" },
  { name: "Lazer/Restaurante/Compras", color: "var(--chart-3)", bucket: "qualidade" },
  { name: "Reserva Imprevistos", color: "var(--chart-9)", bucket: "patrimonio" },
  { name: "Investimentos", color: "var(--chart-2)", bucket: "patrimonio" },
]

export const ACCENT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
  "var(--chart-9)",
]
