"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { loadAppData, saveAppData } from "@/app/actions/app-data"

interface Options<T> {
  /** Converte o JSON salvo no banco no estado do app (aplica migrações). */
  restore: (raw: unknown) => T
  /** Cria o estado inicial quando ainda não há nada salvo para a chave. */
  create: () => Promise<T> | T
  /** Importa dados antigos do navegador (localStorage), se existirem. */
  legacy?: () => T | null
}

interface Loaded<T> {
  value: T
  /** true quando o valor ainda não existe no banco e precisa ser gravado. */
  fresh: boolean
}

const SAVE_DELAY_MS = 400

export function swrKey(key: string) {
  return ["app-data", key] as const
}

/**
 * Estado sincronizado com o banco (tabela app_data). Carrega via SWR, mantém
 * uma cópia local para edição instantânea e grava com debounce.
 * Passe `key = null` para aguardar (ex.: enquanto o ano ainda carrega).
 */
export function usePersistedState<T>(key: string | null, options: Options<T>) {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const { data } = useSWR<Loaded<T>>(
    key ? swrKey(key) : null,
    async () => {
      const k = key as string
      const { restore, create, legacy } = optionsRef.current
      const res = await loadAppData(k)
      if (res.found) return { value: restore(res.data), fresh: false }
      const imported = legacy?.()
      if (imported) return { value: imported, fresh: true }
      return { value: await create(), fresh: true }
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: false },
  )

  const [state, setState] = useState<{ key: string; value: T } | null>(null)
  const baseline = useRef<T | null>(null)
  const pending = useRef<{ key: string; value: T } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    const p = pending.current
    pending.current = null
    if (p) {
      saveAppData(p.key, p.value).catch((err) => console.error("Falha ao salvar dados:", err))
    }
  }, [])

  // Sincroniza o estado local com o valor carregado sempre que a chave muda.
  useEffect(() => {
    if (!key || !data || state?.key === key) return
    baseline.current = data.fresh ? null : data.value
    setState({ key, value: data.value })
  }, [key, data, state?.key])

  // Grava alterações (debounce) e mantém o cache do SWR atualizado.
  useEffect(() => {
    if (!state || state.value === baseline.current) return
    baseline.current = state.value
    pending.current = state
    globalMutate(swrKey(state.key), { value: state.value, fresh: false }, { revalidate: false })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, SAVE_DELAY_MS)
  }, [state, flush])

  // Ao trocar de chave (ex.: outro ano) ou sair da tela, grava o pendente.
  useEffect(() => () => flush(), [key, flush])

  const setValue = useCallback((updater: T | ((prev: T) => T)) => {
    setState((s) => {
      if (!s) return s
      const next = typeof updater === "function" ? (updater as (prev: T) => T)(s.value) : updater
      return { key: s.key, value: next }
    })
  }, [])

  const loaded = !!key && state?.key === key
  return [loaded ? (state as { value: T }).value : null, setValue, loaded] as const
}
