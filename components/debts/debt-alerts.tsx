"use client"

import { useMemo } from "react"
import Link from "next/link"
import { AlertTriangle, Clock, CheckCircle2, ArrowRight } from "lucide-react"
import { useDebts } from "@/lib/use-debts"
import { debtDueStatus, daysUntil } from "@/lib/debt-types"
import type { Debt } from "@/lib/debt-types"
import { formatDateBR } from "@/lib/format"

function today() {
  return new Date().toISOString().slice(0, 10)
}

export function DebtAlerts() {
  const { debts, loaded } = useDebts()
  const todayIso = today()

  const { overdue, dueSoon } = useMemo(() => {
    const overdue: Debt[] = []
    const dueSoon: Debt[] = []
    for (const d of debts) {
      const status = debtDueStatus(d, todayIso)
      if (status === "overdue") overdue.push(d)
      else if (status === "due-soon") dueSoon.push(d)
    }
    return { overdue, dueSoon }
  }, [debts, todayIso])

  // Avoid hydration mismatch: localStorage is only available on the client.
  if (!loaded || debts.length === 0) return null

  return (
    <div className="mb-8 flex flex-col gap-3" aria-live="polite">
      {overdue.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {overdue.length === 1
                ? "1 dívida em atraso"
                : `${overdue.length} dívidas em atraso`}
            </p>
            <p className="mt-0.5 text-sm text-destructive/90">
              {overdue
                .map((d) => `${d.creditor} (venceu em ${formatDateBR(d.dueDate)})`)
                .join(" · ")}
            </p>
          </div>
        </div>
      )}

      {dueSoon.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-chart-3/40 bg-chart-3/10 px-4 py-3 text-chart-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {dueSoon.length === 1
                ? "1 dívida próxima do vencimento"
                : `${dueSoon.length} dívidas próximas do vencimento`}
            </p>
            <p className="mt-0.5 text-sm">
              {dueSoon
                .map((d) => {
                  const days = daysUntil(todayIso, d.dueDate)
                  const quando = days === 0 ? "vence hoje" : days === 1 ? "vence amanhã" : `faltam ${days} dias`
                  return `${d.creditor} (${quando})`
                })
                .join(" · ")}
            </p>
          </div>
        </div>
      )}

      {overdue.length === 0 && dueSoon.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-primary">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Todas as parcelas estão em dia</p>
            <p className="mt-0.5 text-sm text-primary/90">Nenhuma dívida em atraso ou próxima do vencimento.</p>
          </div>
        </div>
      )}

      {(overdue.length > 0 || dueSoon.length > 0) && (
        <Link
          href="/financeiro/dividas"
          className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline"
        >
          Ver Gestão de Dívidas
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}
