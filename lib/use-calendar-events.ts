"use client"

import { useCallback, useEffect, useState } from "react"
import type { CalendarEvent } from "./calendar-types"

const STORAGE_KEY = "calendario-eventos-v1"

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Campos informados pelo usuário ao criar/editar um evento próprio.
export type CalendarEventInput = Omit<CalendarEvent, "id">

// Gerencia os eventos cadastrados diretamente na tela do Calendário.
export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setEvents(JSON.parse(raw) as CalendarEvent[])
    } catch {
      // ignore malformed data
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  }, [events, loaded])

  const addEvent = useCallback((input: CalendarEventInput) => {
    setEvents((list) => [...list, { ...input, id: uid() }])
  }, [])

  const updateEvent = useCallback((id: string, patch: Partial<CalendarEventInput>) => {
    setEvents((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }, [])

  const removeEvent = useCallback((id: string) => {
    setEvents((list) => list.filter((e) => e.id !== id))
  }, [])

  return { events, loaded, addEvent, updateEvent, removeEvent }
}
