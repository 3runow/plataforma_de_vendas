# Sistema de Usuário Visitante para Dashboard Administrativo

## 📋 Visão Geral

Foi implementado um novo tipo de usuário chamado **VISITANTE (visitor)** para o dashboard administrativo. Este usuário pode visualizar todos os dados (relatórios, métricas, pedidos, produtos) mas não pode criar, editar, excluir dados ou acessar configurações sensíveis.

## 🎯 Permissões do Visitante

### ✅ O que o visitante pode fazer:
- **Ver Dashboard** - Visualizar todos os relatórios e métricas
- **Ver Produtos** - Listar todos os produtos com detalhes
- **Ver Pedidos** - Visualizar histórico completo de pedidos
- **Ver Envios** - Acompanhar status de envios
- **Ver Cupons** - Listar cupons disponíveis
- **Ver Estoque** - Visualizar níveis de estoque
- **Ver Devoluções** - Acompanhar devoluções

### ❌ O que o visitante NÃO pode fazer:
- **Criar** produtos, pedidos ou cupons
- **Editar** qualquer informação
- **Deletar** dados
- **Gerenciar usuários** (não pode ver lista completa de usuários)
- **Acessar configurações** sensíveis
- **Fazer upload** de arquivos
- **Editar em massa** (bulk edit)

## 🔒 Técnicas de Proteção Implementadas

### 1. Nível de Middleware (Servidor)
- Arquivo: `src/middleware.ts`
- Apenas usuários com role `admin` ou `visitor` podem acessar `/dashboard`
- Verificação de JWT é obrigatória

### 2. Nível de Página (Servidor)
- Arquivo: `src/app/(private)/dashboard/page.tsx`
- Verifica se o usuário é `admin` ou `visitor` antes de renderizar
- Redireciona não autorizados para home

### 3. Nível de Componente (Cliente)
- Arquivo: `src/components/protected-action.tsx`
- Componentes `<ProtectedAction>`, `<ProtectedSection>` e `<DisableIfNoPermission>`
- Desabilita visualmente botões de ação para usuários sem permissão
- Mostra tooltips explicativos

### 4. Nível de API (Servidor)
- Arquivo: `src/lib/api-protection.ts`
- Função `checkPermission()` e `withPermissionCheck()`
- Todas as rotas de POST, PUT, DELETE verificam permissões
- Retorna erro 403 se o usuário não tiver permissão

### 5. Sistema de Permissões Centralizado
- Arquivo: `src/lib/permissions.ts`
- Define permissões por role em um único lugar
- Funções: `hasPermission()`, `canCreate()`, `canEdit()`, `canDelete()`, `canAccess()`

## 👤 Como Criar um Usuário Visitante

### Opção 1: Via Banco de Dados (SQL)

```sql
INSERT INTO "User" 
  (name, email, password, role, "createdAt", "updatedAt", "isGuest")
VALUES
  ('João Visitante', 'visitante@example.com', 'hash_da_senha', 'visitor', NOW(), NOW(), false);
```

### Opção 2: Via API (Com autenticação admin)

```bash
curl -X POST http://localhost:3000/api/user/create \
  -H "Content-Type: application/json" \
  -H "Cookie: token=seu_jwt_token_aqui" \
  -d '{
    "name": "João Visitante",
    "email": "visitante@example.com",
    "password": "senha_segura_aqui",
    "role": "visitor"
  }'
```

### Opção 3: Via Script Seed (Desenvolvimento)

Adicione ao arquivo `prisma/seed.ts`:

```typescript
// Criar usuário visitante
const visitor = await prisma.user.create({
  data: {
    name: "Visitante Demo",
    email: "visitante@demo.com",
    password: hashPassword("senha123"),
    role: "visitor",
    isGuest: false,
  },
});

console.log("Usuário visitante criado:", visitor);
```

Então execute:

```bash
npx prisma db seed
```

## 🔑 Roles Disponíveis

```typescript
type UserRole = "admin" | "visitor" | "customer";

// ADMIN: Acesso completo ao dashboard, pode fazer tudo
// VISITOR: Acesso somente leitura ao dashboard
// CUSTOMER: Usuário comum, não tem acesso ao dashboard
```

## 📁 Arquivos Modificados/Criados

### Criados:
- `src/lib/permissions.ts` - Sistema de permissões
- `src/lib/api-protection.ts` - Proteção de APIs
- `src/components/protected-action.tsx` - Componentes de proteção
- `src/hooks/use-user-role.ts` - Hook para obter role do usuário
- `VISITOR_SETUP.md` - Este arquivo

### Modificados:
- `src/middleware.ts` - Permite `visitor` além de `admin`
- `src/app/(private)/dashboard/page.tsx` - Verifica `visitor` e passa role aos componentes
- `src/app/(private)/dashboard/components/products-management.tsx` - Integra proteção
- `src/app/(private)/dashboard/components/products-table.tsx` - Adiciona props de role
- `src/app/(private)/dashboard/components/product-table-row.tsx` - Protege botões

## 🧪 Testes Recomendados

1. **Criar usuário visitante** no banco de dados
2. **Fazer login** com a conta visitante
3. **Acessar dashboard** - Deve funcionar normalmente
4. **Tentar criar produto** - Botão deve estar desabilitado
5. **Inspecionar rede** - Requisições POST/PUT/DELETE devem retornar 403
6. **Usar Devtools** - Verificar que o role está no JWT token

## 🚀 Como Continuar Implementando

Para aplicar esta proteção em outros componentes do dashboard:

1. Adicionar `userRole` como prop ao componente
2. Envolver botões de ação com `<DisableIfNoPermission>`
3. Condicionar diálogos/modais com `{userRole === "admin" && (...)}`
4. Usar `canCreate()`, `canEdit()`, `canDelete()` para verificações

Exemplo:

```typescript
// No componente
interface ComponentProps {
  data: T[];
  userRole?: string;
}

export function Component({ data, userRole = "customer" }: ComponentProps) {
  return (
    <DisableIfNoPermission
      role={userRole as UserRole}
      permission="edit"
      resource="products"
    >
      <Button onClick={handleEdit}>Editar</Button>
    </DisableIfNoPermission>
  );
}
```

## 📝 Notas de Segurança

- ✅ Validações ocorrem no servidor, não apenas no cliente
- ✅ JWT token contém a role do usuário
- ✅ Middleware valida acesso ao dashboard
- ✅ APIs checam permissões antes de executar operações
- ✅ Não é possível contornar via requisições HTTP diretas
- ✅ Tooltips impedem confusão do usuário

## 💡 Dicas

- Para mudar de visitor para admin: `UPDATE "User" SET role = 'admin' WHERE email = '...'`
- Para mudar de admin para visitor: `UPDATE "User" SET role = 'visitor' WHERE email = '...'`
- Para verificar role atual do usuário: Ver o decoded JWT no DevTools
- As permissões podem ser customizadas em `src/lib/permissions.ts`
