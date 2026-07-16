"use client"

import { useCallback, useEffect, useState } from "react"
import type { Debt, Installment } from "./debt-types"
import { buildInstallments, effectiveCount } from "./debt-types"

const STORAGE_KEY = "gestao-dividas-v1"

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

// Fields the user provides when creating/editing a debt (computed/derived fields excluded).
export type DebtInput = Pick<
  Debt,
  "creditor" | "contract" | "dueDay" | "totalAmount" | "installmentPlan" | "installmentCount"
>

// Cria uma dívida completa (com cronograma de parcelas) a partir do input.
function buildDebt(input: DebtInput, start: string): Debt {
  return {
    ...input,
    id: uid(),
    installments: buildInstallments(input, start, uid),
  }
}

// Ao editar, regenera o cronograma preservando o estado "paga" das parcelas
// que continuam existindo (comparadas pelo número da parcela).
function rebuildInstallments(existing: Debt, patch: Partial<DebtInput>, start: string): Installment[] {
  const merged = { ...existing, ...patch }
  const paidNumbers = new Set(existing.installments.filter((i) => i.paid).map((i) => i.number))
  const paidDates = new Map(existing.installments.map((i) => [i.number, i.paidDate]))
  const fresh = buildInstallments(merged, start, uid)
  return fresh.map((i) =>
    paidNumbers.has(i.number)
      ? { ...i, paid: true, paidDate: paidDates.get(i.number) ?? start }
      : i,
  )
}

const seedInput: DebtInput[] = [
  {
    creditor: "Banco Itaú",
    contract: "Empréstimo pessoal nº 12345",
    dueDay: 5,
    totalAmount: 12000,
    installmentPlan: true,
    installmentCount: 24,
  },
  {
    creditor: "Loja Mais",
    contract: "Cartão - compra de eletrodoméstico",
    dueDay: 10,
    totalAmount: 2400,
    installmentPlan: true,
    installmentCount: 12,
  },
]

function makeSeed(): Debt[] {
  const start = todayIso()
  return seedInput.map((input) => {
    const debt = buildDebt(input, start)
    // Marca as duas primeiras parcelas como pagas apenas no exemplo inicial.
    debt.installments = debt.installments.map((i) =>
      i.number <= 2 ? { ...i, paid: true, paidDate: i.dueDate } : i,
    )
    return debt
  })
}

// Migra dados antigos (modelo de `payments` livres) para o novo modelo de
// parcelas: reconstrói o cronograma e marca como pagas as primeiras parcelas
// até cobrir o total que já havia sido pago.
function migrateLegacyDebt(raw: unknown, start: string): Debt {
  const d = raw as Debt & {
    dueDate?: string
    payments?: { amount: number; date?: string }[]
    installments?: Installment[]
  }

  const legacyDay = d.dueDate ? Number(d.dueDate.split("-")[2]) : 0
  const dueDay = d.dueDay ?? (Number.isFinite(legacyDay) ? legacyDay : 0)

  const base: DebtInput = {
    creditor: d.creditor ?? "",
    contract: d.contract ?? "",
    dueDay: dueDay || 0,
    totalAmount: d.totalAmount ?? 0,
    installmentPlan: d.installmentPlan ?? false,
    installmentCount: d.installmentCount ?? 0,
  }

  // Já está no novo modelo: só garante o array.
  if (Array.isArray(d.installments)) {
    return { ...base, id: d.id ?? uid(), installments: d.installments }
  }

  // Modelo antigo: converte pagamentos em parcelas pagas.
  const installments = buildInstallments(base, start, uid)
  const paidTotal = (d.payments ?? []).reduce((sum, p) => sum + (p.amount || 0), 0)

  let acc = 0
  const n = effectiveCount(base.installmentPlan, base.installmentCount)
  const per = n > 0 ? base.totalAmount / n : base.totalAmount
  const migrated = installments.map((i) => {
    // Marca como paga enquanto o total pago cobrir (com folga de 1 centavo) a parcela.
    if (acc + per <= paidTotal + 0.01 && paidTotal > 0) {
      acc += per
      return { ...i, paid: true, paidDate: i.dueDate }
    }
    return i
  })

  return { ...base, id: d.id ?? uid(), installments: migrated }
}

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>(makeSeed)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown[]
        const start = todayIso()
        setDebts((parsed ?? []).map((d) => migrateLegacyDebt(d, start)))
      }
    } catch {
      // ignore malformed data
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(debts))
  }, [debts, loaded])

  const addDebt = useCallback((input: DebtInput) => {
    setDebts((list) => [...list, buildDebt(input, todayIso())])
  }, [])

  const updateDebt = useCallback((id: string, patch: Partial<DebtInput>) => {
    setDebts((list) =>
      list.map((d) =>
        d.id === id
          ? { ...d, ...patch, installments: rebuildInstallments(d, patch, todayIso()) }
          : d,
      ),
    )
  }, [])

  const removeDebt = useCallback((id: string) => {
    setDebts((list) => list.filter((d) => d.id !== id))
  }, [])

  // Alterna o estado "paga" de uma parcela; ao marcar, registra a data de hoje.
  const toggleInstallment = useCallback((debtId: string, installmentId: string) => {
    setDebts((list) =>
      list.map((d) =>
        d.id === debtId
          ? {
              ...d,
              installments: d.installments.map((i) =>
                i.id === installmentId
                  ? { ...i, paid: !i.paid, paidDate: !i.paid ? todayIso() : undefined }
                  : i,
              ),
            }
          : d,
      ),
    )
  }, [])

  return { debts, loaded, addDebt, updateDebt, removeDebt, toggleInstallment }
}
