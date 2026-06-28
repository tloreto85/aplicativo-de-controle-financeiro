"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BarChart3, Calendar, MapPin, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { useShopping } from "@/lib/use-shopping"
import { listTotal, type ShoppingList } from "@/lib/shopping-types"
import { formatBRL, formatDateBR } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { ListFormDialog } from "@/components/shopping/list-form-dialog"
import {
  AlertDialogConfirm,
} from "@/components/shopping/confirm-dialog"

export default function ComprasPage() {
  const { state, loaded, createList, removeList } = useShopping()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ShoppingList | null>(null)

  function handleCreate(data: { name: string; date: string; store: string }) {
    const id = createList(data)
    router.push(`/compras/${id}`)
  }

  if (!loaded) {
    return (
      <main className="flex min-h-svh items-center justify-center text-muted-foreground">Carregando…</main>
    )
  }

  return (
    <main className="min-h-svh">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" aria-label="Voltar ao menu">
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-card-foreground">Listas de Compras</h1>
              <p className="text-sm text-muted-foreground">Crie e gerencie suas compras de supermercado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/compras/comparativo">
                <BarChart3 className="h-4 w-4" />
                Comparativo
              </Link>
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova lista
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {state.lists.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center">
            <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Você ainda não tem listas de compras.</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Criar primeira lista
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.lists.map((list) => (
              <div
                key={list.id}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <Link href={`/compras/${list.id}`} className="flex-1">
                  <h2 className="pr-8 font-semibold text-card-foreground">{list.name}</h2>
                  <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateBR(list.date)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {list.store || "Sem estabelecimento"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <span className="text-xs text-muted-foreground">
                      {list.items.length} {list.items.length === 1 ? "item" : "itens"}
                    </span>
                    <span className="font-mono text-base font-bold text-primary">{formatBRL(listTotal(list))}</span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setToDelete(list)}
                  aria-label={`Excluir lista ${list.name}`}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ListFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleCreate} />

      <AlertDialogConfirm
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir lista?"
        description={`A lista "${toDelete?.name}" e todos os seus itens serão removidos permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (toDelete) removeList(toDelete.id)
          setToDelete(null)
        }}
      />
    </main>
  )
}
