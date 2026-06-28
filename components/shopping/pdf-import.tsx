"use client"

import { useRef, useState } from "react"
import { FileUp, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
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

type DraftItem = Omit<ShoppingItem, "id">

interface Props {
  categories: string[]
  onImport: (items: DraftItem[]) => void
  onNewCategory: (name: string) => void
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
      const dataUrl = await readAsDataURL(file)
      const res = await fetch("/api/parse-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf: dataUrl, categories }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Falha ao ler o PDF.")
      if (!data.items?.length) {
        setError("Nenhum produto foi identificado no PDF.")
      } else {
        setItems(data.items)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar o arquivo.")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function confirmImport() {
    if (!items) return
    // Register any categories that don't exist yet.
    const known = new Set(categories.map((c) => c.toLowerCase()))
    for (const it of items) {
      if (it.category && !known.has(it.category.toLowerCase())) {
        onNewCategory(it.category)
        known.add(it.category.toLowerCase())
      }
    }
    onImport(items)
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar lista de um PDF</DialogTitle>
          <DialogDescription>
            Envie um PDF com sua lista de compras ou cupom fiscal. A IA vai extrair os produtos, quantidades e preços
            para você revisar.
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
            <span className="text-xs text-muted-foreground">Somente arquivos .pdf</span>
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

          {error && (
            <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          {items && items.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-card-foreground">
                  {items.length} {items.length === 1 ? "produto encontrado" : "produtos encontrados"}
                </p>
                <span className="font-mono text-sm font-semibold text-primary">{formatBRL(total)}</span>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-muted/80 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="p-2 font-medium">Produto</th>
                      <th className="p-2 font-medium">Categoria</th>
                      <th className="p-2 font-medium">Qtd</th>
                      <th className="p-2 text-right font-medium">Preço un.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-2">{it.name}</td>
                        <td className="p-2 text-muted-foreground">{it.category}</td>
                        <td className="p-2 text-muted-foreground">{it.quantity}</td>
                        <td className="p-2 text-right font-mono">{formatBRL(it.price)}</td>
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
