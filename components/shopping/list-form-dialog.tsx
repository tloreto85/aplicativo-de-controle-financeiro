"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ShoppingList } from "@/lib/shopping-types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: ShoppingList | null
  onSubmit: (data: { name: string; date: string; store: string }) => void
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function ListFormDialog({ open, onOpenChange, editing, onSubmit }: Props) {
  const [name, setName] = useState("")
  const [date, setDate] = useState(todayISO())
  const [store, setStore] = useState("")

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "")
      setDate(editing?.date ?? todayISO())
      setStore(editing?.store ?? "")
    }
  }, [open, editing])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name, date, store })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar lista" : "Nova lista de compras"}</DialogTitle>
            <DialogDescription>
              Defina os dados da lista. Você pode adicionar os produtos depois.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="list-name">Nome da lista</Label>
              <Input
                id="list-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Compras do mês"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="list-date">Data</Label>
                <Input id="list-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="list-store">Estabelecimento</Label>
                <Input
                  id="list-store"
                  value={store}
                  onChange={(e) => setStore(e.target.value)}
                  placeholder="Ex: Supermercado X"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Salvar" : "Criar lista"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
