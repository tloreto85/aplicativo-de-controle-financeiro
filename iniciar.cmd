@echo off
setlocal
cd /d "%~dp0"
title Controle Financeiro

where node >nul 2>nul
if errorlevel 1 goto :sem_node

where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm nao encontrado. Instalando com npm...
  call npm install -g pnpm
  if errorlevel 1 goto :erro
)

echo.
echo [1/3] Instalando dependencias...
call pnpm install
if errorlevel 1 goto :erro

echo.
echo [2/3] Verificando .env.local e banco de dados...
call node scripts\setup.mjs
if errorlevel 1 goto :erro

echo.
echo [3/3] Iniciando a aplicacao em http://localhost:3000
echo Para encerrar, pressione Ctrl+C nesta janela.
echo.
start "" "http://localhost:3000"
call pnpm dev
goto :eof

:sem_node
echo [ERRO] Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e abra este arquivo novamente.
pause
exit /b 1

:erro
echo.
echo [ERRO] A inicializacao falhou. Leia a mensagem acima.
pause
exit /b 1
