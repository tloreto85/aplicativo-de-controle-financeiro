"use client"

import type { Bucket, Category, Income } from "@/lib/types"
import { BUCKET_LABELS } from "@/lib/types"
import { formatBRL } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface Props {
  categories: Category[]
  incomes: Income[]
  targets: Record<Bucket, number>
}

const BUCKETS: Bucket[] = ["essenciais", "dividas", "pessoal", "investimentos"]

const BUCKET_COLORS: Record<Bucket, string> = {
  essenciais: "var(--chart-1)",
  dividas: "var(--chart-3)",
  pessoal: "var(--chart-5)",
  investimentos: "var(--chart-2)",
}

export function ConsolidatedPanel({ categories, incomes, targets }: Props) {
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)

  const realizedByBucket = BUCKETS.reduce(
    (acc, b) => {
      acc[b] = categories
        .filter((c) => c.bucket === b)
        .reduce((sum, c) => sum + c.expenses.reduce((s, e) => s + e.amount, 0), 0)
      return acc
    },
    {} as Record<Bucket, number>,
  )

  const totalExpenses = BUCKETS.reduce((sum, b) => sum + realizedByBucket[b], 0)
  const diff = totalIncome - totalExpenses

  return (
    <Card className="border-primary/30">
      <CardHeader className="rounded-t-xl bg-primary py-3">
        <CardTitle className="text-center text-base font-bold uppercase tracking-wide text-primary-foreground">
          Consolidado — Regra 50% · 30% · 20%
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Grupo</span>
            <span className="w-24 text-right">Estimado</span>
            <span className="w-24 text-right">Realizado</span>
            <span className="w-16 text-right">Status</span>
          </div>

          {BUCKETS.map((b) => {
            const estimated = (targets[b] / 100) * totalIncome
            const realized = realizedByBucket[b]
            const pctOfIncome = totalIncome > 0 ? Math.round((realized / totalIncome) * 100) : 0
            const within = realized <= estimated + 0.001
            return (
              <div key={b} className="flex flex-col gap-1.5">
                <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: BUCKET_COLORS[b] }} />
                    <span className="text-sm font-medium text-card-foreground">{BUCKET_LABELS[b]}</span>
                    <span className="text-xs text-muted-foreground">({targets[b]}%)</span>
                  </div>
                  <span className="w-24 text-right font-mono text-sm text-muted-foreground">
                    {formatBRL(estimated)}
                  </span>
                  <span className="w-24 text-right font-mono text-sm font-semibold text-card-foreground">
                    {formatBRL(realized)}
                  </span>
                  <span
                    className={`w-16 text-right text-xs font-semibold ${
                      within ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {within ? "Ok" : "Acima"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={Math.min(pctOfIncome / (targets[b] || 100) * 100, 100)}
                    className="h-1.5 flex-1"
                  />
                  <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{pctOfIncome}%</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-secondary/30 p-4">
          <h4 className="mb-1 text-sm font-semibold text-card-foreground">Detalhamento</h4>
          {categories.map((c) => {
            const total = c.expenses.reduce((s, e) => s + e.amount, 0)
            return (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="font-mono text-card-foreground">{formatBRL(total)}</span>
              </div>
            )
          })}
          <Separator className="my-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-card-foreground">Total despesas</span>
            <span className="font-mono font-semibold text-card-foreground">{formatBRL(totalExpenses)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-card-foreground">Total receitas</span>
            <span className="font-mono font-semibold text-card-foreground">{formatBRL(totalIncome)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between rounded-md bg-total px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-total-foreground">Saldo (Diff)</span>
            <span className={`font-mono text-sm font-bold ${diff >= 0 ? "text-total-foreground" : "text-destructive"}`}>
              {formatBRL(diff)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
