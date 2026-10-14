#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js não encontrado. Instale a versão LTS em https://nodejs.org e rode novamente."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm não encontrado. Instalando com npm..."
  npm install -g pnpm
fi

echo
echo "[1/3] Instalando dependências..."
pnpm install

echo
echo "[2/3] Verificando .env.local e banco de dados..."
node scripts/setup.mjs

echo
echo "[3/3] Iniciando a aplicação em http://localhost:3000 (Ctrl+C para encerrar)"
echo
pnpm dev
