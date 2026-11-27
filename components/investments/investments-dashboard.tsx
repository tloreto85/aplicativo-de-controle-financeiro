"use client"

import { useMemo, useState } from "react"
import { Activity, ArrowDownToLine, ArrowUpRight, CalendarDays, CircleDollarSign, Plus, Target, Wallet } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { formatBRL, formatDateBR } from "@/lib/format"
import { investmentTotal } from "@/lib/investment-types"
import type { Investment, InvestmentInput } from "@/lib/investment-types"
import { useInvestments } from "@/lib/use-investments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function InvestmentDialog({ open, onOpenChange, onCreate }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: InvestmentInput & { initialContributionDate: string; initialContributionAmount: number }) => void
}) {
  const [name, setName] = useState("")
  const [objective, setObjective] = useState("")
  const [target, setTarget] = useState("")
  const [monthly, setMonthly] = useState("")
  const [firstDate, setFirstDate] = useState(todayIso())
  const [firstAmount, setFirstAmount] = useState("")

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const targetAmount = Number(target.replace(",", "."))
    const monthlyContribution = Number(monthly.replace(",", ".")) || 0
    const initialContributionAmount = Number(firstAmount.replace(",", ".")) || 0
    if (!name.trim() || !objective.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !Number.isFinite(monthlyContribution) || monthlyContribution < 0 || !Number.isFinite(initialContributionAmount) || initialContributionAmount < 0) return
    onCreate({
      name: name.trim(), objective: objective.trim(), targetAmount,
      monthlyContribution, active: true, initialContributionDate: firstDate,
      initialContributionAmount,
    })
    setName("")
    setObjective("")
    setTarget("")
    setMonthly("")
    setFirstAmount("")
    setFirstDate(todayIso())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo investimento</DialogTitle>
          <DialogDescription>Defina o ativo, o objetivo e a meta. O primeiro aporte pode ser registrado agora ou depois.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="investment-name">Ativo ou tipo de investimento</Label>
            <Input id="investment-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Renda Fixa" required maxLength={80} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="investment-objective">Objetivo vinculado</Label>
            <Input id="investment-objective" value={objective} onChange={(event) => setObjective(event.target.value)} placeholder="Ex.: Reserva de Emergência" required maxLength={100} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="investment-target">Meta de valor (R$)</Label>
              <Input id="investment-target" inputMode="decimal" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="0,00" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="investment-monthly">Aporte mensal planejado (R$)</Label>
              <Input id="investment-monthly" inputMode="decimal" value={monthly} onChange={(event) => setMonthly(event.target.value)} placeholder="0,00" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="investment-first-date">Data do primeiro aporte</Label>
              <Input id="investment-first-date" type="date" value={firstDate} onChange={(event) => setFirstDate(event.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="investment-first-amount">Valor do primeiro aporte (R$)</Label>
              <Input id="investment-first-amount" inputMode="decimal" value={firstAmount} onChange={(event) => setFirstAmount(event.target.value)} placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Criar investimento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ContributionDialog({ investment, onOpenChange, onSave }: {
  investment: Investment | null
  onOpenChange: (open: boolean) => void
  onSave: (id: string, contribution: { date: string; amount: number; note?: string }) => void
}) {
  const [date, setDate] = useState(todayIso())
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount.replace(",", "."))
    if (!investment || !date || parsedAmount <= 0) return
    onSave(investment.id, { date, amount: parsedAmount, note: note.trim() || undefined })
    setDate(todayIso())
    setAmount("")
    setNote("")
    onOpenChange(false)
  }

  return (
    <Dialog open={!!investment} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar aporte</DialogTitle>
          <DialogDescription>{investment ? `${investment.name} · ${investment.objective}` : "Registre um aporte neste investimento."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="contribution-date">Data do aporte</Label>
            <Input id="contribution-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contribution-amount">Valor investido (R$)</Label>
            <Input id="contribution-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contribution-note">Observação (opcional)</Label>
            <Input id="contribution-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={100} placeholder="Ex.: aporte mensal de novembro" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar aporte</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function InvestmentCard({ investment, onAddContribution, onToggleActive }: {
  investment: Investment
  onAddContribution: (investment: Investment) => void
  onToggleActive: (id: string) => void
}) {
  const total = investmentTotal(investment)
  const progress = investment.targetAmount > 0 ? Math.min((total / investment.targetAmount) * 100, 100) : 0
  const contributions = [...investment.contributions].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CardTitle className="text-lg">{investment.name}</CardTitle>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">{investment.active ? "Ativo" : "Inativo"}</span>
          </div>
          <CardDescription>Objetivo: {investment.objective}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => onToggleActive(investment.id)}>{investment.active ? "Pausar" : "Reativar"}</Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Montante guardado</p>
            <p className="text-2xl font-semibold tabular-nums">{formatBRL(total)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Meta</p>
            <p className="font-medium tabular-nums">{formatBRL(investment.targetAmount)}</p>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="flex justify-between text-xs text-muted-foreground"><span>Progresso da meta</span><span>{Math.round(progress)}%</span></div>
          <Progress value={progress} aria-label={`Progresso da meta: ${Math.round(progress)}%`} />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Aporte mensal planejado</span>
          <span className="font-medium tabular-nums">{formatBRL(investment.monthlyContribution)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium">Histórico de aportes</h3>
          {investment.active && <Button size="sm" variant="outline" onClick={() => onAddContribution(investment)}><Plus data-icon="inline-start" />Aporte</Button>}
        </div>
        {contributions.length ? (
          <ul className="flex flex-col divide-y divide-border">
            {contributions.slice(0, 4).map((contribution) => (
              <li key={contribution.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0"><p>{formatDateBR(contribution.date)}</p>{contribution.note && <p className="truncate text-xs text-muted-foreground">{contribution.note}</p>}</div>
                <span className="shrink-0 font-medium tabular-nums">{formatBRL(contribution.amount)}</span>
              </li>
            ))}
            {contributions.length > 4 && <li className="pt-2 text-xs text-muted-foreground">+ {contributions.length - 4} aportes anteriores</li>}
          </ul>
        ) : <p className="text-sm text-muted-foreground">Nenhum aporte registrado ainda.</p>}
      </CardContent>
    </Card>
  )
}

export function InvestmentsDashboard() {
  const data = useInvestments()
  const [createOpen, setCreateOpen] = useState(false)
  const [contributionInvestment, setContributionInvestment] = useState<Investment | null>(null)
  const chartData = useMemo(() => {
    const totals = new Map<string, number>()
    data.investments.forEach((investment) => {
      totals.set(investment.objective, (totals.get(investment.objective) ?? 0) + investmentTotal(investment))
    })
    return [...totals.entries()].map(([objective, total]) => ({ objective, total })).sort((a, b) => b.total - a.total)
  }, [data.investments])

  function createInvestment(input: InvestmentInput & { initialContributionDate: string; initialContributionAmount: number }) {
    const { initialContributionDate, initialContributionAmount, ...investmentInput } = input
    const investmentId = data.createInvestment(investmentInput)
    if (initialContributionAmount > 0) {
      data.addContribution(investmentId, { date: initialContributionDate, amount: initialContributionAmount })
    }
  }

  if (!data.loaded) return <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4"><p className="text-sm text-muted-foreground">Carregando seus investimentos…</p></main>

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><Activity className="size-4" aria-hidden="true" />Acompanhamento e histórico</p>
          <h1 className="text-3xl font-semibold tracking-tight">Investimentos</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Organize seus ativos por objetivo, acompanhe os aportes e veja a evolução das metas.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus data-icon="inline-start" />Novo investimento</Button>
      </header>

      <section aria-label="Resumo dos investimentos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Wallet} label="Montante guardado" value={formatBRL(data.total)} detail={`${data.investments.length} ${data.investments.length === 1 ? "objetivo" : "objetivos"}`} />
        <SummaryCard icon={Target} label="Investimentos ativos" value={String(data.activeInvestments.length)} detail="Aportes planejados" />
        <SummaryCard icon={CalendarDays} label="Planejado por mês" value={formatBRL(data.monthly)} detail="Soma dos aportes mensais ativos" />
        <SummaryCard icon={ArrowDownToLine} label="Aportado neste mês" value={formatBRL(data.contributedThisMonth)} detail="Com base no histórico registrado" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Valores por objetivo</CardTitle>
            <CardDescription>Montante acumulado em cada finalidade cadastrada.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length ? (
              <ChartContainer config={{ total: { label: "Investido", color: "var(--chart-1)" } }} className="h-[280px] w-full">
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => formatBRL(Number(value))} />
                  <YAxis type="category" dataKey="objective" width={125} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatBRL(Number(value))} />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
                <Target className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
                <p className="font-medium">Seu gráfico começa com o primeiro aporte</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Cadastre um investimento e registre valores para comparar os objetivos.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sobre o acompanhamento</CardTitle>
            <CardDescription>Uma visão clara do que foi planejado e do que já foi investido.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <InfoRow icon={CircleDollarSign} title="Histórico manual" description="Cada aporte é registrado com data, valor e observação opcional." />
            <InfoRow icon={ArrowUpRight} title="Meta por finalidade" description="Acompanhe o progresso de cada objetivo separadamente." />
            <InfoRow icon={Activity} title="Planejado x realizado" description="O aporte mensal é uma referência; só os valores lançados entram no montante." />
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold">Meus objetivos</h2><p className="mt-1 text-sm text-muted-foreground">Ativos e pausados, com meta e histórico de aportes.</p></div></div>
        {data.investments.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {[...data.investments].sort((a, b) => Number(b.active) - Number(a.active)).map((investment) => (
              <InvestmentCard key={investment.id} investment={investment} onAddContribution={setContributionInvestment} onToggleActive={data.toggleActive} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-12 text-center">
            <Target className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <h3 className="font-medium">Nenhum investimento cadastrado</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">Crie seu primeiro objetivo e comece a registrar os aportes feitos.</p>
            <Button className="mt-5" onClick={() => setCreateOpen(true)}><Plus data-icon="inline-start" />Cadastrar investimento</Button>
          </div>
        )}
      </section>

      <InvestmentDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={createInvestment} />
      <ContributionDialog investment={contributionInvestment} onOpenChange={(open) => !open && setContributionInvestment(null)} onSave={data.addContribution} />
    </main>
  )
}

function SummaryCard({ icon: Icon, label, value, detail }: { icon: typeof Wallet; label: string; value: string; detail: string }) {
  return <Card><CardContent className="flex items-start gap-4 pt-6"><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="size-5" aria-hidden="true" /></div><div className="min-w-0"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 truncate text-xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>
}

function InfoRow({ icon: Icon, title, description }: { icon: typeof Wallet; title: string; description: string }) {
  return <div className="flex gap-3"><div className="mt-0.5 rounded-md bg-muted p-2"><Icon className="size-4 text-primary" aria-hidden="true" /></div><div><p className="font-medium">{title}</p><p className="mt-1 text-muted-foreground">{description}</p></div></div>
}
