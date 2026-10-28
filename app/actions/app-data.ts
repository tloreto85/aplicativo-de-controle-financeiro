"use server"

import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { appData } from "@/lib/db/schema"

const KEY_PATTERN = /^(settings|shopping|(finance|debts|calendar):\d{4})$/
const MAX_BYTES = 2_000_000

// O app é público: todos os usuários compartilham a mesma base no Neon.
// O valor fixo preserva a chave composta existente sem exigir migração.
const SHARED_USER_ID = "public-shared"

function getUserId() {
  return SHARED_USER_ID
}

function assertKey(key: string) {
  if (!KEY_PATTERN.test(key)) throw new Error("Chave inválida")
}

export async function loadAppData(key: string): Promise<{ found: boolean; data: unknown }> {
  assertKey(key)
  const userId = await getUserId()
  const rows = await db
    .select({ data: appData.data })
    .from(appData)
    .where(and(eq(appData.userId, userId), eq(appData.key, key)))
    .limit(1)
  return rows.length ? { found: true, data: rows[0].data } : { found: false, data: null }
}

export async function saveAppData(key: string, data: unknown): Promise<void> {
  assertKey(key)
  const userId = await getUserId()
  if (data === null || typeof data !== "object") throw new Error("Dados inválidos")
  if (JSON.stringify(data).length > MAX_BYTES) throw new Error("Dados muito grandes")
  const now = new Date()
  await db
    .insert(appData)
    .values({ userId, key, data, updatedAt: now })
    .onConflictDoUpdate({ target: [appData.userId, appData.key], set: { data, updatedAt: now } })
}
