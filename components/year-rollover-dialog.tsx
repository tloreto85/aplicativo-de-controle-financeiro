"use client"

import { CalendarClock, Download } from "lucide-react"
import type { RolloverInfo } from "@/lib/use-finance"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Props {
  info: RolloverInfo | null
  onDownload: () => void
  onDismiss: () => void
}

export function YearRolloverDialog({ info, onDownload, onDismiss }: Props) {
  return (
    <Dialog open={!!info} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent>
        {info && (
          <>
            <DialogHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <CalendarClock className="h-5 w-5 text-accent-foreground" />
              </div>
              <DialogTitle>Bem-vindo a {info.newYear}!</DialogTitle>
              <DialogDescription>
                Detectamos a virada de ano. Os dados de {info.previousYear} foram exportados em um
                arquivo Excel ({info.fileName}) e uma nova base, em branco, foi criada para{" "}
                {info.newYear}.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Se o download não iniciou automaticamente, baixe o arquivo do ano anterior pelo botão
              abaixo. Ele não ficará mais disponível depois de fechar este aviso.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={onDownload}>
                <Download className="h-4 w-4" />
                Baixar {info.previousYear}
              </Button>
              <Button onClick={onDismiss}>Começar {info.newYear}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
