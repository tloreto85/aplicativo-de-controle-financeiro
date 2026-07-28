"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Wallet, Landmark } from "lucide-react"
import { useFinance } from "@/lib/use-finance"
import type { Category } from "@/lib/types"
import { formatBRL, monthKey, monthLabel, currentMonthKey } from "@/lib/format"
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

  // Categories with expenses filtered by the selected month (mutations still use ids).
  const filteredCategories = useMemo(() => {
    if (selectedMonth === ALL_MONTHS) return state.categories
    return state.categories.map((c) => ({
      ...c,
      expenses: c.expenses.filter((e) => monthKey(e.date) === selectedMonth),
    }))
  }, [state.categories, selectedMonth])

  // Receitas vinculadas ao mês selecionado. Em "Todos os meses" mostra todas.
  const filteredIncomes = useMemo(() => {
    if (selectedMonth === ALL_MONTHS) return state.incomes
    return state.incomes.filter((i) => i.month === selectedMonth)
  }, [state.incomes, selectedMonth])

  // Ao adicionar em "Todos os meses", a receita entra no mês corrente.
  const incomeMonth = selectedMonth === ALL_MONTHS ? currentMonthKey() : selectedMonth
  const incomePeriodLabel = selectedMonth === ALL_MONTHS ? "Todos os meses" : monthLabel(selectedMonth)

  // Saldo considera apenas despesas efetivamente PAGAS; despesas em aberto
  // (não pagas) não impactam o saldo até serem quitadas.
  const totalPaidExpenses = filteredCategories.reduce(
    (sum, c) => sum + c.expenses.filter((e) => e.paid).reduce((s, e) => s + e.amount, 0),
    0,
  )
  const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.amount, 0)

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
            <Button
              render={<Link href="/" />}
              nativeButton={false}
              variant="ghost"
              size="icon"
              aria-label="Voltar ao menu"
            >
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
                  totalIncome - totalPaidExpenses >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {formatBRL(totalIncome - totalPaidExpenses)}
              </span>
            </div>
            <Button
              render={<Link href="/financeiro/dividas" />}
              nativeButton={false}
              variant="outline"
            >
              <Landmark className="h-4 w-4" />
              Gestão de Dívidas
            </Button>
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
          year={state.year}
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
                  defaultMonth={selectedMonth === ALL_MONTHS ? undefined : selectedMonth}
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
          <IncomePanel
            incomes={filteredIncomes}
            periodLabel={incomePeriodLabel}
            onAdd={(name, amount) => addIncome(name, amount, incomeMonth)}
            onRemove={removeIncome}
          />
          <TargetsEditor targets={state.targets} onChange={updateTargets} />
        </section>

        <section>
          <DistributionChart categories={filteredCategories} />
        </section>

        <section>
          <ConsolidatedPanel categories={filteredCategories} incomes={filteredIncomes} targets={state.targets} />
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
