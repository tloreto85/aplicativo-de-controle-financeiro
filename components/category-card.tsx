"use client"

import { useState } from "react"
import { Plus, Trash2, Check, X, Pencil } from "lucide-react"
import type { Category, Expense } from "@/lib/types"
import { BUCKET_LABELS } from "@/lib/types"
import { formatBRL, formatDateShort } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  category: Category
  onAddExpense: (categoryId: string, expense: Omit<Expense, "id">) => void
  onUpdateExpense: (categoryId: string, expenseId: string, patch: Partial<Omit<Expense, "id">>) => void
  onRemoveExpense: (categoryId: string, expenseId: string) => void
  onRemoveCategory: (id: string) => void
  onEditCategory: (category: Category) => void
}

export function CategoryCard({
  category,
  onAddExpense,
  onUpdateExpense,
  onRemoveExpense,
  onRemoveCategory,
  onEditCategory,
}: Props) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  const total = category.expenses.reduce((sum, e) => sum + e.amount, 0)

  function handleAdd() {
    const value = Number.parseFloat(amount.replace(",", "."))
    if (!name.trim() || Number.isNaN(value)) return
    onAddExpense(category.id, { name: name.trim(), amount: value, date })
    setName("")
    setAmount("")
    setDate("")
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card shadow-sm">
      <header
        className="flex items-center justify-between gap-2 rounded-t-lg px-4 py-2.5"
        style={{ backgroundColor: category.color }}
      >
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold leading-tight text-white">{category.name}</h3>
          <span className="text-[11px] font-medium text-white/80">{BUCKET_LABELS[category.bucket]}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEditCategory(category)}
            className="rounded p-1 text-white/90 transition-colors hover:bg-white/20"
            aria-label={`Editar categoria ${category.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveCategory(category.id)}
            className="rounded p-1 text-white/90 transition-colors hover:bg-white/20"
            aria-label={`Remover categoria ${category.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="flex-1">Descrição</span>
        <span className="w-20 text-right">R$</span>
        <span className="w-14 text-right">Data</span>
        <span className="w-6" />
      </div>

      <ul className="flex-1">
        {category.expenses.length === 0 && (
          <li className="px-4 py-3 text-center text-xs text-muted-foreground">Nenhuma despesa lançada.</li>
        )}
        {category.expenses.map((e) => (
          <li
            key={e.id}
            className="group flex items-center gap-2 border-b border-border/60 px-4 py-1.5 text-sm last:border-b-0"
          >
            {editingId === e.id ? (
              <EditExpenseRow
                expense={e}
                onSave={(patch) => {
                  onUpdateExpense(category.id, e.id, patch)
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <span className="flex-1 truncate text-card-foreground">{e.name}</span>
                <span className="w-20 text-right font-mono text-card-foreground">{formatBRL(e.amount)}</span>
                <span className="w-14 text-right text-xs text-muted-foreground">{formatDateShort(e.date)}</span>
                <div className="flex w-6 items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setEditingId(e.id)}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label={`Editar ${e.name}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveExpense(category.id, e.id)}
                    className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                    aria-label={`Remover ${e.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-1.5 border-t border-border bg-secondary/40 px-3 py-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Descrição"
          className="h-8 flex-1 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          aria-label="Nome da despesa"
        />
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          inputMode="decimal"
          className="h-8 w-20 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          aria-label="Valor da despesa"
        />
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-8 w-[120px] text-xs"
          aria-label="Data da despesa"
        />
        <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAdd} aria-label="Adicionar despesa">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-b-lg bg-total px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-total-foreground">Total</span>
        <span className="font-mono text-sm font-bold text-total-foreground">{formatBRL(total)}</span>
      </div>
    </div>
  )
}

function EditExpenseRow({
  expense,
  onSave,
  onCancel,
}: {
  expense: Expense
  onSave: (patch: Partial<Omit<Expense, "id">>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(expense.name)
  const [amount, setAmount] = useState(String(expense.amount))
  const [date, setDate] = useState(expense.date)

  function save() {
    const value = Number.parseFloat(amount.replace(",", "."))
    if (!name.trim() || Number.isNaN(value)) return
    onSave({ name: name.trim(), amount: value, date })
  }

  return (
    <div className="flex w-full items-center gap-1.5">
      <Input value={name} onChange={(e) => setName(e.target.value)} className="h-7 flex-1 text-sm" aria-label="Nome" />
      <Input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-7 w-20 text-sm"
        inputMode="decimal"
        aria-label="Valor"
      />
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-7 w-[120px] text-xs" aria-label="Data" />
      <button type="button" onClick={save} className="rounded p-1 text-primary hover:bg-primary/10" aria-label="Salvar">
        <Check className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onCancel} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Cancelar">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
