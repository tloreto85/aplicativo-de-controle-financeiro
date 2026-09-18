"use client"

import Link from "next/link"
import { ArrowLeft, BarChart3 } from "lucide-react"
import { useFinance } from "@/lib/use-finance"
import { Button } from "@/components/ui/button"
import { AnnualConsolidation } from "@/components/annual-consolidation"

export default function ConsolidadoPage() {
  const { state, loaded } = useFinance()

  if (!loaded) {
    return (
      <main className="flex min-h-svh items-center justify-center text-muted-foreground">Carregando…</main>
    )
  }

  return (
    <main className="min-h-svh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5">
          <Button
            render={<Link href="/financeiro" />}
            nativeButton={false}
            variant="ghost"
            size="icon"
            aria-label="Voltar ao Controle Financeiro"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-card-foreground">Consolidado Anual</h1>
            <p className="text-sm text-muted-foreground">
              Todas as receitas e despesas de {state.year}, com filtros e gráficos
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <AnnualConsolidation categories={state.categories} incomes={state.incomes} year={state.year} />
      </div>
    </main>
  )
}
