"use client"

import { useCallback } from "react"
import type { Debt, Installment } from "./debt-types"
import { buildInstallments, effectiveCount } from "./debt-types"
import { loadAppData } from "@/app/actions/app-data"
import { usePersistedState } from "./use-persisted-state"
import { useYear } from "./year-context"

const LEGACY_STORAGE_KEY = "gestao-dividas-v1"

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

// Fields the user provides when creating/editing a debt (computed/derived fields excluded).
export type DebtInput = Pick<
  Debt,
  | "creditor"
  | "contract"
  | "dueDay"
  | "totalAmount"
  | "installmentPlan"
  | "installmentCount"
  | "firstDueDate"
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
  // Sem 1ª parcela informada, mantém o mês de início do cronograma existente
  // em vez de reiniciá-lo no mês atual.
  const firstExisting = existing.installments.find((i) => i.number === 1)?.dueDate
  const fresh = buildInstallments(merged, firstExisting ?? start, uid)
  return fresh.map((i) =>
    paidNumbers.has(i.number)
      ? { ...i, paid: true, paidDate: paidDates.get(i.number) ?? start }
      : i,
  )
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
    firstDueDate: d.firstDueDate,
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

function restoreDebts(raw: unknown): Debt[] {
  const start = todayIso()
  return (Array.isArray(raw) ? raw : []).map((d) => migrateLegacyDebt(d, start))
}

// Ano novo: leva as dívidas do ano anterior que ainda têm parcelas em aberto.
async function createDebts(year: number): Promise<Debt[]> {
  try {
    const prev = await loadAppData(`debts:${year - 1}`)
    if (prev.found) return restoreDebts(prev.data).filter((d) => d.installments.some((i) => !i.paid))
  } catch {
    // sem base anterior acessível
  }
  return []
}

// Importa as dívidas salvas no navegador (antes do banco) para o ano atual.
function legacyDebts(year: number): Debt[] | null {
  if (year !== new Date().getFullYear()) return null
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    return raw ? restoreDebts(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

const EMPTY: Debt[] = []

export function useDebts() {
  const { year } = useYear()
  const [persisted, setDebts, loaded] = usePersistedState<Debt[]>(year ? `debts:${year}` : null, {
    restore: restoreDebts,
    create: () => createDebts(year as number),
    legacy: () => legacyDebts(year as number),
  })
  const debts = persisted ?? EMPTY

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
