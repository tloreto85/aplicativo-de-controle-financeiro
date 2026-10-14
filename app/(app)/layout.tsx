import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { YearProvider } from "@/lib/year-context"
import { AppBar } from "@/components/app-bar"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  return (
    <YearProvider>
      <AppBar userName={session.user.name || session.user.email} />
      {children}
    </YearProvider>
  )
}
