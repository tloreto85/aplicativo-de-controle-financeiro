"use client"

import Link from "next/link"
import { CalendarRange, ChevronLeft, ChevronRight, Wallet } from "lucide-react"
import { MAX_YEAR, MIN_YEAR, useYear } from "@/lib/year-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function yearOptions(selected: number) {
  const now = new Date().getFullYear()
  const from = Math.max(MIN_YEAR, Math.min(now - 5, selected))
  const to = Math.min(MAX_YEAR, Math.max(now + 5, selected))
  return Array.from({ length: to - from + 1 }, (_, i) => to - i)
}

export function AppBar() {
  const { year, setYear } = useYear()
  const options = yearOptions(year ?? new Date().getFullYear())

  return (
    <div className="border-b border-border bg-card print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Wallet className="size-4 text-primary" aria-hidden="true" />
          Minhas Finanças
        </Link>

        <div className="flex items-center gap-1" role="group" aria-label="Ano de trabalho">
          <CalendarRange className="mr-1 size-4 text-muted-foreground" aria-hidden="true" />
          <span className="mr-1 hidden text-sm text-muted-foreground sm:inline">Ano de trabalho</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={year === null || year <= MIN_YEAR}
            onClick={() => year !== null && setYear(year - 1)}
            aria-label="Ano anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Select
            value={year !== null ? String(year) : null}
            onValueChange={(v) => v && setYear(Number(v))}
            items={options.map((y) => ({ value: String(y), label: String(y) }))}
            disabled={year === null}
          >
            <SelectTrigger className="h-8 w-24" aria-label="Selecionar ano">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={year === null || year >= MAX_YEAR}
            onClick={() => year !== null && setYear(year + 1)}
            aria-label="Próximo ano"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>


      </div>
    </div>
  )
}
