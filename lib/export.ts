import type { Category } from "./types"

function csvCell(value: string | number): string {
  const s = String(value ?? "")
  // Escape quotes and wrap fields that contain separators/newlines.
  if (/[";\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

// Builds a CSV (separated by ";" for pt-BR Excel compatibility) listing every expense.
export function buildExpensesCsv(categories: Category[]): string {
  const header = ["Categoria", "Grupo", "Descrição", "Valor", "Data"]
  const rows: string[] = [header.map(csvCell).join(";")]

  for (const category of categories) {
    for (const expense of category.expenses) {
      rows.push(
        [
          csvCell(category.name),
          csvCell(category.bucket),
          csvCell(expense.name),
          // Use comma as decimal separator so Excel pt-BR reads it as a number.
          csvCell(expense.amount.toFixed(2).replace(".", ",")),
          csvCell(expense.date),
        ].join(";"),
      )
    }
  }

  return rows.join("\n")
}

// Triggers a client-side download of the given CSV content.
export function downloadCsv(filename: string, csv: string) {
  // Prepend BOM so Excel detects UTF-8 (correct accents).
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
