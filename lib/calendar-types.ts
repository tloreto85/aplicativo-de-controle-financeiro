// Tipos do módulo Calendário.
//
// O calendário agrega lançamentos de duas origens:
// - "financeiro": despesas (com data) e receitas do Controle Financeiro
// - "calendario": eventos cadastrados diretamente na tela do Calendário
//
// A Gestão de Dívidas é um módulo separado e não alimenta o calendário.
// Cada lançamento vira uma `CalendarEntry` para renderização unificada.

export type EventKind = "receita" | "despesa" | "evento"
export type EventSource = "financeiro" | "calendario"

// Evento cadastrado na própria tela do Calendário (persistido em localStorage).
export interface CalendarEvent {
  id: string
  // Data ISO (yyyy-mm-dd)
  date: string
  title: string
  kind: EventKind
  // Valor opcional (para receita/despesa). Eventos sem valor financeiro omitem.
  amount?: number
}

// Lançamento normalizado para exibição no calendário.
export interface CalendarEntry {
  id: string
  date: string
  title: string
  kind: EventKind
  source: EventSource
  amount?: number
  // Para parcelas/despesas: se já foi paga/quitada.
  paid?: boolean
  // Eventos "calendario" podem ser editados/excluídos na própria tela.
  editable: boolean
}

// Metadados visuais por tipo de lançamento (cor, rótulo).
export const KIND_META: Record<EventKind, { label: string; color: string }> = {
  receita: { label: "Receita", color: "var(--chart-1)" },
  despesa: { label: "Despesa", color: "var(--chart-4)" },
  evento: { label: "Evento", color: "var(--chart-2)" },
}

// Tipos que o usuário pode cadastrar manualmente no Calendário.
export const NATIVE_KINDS: EventKind[] = ["receita", "despesa", "evento"]
