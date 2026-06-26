"use client"

import type { Bucket } from "@/lib/types"
import { BUCKET_LABELS } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  targets: Record<Bucket, number>
  onChange: (targets: Record<Bucket, number>) => void
}

const BUCKETS: Bucket[] = ["essenciais", "dividas", "pessoal", "investimentos"]

export function TargetsEditor({ targets, onChange }: Props) {
  const sum = BUCKETS.reduce((s, b) => s + (targets[b] || 0), 0)

  function update(b: Bucket, raw: string) {
    const value = Math.max(0, Math.min(100, Number.parseFloat(raw) || 0))
    onChange({ ...targets, [b]: value })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Metas por grupo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {BUCKETS.map((b) => (
          <div key={b} className="flex items-center justify-between gap-2">
            <Label htmlFor={`target-${b}`} className="text-sm text-muted-foreground">
              {BUCKET_LABELS[b]}
            </Label>
            <div className="flex items-center gap-1">
              <Input
                id={`target-${b}`}
                value={targets[b]}
                onChange={(e) => update(b, e.target.value)}
                inputMode="decimal"
                className="h-8 w-16 text-right text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
          <span className="font-medium text-card-foreground">Soma</span>
          <span className={`font-semibold ${sum === 100 ? "text-primary" : "text-destructive"}`}>{sum}%</span>
        </div>
      </CardContent>
    </Card>
  )
}
