"use client"

import { useState } from "react"
import { Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Props {
  onClear: () => void
}

export function ClearDataDialog({ onClear }: Props) {
  const [open, setOpen] = useState(false)

  function handleConfirm() {
    onClear()
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        Limpar dados
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Limpar todos os dados?</DialogTitle>
            <DialogDescription>
              Esta ação remove todas as categorias, despesas e receitas cadastradas. As metas
              voltam ao padrão. Não é possível desfazer.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Dica: se quiser guardar um histórico, exporte o CSV antes de limpar.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              <Trash2 className="h-4 w-4" />
              Limpar tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
