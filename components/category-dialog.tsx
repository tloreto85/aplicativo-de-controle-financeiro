"use client"

import { useEffect, useState } from "react"
import type { Bucket, Category } from "@/lib/types"
import { ACCENT_COLORS, BUCKET_LABELS } from "@/lib/types"
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
  editing: Category | null
  onCreate: (name: string, color: string, bucket: Bucket) => void
  onUpdate: (id: string, patch: { name: string; color: string; bucket: Bucket }) => void
}

const BUCKETS: Bucket[] = ["essenciais", "dividas", "pessoal", "investimentos"]

export function CategoryDialog({ open, onOpenChange, editing, onCreate, onUpdate }: Props) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(ACCENT_COLORS[0])
  const [bucket, setBucket] = useState<Bucket>("essenciais")

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "")
      setColor(editing?.color ?? ACCENT_COLORS[0])
      setBucket(editing?.bucket ?? "essenciais")
    }
  }, [open, editing])

  function submit() {
    if (!name.trim()) return
    if (editing) {
      onUpdate(editing.id, { name: name.trim(), color, bucket })
    } else {
      onCreate(name.trim(), color, bucket)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            Defina o nome, a cor e a qual grupo da regra 50-30-20 esta categoria pertence.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cat-name">Nome</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alimentação"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cat-bucket">Grupo (50-30-20)</Label>
            <Select value={bucket} onValueChange={(v) => setBucket(v as Bucket)}>
              <SelectTrigger id="cat-bucket">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUCKETS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {BUCKET_LABELS[b]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    color === c ? "scale-110 border-foreground" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Selecionar cor ${c}`}
                />
              ))}
            </div>
          </div>
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
