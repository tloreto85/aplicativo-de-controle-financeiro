"use client"

import { useState } from "react"
import { Plus, Tag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Props {
  categories: string[]
  onAdd: (name: string) => void
  onRemove: (name: string) => void
}

export function CategoryManager({ categories, onAdd, onRemove }: Props) {
  const [value, setValue] = useState("")

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    onAdd(value)
    setValue("")
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Tag className="h-4 w-4" />
          Categorias
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar categorias</DialogTitle>
          <DialogDescription>
            Crie categorias para classificar seus produtos. Elas ficam disponíveis em todas as listas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="flex gap-2 py-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nova categoria"
          />
          <Button type="submit">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma categoria criada.</p>
          )}
          {categories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-sm text-secondary-foreground"
            >
              {c}
              <button
                type="button"
                onClick={() => onRemove(c)}
                aria-label={`Remover categoria ${c}`}
                className="rounded-full text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
