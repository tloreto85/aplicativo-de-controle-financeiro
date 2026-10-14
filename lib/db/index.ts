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

export const pool = new Pool({ connectionString })
export const db = drizzle(pool, { schema })
