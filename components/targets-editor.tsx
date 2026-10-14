"use client"

import type { Bucket, RuleId } from "@/lib/types"
import { BUCKETS, RULES, RULE_IDS } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Props {
  targets: Record<Bucket, number>
  rule: RuleId
  onChange: (targets: Record<Bucket, number>) => void
  onRuleChange: (rule: RuleId) => void
}

export function TargetsEditor({ targets, rule, onChange, onRuleChange }: Props) {
  const sum = BUCKETS.reduce((s, b) => s + (targets[b] || 0), 0)
  const labels = RULES[rule].labels

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
        <div className="flex flex-col gap-1.5">
          <span id="rule-label" className="text-sm text-muted-foreground">
            Forma de distribuição
          </span>
          <div role="radiogroup" aria-labelledby="rule-label" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {RULE_IDS.map((id) => {
              const active = id === rule
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => !active && onRuleChange(id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-mono text-sm font-semibold transition-colors",
                    active
                      ? "bg-card text-card-foreground shadow-sm"
                      : "text-muted-foreground hover:text-card-foreground",
                  )}
                >
                  {id}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Ao trocar a regra, as metas voltam aos percentuais padrão dela.
          </p>
        </div>

        {BUCKETS.map((b) => (
          <div key={b} className="flex items-center justify-between gap-2">
            <Label htmlFor={`target-${b}`} className="text-sm text-muted-foreground">
              {labels[b]}
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
