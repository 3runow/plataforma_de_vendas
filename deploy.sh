#!/bin/bash
set -e

echo "==== DEPLOY OFICIALBRICKS ===="

echo ">> Parando apenas oficialbricks"
pm2 stop oficialbricks || true
pm2 delete oficialbricks || true

echo ">> Atualizando código (git fetch/reset)"
git fetch origin main
git reset --hard origin/main

echo ">> Limpando node_modules, .next e package-lock.json"
rm -rf node_modules || true
rm -rf .next || true
rm -f package-lock.json || true

echo ">> Instalando dependências (npm install)"
npm install

echo ">> Gerando build (npm run build)"
npm run build

echo ">> Iniciando oficialbricks no PM2"
pm2 start "npm run start" --name oficialbricks

echo ">> Verificando webhook-bricks"
pm2 restart webhook-bricks || echo "webhook-bricks já está rodando"

echo ">> Status dos processos"
pm2 list

echo "✅ Deploy finalizado com sucesso!"
