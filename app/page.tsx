import Link from "next/link"
import { ShoppingCart, Wallet, ArrowRight } from "lucide-react"

const options = [
  {
    href: "/financeiro",
    title: "Controle Financeiro",
    description: "Gerencie despesas, vencimentos e acompanhe a regra 50-30-20.",
    icon: Wallet,
  },
  {
    href: "/compras",
    title: "Lista de Compras",
    description: "Crie listas de supermercado, importe PDFs e compare preços ao longo do tempo.",
    icon: ShoppingCart,
  },
]

export default function MenuPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <header className="mb-10 text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Meu Painel Financeiro
          </h1>
          <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
            Escolha uma das ferramentas abaixo para começar a organizar suas finanças e compras.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {options.map((opt) => {
            const Icon = opt.icon
            return (
              <Link
                key={opt.href}
                href={opt.href}
                className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary hover:bg-accent"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-card-foreground">{opt.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{opt.description}</p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Abrir
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
