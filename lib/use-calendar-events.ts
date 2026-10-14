"use client"

import { useCallback } from "react"
import type { CalendarEvent } from "./calendar-types"
import { usePersistedState } from "./use-persisted-state"
import { useYear } from "./year-context"

const LEGACY_STORAGE_KEY = "calendario-eventos-v1"

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Campos informados pelo usuário ao criar/editar um evento próprio.
export type CalendarEventInput = Omit<CalendarEvent, "id">

const EMPTY: CalendarEvent[] = []

function legacyEvents(year: number): CalendarEvent[] | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const list = (JSON.parse(raw) as CalendarEvent[]).filter((e) => e.date?.startsWith(`${year}-`))
    return list.length ? list : null
  } catch {
    return null
  }
}

// Gerencia os eventos cadastrados diretamente na tela do Calendário (por ano).
export function useCalendarEvents() {
  const { year } = useYear()
  const [persisted, setEvents, loaded] = usePersistedState<CalendarEvent[]>(year ? `calendar:${year}` : null, {
    restore: (raw) => (Array.isArray(raw) ? (raw as CalendarEvent[]) : []),
    create: () => [],
    legacy: () => legacyEvents(year as number),
  })
  const events = persisted ?? EMPTY

  const addEvent = useCallback(
    (input: CalendarEventInput) => {
      setEvents((list) => [...list, { ...input, id: uid() }])
    },
    [setEvents],
  )

  const updateEvent = useCallback(
    (id: string, patch: Partial<CalendarEventInput>) => {
      setEvents((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    },
    [setEvents],
  )

  const removeEvent = useCallback(
    (id: string) => {
      setEvents((list) => list.filter((e) => e.id !== id))
    },
    [setEvents],
  )

  return { events, loaded, addEvent, updateEvent, removeEvent }
}
