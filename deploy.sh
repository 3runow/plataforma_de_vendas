#!/bin/bash
set -e

echo "==== DEPLOY OFICIALBRICKS ===="

echo ">> Atualizando código (git fetch/reset)"
git fetch origin main
git reset --hard origin/main

echo ">> Instalando dependências (npm install)"
npm install

echo ">> Gerando build (npm run build)"
npm run build

echo ">> Subindo / reiniciando PM2"
pm2 restart oficialbricks || pm2 start "npm run start" --name oficialbricks

echo "✅ Deploy finalizado com sucesso!"
