#!/usr/bin/env node
// Prepara o ambiente local: valida o Node, cria o .env.local (se não existir)
// e cria as tabelas no banco. Pode ser executado quantas vezes quiser: nada é
// apagado e as tabelas existentes são mantidas.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { randomBytes } from "node:crypto"
import { createInterface } from "node:readline/promises"
import { stdin, stdout, exit } from "node:process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const envPath = path.join(root, ".env.local")

const MIN_NODE = [20, 9]

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "image" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expiresAt" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope" text,
  "password" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "app_data" (
  "userId" text NOT NULL,
  "key" text NOT NULL,
  "data" jsonb NOT NULL,
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("userId", "key")
);

CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");
`

function fail(message) {
  console.error(`\n[ERRO] ${message}\n`)
  exit(1)
}

function checkNodeVersion() {
  const [major, minor] = process.versions.node.split(".").map(Number)
  const [minMajor, minMinor] = MIN_NODE
  if (major < minMajor || (major === minMajor && minor < minMinor)) {
    fail(`Node.js ${process.versions.node} é antigo demais. Instale o Node.js ${minMajor}.${minMinor} ou superior (versão LTS em https://nodejs.org).`)
  }
}

function parseEnvFile(content) {
  const env = {}
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) continue
    env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2")
  }
  return env
}

function isValidDatabaseUrl(value) {
  if (!value || value.includes("...")) return false
  try {
    const url = new URL(value)
    return /^postgres(ql)?:$/.test(url.protocol) && Boolean(url.hostname)
  } catch {
    return false
  }
}

async function createEnvFile() {
  console.log("\nArquivo .env.local não encontrado. Vamos criá-lo agora.")
  console.log("Cole a connection string do seu banco Neon (Neon Console > Connect).")
  console.log("Formato: postgresql://usuario:senha@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require\n")

  // Iterating lines (instead of rl.question) keeps input that arrives early, e.g. a paste with several lines.
  const rl = createInterface({ input: stdin, output: stdout, terminal: false })
  let databaseUrl = ""
  stdout.write("DATABASE_URL: ")
  for await (const line of rl) {
    const candidate = line.trim().replace(/^(["'])(.*)\1$/, "$2")
    if (isValidDatabaseUrl(candidate)) {
      databaseUrl = candidate
      break
    }
    console.log("Valor inválido. Ele deve começar com postgresql:// e conter o host do Neon.")
    stdout.write("DATABASE_URL: ")
  }
  rl.close()
  if (!databaseUrl) fail("Nenhum DATABASE_URL informado.")

  const secret = randomBytes(32).toString("base64")
  const content = [
    `DATABASE_URL="${databaseUrl}"`,
    `BETTER_AUTH_SECRET="${secret}"`,
    `BETTER_AUTH_URL="http://localhost:3000"`,
    "",
  ].join("\n")
  writeFileSync(envPath, content, { encoding: "utf8" })
  console.log("\n.env.local criado (BETTER_AUTH_SECRET gerado automaticamente).")
}

async function loadEnv() {
  if (!existsSync(envPath)) await createEnvFile()

  const env = parseEnvFile(readFileSync(envPath, "utf8"))
  if (!isValidDatabaseUrl(env.DATABASE_URL)) {
    fail("DATABASE_URL ausente ou inválido no .env.local. Corrija o valor (ou apague o arquivo e rode o script de novo).")
  }
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
    fail("BETTER_AUTH_SECRET ausente ou curto demais no .env.local (mínimo de 32 caracteres).")
  }
  return env
}

async function createTables(databaseUrl) {
  let pg
  try {
    pg = (await import("pg")).default
  } catch {
    fail('Dependências não instaladas. Rode "pnpm install" antes deste script.')
  }

  const client = new pg.Client({ connectionString: databaseUrl })
  try {
    await client.connect()
  } catch (error) {
    fail(`Não foi possível conectar ao banco (${error.code ?? error.message}). Verifique o DATABASE_URL e sua conexão com a internet.`)
  }

  try {
    await client.query(SCHEMA_SQL)
    const { rows } = await client.query('SELECT count(*)::int AS total FROM "user"')
    console.log(`Banco pronto. Tabelas verificadas (${rows[0].total} usuário(s) cadastrado(s)).`)
  } catch (error) {
    fail(`Erro ao criar as tabelas: ${error.message}`)
  } finally {
    await client.end()
  }
}

checkNodeVersion()
const env = await loadEnv()
await createTables(env.DATABASE_URL)
