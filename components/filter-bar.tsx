"use client"

import { Calendar, Download } from "lucide-react"
import { monthLabel } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  months: string[]
  selected: string
  onSelect: (value: string) => void
  onExport: () => void
}

export const ALL_MONTHS = "all"

export function FilterBar({ months, selected, onSelect, onExport }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={selected} onValueChange={onSelect}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Período">
              {selected === ALL_MONTHS ? "Todos os meses" : monthLabel(selected)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MONTHS}>Todos os meses</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" onClick={onExport}>
        <Download className="h-4 w-4" />
        Exportar CSV
      </Button>
    </div>
  )
}
