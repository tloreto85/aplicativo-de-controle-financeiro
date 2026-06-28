export interface ShoppingItem {
  id: string
  name: string
  category: string
  quantity: number
  // unit price in BRL
  price: number
}

export interface ShoppingList {
  id: string
  name: string
  // ISO date "yyyy-mm-dd"
  date: string
  store: string
  items: ShoppingItem[]
  createdAt: number
  updatedAt: number
}

export interface ShoppingState {
  lists: ShoppingList[]
  // user-defined product categories shared across lists
  categories: string[]
}

// Default categories offered to new users.
export const DEFAULT_SHOPPING_CATEGORIES = [
  "Hortifruti",
  "Carnes",
  "Laticínios",
  "Padaria",
  "Bebidas",
  "Limpeza",
  "Higiene",
  "Mercearia",
  "Congelados",
  "Outros",
]

export function itemTotal(item: ShoppingItem): number {
  return (item.price || 0) * (item.quantity || 0)
}

export function listTotal(list: ShoppingList): number {
  return list.items.reduce((sum, i) => sum + itemTotal(i), 0)
}
