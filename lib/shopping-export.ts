import * as XLSX from "xlsx"
import { itemTotal, listTotal, type ShoppingList } from "./shopping-types"
import { formatDateBR } from "./format"

// Exports a shopping list to a real .xlsx spreadsheet.
export function exportListToXlsx(list: ShoppingList) {
  const header = [
    ["Lista", list.name],
    ["Data", formatDateBR(list.date)],
    ["Estabelecimento", list.store || "—"],
    [],
    ["Produto", "Categoria", "Quantidade", "Preço unitário", "Total"],
  ]

  const rows = list.items.map((i) => [i.name, i.category, i.quantity, i.price, itemTotal(i)])

  const footer = [[], ["", "", "", "Total geral", listTotal(list)]]

  const aoa = [...header, ...rows, ...footer]
  const ws = XLSX.utils.aoa_to_sheet(aoa)

  // Column widths for readability.
  ws["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 14 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Lista")

  const safeName = (list.name || "lista").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40)
  XLSX.writeFile(wb, `${safeName}.xlsx`)
}
