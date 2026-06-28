"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, FileSpreadsheet, MapPin, Pencil, ShoppingCart } from "lucide-react"
import { useShopping } from "@/lib/use-shopping"
import { listTotal } from "@/lib/shopping-types"
import { formatBRL, formatDateBR } from "@/lib/format"
import { exportListToXlsx } from "@/lib/shopping-export"
import { Button } from "@/components/ui/button"
import { ListFormDialog } from "@/components/shopping/list-form-dialog"
import { CategoryManager } from "@/components/shopping/category-manager"
import { AddItemForm } from "@/components/shopping/add-item-form"
import { ItemRow } from "@/components/shopping/item-row"
import { PdfImport } from "@/components/shopping/pdf-import"

export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    state,
    loaded,
    updateList,
    addItem,
    addItems,
    updateItem,
    removeItem,
    addCategory,
    removeCategory,
  } = useShopping()

  const [editOpen, setEditOpen] = useState(false)

  const list = useMemo(() => state.lists.find((l) => l.id === id), [state.lists, id])

  if (!loaded) {
    return (
      <main className="flex min-h-svh items-center justify-center text-muted-foreground">Carregando…</main>
    )
  }

  if (!list) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Lista não encontrada.</p>
        <Button onClick={() => router.push("/compras")}>Voltar para listas</Button>
      </main>
    )
  }

  return (
    <main className="min-h-svh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                render={<Link href="/compras" />}
                nativeButton={false}
                variant="ghost"
                size="icon"
                aria-label="Voltar para listas"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold leading-tight text-card-foreground">{list.name}</h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditOpen(true)}
                    aria-label="Editar dados da lista"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateBR(list.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {list.store || "Sem estabelecimento"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</span>
              <span className="font-mono text-base font-bold text-primary">{formatBRL(listTotal(list))}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <CategoryManager categories={state.categories} onAdd={addCategory} onRemove={removeCategory} />
            <PdfImport
              categories={state.categories}
              onImport={(items) => addItems(list.id, items)}
              onNewCategory={addCategory}
            />
            <Button variant="outline" size="sm" onClick={() => exportListToXlsx(list)} disabled={list.items.length === 0}>
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6">
        <AddItemForm categories={state.categories} onAdd={(item) => addItem(list.id, item)} />

        <section className="overflow-hidden rounded-lg border border-border bg-card">
          {list.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum produto ainda. Adicione manualmente acima ou importe de um PDF.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="p-3 font-medium">Produto</th>
                    <th className="p-3 font-medium">Categoria</th>
                    <th className="p-3 font-medium">Qtd</th>
                    <th className="p-3 font-medium">Preço un.</th>
                    <th className="p-3 text-right font-medium">Total</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      categories={state.categories}
                      onUpdate={(it) => updateItem(list.id, it)}
                      onRemove={(itemId) => removeItem(list.id, itemId)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <ListFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={list}
        onSubmit={(data) => updateList(list.id, data)}
      />
    </main>
  )
}
