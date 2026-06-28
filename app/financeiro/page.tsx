"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Wallet } from "lucide-react"
import { useFinance } from "@/lib/use-finance"
import type { Category } from "@/lib/types"
import { formatBRL, monthKey } from "@/lib/format"
import { buildExpensesCsv, downloadCsv } from "@/lib/export"
import { Button } from "@/components/ui/button"
import { CategoryCard } from "@/components/category-card"
import { CategoryDialog } from "@/components/category-dialog"
import { IncomePanel } from "@/components/income-panel"
import { TargetsEditor } from "@/components/targets-editor"
import { ConsolidatedPanel } from "@/components/consolidated-panel"
import { DistributionChart } from "@/components/distribution-chart"
import { FilterBar, ALL_MONTHS } from "@/components/filter-bar"
import { ClearDataDialog } from "@/components/clear-data-dialog"
import { YearRolloverDialog } from "@/components/year-rollover-dialog"

export default function FinanceiroPage() {
  const {
    state,
    loaded,
    rollover,
    clearAll,
    downloadRollover,
    dismissRollover,
    addCategory,
    updateCategory,
    removeCategory,
    addExpense,
    updateExpense,
    removeExpense,
    addIncome,
    removeIncome,
    updateTargets,
  } = useFinance()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(ALL_MONTHS)

  // All distinct "yyyy-mm" keys present across expenses, most recent first.
  const availableMonths = useMemo(() => {
    const set = new Set<string>()
    for (const c of state.categories) {
      for (const e of c.expenses) {
        const key = monthKey(e.date)
        if (key) set.add(key)
      }
    }
    return Array.from(set).sort().reverse()
  }, [state.categories])

  // Categories with expenses filtered by the selected month (mutations still use ids).
  const filteredCategories = useMemo(() => {
    if (selectedMonth === ALL_MONTHS) return state.categories
    return state.categories.map((c) => ({
      ...c,
      expenses: c.expenses.filter((e) => monthKey(e.date) === selectedMonth),
    }))
  }, [state.categories, selectedMonth])

  const totalExpenses = filteredCategories.reduce(
    (sum, c) => sum + c.expenses.reduce((s, e) => s + e.amount, 0),
    0,
  )
  const totalIncome = state.incomes.reduce((sum, i) => sum + i.amount, 0)

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setDialogOpen(true)
  }

  function handleExport() {
    const csv = buildExpensesCsv(filteredCategories)
    const suffix = selectedMonth === ALL_MONTHS ? "todos" : selectedMonth
    downloadCsv(`despesas-${suffix}.csv`, csv)
  }

  if (!loaded) {
    return (
      <main className="flex min-h-svh items-center justify-center text-muted-foreground">
        Carregando…
      </main>
    )
  }

  return (
    <main className="min-h-svh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button render={<Link href="/" />} variant="ghost" size="icon" aria-label="Voltar ao menu">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-card-foreground">Controle Financeiro</h1>
              <p className="text-sm text-muted-foreground">Despesas, vencimentos e regra 50-30-20</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Saldo</span>
              <span
                className={`font-mono text-base font-bold ${
                  totalIncome - totalExpenses >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {formatBRL(totalIncome - totalExpenses)}
              </span>
            </div>
            <ClearDataDialog onClear={clearAll} />
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Nova categoria
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6">
        <FilterBar
          months={availableMonths}
          selected={selectedMonth}
          onSelect={setSelectedMonth}
          onExport={handleExport}
        />

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Despesas por categoria
          </h2>
          {state.categories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma categoria ainda.</p>
              <Button variant="outline" className="mt-3" onClick={openNew}>
                <Plus className="h-4 w-4" />
                Criar primeira categoria
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onAddExpense={addExpense}
                  onUpdateExpense={updateExpense}
                  onRemoveExpense={removeExpense}
                  onRemoveCategory={removeCategory}
                  onEditCategory={openEdit}
                />
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <IncomePanel incomes={state.incomes} onAdd={addIncome} onRemove={removeIncome} />
          <TargetsEditor targets={state.targets} onChange={updateTargets} />
        </section>

        <section>
          <DistributionChart categories={filteredCategories} />
        </section>

        <section>
          <ConsolidatedPanel categories={filteredCategories} incomes={state.incomes} targets={state.targets} />
        </section>
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onCreate={addCategory}
        onUpdate={updateCategory}
      />

      <YearRolloverDialog info={rollover} onDownload={downloadRollover} onDismiss={dismissRollover} />
    </main>
  )
}
