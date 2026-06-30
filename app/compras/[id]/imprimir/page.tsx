"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Printer } from "lucide-react"
import { useShopping } from "@/lib/use-shopping"
import { listTotal, itemTotal, type ShoppingList } from "@/lib/shopping-types"
import { formatBRL, formatDateBR } from "@/lib/format"
import { Button } from "@/components/ui/button"

// Group items by category, preserving the category order they first appear in.
function groupByCategory(list: ShoppingList) {
  const groups = new Map<string, typeof list.items>()
  for (const item of list.items) {
    const key = item.category || "Outros"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
}

export default function PrintListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { state, loaded } = useShopping()
  const [showPrices, setShowPrices] = useState(true)

  const list = useMemo(() => state.lists.find((l) => l.id === id), [state.lists, id])
  const groups = useMemo(() => (list ? groupByCategory(list) : []), [list])

  if (!loaded) {
    return <main className="flex min-h-svh items-center justify-center text-muted-foreground">Carregando…</main>
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
    <main className="min-h-svh bg-muted/30 print:bg-white">
      {/* Toolbar — hidden when printing */}
      <div className="border-b border-border bg-card print:hidden">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              render={<Link href={`/compras/${list.id}`} />}
              nativeButton={false}
              variant="ghost"
              size="icon"
              aria-label="Voltar para a lista"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-bold leading-tight text-card-foreground">Lista para impressão</h1>
              <p className="text-sm text-muted-foreground">Marque os itens enquanto faz as compras.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={showPrices}
                onChange={(e) => setShowPrices(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Mostrar preços estimados
            </label>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Printable sheet */}
      <div className="mx-auto max-w-3xl px-4 py-6 print:px-0 print:py-0">
        <article className="rounded-lg border border-border bg-card p-8 print:border-0 print:p-0 print:shadow-none">
          <header className="mb-6 border-b border-border pb-4">
            <h2 className="text-2xl font-bold text-card-foreground text-balance">{list.name}</h2>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span>
                <strong className="font-medium text-card-foreground">Data:</strong> {formatDateBR(list.date)}
              </span>
              <span>
                <strong className="font-medium text-card-foreground">Estabelecimento:</strong>{" "}
                {list.store || "—"}
              </span>
              <span>
                <strong className="font-medium text-card-foreground">Itens:</strong> {list.items.length}
              </span>
            </div>
          </header>

          {list.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Esta lista ainda não tem produtos.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {groups.map(([category, items]) => (
                <section key={category} className="break-inside-avoid">
                  <h3 className="mb-2 border-b border-border pb-1 text-sm font-bold uppercase tracking-wide text-primary">
                    {category}
                  </h3>
                  <ul className="flex flex-col">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 border-b border-dashed border-border py-2 text-sm last:border-0"
                      >
                        <span
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 rounded-sm border border-foreground/40"
                        />
                        <span className="flex-1 text-card-foreground">{item.name}</span>
                        <span className="w-16 text-right tabular-nums text-muted-foreground">
                          {item.quantity} un.
                        </span>
                        {showPrices && (
                          <span className="w-24 text-right font-mono text-muted-foreground">
                            {formatBRL(itemTotal(item))}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {showPrices && list.items.length > 0 && (
            <footer className="mt-6 flex items-center justify-between border-t-2 border-foreground/20 pt-3">
              <span className="text-sm font-semibold uppercase tracking-wide text-card-foreground">
                Total estimado
              </span>
              <span className="font-mono text-lg font-bold text-primary">{formatBRL(listTotal(list))}</span>
            </footer>
          )}
        </article>
      </div>
    </main>
  )
}
