export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0)
}

export function formatDateShort(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return "—"
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
  return `${String(d).padStart(2, "0")}/${months[m - 1]}`
}
