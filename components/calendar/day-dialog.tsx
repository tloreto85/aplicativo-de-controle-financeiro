"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Pencil, X } from "lucide-react"
import type { CalendarEntry, EventKind } from "@/lib/calendar-types"
import { KIND_META, NATIVE_KINDS } from "@/lib/calendar-types"
import type { CalendarEventInput } from "@/lib/use-calendar-events"
import { formatBRL, formatDateBR } from "@/lib/format"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  date: string | null
  entries: CalendarEntry[]
  onOpenChange: (open: boolean) => void
  onAdd: (input: CalendarEventInput) => void
  onUpdate: (id: string, patch: Partial<CalendarEventInput>) => void
  onRemove: (id: string) => void
}

const SOURCE_LABEL: Record<string, string> = {
  financeiro: "Controle Financeiro",
  calendario: "Calendário",
}

// Remove o prefixo "cal-" para recuperar o id real do evento próprio.
function rawId(entryId: string) {
  return entryId.replace(/^cal-/, "")
}

export function DayDialog({ date, entries, onOpenChange, onAdd, onUpdate, onRemove }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [kind, setKind] = useState<EventKind>("evento")
  const [amount, setAmount] = useState("")

  // Fecha o formulário sempre que troca de dia.
  useEffect(() => {
    setFormOpen(false)
    setEditingId(null)
  }, [date])

  function resetForm() {
    setTitle("")
    setKind("evento")
    setAmount("")
    setEditingId(null)
  }

  function startAdd() {
    resetForm()
    setFormOpen(true)
  }

  function startEdit(entry: CalendarEntry) {
    setEditingId(rawId(entry.id))
    setTitle(entry.title)
    setKind(entry.kind)
    setAmount(entry.amount != null ? String(entry.amount) : "")
    setFormOpen(true)
  }

  function submit() {
    if (!date || !title.trim()) return
    const value = Number.parseFloat(amount.replace(",", ".")) || 0
    const input: CalendarEventInput = {
      date,
      title: title.trim(),
      kind,
      amount: kind === "evento" ? undefined : value,
    }
    if (editingId) onUpdate(editingId, input)
    else onAdd(input)
    resetForm()
    setFormOpen(false)
  }

  const showAmount = kind !== "evento"

  return (
    <Dialog open={date !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">{date ? formatDateBR(date) : ""}</DialogTitle>
          <DialogDescription>
            Lançamentos do dia vindos do Controle Financeiro e do próprio Calendário.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto py-1">
          {entries.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum lançamento neste dia.
            </p>
          )}
          {entries.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span
                className="h-8 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: KIND_META[e.kind].color }}
              />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${e.paid ? "line-through opacity-60" : ""}`}>
                  {e.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span style={{ color: KIND_META[e.kind].color }}>{KIND_META[e.kind].label}</span>
                  {" · "}
                  {SOURCE_LABEL[e.source]}
                  {e.paid ? " · quitado" : ""}
                </p>
              </div>
              {e.amount != null && (
                <span
                  className="shrink-0 font-mono text-sm font-semibold"
                  style={{ color: KIND_META[e.kind].color }}
                >
                  {formatBRL(e.amount)}
                </span>
              )}
              {e.editable && (
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button variant="ghost" size="icon" aria-label="Editar evento" onClick={() => startEdit(e)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir evento"
                    onClick={() => onRemove(rawId(e.id))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {formOpen ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {editingId ? "Editar evento" : "Novo evento"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fechar formulário"
                onClick={() => {
                  resetForm()
                  setFormOpen(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cal-title">Descrição</Label>
              <Input
                id="cal-title"
                value={title}
                onChange={(ev) => setTitle(ev.target.value)}
                placeholder="Ex: Conta de luz, Salário, Reunião…"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cal-kind">Tipo</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as EventKind)}>
                  <SelectTrigger id="cal-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIVE_KINDS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {KIND_META[k].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showAmount && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cal-amount">Valor (R$)</Label>
                  <Input
                    id="cal-amount"
                    value={amount}
                    onChange={(ev) => setAmount(ev.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </div>
              )}
            </div>

            <Button onClick={submit} disabled={!title.trim()}>
              {editingId ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={startAdd}>
            <Plus className="h-4 w-4" />
            Adicionar evento neste dia
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
