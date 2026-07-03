"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight, Download, LayoutList } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  year: number
  selected: string
  onSelect: (value: string) => void
  onExport: () => void
}

export const ALL_MONTHS = "all"

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

// Navegador de meses: faixa com os 12 meses do ano + setas de avanço/retrocesso.
// Permite navegar para qualquer mês (inclusive futuros, para montar o quadro
// de despesas de um mês seguinte com antecedência).
export function FilterBar({ year, selected, onSelect, onExport }: Props) {
  const isAll = selected === ALL_MONTHS
  const monthIdx = isAll ? -1 : Number(selected.split("-")[1]) - 1

  const selectMonth = (idx: number) => onSelect(`${year}-${String(idx + 1).padStart(2, "0")}`)

  const step = (delta: number) => {
    // Ao navegar a partir de "Todos os meses", parte do mês atual.
    const base = monthIdx < 0 ? new Date().getMonth() : monthIdx
    selectMonth(Math.max(0, Math.min(11, base + delta)))
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-card-foreground">{year}</span>
          <Button
            render={<Link href="/financeiro/consolidado" />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            <LayoutList className="h-4 w-4" />
            Todos os meses
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => step(-1)}
            disabled={!isAll && monthIdx <= 0}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => step(1)}
            disabled={!isAll && monthIdx >= 11}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
        {MONTH_LABELS.map((label, idx) => {
          const active = idx === monthIdx
          return (
            <button
              key={label}
              type="button"
              onClick={() => selectMonth(idx)}
              aria-pressed={active}
              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
