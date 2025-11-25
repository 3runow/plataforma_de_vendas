#!/bin/bash
set -e

echo "==== DEPLOY OFICIALBRICKS ===="

echo ">> Atualizando código (git fetch/reset)"
git fetch origin main
git reset --hard origin/main

echo ">> Limpando cache e reinstalando dependências"
rm -rf node_modules/.cache
rm -rf .next
npm rebuild
npm install

echo ">> Gerando build (npm run build)"
npm run build

echo ">> Subindo / reiniciando PM2"
pm2 restart oficialbricks || pm2 start "npm run start" --name oficialbricks

echo "✅ Deploy finalizado com sucesso!"
