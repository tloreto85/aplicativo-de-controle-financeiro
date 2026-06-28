"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ShoppingItem } from "@/lib/shopping-types"

interface Props {
  categories: string[]
  onAdd: (item: Omit<ShoppingItem, "id">) => void
}

export function AddItemForm({ categories, onAdd }: Props) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState(categories[0] ?? "Outros")
  const [quantity, setQuantity] = useState("1")
  const [price, setPrice] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      category: category || "Outros",
      quantity: Number(quantity) || 1,
      price: Number(price.replace(",", ".")) || 0,
    })
    setName("")
    setQuantity("1")
    setPrice("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid items-end gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-[2fr_1.3fr_0.7fr_1fr_auto]"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="item-name" className="text-xs">
          Produto
        </Label>
        <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Arroz 5kg" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="item-cat" className="text-xs">
          Categoria
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="item-cat">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="item-qty" className="text-xs">
          Qtd
        </Label>
        <Input
          id="item-qty"
          type="number"
          min="0"
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="item-price" className="text-xs">
          Preço un. (R$)
        </Label>
        <Input
          id="item-price"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0,00"
        />
      </div>
      <Button type="submit">
        <Plus className="h-4 w-4" />
        Adicionar
      </Button>
    </form>
  )
}
