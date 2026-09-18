import type { FinanceState } from "./types"
import type { Debt } from "./debt-types"
import type { CalendarEntry, CalendarEvent } from "./calendar-types"
import { effectiveCount } from "./debt-types"

// Nomes dos dias da semana (domingo primeiro, como o Google Agenda).
export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`
}

// Célula de um dia na grade do mês.
export interface DayCell {
  date: string
  day: number
  // Se o dia pertence ao mês em exibição (false = dia "vazado" de mês vizinho).
  inMonth: boolean
  isToday: boolean
}

// Monta a grade do mês começando no domingo, incluindo dias vizinhos para
// completar as semanas (padrão de calendários visuais).
export function buildMonthGrid(year: number, month0: number, today: string): DayCell[] {
  const first = new Date(year, month0, 1)
  const startOffset = first.getDay() // 0 = domingo
  const daysInMonth = new Date(year, month0 + 1, 0).getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  const cells: DayCell[] = []
  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - startOffset + 1
    const d = new Date(year, month0, dayNumber)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`
    cells.push({
      date: iso,
      day: d.getDate(),
      inMonth: d.getMonth() === month0,
      isToday: iso === today,
    })
  }
  return cells
}

// Agrega despesas (com data), receitas, parcelas de dívidas e eventos próprios
// em uma lista unificada de lançamentos do calendário.
export function buildEntries(
  finance: FinanceState,
  debts: Debt[],
  events: CalendarEvent[],
): CalendarEntry[] {
  const entries: CalendarEntry[] = []

  // Despesas do Controle Financeiro (apenas as que têm data informada).
  for (const c of finance.categories) {
    for (const e of c.expenses) {
      if (!e.date) continue
      entries.push({
        id: `fin-exp-${e.id}`,
        date: e.date,
        title: `${e.name} · ${c.name}`,
        kind: "despesa",
        source: "financeiro",
        amount: e.amount,
        paid: e.paid,
        editable: false,
      })
    }
  }

  // Receitas do mês: sem dia específico, ancoradas no dia 1 do mês.
  for (const i of finance.incomes) {
    if (!i.month) continue
    entries.push({
      id: `fin-inc-${i.id}`,
      date: `${i.month}-01`,
      title: i.name,
      kind: "receita",
      source: "financeiro",
      amount: i.amount,
      editable: false,
    })
  }

  // Parcelas das dívidas, pelo vencimento.
  for (const d of debts) {
    const total = effectiveCount(d.installmentPlan, d.installmentCount)
    for (const inst of d.installments) {
      entries.push({
        id: `debt-${d.id}-${inst.id}`,
        date: inst.dueDate,
        title: `${d.creditor} · parcela ${inst.number}/${total}`,
        kind: "divida",
        source: "dividas",
        amount: inst.amount,
        paid: inst.paid,
        editable: false,
      })
    }
  }

  // Eventos cadastrados no próprio Calendário.
  for (const ev of events) {
    entries.push({
      id: `cal-${ev.id}`,
      date: ev.date,
      title: ev.title,
      kind: ev.kind,
      source: "calendario",
      amount: ev.amount,
      editable: true,
    })
  }

  return entries
}

// Agrupa lançamentos por data (yyyy-mm-dd) para consulta rápida por célula.
export function groupByDate(entries: CalendarEntry[]): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>()
  for (const e of entries) {
    const list = map.get(e.date)
    if (list) list.push(e)
    else map.set(e.date, [e])
  }
  // Ordena cada dia: receitas primeiro, depois despesas, dívidas e eventos.
  const order: Record<string, number> = { receita: 0, despesa: 1, divida: 2, evento: 3 }
  for (const list of map.values()) {
    list.sort((a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9))
  }
  return map
}

// Totais de receita/despesa de um mês ("yyyy-mm") a partir dos lançamentos.
// Dívidas entram como despesa no cômputo do saldo previsto.
export function monthTotals(entries: CalendarEntry[], monthKey: string) {
  let receita = 0
  let despesa = 0
  for (const e of entries) {
    if (!e.date.startsWith(monthKey)) continue
    if (e.kind === "receita") receita += e.amount ?? 0
    else if (e.kind === "despesa" || e.kind === "divida") despesa += e.amount ?? 0
  }
  return { receita, despesa, saldo: receita - despesa }
}
