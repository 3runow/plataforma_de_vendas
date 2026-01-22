# 👤 Sistema de Usuário Visitante - Dashboard Administrativo

## 📋 Resumo

Implementação de um **usuário VISITANTE (visitor)** para o dashboard administrativo que permite acesso somente para **visualização** de dados, sem permissão para criar, editar ou deletar nada.

```
┌─────────────────────────────────────────┐
│         USUÁRIO VISITANTE              │
├─────────────────────────────────────────┤
│ ✅ Ver Dashboard e Métricas            │
│ ✅ Ver Produtos                         │
│ ✅ Ver Pedidos                          │
│ ✅ Ver Envios                           │
│ ✅ Ver Cupons                           │
│ ✅ Ver Estoque                          │
│ ✅ Ver Devoluções                       │
├─────────────────────────────────────────┤
│ ❌ Criar / Editar / Deletar             │
│ ❌ Gerenciar Usuários                   │
│ ❌ Acessar Configurações                │
│ ❌ Fazer Upload de Arquivos             │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start (1 minuto)

### Windows
```powershell
# 1. Abra PowerShell na pasta do projeto
powershell -ExecutionPolicy Bypass -File setup-visitor.ps1

# 2. Inicie o servidor
npm run dev

# 3. Faça login com: visitante@demo.com / senha123
```

### Linux/Mac
```bash
# 1. Na pasta do projeto
bash setup-visitor.sh

# 2. Inicie o servidor
npm run dev

# 3. Faça login com: visitante@demo.com / senha123
```

### Manual
```bash
# Se preferir fazer manualmente:
npx ts-node prisma/create-test-users.ts
npm run dev
# Acesse http://localhost:3000/login
# Email: visitante@demo.com | Senha: senha123
```

## 📚 Documentação Completa

### 📖 Para Usuários Finais
→ Leia [VISITOR_SETUP.md](./VISITOR_SETUP.md)
- Como criar usuários visitantes
- Como fazer login
- O que pode/não pode fazer

### 🔧 Para Desenvolvedores
→ Leia [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- Arquivos criados e modificados
- Camadas de segurança
- Como integrar em novos componentes

### ✅ Checklist Completo
→ Veja [VISITOR_IMPLEMENTATION_CHECKLIST.md](./VISITOR_IMPLEMENTATION_CHECKLIST.md)
- Status de cada arquivo
- Cobertura de componentes
- Como testar

## 🔒 Segurança em 5 Camadas

### 1. Middleware (Servidor)
Bloqueia acesso não autorizado na entrada
```typescript
// ✅ Passa: admin, visitor
// ❌ Bloqueia: customer, anônimos
```

### 2. Página (Servidor)
Valida role antes de renderizar
```typescript
if (user.role !== "admin" && user.role !== "visitor") {
  redirect("/");
}
```

### 3. Componentes (Cliente)
Desabilita botões visualmente com tooltips
```typescript
<DisableIfNoPermission role={userRole} permission="edit">
  <Button disabled={userRole !== "admin"}>Editar</Button>
</DisableIfNoPermission>
```

### 4. APIs (Servidor)
Valida permissão antes de operações de escrita
```typescript
const permission = await checkPermission(request, "edit", "products");
if (!permission.allowed) {
  return NextResponse.json({ error: "..." }, { status: 403 });
}
```

### 5. Permissões Centralizadas
Única fonte de verdade para quem pode fazer o quê
```typescript
const visitor = {
  canViewProducts: true,
  canEditProducts: false,
  canDeleteProducts: false,
  // ... 9 recursos cobertos
};
```

## 👥 Roles Disponíveis

| Role | Dashboard | Criar | Editar | Deletar | Config |
|------|-----------|-------|--------|---------|--------|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **VISITOR** ⭐ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **CUSTOMER** | ❌ | ❌ | ❌ | ❌ | ❌ |

## 🧪 Testar

### 1. Criar Usuários
```bash
npx ts-node prisma/create-test-users.ts
```

### 2. Login
```
URL: http://localhost:3000/login
Email: visitante@demo.com
Senha: senha123
```

### 3. Acessar Dashboard
```
URL: http://localhost:3000/dashboard
Você verá todos os dados mas sem poder editar
```

### 4. Verificar Permissões
Abra DevTools → Console e execute:
```javascript
const token = document.cookie.split('; ').find(row => row.startsWith('token='));
console.log(token); // Veja o JWT token com role: "visitor"
```

### 5. Testar API (403 Forbidden)
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Cookie: token=seu_token_visitor" \
  -d '{"name": "Teste"}'

# Resposta esperada:
# { "error": "Acesso negado. Você não tem permissão para criar products." }
```

## 📁 Arquivos Criados

```
plataforma_de_vendas/
├── src/
│   ├── lib/
│   │   ├── permissions.ts          ← Sistema de permissões (230 linhas)
│   │   └── api-protection.ts       ← Proteção de APIs (80 linhas)
│   ├── components/
│   │   └── protected-action.tsx    ← Componentes de UI (130 linhas)
│   └── hooks/
│       └── use-user-role.ts        ← Hook para role (35 linhas)
├── prisma/
│   └── create-test-users.ts        ← Script de teste (65 linhas)
├── setup-visitor.sh                ← Setup automático (Linux/Mac)
├── setup-visitor.ps1               ← Setup automático (Windows)
├── create-visitor-user.sql         ← Setup via SQL
├── VISITOR_SETUP.md                ← Guia de usuário
├── IMPLEMENTATION_SUMMARY.md       ← Resumo técnico
└── VISITOR_IMPLEMENTATION_CHECKLIST.md ← Checklist
```

## ⚙️ Integração em Novos Componentes

Para proteger um novo componente:

```typescript
// 1. Importar
import { DisableIfNoPermission } from "@/components/protected-action";
import { UserRole } from "@/lib/permissions";

// 2. Adicionar prop
interface Props {
  userRole?: string;
}

// 3. Proteger botões
<DisableIfNoPermission
  role={userRole as UserRole}
  permission="edit"
  resource="products"
>
  <Button>Editar</Button>
</DisableIfNoPermission>

// 4. Condicionar dialogs
{userRole === "admin" && (
  <EditDialog />
)}
```

## 📊 Cobertura Atual

- ✅ Dashboard Overview
- ✅ Products Management (criar, editar, deletar)
- ✅ Orders Management
- ✅ Stock Management
- ✅ Users Management
- ✅ Coupons Management
- ✅ Shipping Management (preparado)
- ✅ Returns Management (preparado)

## 🎓 Recursos Aprendidos

1. **JWT com Role** - Armazenar role no token JWT
2. **Middleware de Autenticação** - Validar em primeiro nível
3. **Componentes Protegidos** - Desabilitar UI sem lógica
4. **Proteção de APIs** - Validar no servidor
5. **Permissões Centralizadas** - Matriz única de verdade

## 🆘 Troubleshooting

### Erro: "Usuários não foram criados"
```bash
# Verifique o arquivo .env
cat .env | grep DATABASE_URL

# Teste a conexão
npx prisma db execute --stdin < create-visitor-user.sql
```

### Erro: "TypeError: Cannot read property 'role' of undefined"
```bash
# Sincronize o banco
npx prisma migrate deploy
npx prisma db push
```

### Visitante vê botões de ação
```bash
# Limpe o cache do navegador
# Ctrl+Shift+Delete ou Cmd+Shift+Delete
# Depois reload a página
```

## 📞 Suporte

Se encontrar problemas:

1. **Verifique .env** - `DATABASE_URL` e `JWT_SECRET` existem?
2. **Verifique Banco** - `npx prisma db push`
3. **Recrie Usuários** - `npx ts-node prisma/create-test-users.ts`
4. **Limpe Cache** - Ctrl+Shift+Delete no navegador
5. **Reinicie** - `npm run dev`

## 🎉 Pronto!

Seu sistema de usuário VISITANTE está:
- ✅ Implementado
- ✅ Testado
- ✅ Documentado
- ✅ Pronto para produção

---

**Próximos passos:**
1. `npm run dev` para iniciar
2. Login com `visitante@demo.com`
3. Explore o dashboard
4. Todos os botões de ação estarão desabilitados ✨

**Dúvidas?** Consulte os arquivos de documentação acima!
