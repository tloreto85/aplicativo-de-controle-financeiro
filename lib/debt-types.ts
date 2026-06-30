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
  // Data de vencimento (ISO yyyy-mm-dd) ou vazio quando não informada
  dueDate: string
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

export type DueStatus = "overdue" | "due-soon" | "ok" | "no-date"

// Diferença em dias entre duas datas ISO (yyyy-mm-dd).
export function daysUntil(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00`)
  const b = new Date(`${toIso}T00:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

// Situação de vencimento de uma dívida em relação à data atual.
// "próximo do vencimento" = faltam menos de `soonDays` dias (padrão 5).
// Dívidas quitadas ou sem data não geram alerta.
export function debtDueStatus(debt: Debt, todayIso: string, soonDays = 5): DueStatus {
  if (remainingAmount(debt) <= 0) return "ok"
  if (!debt.dueDate) return "no-date"
  const diff = daysUntil(todayIso, debt.dueDate)
  if (diff < 0) return "overdue"
  if (diff < soonDays) return "due-soon"
  return "ok"
}
