"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { TrendingUp, TrendingDown, Wallet, CalendarCheck } from "lucide-react"
import type { Category, Income } from "@/lib/types"
import { formatBRL, monthKey, monthLabel, currentMonthKey } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface Props {
  categories: Category[]
  incomes: Income[]
}

const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

const chartConfig: ChartConfig = {
  receita: { label: "Receita", color: "var(--chart-2)" },
  despesa: { label: "Despesa", color: "var(--chart-3)" },
}

export function MonthlyConsolidation({ categories, incomes }: Props) {
  // Meses finalizados são os anteriores ao mês corrente.
  const todayKey = currentMonthKey()

  // Agrupa despesas e receitas por mês, considerando apenas meses finalizados.
  // A receita de cada mês é a soma das receitas vinculadas àquele mês.
  const months = useMemo(() => {
    const map = new Map<
      string,
      { key: string; despesa: number; receita: number; byCategory: Record<string, number> }
    >()

    const ensure = (key: string) =>
      map.get(key) ?? { key, despesa: 0, receita: 0, byCategory: {} }

    for (const c of categories) {
      for (const e of c.expenses) {
        const key = monthKey(e.date)
        if (!key || key >= todayKey) continue // ignora sem data e meses não finalizados
        const entry = ensure(key)
        entry.despesa += e.amount
        entry.byCategory[c.id] = (entry.byCategory[c.id] ?? 0) + e.amount
        map.set(key, entry)
      }
    }

    for (const i of incomes) {
      if (!i.month || i.month >= todayKey) continue // só meses finalizados
      const entry = ensure(i.month)
      entry.receita += i.amount
      map.set(i.month, entry)
    }

    return Array.from(map.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((m) => ({ ...m, saldo: m.receita - m.despesa }))
  }, [categories, incomes, todayKey])

  // Totais gerais ao longo de todos os meses finalizados.
  const totals = useMemo(() => {
    const receita = months.reduce((s, m) => s + m.receita, 0)
    const despesa = months.reduce((s, m) => s + m.despesa, 0)
    const byCategory: Record<string, number> = {}
    for (const m of months) {
      for (const [catId, v] of Object.entries(m.byCategory)) {
        byCategory[catId] = (byCategory[catId] ?? 0) + v
      }
    }
    return { receita, despesa, saldo: receita - despesa, byCategory }
  }, [months])

  const chartData = useMemo(
    () =>
      months.map((m) => ({
        mes: MONTHS_SHORT[Number(m.key.split("-")[1]) - 1],
        receita: m.receita,
        despesa: m.despesa,
      })),
    [months],
  )

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  if (months.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <CalendarCheck className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Ainda não há meses finalizados com despesas registradas.
          </p>
          <p className="text-xs text-muted-foreground">
            Lance despesas com data em meses anteriores ao atual para vê-las consolidadas aqui.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cartões de resumo geral */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Receita Total"
          value={totals.receita}
          hint={`${months.length} ${months.length === 1 ? "mês finalizado" : "meses finalizados"}`}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="positive"
        />
        <SummaryCard
          label="Despesa Total"
          value={totals.despesa}
          hint="Somatório de todos os meses"
          icon={<TrendingDown className="h-5 w-5" />}
          tone="negative"
        />
        <SummaryCard
          label="Saldo Consolidado"
          value={totals.saldo}
          hint="Receitas menos despesas"
          icon={<Wallet className="h-5 w-5" />}
          tone={totals.saldo >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Gráfico receita x despesa por mês */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Receitas e despesas por mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart data={chartData} margin={{ top: 16, right: 12, left: 12, bottom: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(v) => formatBRL(Number(v))}
                fontSize={11}
              />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatBRL(Number(value))} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="receita" fill="var(--color-receita)" radius={4} />
              <Bar dataKey="despesa" fill="var(--color-despesa)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Consolidado por categoria (todos os meses finalizados) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Gasto por categoria (consolidado)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {categories
            .map((c) => ({ c, total: totals.byCategory[c.id] ?? 0 }))
            .sort((a, b) => b.total - a.total)
            .map(({ c, total }) => {
              const pct = totals.despesa > 0 ? Math.round((total / totals.despesa) * 100) : 0
              return (
                <div key={c.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: c.color }} />
                      <span className="text-card-foreground">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-card-foreground">{formatBRL(total)}</span>
                      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              )
            })}
        </CardContent>
      </Card>

      {/* Detalhamento mês a mês */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Detalhamento mês a mês
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {months
            .slice()
            .reverse()
            .map((m) => (
              <Card key={m.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize">{monthLabel(m.key)}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Receita</span>
                    <span className="font-mono text-card-foreground">{formatBRL(m.receita)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Despesa</span>
                    <span className="font-mono text-card-foreground">{formatBRL(m.despesa)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between rounded-md bg-total px-3 py-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-total-foreground">Saldo</span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        m.saldo >= 0 ? "text-total-foreground" : "text-destructive"
                      }`}
                    >
                      {formatBRL(m.saldo)}
                    </span>
                  </div>

                  <Separator className="my-2" />

                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Por categoria
                  </h4>
                  {Object.entries(m.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([catId, v]) => {
                      const cat = catById.get(catId)
                      if (!cat) return null
                      return (
                        <div key={catId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: cat.color }} />
                            <span className="text-muted-foreground">{cat.name}</span>
                          </div>
                          <span className="font-mono text-card-foreground">{formatBRL(v)}</span>
                        </div>
                      )
                    })}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string
  value: number
  hint: string
  icon: React.ReactNode
  tone: "positive" | "negative"
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
            tone === "positive" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          }`}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
          <span
            className={`font-mono text-xl font-bold ${tone === "positive" ? "text-card-foreground" : "text-destructive"}`}
          >
            {formatBRL(value)}
          </span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </div>
      </CardContent>
    </Card>
  )
}
