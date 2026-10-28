import { YearProvider } from "@/lib/year-context"
import { AppBar } from "@/components/app-bar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <YearProvider>
      <AppBar />
      {children}
    </YearProvider>
  )
}
