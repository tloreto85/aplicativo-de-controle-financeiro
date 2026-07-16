// Uma parcela do cronograma da dívida. É gerada automaticamente a partir do
// número de parcelas e do dia de vencimento; o usuário marca `paid` para
// quitá-la, o que subtrai o valor do saldo devedor.
export interface Installment {
  id: string
  // Número da parcela (1..N)
  number: number
  // Vencimento da parcela (ISO yyyy-mm-dd)
  dueDate: string
  // Valor da parcela
  amount: number
  // Se a parcela foi paga
  paid: boolean
  // Data em que foi marcada como paga (ISO yyyy-mm-dd), quando aplicável
  paidDate?: string
}

export interface Debt {
  id: string
  // Credor
  creditor: string
  // Contrato ou outras informações
  contract: string
  // Dia do vencimento no mês (1-31). 0 = não informado.
  dueDay: number
  // Valor total devido
  totalAmount: number
  // Parcelamento: true = parcelado, false = à vista
  installmentPlan: boolean
  // Quantidade de parcelas (válido quando installmentPlan = true)
  installmentCount: number
  // Cronograma de parcelas gerado automaticamente
  installments: Installment[]
}

// Quantidade efetiva de parcelas: uma dívida à vista é tratada como 1 parcela.
export function effectiveCount(installmentPlan: boolean, installmentCount: number): number {
  if (!installmentPlan) return 1
  return Math.max(Math.round(installmentCount) || 0, 1)
}

// Valor de cada parcela (total dividido pelo número de parcelas).
export function installmentValue(debt: Debt): number {
  const n = effectiveCount(debt.installmentPlan, debt.installmentCount)
  return debt.totalAmount / n
}

// Último dia de um mês (1-12).
function lastDayOfMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate()
}

// Gera o cronograma de parcelas: uma parcela por mês, começando no mês de
// `startIso` (padrão: mês atual), no dia `dueDay` (limitado ao último dia de
// cada mês). Os valores são arredondados em centavos e o resíduo vai na última
// parcela, garantindo que a soma feche exatamente com o total.
export function buildInstallments(
  opts: {
    totalAmount: number
    installmentPlan: boolean
    installmentCount: number
    dueDay: number
  },
  startIso: string,
  makeId: () => string,
): Installment[] {
  const n = effectiveCount(opts.installmentPlan, opts.installmentCount)
  if (opts.totalAmount <= 0 || n <= 0) return []

  const [startY, startM] = startIso.split("-").map(Number)
  const day = Math.min(Math.max(opts.dueDay || 1, 1), 31)

  const perCents = Math.round((opts.totalAmount * 100) / n)
  const totalCents = Math.round(opts.totalAmount * 100)

  const items: Installment[] = []
  for (let k = 0; k < n; k++) {
    // Mês/ano da parcela k (0-indexado a partir do mês inicial).
    const monthIndex = startM - 1 + k
    const year = startY + Math.floor(monthIndex / 12)
    const month = (monthIndex % 12) + 1
    const dueDay = Math.min(day, lastDayOfMonth(year, month))
    const dueDate = `${year}-${String(month).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`

    // Última parcela absorve o resíduo de arredondamento.
    const cents = k === n - 1 ? totalCents - perCents * (n - 1) : perCents

    items.push({
      id: makeId(),
      number: k + 1,
      dueDate,
      amount: cents / 100,
      paid: false,
    })
  }
  return items
}

// Soma das parcelas já pagas.
export function paidAmount(debt: Debt): number {
  return debt.installments.reduce((sum, i) => sum + (i.paid ? i.amount : 0), 0)
}

// Saldo devedor = total - pago (nunca negativo).
export function remainingAmount(debt: Debt): number {
  return Math.max(debt.totalAmount - paidAmount(debt), 0)
}

// Número de parcelas já pagas.
export function paidInstallments(debt: Debt): number {
  return debt.installments.filter((i) => i.paid).length
}

// Número de parcelas ainda em aberto.
export function openInstallments(debt: Debt): number {
  return debt.installments.filter((i) => !i.paid).length
}

// Próxima parcela em aberto (a de menor vencimento ainda não paga).
export function nextUnpaidInstallment(debt: Debt): Installment | null {
  const open = debt.installments.filter((i) => !i.paid)
  if (open.length === 0) return null
  return open.reduce((earliest, i) => (i.dueDate < earliest.dueDate ? i : earliest))
}

// Impacto mensal: o valor de uma parcela enquanto houver saldo devedor.
export function monthlyImpact(debt: Debt): number {
  if (remainingAmount(debt) <= 0) return 0
  return installmentValue(debt)
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

// Situação de vencimento com base na PRÓXIMA parcela em aberto:
// "overdue" = já passou do vencimento · "due-soon" = faltam menos de
// `soonDays` dias (padrão 5). Dívidas quitadas retornam "ok".
export function debtDueStatus(debt: Debt, todayIso: string, soonDays = 5): DueStatus {
  if (remainingAmount(debt) <= 0) return "ok"
  const next = nextUnpaidInstallment(debt)
  if (!next) return "ok"
  const diff = daysUntil(todayIso, next.dueDate)
  if (diff < 0) return "overdue"
  if (diff < soonDays) return "due-soon"
  return "ok"
}
