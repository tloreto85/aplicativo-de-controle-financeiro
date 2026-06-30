"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus, X, CircleCheck } from "lucide-react"
import type { Debt, DebtPayment } from "@/lib/debt-types"
import { installmentValue, paidAmount, remainingAmount } from "@/lib/debt-types"
import { formatBRL, formatDateBR } from "@/lib/format"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface Props {
  debt: Debt
  onEdit: (debt: Debt) => void
  onRemove: (id: string) => void
  onAddPayment: (debtId: string, payment: Omit<DebtPayment, "id">) => void
  onRemovePayment: (debtId: string, paymentId: string) => void
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function DebtCard({ debt, onEdit, onRemove, onAddPayment, onRemovePayment }: Props) {
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(today())
  const [note, setNote] = useState("")

  const paid = paidAmount(debt)
  const remaining = remainingAmount(debt)
  const perInstallment = installmentValue(debt)
  const progress = debt.totalAmount > 0 ? (paid / debt.totalAmount) * 100 : 0
  const settled = remaining <= 0

  function handleAddPayment() {
    const value = Number.parseFloat(amount.replace(",", "."))
    if (Number.isNaN(value) || value <= 0) return
    onAddPayment(debt.id, { amount: value, date: date || today(), note: note.trim() })
    setAmount("")
    setNote("")
    setDate(today())
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-card-foreground">{debt.creditor}</h3>
              {settled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  <CircleCheck className="h-3 w-3" />
                  Quitada
                </span>
              )}
            </div>
            {debt.contract && <p className="truncate text-sm text-muted-foreground">{debt.contract}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(debt)}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={`Editar dívida ${debt.creditor}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(debt.id)}
              className="rounded p-1 text-muted-foreground hover:text-destructive"
              aria-label={`Excluir dívida ${debt.creditor}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Progress value={Math.min(progress, 100)} className="h-2 flex-1" />
          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-muted/60 px-2 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="font-mono text-sm font-semibold text-card-foreground">{formatBRL(debt.totalAmount)}</p>
          </div>
          <div className="rounded-md bg-muted/60 px-2 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Pago</p>
            <p className="font-mono text-sm font-semibold text-primary">{formatBRL(paid)}</p>
          </div>
          <div className="rounded-md bg-muted/60 px-2 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Saldo devedor</p>
            <p className="font-mono text-sm font-semibold text-card-foreground">{formatBRL(remaining)}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {debt.installmentPlan && debt.installmentCount > 0
            ? `Parcelado em ${debt.installmentCount}x de ${formatBRL(perInstallment)}`
            : "Pagamento à vista"}
        </p>

        {debt.payments.length > 0 && (
          <ul className="flex flex-col gap-1 border-t border-border/60 pt-2">
            {debt.payments.map((p) => (
              <li key={p.id} className="group flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs tabular-nums">{formatDateBR(p.date)}</span>
                  {p.note && <span className="truncate text-card-foreground">{p.note}</span>}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-card-foreground">{formatBRL(p.amount)}</span>
                  <button
                    type="button"
                    onClick={() => onRemovePayment(debt.id, p.id)}
                    className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    aria-label="Remover pagamento"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-col gap-1.5 border-t border-border/60 pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Registrar pagamento
          </span>
          <div className="flex items-center gap-1.5">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              className="h-8 w-24 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddPayment()}
              aria-label="Valor do pagamento"
            />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 w-36 text-sm"
              aria-label="Data do pagamento"
            />
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Obs."
              className="h-8 flex-1 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddPayment()}
              aria-label="Observação do pagamento"
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleAddPayment}
              aria-label="Adicionar pagamento"
              disabled={settled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
