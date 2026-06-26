"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import type { Income } from "@/lib/types"
import { formatBRL } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  incomes: Income[]
  onAdd: (name: string, amount: number) => void
  onRemove: (id: string) => void
}

export function IncomePanel({ incomes, onAdd, onRemove }: Props) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const total = incomes.reduce((sum, i) => sum + i.amount, 0)

  function handleAdd() {
    const value = Number.parseFloat(amount.replace(",", "."))
    if (!name.trim() || Number.isNaN(value)) return
    onAdd(name.trim(), value)
    setName("")
    setAmount("")
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Receitas</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <ul className="flex flex-col">
          {incomes.map((i) => (
            <li key={i.id} className="group flex items-center justify-between border-b border-border/60 py-1.5 text-sm">
              <span className="text-card-foreground">{i.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-card-foreground">{formatBRL(i.amount)}</span>
                <button
                  type="button"
                  onClick={() => onRemove(i.id)}
                  className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label={`Remover receita ${i.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Fonte de renda"
            className="h-8 flex-1 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            aria-label="Nome da receita"
          />
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            inputMode="decimal"
            className="h-8 w-24 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            aria-label="Valor da receita"
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleAdd} aria-label="Adicionar receita">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-1 flex items-center justify-between rounded-md bg-total px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-total-foreground">Total de receitas</span>
          <span className="font-mono text-sm font-bold text-total-foreground">{formatBRL(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
