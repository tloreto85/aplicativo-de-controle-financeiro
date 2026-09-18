"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, Pie, PieChart } from "recharts"
import { TrendingUp, TrendingDown, Wallet, CalendarCheck, Filter } from "lucide-react"
import type { Category, Income } from "@/lib/types"
import { formatBRL, monthLabel } from "@/lib/format"
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
  year: number
}

const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

const barConfig: ChartConfig = {
  receita: { label: "Receita", color: "var(--chart-2)" },
  despesa: { label: "Despesa", color: "var(--chart-3)" },
}

// Consolidação de todo o ano: reúne receitas (por mês) e despesas com data
// dentro do ano informado, com filtro por categoria e gráficos.
export function AnnualConsolidation({ categories, incomes, year }: Props) {
  const yearPrefix = `${year}-`

  // Filtro de categorias: por padrão todas ativas.
  const [activeCats, setActiveCats] = useState<Set<string>>(() => new Set(categories.map((c) => c.id)))

  const allActive = activeCats.size === categories.length
  const toggleCat = (id: string) =>
    setActiveCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const selectAll = () => setActiveCats(new Set(categories.map((c) => c.id)))
  const clearAll = () => setActiveCats(new Set())

  const selectedCategories = useMemo(
    () => categories.filter((c) => activeCats.has(c.id)),
    [categories, activeCats],
  )

  // Estrutura por mês (0-11) considerando o filtro de categorias.
  // A receita é sempre o total do mês (não depende de categoria).
  const monthly = useMemo(() => {
    const receita = new Array(12).fill(0) as number[]
    const despesa = new Array(12).fill(0) as number[]
    const byCategory = Array.from({ length: 12 }, () => ({}) as Record<string, number>)

    for (const c of selectedCategories) {
      for (const e of c.expenses) {
        if (!e.date || !e.date.startsWith(yearPrefix)) continue
        const idx = Number(e.date.split("-")[1]) - 1
        if (idx < 0 || idx > 11) continue
        despesa[idx] += e.amount
        byCategory[idx][c.id] = (byCategory[idx][c.id] ?? 0) + e.amount
      }
    }

    for (const i of incomes) {
      if (!i.month || !i.month.startsWith(yearPrefix)) continue
      const idx = Number(i.month.split("-")[1]) - 1
      if (idx < 0 || idx > 11) continue
      receita[idx] += i.amount
    }

    return { receita, despesa, byCategory }
  }, [selectedCategories, incomes, yearPrefix])

  const totalReceita = monthly.receita.reduce((s, v) => s + v, 0)
  const totalDespesa = monthly.despesa.reduce((s, v) => s + v, 0)
  const saldo = totalReceita - totalDespesa

  // Total por categoria no ano (para a distribuição em pizza).
  const catTotals = useMemo(() => {
    return selectedCategories
      .map((c) => {
        const value = c.expenses
          .filter((e) => e.date && e.date.startsWith(yearPrefix))
          .reduce((s, e) => s + e.amount, 0)
        return { id: c.id, name: c.name, color: c.color, value }
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [selectedCategories, yearPrefix])

  const barData = useMemo(
    () =>
      MONTHS_SHORT.map((mes, idx) => ({
        mes,
        receita: monthly.receita[idx],
        despesa: monthly.despesa[idx],
      })),
    [monthly],
  )

  const pieConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {}
    catTotals.forEach((d) => {
      cfg[d.name] = { label: d.name, color: d.color }
    })
    return cfg
  }, [catTotals])

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  // Meses do ano com algum lançamento (receita ou despesa), para o detalhamento.
  const monthsWithData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, idx) => idx).filter(
        (idx) => monthly.receita[idx] > 0 || monthly.despesa[idx] > 0,
      ),
    [monthly],
  )

  const hasData = totalReceita > 0 || totalDespesa > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Filtro de categorias */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filtrar categorias
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={allActive ? clearAll : selectAll}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              allActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {allActive ? "Limpar seleção" : "Selecionar todas"}
          </button>
          {categories.map((c) => {
            const active = activeCats.has(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCat(c.id)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-transparent text-card-foreground"
                    : "border-dashed border-border text-muted-foreground opacity-60 hover:opacity-100"
                }`}
                style={active ? { backgroundColor: `color-mix(in oklch, ${c.color} 22%, transparent)` } : undefined}
              >
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                {c.name}
              </button>
            )
          })}
        </CardContent>
      </Card>

      {!hasData ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <CalendarCheck className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Sem lançamentos em {year} para as categorias selecionadas.
            </p>
            <p className="text-xs text-muted-foreground">
              Lance despesas com data e receitas ao longo do ano para vê-las consolidadas aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Cartões de resumo do ano */}
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label={`Receita ${year}`}
              value={totalReceita}
              hint="Somatório do ano"
              icon={<TrendingUp className="h-5 w-5" />}
              tone="positive"
            />
            <SummaryCard
              label={`Despesa ${year}`}
              value={totalDespesa}
              hint={allActive ? "Todas as categorias" : `${selectedCategories.length} de ${categories.length} categorias`}
              icon={<TrendingDown className="h-5 w-5" />}
              tone="negative"
            />
            <SummaryCard
              label="Saldo do Ano"
              value={saldo}
              hint="Receitas menos despesas"
              icon={<Wallet className="h-5 w-5" />}
              tone={saldo >= 0 ? "positive" : "negative"}
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
              <ChartContainer config={barConfig} className="h-[280px] w-full">
                <BarChart data={barData} margin={{ top: 16, right: 12, left: 12, bottom: 4 }}>
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

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Distribuição por categoria (pizza) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Distribuição por categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                {catTotals.length === 0 ? (
                  <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                    Sem despesas para exibir.
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <ChartContainer config={pieConfig} className="aspect-square h-[220px]">
                      <PieChart>
                        <ChartTooltip
                          content={<ChartTooltipContent hideLabel formatter={(value) => formatBRL(Number(value))} />}
                        />
                        <Pie data={catTotals} dataKey="value" nameKey="name" innerRadius={55} strokeWidth={2}>
                          {catTotals.map((d) => (
                            <Cell key={d.id} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="flex w-full flex-col gap-2">
                      {catTotals.map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
                            <span className="text-card-foreground">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-card-foreground">{formatBRL(d.value)}</span>
                            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                              {totalDespesa > 0 ? Math.round((d.value / totalDespesa) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ranking por categoria (barras horizontais) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Gasto por categoria
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {catTotals.length === 0 ? (
                  <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                    Sem despesas para exibir.
                  </div>
                ) : (
                  catTotals.map((d) => {
                    const pct = totalDespesa > 0 ? Math.round((d.value / totalDespesa) * 100) : 0
                    return (
                      <div key={d.id} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: d.color }} />
                            <span className="text-card-foreground">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-card-foreground">{formatBRL(d.value)}</span>
                            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detalhamento mês a mês */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Detalhamento mês a mês
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {monthsWithData.map((idx) => {
                const key = `${year}-${String(idx + 1).padStart(2, "0")}`
                const receita = monthly.receita[idx]
                const despesa = monthly.despesa[idx]
                const mSaldo = receita - despesa
                const byCat = monthly.byCategory[idx]
                return (
                  <Card key={key}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base capitalize">{monthLabel(key)}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Receita</span>
                        <span className="font-mono text-card-foreground">{formatBRL(receita)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Despesa</span>
                        <span className="font-mono text-card-foreground">{formatBRL(despesa)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between rounded-md bg-total px-3 py-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-total-foreground">
                          Saldo
                        </span>
                        <span
                          className={`font-mono text-sm font-bold ${
                            mSaldo >= 0 ? "text-total-foreground" : "text-destructive"
                          }`}
                        >
                          {formatBRL(mSaldo)}
                        </span>
                      </div>

                      {Object.keys(byCat).length > 0 && (
                        <>
                          <Separator className="my-2" />
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Por categoria
                          </h4>
                          {Object.entries(byCat)
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
                        </>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </>
      )}
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
