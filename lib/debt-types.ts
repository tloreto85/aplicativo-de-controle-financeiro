export interface DebtPayment {
  id: string
  amount: number
  // ISO date string (yyyy-mm-dd)
  date: string
  note: string
}

export interface Debt {
  id: string
  // Credor
  creditor: string
  // Contrato ou outras informações
  contract: string
  // Dia do vencimento no mês (1-31). 0 = não informado.
  // O app avalia o status comparando esse dia com o dia atual do mês.
  dueDay: number
  // Valor total devido
  totalAmount: number
  // Parcelamento: true = parcelado, false = à vista
  installmentPlan: boolean
  // Quantidade de parcelas (válido quando installmentPlan = true)
  installmentCount: number
  // Pagamentos registrados (alimentam saldo devedor e valor pago)
  payments: DebtPayment[]
}

// Valor de cada parcela (total dividido pelo número de parcelas).
export function installmentValue(debt: Debt): number {
  if (!debt.installmentPlan || debt.installmentCount <= 0) return debt.totalAmount
  return debt.totalAmount / debt.installmentCount
}

// Soma dos pagamentos já realizados.
export function paidAmount(debt: Debt): number {
  return debt.payments.reduce((sum, p) => sum + p.amount, 0)
}

// Saldo devedor = total - pago (nunca negativo).
export function remainingAmount(debt: Debt): number {
  return Math.max(debt.totalAmount - paidAmount(debt), 0)
}

// Impacto mensal: o valor de uma parcela enquanto houver saldo devedor.
// Dívidas quitadas deixam de impactar o orçamento mensal.
export function monthlyImpact(debt: Debt): number {
  if (remainingAmount(debt) <= 0) return 0
  return installmentValue(debt)
}

// Número estimado de parcelas já pagas (valor pago dividido pelo valor da parcela).
export function paidInstallments(debt: Debt): number {
  if (!debt.installmentPlan || debt.installmentCount <= 0) {
    return remainingAmount(debt) <= 0 ? 1 : 0
  }
  const per = installmentValue(debt)
  if (per <= 0) return 0
  return Math.min(Math.round(paidAmount(debt) / per), debt.installmentCount)
}

// Número de parcelas ainda em aberto.
export function openInstallments(debt: Debt): number {
  if (!debt.installmentPlan || debt.installmentCount <= 0) {
    return remainingAmount(debt) > 0 ? 1 : 0
  }
  return Math.max(debt.installmentCount - paidInstallments(debt), 0)
}

// Categoria da dívida pelo VALOR TOTAL (semáforo).
export type DebtValueCategory = "green" | "yellow" | "orange" | "red"

export interface DebtCategoryInfo {
  key: DebtValueCategory
  label: string
  // Classe utilitária de cor sólida (usa tokens --debt-*)
  color: string
  // Faixa de valor descrita para legenda
  range: string
}

// Faixas contínuas cobrindo todos os valores:
// verde: abaixo de R$ 1.000 · amarelo: R$ 1.000 a R$ 1.999
// laranja: R$ 2.000 a R$ 2.999 · vermelho: R$ 3.000 ou acima
export function debtValueCategory(total: number): DebtValueCategory {
  if (total < 1000) return "green"
  if (total < 2000) return "yellow"
  if (total < 3000) return "orange"
  return "red"
}

export const DEBT_CATEGORY_INFO: Record<DebtValueCategory, DebtCategoryInfo> = {
  green: { key: "green", label: "Baixa", color: "debt-green", range: "Abaixo de R$ 1.000" },
  yellow: { key: "yellow", label: "Moderada", color: "debt-yellow", range: "R$ 1.000 a R$ 1.999" },
  orange: { key: "orange", label: "Alta", color: "debt-orange", range: "R$ 2.000 a R$ 2.999" },
  red: { key: "red", label: "Crítica", color: "debt-red", range: "R$ 3.000 ou mais" },
}

export function debtCategoryInfo(debt: Debt): DebtCategoryInfo {
  return DEBT_CATEGORY_INFO[debtValueCategory(debt.totalAmount)]
}

export type DueStatus = "overdue" | "due-soon" | "ok" | "no-date"

// Diferença em dias entre duas datas ISO (yyyy-mm-dd).
export function daysUntil(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00`)
  const b = new Date(`${toIso}T00:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

// Data ISO (yyyy-mm-dd) do vencimento no mês atual, a partir de um dia do mês.
// O dia é limitado ao último dia do mês (ex.: dia 31 em fevereiro vira 28/29).
export function currentMonthDueIso(dueDay: number, todayIso: string): string {
  const [y, m] = todayIso.split("-").map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const day = Math.min(Math.max(dueDay, 1), lastDay)
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

// Indica se houve algum pagamento registrado no mês corrente (mesmo ano e mês
// de `todayIso`). Um pagamento no mês quita a parcela daquele mês.
export function hasPaymentInMonth(debt: Debt, todayIso: string): boolean {
  const monthPrefix = todayIso.slice(0, 7) // "yyyy-mm"
  return debt.payments.some((p) => p.date.slice(0, 7) === monthPrefix)
}

// Situação de vencimento com base apenas no DIA do mês:
// o app verifica se aquele dia, no mês atual, já passou ou não.
// "próximo do vencimento" = faltam menos de `soonDays` dias (padrão 5).
// Dívidas quitadas, sem dia informado ou com a parcela do mês já paga
// não geram alerta.
export function debtDueStatus(debt: Debt, todayIso: string, soonDays = 5): DueStatus {
  if (remainingAmount(debt) <= 0) return "ok"
  if (!debt.dueDay || debt.dueDay < 1) return "no-date"
  // Se a parcela deste mês já foi paga, não há atraso nem vencimento próximo.
  if (hasPaymentInMonth(debt, todayIso)) return "ok"
  const diff = daysUntil(todayIso, currentMonthDueIso(debt.dueDay, todayIso))
  if (diff < 0) return "overdue"
  if (diff < soonDays) return "due-soon"
  return "ok"
}
