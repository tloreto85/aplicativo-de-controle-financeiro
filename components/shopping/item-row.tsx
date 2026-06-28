"use client"

import { useState } from "react"
import { Check, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { itemTotal, type ShoppingItem } from "@/lib/shopping-types"
import { formatBRL } from "@/lib/format"

interface Props {
  item: ShoppingItem
  categories: string[]
  onUpdate: (item: ShoppingItem) => void
  onRemove: (id: string) => void
}

export function ItemRow({ item, categories, onUpdate, onRemove }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item)

  function save() {
    onUpdate({
      ...draft,
      name: draft.name.trim() || item.name,
      quantity: Number(draft.quantity) || 0,
      price: Number(draft.price) || 0,
    })
    setEditing(false)
  }

  function cancel() {
    setDraft(item)
    setEditing(false)
  }

  if (editing) {
    return (
      <tr className="border-b border-border bg-accent/40">
        <td className="p-2">
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="h-8"
          />
        </td>
        <td className="p-2">
          <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="p-2">
          <Input
            type="number"
            min="0"
            value={String(draft.quantity)}
            onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })}
            className="h-8 w-20"
          />
        </td>
        <td className="p-2">
          <Input
            inputMode="decimal"
            value={String(draft.price)}
            onChange={(e) => setDraft({ ...draft, price: Number(e.target.value.replace(",", ".")) || 0 })}
            className="h-8 w-24"
          />
        </td>
        <td className="p-2 text-right font-mono text-sm">{formatBRL(itemTotal(draft))}</td>
        <td className="p-2">
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={save} aria-label="Salvar">
              <Check className="h-4 w-4 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancel} aria-label="Cancelar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40">
      <td className="p-3 font-medium text-card-foreground">{item.name}</td>
      <td className="p-3">
        <span className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {item.category}
        </span>
      </td>
      <td className="p-3 text-sm text-muted-foreground">{item.quantity}</td>
      <td className="p-3 font-mono text-sm text-muted-foreground">{formatBRL(item.price)}</td>
      <td className="p-3 text-right font-mono text-sm font-semibold">{formatBRL(itemTotal(item))}</td>
      <td className="p-3">
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              setDraft(item)
              setEditing(true)
            }}
            aria-label={`Editar ${item.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.id)}
            aria-label={`Remover ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
