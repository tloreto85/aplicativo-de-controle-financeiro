"use client"

import { useMemo } from "react"
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts"
import type { Debt } from "@/lib/debt-types"
import { monthlyImpact, remainingAmount, paidAmount, openInstallments } from "@/lib/debt-types"
import { formatBRL } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"

interface Props {
  debts: Debt[]
  monthlyIncome: number
}

const BAR_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

export function BudgetImpact({ debts, monthlyIncome }: Props) {
  const totalMonthly = useMemo(() => debts.reduce((s, d) => s + monthlyImpact(d), 0), [debts])
  const totalRemaining = useMemo(() => debts.reduce((s, d) => s + remainingAmount(d), 0), [debts])
  const totalPaid = useMemo(() => debts.reduce((s, d) => s + paidAmount(d), 0), [debts])

  // Per-debt monthly commitment (only active debts contribute to the chart).
  const chartData = useMemo(
    () =>
      debts
        .map((d, i) => {
          const value = monthlyImpact(d)
          const open = openInstallments(d)
          return {
            name: d.creditor,
            value,
            open,
            // Right-side label combines the monthly value and how many installments remain.
            label: `${formatBRL(value)} · ${open} ${open === 1 ? "parcela" : "parcelas"} em aberto`,
            color: BAR_COLORS[i % BAR_COLORS.length],
          }
        })
        .filter((d) => d.value > 0),
    [debts],
  )

  // Y-axis width adapts to the longest creditor name so every label fits.
  const yAxisWidth = useMemo(() => {
    const longest = chartData.reduce((max, d) => Math.max(max, d.name.length), 0)
    return Math.min(Math.max(longest * 7 + 16, 90), 200)
  }, [chartData])

  // Right margin adapts to the longest label so "valor · N parcelas em aberto" fits.
  const rightMargin = useMemo(() => {
    const longest = chartData.reduce((max, d) => Math.max(max, d.label.length), 0)
    return Math.min(Math.max(longest * 6 + 16, 80), 240)
  }, [chartData])

  // Height grows with the number of debts so every bar/creditor is visible.
  const chartHeight = useMemo(() => Math.max(chartData.length * 44 + 24, 120), [chartData])

  const pctOfIncome = monthlyIncome > 0 ? (totalMonthly / monthlyIncome) * 100 : 0

  // Status of the monthly commitment relative to income.
  const status =
    pctOfIncome > 50 ? "Alto" : pctOfIncome > 30 ? "Moderado" : "Saudável"
  const statusColor =
    pctOfIncome > 50 ? "text-destructive" : pctOfIncome > 30 ? "text-chart-3" : "text-primary"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Impacto no orçamento mensal
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Comprometimento mensal</p>
            <p className="font-mono text-lg font-bold text-card-foreground">{formatBRL(totalMonthly)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Saldo devedor total</p>
            <p className="font-mono text-lg font-bold text-card-foreground">{formatBRL(totalRemaining)}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total já pago</p>
            <p className="font-mono text-lg font-bold text-primary">{formatBRL(totalPaid)}</p>
          </div>
        </div>

        {monthlyIncome > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Parcelas mensais vs. renda ({formatBRL(monthlyIncome)})
              </span>
              <span className={`font-semibold ${statusColor}`}>
                {Math.round(pctOfIncome)}% · {status}
              </span>
            </div>
            <Progress value={Math.min(pctOfIncome, 100)} className="h-2" />
          </div>
        )}

        {chartData.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Parcela mensal e parcelas em aberto por dívida
            </p>
            <ChartContainer
              config={{ value: { label: "Parcela mensal" } }}
              className="w-full"
              style={{ height: chartHeight }}
            >
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 8, right: rightMargin, top: 4, bottom: 4 }}
                barCategoryGap="25%"
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={yAxisWidth}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={{ fontSize: 12, width: yAxisWidth - 8 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel formatter={(value) => formatBRL(Number(value))} />}
                />
                <Bar dataKey="value" radius={4}>
                  {chartData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                  <LabelList
                    dataKey="label"
                    position="right"
                    className="fill-foreground"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
            Nenhuma dívida ativa impactando o orçamento.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
