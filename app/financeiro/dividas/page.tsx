"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Landmark, LayoutGrid, List } from "lucide-react"
import { useDebts } from "@/lib/use-debts"
import { useFinance } from "@/lib/use-finance"
import type { Debt } from "@/lib/debt-types"
import { remainingAmount, DEBT_CATEGORY_INFO } from "@/lib/debt-types"
import { formatBRL } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { DebtCard } from "@/components/debts/debt-card"
import { DebtDialog } from "@/components/debts/debt-dialog"
import { BudgetImpact } from "@/components/debts/budget-impact"

type ViewMode = "grid" | "list"

const CATEGORY_DOT: Record<string, string> = {
  "debt-green": "bg-debt-green",
  "debt-yellow": "bg-debt-yellow",
  "debt-orange": "bg-debt-orange",
  "debt-red": "bg-debt-red",
}

export default function DividasPage() {
  const { debts, loaded, addDebt, updateDebt, removeDebt, toggleInstallment } = useDebts()
  const { state, loaded: financeLoaded } = useFinance()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)
  const [view, setView] = useState<ViewMode>("grid")

  const monthlyIncome = useMemo(
    () => state.incomes.reduce((sum, i) => sum + i.amount, 0),
    [state.incomes],
  )

  const totalRemaining = useMemo(
    () => debts.reduce((sum, d) => sum + remainingAmount(d), 0),
    [debts],
  )

  // Agrupa dívidas por credor, ordenando os grupos alfabeticamente.
  const groups = useMemo(() => {
    const map = new Map<string, Debt[]>()
    for (const d of debts) {
      const key = d.creditor.trim() || "Sem credor"
      const arr = map.get(key) ?? []
      arr.push(d)
      map.set(key, arr)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
  }, [debts])

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
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Minhas dívidas
            </h2>
            {debts.length > 0 && (
              <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
                <Button
                  variant={view === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 gap-1.5 px-2.5"
                  onClick={() => setView("grid")}
                  aria-pressed={view === "grid"}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Grade
                </Button>
                <Button
                  variant={view === "list" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 gap-1.5 px-2.5"
                  onClick={() => setView("list")}
                  aria-pressed={view === "list"}
                >
                  <List className="h-4 w-4" />
                  Lista
                </Button>
              </div>
            )}
          </div>

          {debts.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-card px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Categoria por valor
              </span>
              {Object.values(DEBT_CATEGORY_INFO).map((cat) => (
                <span key={cat.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-2.5 w-2.5 rounded-full ${CATEGORY_DOT[cat.color]}`} aria-hidden />
                  <span className="font-medium text-card-foreground">{cat.label}</span>
                  <span className="hidden sm:inline">· {cat.range}</span>
                </span>
              ))}
            </div>
          )}

          {debts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma dívida cadastrada.</p>
              <Button variant="outline" className="mt-3" onClick={openNew}>
                <Plus className="h-4 w-4" />
                Cadastrar primeira dívida
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {groups.map(([creditor, creditorDebts]) => {
                const groupRemaining = creditorDebts.reduce((sum, d) => sum + remainingAmount(d), 0)
                return (
                  <div key={creditor}>
                    <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                        {creditor}
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {creditorDebts.length}
                          {creditorDebts.length === 1 ? " dívida" : " dívidas"}
                        </span>
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        Saldo devedor{" "}
                        <span className="font-mono font-semibold text-card-foreground">
                          {formatBRL(groupRemaining)}
                        </span>
                      </span>
                    </div>
                    <div className={view === "grid" ? "grid gap-4 lg:grid-cols-2" : "flex flex-col gap-3"}>
                      {creditorDebts.map((debt) => (
                        <DebtCard
                          key={debt.id}
                          debt={debt}
                          variant={view}
                          onEdit={openEdit}
                          onRemove={removeDebt}
                          onToggleInstallment={toggleInstallment}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
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
