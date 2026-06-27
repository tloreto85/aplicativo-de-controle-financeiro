"use client"

import { useMemo } from "react"
import { Cell, Pie, PieChart } from "recharts"
import type { Category } from "@/lib/types"
import { formatBRL } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface Props {
  categories: Category[]
}

export function DistributionChart({ categories }: Props) {
  const data = useMemo(() => {
    return categories
      .map((c) => ({
        name: c.name,
        value: c.expenses.reduce((s, e) => s + e.amount, 0),
        color: c.color,
      }))
      .filter((d) => d.value > 0)
  }, [categories])

  const total = data.reduce((s, d) => s + d.value, 0)

  const chartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {}
    data.forEach((d) => {
      cfg[d.name] = { label: d.name, color: d.color }
    })
    return cfg
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Distribuição das despesas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            Sem despesas para exibir.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ChartContainer config={chartConfig} className="aspect-square h-[220px]">
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel formatter={(value) => formatBRL(Number(value))} />}
                />
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} strokeWidth={2}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex w-full flex-col gap-2">
              {data.map((d) => (
                <div key={d.name} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-card-foreground">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-card-foreground">{formatBRL(d.value)}</span>
                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                      {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
