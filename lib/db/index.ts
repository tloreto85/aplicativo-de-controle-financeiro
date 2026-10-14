import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

// Without this check, pg silently falls back to localhost:5432 and fails with ECONNREFUSED.
if (!connectionString) {
  throw new Error(
    "DATABASE_URL não definido. Crie o arquivo .env.local na raiz do projeto (ao lado do package.json) com DATABASE_URL e BETTER_AUTH_SECRET e reinicie o servidor.",
  )
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return ""
  }
}

const hostname = getHostname(connectionString)
if (!hostname || /^\.+$/.test(hostname) || connectionString.includes("...")) {
  throw new Error(
    "DATABASE_URL inválido em .env.local (parece ser o texto de exemplo). Cole a connection string completa do Neon (Neon Console > Connect), no formato postgresql://usuario:senha@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require, e reinicie o servidor.",
  )
}

export const pool = new Pool({ connectionString })
export const db = drizzle(pool, { schema })
