"use client"

import { useCallback, useEffect, useState } from "react"
import type { Debt, DebtPayment } from "./debt-types"

const STORAGE_KEY = "gestao-dividas-v1"

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Fields the user provides when creating/editing a debt (computed/derived fields excluded).
export type DebtInput = Pick<
  Debt,
  "creditor" | "contract" | "dueDate" | "totalAmount" | "installmentPlan" | "installmentCount"
>

const seedDebts: Debt[] = [
  {
    id: uid(),
    creditor: "Banco Itaú",
    contract: "Empréstimo pessoal nº 12345",
    dueDate: "2026-08-05",
    totalAmount: 12000,
    installmentPlan: true,
    installmentCount: 24,
    payments: [
      { id: uid(), amount: 500, date: "2026-06-05", note: "Parcela 1" },
      { id: uid(), amount: 500, date: "2026-07-05", note: "Parcela 2" },
    ],
  },
  {
    id: uid(),
    creditor: "Loja Mais",
    contract: "Cartão - compra de eletrodoméstico",
    dueDate: "2026-08-10",
    totalAmount: 2400,
    installmentPlan: true,
    installmentCount: 12,
    payments: [{ id: uid(), amount: 200, date: "2026-07-10", note: "Entrada" }],
  },
]

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>(seedDebts)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Debt[]
        // Normalize: ensure arrays/fields exist on older data.
        setDebts(
          (parsed ?? []).map((d) => ({
            ...d,
            dueDate: d.dueDate ?? "",
            payments: (d.payments ?? []).map((p) => ({ ...p, note: p.note ?? "" })),
          })),
        )
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
    setDebts((list) => [...list, { ...input, id: uid(), payments: [] }])
  }, [])

  const updateDebt = useCallback((id: string, patch: Partial<DebtInput>) => {
    setDebts((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }, [])

  const removeDebt = useCallback((id: string) => {
    setDebts((list) => list.filter((d) => d.id !== id))
  }, [])

  const addPayment = useCallback((debtId: string, payment: Omit<DebtPayment, "id">) => {
    setDebts((list) =>
      list.map((d) =>
        d.id === debtId ? { ...d, payments: [...d.payments, { ...payment, id: uid() }] } : d,
      ),
    )
  }, [])

  const removePayment = useCallback((debtId: string, paymentId: string) => {
    setDebts((list) =>
      list.map((d) =>
        d.id === debtId ? { ...d, payments: d.payments.filter((p) => p.id !== paymentId) } : d,
      ),
    )
  }, [])

  return { debts, loaded, addDebt, updateDebt, removeDebt, addPayment, removePayment }
}
