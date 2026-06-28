"use client"

import { useRef, useState } from "react"
import { FileUp, Loader2, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatBRL } from "@/lib/format"
import { itemTotal, type ShoppingItem } from "@/lib/shopping-types"
import { parsePdfItems, type DraftItem } from "@/lib/pdf-parse"

interface Props {
  categories: string[]
  onImport: (items: DraftItem[]) => void
  onNewCategory: (name: string) => void
}

export function PdfImport({ categories, onImport, onNewCategory }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<DraftItem[] | null>(null)
  const [fileName, setFileName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setItems(null)
    setError(null)
    setFileName("")
    setLoading(false)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError(null)
    setItems(null)
    setLoading(true)
    try {
      const parsed = await parsePdfItems(file)
      if (!parsed.length) {
        setError(
          "Nenhum produto foi identificado automaticamente. O layout do PDF pode ser irregular — adicione os itens manualmente.",
        )
      } else {
        setItems(parsed)
      }
    } catch (err) {
      setError("Não foi possível ler o PDF. Verifique se o arquivo não é apenas uma imagem digitalizada.")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function updateItem(idx: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev?.map((it, i) => (i === idx ? { ...it, ...patch } : it)) ?? prev)
  }

  function removeItem(idx: number) {
    setItems((prev) => prev?.filter((_, i) => i !== idx) ?? prev)
  }

  function confirmImport() {
    if (!items) return
    const clean = items.filter((it) => it.name.trim())
    // Register any categories that don't exist yet.
    const known = new Set(categories.map((c) => c.toLowerCase()))
    for (const it of clean) {
      if (it.category && !known.has(it.category.toLowerCase())) {
        onNewCategory(it.category)
        known.add(it.category.toLowerCase())
      }
    }
    onImport(clean)
    setOpen(false)
    reset()
  }

  const total = items?.reduce((s, i) => s + itemTotal(i as ShoppingItem), 0) ?? 0

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <FileUp className="h-4 w-4" />
            Importar PDF
          </Button>
        }
      />
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar lista de um PDF</DialogTitle>
          <DialogDescription>
            Envie um PDF com sua lista de compras ou cupom fiscal. Os produtos, quantidades e preços são extraídos do
            texto do arquivo para você revisar e ajustar antes de adicionar.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label
            htmlFor="pdf-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center transition hover:border-primary"
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium text-card-foreground">
              {fileName || "Clique para selecionar um PDF"}
            </span>
            <span className="text-xs text-muted-foreground">Somente arquivos .pdf com texto selecionável</span>
            <input
              ref={inputRef}
              id="pdf-file"
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={handleFile}
              disabled={loading}
            />
          </label>

          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lendo o PDF e extraindo os produtos…
            </div>
          )}

          {error && <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          {items && items.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-card-foreground">
                  {items.length} {items.length === 1 ? "produto encontrado" : "produtos encontrados"} — revise abaixo
                </p>
                <span className="font-mono text-sm font-semibold text-primary">{formatBRL(total)}</span>
              </div>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-muted/80 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-2 font-medium">Produto</th>
                      <th className="p-2 font-medium">Categoria</th>
                      <th className="w-16 p-2 font-medium">Qtd</th>
                      <th className="w-28 p-2 text-right font-medium">Preço un.</th>
                      <th className="w-10 p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-1.5">
                          <Input
                            value={it.name}
                            onChange={(e) => updateItem(idx, { name: e.target.value })}
                            className="h-8"
                            aria-label="Nome do produto"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={it.category}
                            onChange={(e) => updateItem(idx, { category: e.target.value })}
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                            aria-label="Categoria"
                          >
                            <option value="">Sem categoria</option>
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1.5">
                          <Input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) => updateItem(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                            className="h-8"
                            aria-label="Quantidade"
                          />
                        </td>
                        <td className="p-1.5">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={it.price}
                            onChange={(e) => updateItem(idx, { price: Math.max(0, Number(e.target.value) || 0) })}
                            className="h-8 text-right"
                            aria-label="Preço unitário"
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-muted-foreground transition hover:text-destructive"
                            aria-label={`Remover ${it.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmImport} disabled={!items || items.length === 0 || loading}>
            Adicionar {items?.length ? `${items.length} itens` : "itens"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
