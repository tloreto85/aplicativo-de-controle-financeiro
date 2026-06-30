"use client"

import { useEffect, useState } from "react"
import type { Debt } from "@/lib/debt-types"
import type { DebtInput } from "@/lib/use-debts"
import { formatBRL } from "@/lib/format"
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
  const [dueDate, setDueDate] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [installmentPlan, setInstallmentPlan] = useState(false)
  const [installmentCount, setInstallmentCount] = useState("")

  useEffect(() => {
    if (open) {
      setCreditor(editing?.creditor ?? "")
      setContract(editing?.contract ?? "")
      setDueDate(editing?.dueDate ?? "")
      setTotalAmount(editing ? String(editing.totalAmount) : "")
      setInstallmentPlan(editing?.installmentPlan ?? false)
      setInstallmentCount(editing && editing.installmentCount ? String(editing.installmentCount) : "")
    }
  }, [open, editing])

  const total = Number.parseFloat(totalAmount.replace(",", ".")) || 0
  const count = Number.parseInt(installmentCount, 10) || 0
  const perInstallment = installmentPlan && count > 0 ? total / count : total

  function submit() {
    if (!creditor.trim() || total <= 0) return
    const input: DebtInput = {
      creditor: creditor.trim(),
      contract: contract.trim(),
      dueDate,
      totalAmount: total,
      installmentPlan,
      installmentCount: installmentPlan ? count : 0,
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
              <Label htmlFor="debt-due">Data de vencimento</Label>
              <Input
                id="debt-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
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

          {installmentPlan && count > 0 && total > 0 && (
            <div className="flex items-center justify-between rounded-md bg-accent px-3 py-2 text-sm">
              <span className="text-accent-foreground">Valor de cada parcela</span>
              <span className="font-mono font-semibold text-accent-foreground">
                {count}x de {formatBRL(perInstallment)}
              </span>
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
