"use client"

import type { CalendarEntry } from "@/lib/calendar-types"
import { KIND_META } from "@/lib/calendar-types"
import { WEEKDAYS, type DayCell } from "@/lib/calendar-utils"
import { formatBRL } from "@/lib/format"

interface Props {
  cells: DayCell[]
  entriesByDate: Map<string, CalendarEntry[]>
  onSelectDay: (date: string) => void
}

// Quantos chips exibir por célula antes de resumir com "+N".
const MAX_VISIBLE = 3

export function CalendarGrid({ cells, entriesByDate, onSelectDay }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const entries = entriesByDate.get(cell.date) ?? []
          const visible = entries.slice(0, MAX_VISIBLE)
          const extra = entries.length - visible.length

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelectDay(cell.date)}
              className={`flex min-h-24 flex-col gap-1 border-b border-r border-border p-1.5 text-left transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-28 ${
                cell.inMonth ? "bg-card" : "bg-muted/30"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  cell.isToday
                    ? "bg-primary text-primary-foreground"
                    : cell.inMonth
                      ? "text-card-foreground"
                      : "text-muted-foreground/60"
                }`}
              >
                {cell.day}
              </span>

              <span className="flex flex-col gap-0.5">
                {visible.map((e) => (
                  <span
                    key={e.id}
                    className={`flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] leading-tight ${
                      e.paid ? "opacity-55" : ""
                    }`}
                    style={{
                      backgroundColor: `color-mix(in oklch, ${KIND_META[e.kind].color} 16%, transparent)`,
                      color: KIND_META[e.kind].color,
                    }}
                    title={`${KIND_META[e.kind].label}: ${e.title}${
                      e.amount != null ? ` — ${formatBRL(e.amount)}` : ""
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: KIND_META[e.kind].color }}
                    />
                    <span className="truncate font-medium">
                      {e.amount != null ? formatBRL(e.amount) : e.title}
                    </span>
                  </span>
                ))}
                {extra > 0 && (
                  <span className="px-1 text-[11px] font-medium text-muted-foreground">
                    + {extra} mais
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
