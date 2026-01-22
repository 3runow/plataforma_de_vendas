#!/bin/bash

# 🚀 Quick Start: Setup de Usuário Visitante
# 
# Este script configura tudo para você testar o usuário visitante
# Uso: bash setup-visitor.sh
#

set -e

echo "════════════════════════════════════════════════════════════"
echo "🚀 Setup de Usuário Visitante para Dashboard Admin"
echo "════════════════════════════════════════════════════════════"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
  echo "❌ Erro: Execute este script na raiz do projeto"
  echo "   cd plataforma_de_vendas"
  echo "   bash setup-visitor.sh"
  exit 1
fi

echo "📦 Verificando dependências..."
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não está instalado"
  exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo ""

# Verificar se jest precisa ser instalado
if [ ! -d "node_modules" ]; then
  echo "📥 Instalando dependências..."
  npm install
  echo "✅ Dependências instaladas"
  echo ""
fi

# Executar as migrações do Prisma
echo "🗄️  Sincronizando banco de dados..."
npx prisma migrate deploy --skip-generate || true
npx prisma generate
echo "✅ Banco de dados sincronizado"
echo ""

# Criar usuários de teste
echo "👤 Criando usuários de teste..."
npx ts-node prisma/create-test-users.ts
echo "✅ Usuários criados"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "✨ Setup Concluído!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📝 Credenciais de Teste:"
echo "   ADMIN:"
echo "   ├─ Email: admin@demo.com"
echo "   └─ Senha: senha123"
echo ""
echo "   VISITANTE:"
echo "   ├─ Email: visitante@demo.com"
echo "   └─ Senha: senha123"
echo ""
echo "🔗 Próximos passos:"
echo "   1. Inicie o servidor: npm run dev"
echo "   2. Acesse: http://localhost:3000"
echo "   3. Faça login com visitante@demo.com"
echo "   4. Navegue para /dashboard"
echo ""
echo "📚 Documentação:"
echo "   - VISITOR_SETUP.md (Guia completo)"
echo "   - IMPLEMENTATION_SUMMARY.md (Resumo técnico)"
echo "   - VISITOR_IMPLEMENTATION_CHECKLIST.md (Checklist)"
echo ""
echo "🆘 Troubleshooting:"
echo "   Se houver problemas, verifique:"
echo "   - .env está configurado corretamente"
echo "   - Banco de dados está rodando"
echo "   - npx prisma db push (sincronizar schema)"
echo ""
