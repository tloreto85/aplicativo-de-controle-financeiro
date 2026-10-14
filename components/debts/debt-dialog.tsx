"use client"

import { useEffect, useState } from "react"
import type { Debt } from "@/lib/debt-types"
import { buildInstallments, isIsoDate } from "@/lib/debt-types"
import type { DebtInput } from "@/lib/use-debts"
import { formatBRL, formatDateBR } from "@/lib/format"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Debt | null
  onCreate: (input: DebtInput) => void
  onUpdate: (id: string, patch: Partial<DebtInput>) => void
}

export function DebtDialog({ open, onOpenChange, editing, onCreate, onUpdate }: Props) {
  const [creditor, setCreditor] = useState("")
  const [contract, setContract] = useState("")
  const [dueDay, setDueDay] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [installmentPlan, setInstallmentPlan] = useState(false)
  const [installmentCount, setInstallmentCount] = useState("")
  const [firstDueDate, setFirstDueDate] = useState("")

  useEffect(() => {
    if (open) {
      setCreditor(editing?.creditor ?? "")
      setContract(editing?.contract ?? "")
      setDueDay(editing && editing.dueDay ? String(editing.dueDay) : "")
      setTotalAmount(editing ? String(editing.totalAmount) : "")
      setInstallmentPlan(editing?.installmentPlan ?? false)
      setInstallmentCount(editing && editing.installmentCount ? String(editing.installmentCount) : "")
      setFirstDueDate(editing?.firstDueDate ?? "")
    }
  }, [open, editing])

  const total = Number.parseFloat(totalAmount.replace(",", ".")) || 0
  const count = Number.parseInt(installmentCount, 10) || 0
  const perInstallment = installmentPlan && count > 0 ? total / count : total
  const useFirstDate = installmentPlan && isIsoDate(firstDueDate)
  // Com a 1ª parcela informada, o dia do vencimento passa a ser o dessa data.
  const day = useFirstDate
    ? Number(firstDueDate.split("-")[2])
    : Math.min(Math.max(Number.parseInt(dueDay, 10) || 0, 0), 31)

  const schedule =
    useFirstDate && count > 0 && total > 0
      ? buildInstallments(
          { totalAmount: total, installmentPlan, installmentCount: count, dueDay: day, firstDueDate },
          firstDueDate,
          () => "",
        )
      : []
  const lastDueDate = schedule.at(-1)?.dueDate

  function submit() {
    if (!creditor.trim() || total <= 0) return
    const input: DebtInput = {
      creditor: creditor.trim(),
      contract: contract.trim(),
      dueDay: day,
      totalAmount: total,
      installmentPlan,
      installmentCount: installmentPlan ? count : 0,
      firstDueDate: useFirstDate ? firstDueDate : undefined,
    }
    if (editing) {
      onUpdate(editing.id, input)
    } else {
      onCreate(input)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar dívida" : "Nova dívida"}</DialogTitle>
          <DialogDescription>
            Informe o credor, o valor total e, se aplicável, o parcelamento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="debt-creditor">Credor</Label>
            <Input
              id="debt-creditor"
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              placeholder="Ex: Banco Itaú"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="debt-contract">Contrato ou outras informações</Label>
            <Input
              id="debt-contract"
              value={contract}
              onChange={(e) => setContract(e.target.value)}
              placeholder="Ex: Empréstimo pessoal nº 12345"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="debt-total">Valor total (R$)</Label>
              <Input
                id="debt-total"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0,00"
                inputMode="decimal"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="debt-due">Dia do vencimento</Label>
              <Input
                id="debt-due"
                value={useFirstDate ? String(day) : dueDay}
                onChange={(e) => setDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="Ex: 10"
                inputMode="numeric"
                disabled={useFirstDate}
                aria-describedby={useFirstDate ? "debt-due-hint" : undefined}
              />
              {useFirstDate && (
                <p id="debt-due-hint" className="text-xs text-muted-foreground">
                  Definido pela 1ª parcela
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="debt-plan">Parcelamento</Label>
              <Select
                value={installmentPlan ? "sim" : "nao"}
                onValueChange={(v) => setInstallmentPlan(v === "sim")}
              >
                <SelectTrigger id="debt-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não (à vista)</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {installmentPlan && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="debt-count">Qtd. de parcelas</Label>
                <Input
                  id="debt-count"
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(e.target.value)}
                  placeholder="Ex: 12"
                  inputMode="numeric"
                />
              </div>
            )}
          </div>

          {installmentPlan && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="debt-first-due">Vencimento da 1ª parcela</Label>
              <Input
                id="debt-first-due"
                type="date"
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
                aria-describedby="debt-first-due-hint"
              />
              <p id="debt-first-due-hint" className="text-xs text-muted-foreground">
                As demais parcelas vencem mês a mês, no mesmo dia. Se não informar, o cronograma
                começa no mês atual.
              </p>
            </div>
          )}

          {installmentPlan && count > 0 && total > 0 && (
            <div className="flex flex-col gap-1 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
              <div className="flex items-center justify-between">
                <span>Valor de cada parcela</span>
                <span className="font-mono font-semibold">
                  {count}x de {formatBRL(perInstallment)}
                </span>
              </div>
              {useFirstDate && lastDueDate && (
                <div className="flex items-center justify-between">
                  <span>Período</span>
                  <span className="font-mono">
                    {formatDateBR(firstDueDate)} a {formatDateBR(lastDueDate)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>{editing ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
