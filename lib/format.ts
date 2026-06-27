export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0)
}

const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
const MONTHS_LONG = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export function formatDateShort(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return "—"
  return `${String(d).padStart(2, "0")}/${MONTHS_SHORT[m - 1]}`
}

// Returns the "yyyy-mm" key for an ISO date, or "" when invalid/empty.
export function monthKey(iso: string): string {
  if (!iso) return ""
  const [y, m] = iso.split("-")
  if (!y || !m) return ""
  return `${y}-${m}`
}

// Human label for a "yyyy-mm" key, e.g. "Julho 2026".
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number)
  if (!y || !m) return key
  return `${MONTHS_LONG[m - 1]} ${y}`
}
