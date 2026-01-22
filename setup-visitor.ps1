# 🚀 Quick Start: Setup de Usuário Visitante (Windows)
# 
# Este script configura tudo para você testar o usuário visitante
# Uso: powershell -ExecutionPolicy Bypass -File setup-visitor.ps1
#

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 Setup de Usuário Visitante para Dashboard Admin" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
  Write-Host "❌ Erro: Execute este script na raiz do projeto" -ForegroundColor Red
  Write-Host "   cd plataforma_de_vendas" -ForegroundColor Yellow
  Write-Host "   powershell -ExecutionPolicy Bypass -File setup-visitor.ps1" -ForegroundColor Yellow
  exit 1
}

Write-Host "📦 Verificando dependências..." -ForegroundColor Yellow

# Verificar Node.js
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Node.js não está instalado" -ForegroundColor Red
  exit 1
}

Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
  Write-Host "📥 Instalando dependências..." -ForegroundColor Yellow
  npm install
  Write-Host "✅ Dependências instaladas" -ForegroundColor Green
  Write-Host ""
}

# Executar as migrações do Prisma
Write-Host "🗄️  Sincronizando banco de dados..." -ForegroundColor Yellow
try {
  npx prisma migrate deploy --skip-generate
} catch {
  # Ignorar erros de migração (pode não haver migrações pendentes)
}
npx prisma generate
Write-Host "✅ Banco de dados sincronizado" -ForegroundColor Green
Write-Host ""

# Criar usuários de teste
Write-Host "👤 Criando usuários de teste..." -ForegroundColor Yellow
npx ts-node prisma/create-test-users.ts
Write-Host "✅ Usuários criados" -ForegroundColor Green
Write-Host ""

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Setup Concluído!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Credenciais de Teste:" -ForegroundColor Yellow
Write-Host "   ADMIN:" -ForegroundColor White
Write-Host "   ├─ Email: admin@demo.com" -ForegroundColor Gray
Write-Host "   └─ Senha: senha123" -ForegroundColor Gray
Write-Host ""
Write-Host "   VISITANTE:" -ForegroundColor White
Write-Host "   ├─ Email: visitante@demo.com" -ForegroundColor Gray
Write-Host "   └─ Senha: senha123" -ForegroundColor Gray
Write-Host ""

Write-Host "🔗 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Inicie o servidor: npm run dev" -ForegroundColor Gray
Write-Host "   2. Acesse: http://localhost:3000" -ForegroundColor Gray
Write-Host "   3. Faça login com visitante@demo.com" -ForegroundColor Gray
Write-Host "   4. Navegue para /dashboard" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Documentação:" -ForegroundColor Yellow
Write-Host "   - VISITOR_SETUP.md (Guia completo)" -ForegroundColor Gray
Write-Host "   - IMPLEMENTATION_SUMMARY.md (Resumo técnico)" -ForegroundColor Gray
Write-Host "   - VISITOR_IMPLEMENTATION_CHECKLIST.md (Checklist)" -ForegroundColor Gray
Write-Host ""

Write-Host "🆘 Troubleshooting:" -ForegroundColor Yellow
Write-Host "   Se houver problemas, verifique:" -ForegroundColor Gray
Write-Host "   - .env está configurado corretamente" -ForegroundColor Gray
Write-Host "   - Banco de dados está rodando" -ForegroundColor Gray
Write-Host "   - npx prisma db push (sincronizar schema)" -ForegroundColor Gray
Write-Host ""
