"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Landmark } from "lucide-react"
import { useDebts } from "@/lib/use-debts"
import { useFinance } from "@/lib/use-finance"
import type { Debt } from "@/lib/debt-types"
import { remainingAmount } from "@/lib/debt-types"
import { formatBRL } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { DebtCard } from "@/components/debts/debt-card"
import { DebtDialog } from "@/components/debts/debt-dialog"
import { BudgetImpact } from "@/components/debts/budget-impact"

export default function DividasPage() {
  const { debts, loaded, addDebt, updateDebt, removeDebt, addPayment, removePayment } = useDebts()
  const { state, loaded: financeLoaded } = useFinance()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)

  const monthlyIncome = useMemo(
    () => state.incomes.reduce((sum, i) => sum + i.amount, 0),
    [state.incomes],
  )

  const totalRemaining = useMemo(
    () => debts.reduce((sum, d) => sum + remainingAmount(d), 0),
    [debts],
  )

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(debt: Debt) {
    setEditing(debt)
    setDialogOpen(true)
  }

  if (!loaded || !financeLoaded) {
    return (
      <main className="flex min-h-svh items-center justify-center text-muted-foreground">Carregando…</main>
    )
  }

  return (
    <main className="min-h-svh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              render={<Link href="/financeiro" />}
              nativeButton={false}
              variant="ghost"
              size="icon"
              aria-label="Voltar ao controle financeiro"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-card-foreground">Gestão de Dívidas</h1>
              <p className="text-sm text-muted-foreground">Credores, parcelas, pagamentos e impacto no orçamento</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Saldo devedor total</span>
              <span className="font-mono text-base font-bold text-card-foreground">{formatBRL(totalRemaining)}</span>
            </div>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Nova dívida
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
        <section>
          <BudgetImpact debts={debts} monthlyIncome={monthlyIncome} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Minhas dívidas
          </h2>
          {debts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma dívida cadastrada.</p>
              <Button variant="outline" className="mt-3" onClick={openNew}>
                <Plus className="h-4 w-4" />
                Cadastrar primeira dívida
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {debts.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  onEdit={openEdit}
                  onRemove={removeDebt}
                  onAddPayment={addPayment}
                  onRemovePayment={removePayment}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <DebtDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onCreate={addDebt}
        onUpdate={updateDebt}
      />
    </main>
  )
}
