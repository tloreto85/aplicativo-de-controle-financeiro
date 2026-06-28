"use client"

import type { ShoppingItem } from "./shopping-types"

export type DraftItem = Omit<ShoppingItem, "id">

// Lazily configured pdfjs module (loaded only in the browser, on demand).
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString()
      return pdfjs
    })
  }
  return pdfjsPromise
}

// Extracts the text of a PDF file, joining items on the same line by their y-position.
export async function extractPdfText(file: File): Promise<string[]> {
  const pdfjs = await getPdfjs()
  const buffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({ data: buffer })
  const doc = await loadingTask.promise
  const lines: string[] = []

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    // Group text fragments by their vertical position to reconstruct lines.
    const rows = new Map<number, { x: number; str: string }[]>()
    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      if (!item.str) continue
      const y = Math.round(item.transform[5])
      const x = item.transform[4]
      const key = Math.round(y / 3) * 3 // tolerance to merge near-equal baselines
      const arr = rows.get(key) ?? []
      arr.push({ x, str: item.str })
      rows.set(key, arr)
    }
    // Sort rows top-to-bottom, fragments left-to-right.
    const sortedKeys = [...rows.keys()].sort((a, b) => b - a)
    for (const key of sortedKeys) {
      const frags = rows.get(key)!.sort((a, b) => a.x - b.x)
      const line = frags
        .map((f) => f.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
      if (line) lines.push(line)
    }
  }

  await loadingTask.destroy()
  return lines
}

// Parses a Brazilian-formatted money token like "R$ 1.234,56" or "27,90" into a number.
function parseBRLNumber(raw: string): number | null {
  if (!raw) return null
  let s = raw.replace(/r\$/i, "").trim()
  // Remove thousand separators, then turn decimal comma into a dot.
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".")
  }
  const n = Number.parseFloat(s.replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : null
}

const PRICE_RE = /r\$\s*\d{1,3}(?:\.\d{3})*,\d{2}|r\$\s*\d+(?:[.,]\d{1,2})?|\d{1,3}(?:\.\d{3})*,\d{2}/i
// Explicit quantity, e.g. "Qtd: 2", "quantidade 3", "qte. 4".
const QTY_EXPLICIT_RE = /(?:qtd|quant(?:idade)?|qte)\s*[:.]?\s*(\d{1,3})\b/i
// Count-with-unit, e.g. "2 un", "3x", "6 pç". Weights (kg/g/l/ml) are NOT counts.
const QTY_UNIT_RE = /\b(\d{1,3})\s*(?:un|und|unid|pç|pcs|pc|x)\b/i
// Any token used only to scrub the name (includes weights so they stay in the name).
const QTY_SCRUB_RE = /(?:qtd|quant(?:idade)?|qte)\s*[:.]?\s*\d{1,3}\b|\b\d{1,3}\s*(?:un|und|unid|pç|pcs|pc|x)\b/gi

// Heuristic line parser: pulls product name, quantity and unit price from a text line.
function parseLine(line: string): DraftItem | null {
  // A candidate line must contain a price.
  const priceMatch = line.match(PRICE_RE)
  if (!priceMatch) return null

  const price = parseBRLNumber(priceMatch[0])
  if (price == null || price <= 0) return null

  // Quantity (default 1). Prefer an explicit "Qtd: N", then a count-with-unit.
  let quantity = 1
  const explicit = line.match(QTY_EXPLICIT_RE)
  const unit = line.match(QTY_UNIT_RE)
  const qtyRaw = explicit?.[1] ?? unit?.[1]
  if (qtyRaw) {
    const q = Number.parseInt(qtyRaw, 10)
    if (Number.isFinite(q) && q > 0 && q < 1000) quantity = q
  }

  // Name: everything before the first price, with qty/marker noise stripped.
  let name = line.slice(0, priceMatch.index ?? line.length)
  name = name
    .replace(QTY_SCRUB_RE, " ")
    .replace(/\b(r\$|preço|valor|total|unit\.?)\b/gi, " ")
    .replace(/[|;]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[-–•*]\s*$/, "")
    .trim()

  // Drop leading numbering like "1." or "01 -".
  name = name.replace(/^\d{1,3}[).\-\s]+/, "").trim()

  // Reject lines that are clearly headers/totals or have no real name.
  if (!name || name.length < 2) return null
  if (/^(total|subtotal|sub-total|valor a pagar|troco|desconto|itens?)\b/i.test(name)) return null

  return { name, quantity, price, category: "" }
}

// Full pipeline: extract text from the PDF and return the detected draft items.
export async function parsePdfItems(file: File): Promise<DraftItem[]> {
  const lines = await extractPdfText(file)
  const items: DraftItem[] = []
  for (const line of lines) {
    const item = parseLine(line)
    if (item) items.push(item)
  }
  return items
}
