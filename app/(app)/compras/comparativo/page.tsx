"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, TrendingDown, TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { useShopping } from "@/lib/use-shopping"
import { analyzeRecurringProducts } from "@/lib/price-analysis"
import { formatBRL, monthLabel } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

// Build a safe data key for recharts from a product name.
function keyFor(name: string, idx: number) {
  return `p${idx}`
}

export default function ComparativoPage() {
  const { state, loaded } = useShopping()
  const analysis = useMemo(() => analyzeRecurringProducts(state.lists), [state.lists])

  const [hidden, setHidden] = useState<Set<number>>(new Set())

  const { chartData, chartConfig } = useMemo(() => {
    const config: ChartConfig = {}
    analysis.products.forEach((p, idx) => {
      config[keyFor(p.name, idx)] = { label: p.name, color: PALETTE[idx % PALETTE.length] }
    })
    const data = analysis.months.map((m) => {
      const row: Record<string, string | number> = { month: monthLabel(m) }
      analysis.products.forEach((p, idx) => {
        row[keyFor(p.name, idx)] = p.pricesByMonth[m]
      })
      return row
    })
    return { chartData: data, chartConfig: config }
  }, [analysis])

  function toggle(idx: number) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  if (!loaded) {
    return (
      <main className="flex min-h-svh items-center justify-center text-muted-foreground">Carregando…</main>
    )
  }

  const hasData = analysis.products.length > 0

  return (
    <main className="min-h-svh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-5">
          <Button
            render={<Link href="/compras" />}
            nativeButton={false}
            variant="ghost"
            size="icon"
            aria-label="Voltar para listas"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-card-foreground">Comparativo de preços</h1>
            <p className="text-sm text-muted-foreground">
              Produtos comprados todos os meses e a evolução dos seus preços
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        {!hasData ? (
          <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Ainda não há produtos recorrentes para comparar.
            </p>
            <p className="mx-auto mt-1 max-w-md text-pretty text-xs text-muted-foreground">
              O comparativo mostra apenas produtos comprados em <strong>todos os meses</strong> com listas, ao longo do
              último ano. Crie listas em meses diferentes com os mesmos produtos para ver a evolução de preços.
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Evolução de preço unitário (R$)
              </h2>
              <ChartContainer config={chartConfig} className="h-[360px] w-full">
                <LineChart data={chartData} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    width={56}
                    tickFormatter={(v) => formatBRL(Number(v))}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {analysis.products.map((p, idx) =>
                    hidden.has(idx) ? null : (
                      <Line
                        key={idx}
                        type="monotone"
                        dataKey={keyFor(p.name, idx)}
                        stroke={`var(--color-${keyFor(p.name, idx)})`}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ),
                  )}
                </LineChart>
              </ChartContainer>

              <div className="mt-4 flex flex-wrap gap-2">
                {analysis.products.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggle(idx)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                      hidden.has(idx)
                        ? "border-border bg-transparent text-muted-foreground line-through"
                        : "border-transparent bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                    />
                    {p.name}
                  </button>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <h2 className="border-b border-border p-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Resumo dos produtos recorrentes
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-3 font-medium">Produto</th>
                      <th className="p-3 font-medium">Menor preço</th>
                      <th className="p-3 font-medium">Maior preço</th>
                      <th className="p-3 text-right font-medium">Variação no período</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.products.map((p, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-3 font-medium text-card-foreground">{p.name}</td>
                        <td className="p-3 font-mono text-muted-foreground">{formatBRL(p.minPrice)}</td>
                        <td className="p-3 font-mono text-muted-foreground">{formatBRL(p.maxPrice)}</td>
                        <td className="p-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-mono font-semibold ${
                              p.variation > 0
                                ? "text-destructive"
                                : p.variation < 0
                                  ? "text-primary"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {p.variation > 0 ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : p.variation < 0 ? (
                              <TrendingDown className="h-3.5 w-3.5" />
                            ) : null}
                            {p.variation > 0 ? "+" : ""}
                            {p.variation}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
