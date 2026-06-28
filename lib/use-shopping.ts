"use client"

import { useCallback, useEffect, useState } from "react"
import {
  DEFAULT_SHOPPING_CATEGORIES,
  type ShoppingItem,
  type ShoppingList,
  type ShoppingState,
} from "./shopping-types"

const STORAGE_KEY = "lista-de-compras-v1"

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

const defaultState: ShoppingState = {
  lists: [],
  categories: [...DEFAULT_SHOPPING_CATEGORIES],
}

export function useShopping() {
  const [state, setState] = useState<ShoppingState>(defaultState)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ShoppingState
        setState({
          lists: parsed.lists ?? [],
          categories: parsed.categories?.length ? parsed.categories : [...DEFAULT_SHOPPING_CATEGORIES],
        })
      }
    } catch {
      // ignore malformed data
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, loaded])

  // --- List CRUD ---

  const createList = useCallback((data: { name: string; date: string; store: string }) => {
    const now = Date.now()
    const list: ShoppingList = {
      id: uid(),
      name: data.name.trim() || "Nova lista",
      date: data.date || todayISO(),
      store: data.store.trim(),
      items: [],
      createdAt: now,
      updatedAt: now,
    }
    setState((s) => ({ ...s, lists: [list, ...s.lists] }))
    return list.id
  }, [])

  const updateList = useCallback(
    (listId: string, data: Partial<Pick<ShoppingList, "name" | "date" | "store">>) => {
      setState((s) => ({
        ...s,
        lists: s.lists.map((l) =>
          l.id === listId ? { ...l, ...data, updatedAt: Date.now() } : l,
        ),
      }))
    },
    [],
  )

  const removeList = useCallback((listId: string) => {
    setState((s) => ({ ...s, lists: s.lists.filter((l) => l.id !== listId) }))
  }, [])

  // --- Item CRUD ---

  const addItem = useCallback((listId: string, item: Omit<ShoppingItem, "id">) => {
    setState((s) => ({
      ...s,
      lists: s.lists.map((l) =>
        l.id === listId
          ? { ...l, items: [...l.items, { ...item, id: uid() }], updatedAt: Date.now() }
          : l,
      ),
    }))
  }, [])

  // Add several items at once (used by PDF import).
  const addItems = useCallback((listId: string, items: Omit<ShoppingItem, "id">[]) => {
    setState((s) => ({
      ...s,
      lists: s.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: [...l.items, ...items.map((it) => ({ ...it, id: uid() }))],
              updatedAt: Date.now(),
            }
          : l,
      ),
    }))
  }, [])

  const updateItem = useCallback((listId: string, item: ShoppingItem) => {
    setState((s) => ({
      ...s,
      lists: s.lists.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.map((i) => (i.id === item.id ? item : i)), updatedAt: Date.now() }
          : l,
      ),
    }))
  }, [])

  const removeItem = useCallback((listId: string, itemId: string) => {
    setState((s) => ({
      ...s,
      lists: s.lists.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.filter((i) => i.id !== itemId), updatedAt: Date.now() }
          : l,
      ),
    }))
  }, [])

  // --- Categories ---

  const addCategory = useCallback((name: string) => {
    const clean = name.trim()
    if (!clean) return
    setState((s) =>
      s.categories.some((c) => c.toLowerCase() === clean.toLowerCase())
        ? s
        : { ...s, categories: [...s.categories, clean] },
    )
  }, [])

  const removeCategory = useCallback((name: string) => {
    setState((s) => ({ ...s, categories: s.categories.filter((c) => c !== name) }))
  }, [])

  return {
    state,
    loaded,
    createList,
    updateList,
    removeList,
    addItem,
    addItems,
    updateItem,
    removeItem,
    addCategory,
    removeCategory,
  }
}
