import { monthKey } from "./format"
import type { ShoppingList } from "./shopping-types"

export interface RecurringProduct {
  name: string
  // average unit price per "yyyy-mm" (only months where it was bought)
  pricesByMonth: Record<string, number>
  minPrice: number
  maxPrice: number
  // percent variation between first and last recorded month
  variation: number
}

export interface PriceAnalysis {
  // chronological "yyyy-mm" keys (the months that have lists, within the window)
  months: string[]
  products: RecurringProduct[]
}

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

// Returns the "yyyy-mm" for N months before a reference date.
function monthsAgoKey(ref: Date, n: number): string {
  const d = new Date(ref.getFullYear(), ref.getMonth() - n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/**
 * Finds products that were purchased EVERY month that had shopping activity,
 * within the last `windowMonths` (default 12). Only these recurring products
 * are returned, each with its average unit price per month for charting.
 */
export function analyzeRecurringProducts(lists: ShoppingList[], windowMonths = 12): PriceAnalysis {
  const now = new Date()
  const minKey = monthsAgoKey(now, windowMonths - 1)

  // Lists within the window, grouped by month.
  const monthsSet = new Set<string>()
  // productName -> month -> { sum, count } for averaging unit price
  const acc = new Map<string, Map<string, { sum: number; count: number; label: string }>>()

  for (const list of lists) {
    const mk = monthKey(list.date)
    if (!mk || mk < minKey) continue
    monthsSet.add(mk)

    for (const item of list.items) {
      const key = normalize(item.name)
      if (!key) continue
      if (!acc.has(key)) acc.set(key, new Map())
      const byMonth = acc.get(key)!
      const entry = byMonth.get(mk) ?? { sum: 0, count: 0, label: item.name.trim() }
      entry.sum += item.price || 0
      entry.count += 1
      byMonth.set(mk, entry)
    }
  }

  const months = Array.from(monthsSet).sort()

  // Need at least 2 active months for a meaningful comparison.
  if (months.length < 2) {
    return { months, products: [] }
  }

  const products: RecurringProduct[] = []

  for (const [, byMonth] of acc) {
    // Recurring = bought in every active month.
    const boughtEveryMonth = months.every((m) => byMonth.has(m))
    if (!boughtEveryMonth) continue

    const pricesByMonth: Record<string, number> = {}
    let label = ""
    for (const m of months) {
      const entry = byMonth.get(m)!
      pricesByMonth[m] = Math.round((entry.sum / entry.count) * 100) / 100
      label = entry.label
    }

    const values = months.map((m) => pricesByMonth[m])
    const minPrice = Math.min(...values)
    const maxPrice = Math.max(...values)
    const first = values[0]
    const last = values[values.length - 1]
    const variation = first > 0 ? ((last - first) / first) * 100 : 0

    products.push({
      name: label,
      pricesByMonth,
      minPrice,
      maxPrice,
      variation: Math.round(variation * 10) / 10,
    })
  }

  // Most volatile first.
  products.sort((a, b) => Math.abs(b.variation) - Math.abs(a.variation))

  return { months, products }
}
