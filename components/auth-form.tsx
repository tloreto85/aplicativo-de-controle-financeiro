"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Wallet } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type Mode = "sign-in" | "sign-up"

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isSignUp = mode === "sign-up"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")
    const name = String(form.get("name") ?? "").trim()

    if (isSignUp && password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.")
      return
    }

    setPending(true)
    const result = isSignUp
      ? await authClient.signUp.email({ email, password, name: name || email.split("@")[0] })
      : await authClient.signIn.email({ email, password })
    setPending(false)

    if (result.error) {
      console.error("Falha de autenticação:", result.error)
      setError(
        isSignUp
          ? "Não foi possível criar a conta. Verifique os dados e tente novamente."
          : "E-mail ou senha inválidos.",
      )
      return
    }
    router.push("/")
    router.refresh()
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">{isSignUp ? "Criar conta" : "Entrar"}</CardTitle>
          <CardDescription>
            {isSignUp
              ? "Seus dados financeiros ficam salvos com segurança no banco de dados."
              : "Acesse seu controle financeiro de qualquer computador."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" autoComplete="name" placeholder="Seu nome" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@email.com" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={isSignUp ? 8 : undefined}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="mt-6 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}
            </Button>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Já tem conta? " : "Ainda não tem conta? "}
              <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-medium text-primary underline-offset-4 hover:underline">
                {isSignUp ? "Entrar" : "Criar conta"}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
