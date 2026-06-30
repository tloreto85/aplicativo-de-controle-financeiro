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
