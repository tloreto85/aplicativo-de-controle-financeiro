"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { useFinance } from "@/lib/use-finance"
import { useDebts } from "@/lib/use-debts"
import { useCalendarEvents } from "@/lib/use-calendar-events"
import { KIND_META } from "@/lib/calendar-types"
import {
  buildEntries,
  buildMonthGrid,
  groupByDate,
  monthTotals,
  todayIso,
} from "@/lib/calendar-utils"
import { formatBRL, monthLabel } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { CalendarGrid } from "@/components/calendar/calendar-grid"
import { DayDialog } from "@/components/calendar/day-dialog"

export default function CalendarioPage() {
  const finance = useFinance()
  const { debts, loaded: debtsLoaded } = useDebts()
  const { events, loaded: eventsLoaded, addEvent, updateEvent, removeEvent } = useCalendarEvents()

  const today = todayIso()
  const [now] = useState(() => new Date())
  const [cursor, setCursor] = useState(() => ({ year: now.getFullYear(), month0: now.getMonth() }))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const loaded = finance.loaded && debtsLoaded && eventsLoaded

  // Lançamentos unificados das três origens.
  const entries = useMemo(
    () => buildEntries(finance.state, debts, events),
    [finance.state, debts, events],
  )
  const entriesByDate = useMemo(() => groupByDate(entries), [entries])

  const cells = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month0, today),
    [cursor, today],
  )

  const monthKey = `${cursor.year}-${String(cursor.month0 + 1).padStart(2, "0")}`
  const totals = useMemo(() => monthTotals(entries, monthKey), [entries, monthKey])

  const selectedEntries = selectedDate ? entriesByDate.get(selectedDate) ?? [] : []

  function goPrev() {
    setCursor((c) => {
      const d = new Date(c.year, c.month0 - 1, 1)
      return { year: d.getFullYear(), month0: d.getMonth() }
    })
  }
  function goNext() {
    setCursor((c) => {
      const d = new Date(c.year, c.month0 + 1, 1)
      return { year: d.getFullYear(), month0: d.getMonth() }
    })
  }
  function goToday() {
    const d = new Date()
    setCursor({ year: d.getFullYear(), month0: d.getMonth() })
  }

  if (!loaded) {
    return (
      <main className="flex min-h-svh items-center justify-center text-muted-foreground">
        Carregando…
      </main>
    )
  }

  return (
    <main className="min-h-svh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              render={<Link href="/" />}
              nativeButton={false}
              variant="ghost"
              size="icon"
              aria-label="Voltar ao menu"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-card-foreground">Calendário</h1>
              <p className="text-sm text-muted-foreground">
                Receitas, despesas e vencimentos em um só lugar
              </p>
            </div>
          </div>

          {/* Resumo do mês em exibição */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Receitas</span>
              <span className="font-mono text-sm font-bold" style={{ color: KIND_META.receita.color }}>
                {formatBRL(totals.receita)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Despesas</span>
              <span className="font-mono text-sm font-bold" style={{ color: KIND_META.despesa.color }}>
                {formatBRL(totals.despesa)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Saldo</span>
              <span
                className={`font-mono text-sm font-bold ${
                  totals.saldo >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {formatBRL(totals.saldo)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
        {/* Barra de navegação de mês + legenda */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="ml-1 text-lg font-semibold capitalize text-foreground">
              {monthLabel(monthKey)}
            </h2>
            <Button variant="ghost" className="ml-1" onClick={goToday}>
              Hoje
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {(["receita", "despesa", "divida", "evento"] as const).map((k) => (
              <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: KIND_META[k].color }}
                />
                {KIND_META[k].label}
              </span>
            ))}
          </div>
        </div>

        <CalendarGrid cells={cells} entriesByDate={entriesByDate} onSelectDay={setSelectedDate} />

        <p className="text-xs text-muted-foreground">
          Toque em um dia para ver os lançamentos e adicionar eventos próprios. Receitas do mês
          aparecem no dia 1º; despesas e parcelas aparecem na data de vencimento.
        </p>
      </div>

      <DayDialog
        date={selectedDate}
        entries={selectedEntries}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null)
        }}
        onAdd={addEvent}
        onUpdate={updateEvent}
        onRemove={removeEvent}
      />
    </main>
  )
}
