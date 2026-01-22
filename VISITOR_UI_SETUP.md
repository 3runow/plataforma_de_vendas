# 🎯 Adição de Opção VISITANTE no Gerenciamento de Usuários

## ✅ O que foi implementado

Você agora pode **alterar o tipo de usuário diretamente no dashboard**, adicionando a opção **VISITANTE** junto com Admin e Cliente.

## 📊 Interface Updated

### Gerenciamento de Usuários
- ✅ Filtro por tipo agora inclui "Visitantes"
- ✅ Dropdown para mudar role agora tem "Visitante"
- ✅ Cor visual diferente para visitantes (cor âmbar/amarela)
- ✅ Rótulo "Visitante" exibido corretamente

### Cores por Tipo
- **Admin** 🟣 Purple/Roxo
- **Visitante** 🟨 Amber/Amarelo
- **Cliente** 🟦 Blue/Azul

## 📁 Arquivos Modificados

### 1. `src/app/(private)/dashboard/components/users-management.tsx`
- ✅ Atualizada função `getRoleColor()` para incluir cor para visitante
- ✅ Atualizada função `getRoleLabel()` para exibir "Visitante"
- ✅ Filtro agora tem opção "Visitantes"
- ✅ Dropdown de mudança de role agora tem "Visitante" em ambas as visualizações (desktop e mobile)

## 📁 Arquivos Criados

### 2. `src/app/api/users/[id]/route.ts` (Novo!)
API completa para gerenciar usuários:

#### **PUT** - Atualizar usuário
```bash
curl -X PUT http://localhost:3000/api/users/123 \
  -H "Content-Type: application/json" \
  -H "Cookie: token=seu_jwt_admin" \
  -d '{
    "role": "visitor",
    "name": "João Silva",
    "email": "joao@example.com"
  }'
```

Resposta:
```json
{
  "message": "Usuário atualizado com sucesso",
  "user": {
    "id": 123,
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "visitor",
    "createdAt": "2025-01-15T...",
    "updatedAt": "2025-01-15T..."
  }
}
```

#### **DELETE** - Deletar usuário
```bash
curl -X DELETE http://localhost:3000/api/users/123 \
  -H "Cookie: token=seu_jwt_admin"
```

#### **GET** - Obter dados do usuário
```bash
curl http://localhost:3000/api/users/123 \
  -H "Cookie: token=seu_jwt_admin"
```

## 🔐 Permissões da API

- ✅ Apenas **admin** pode chamar essas APIs
- ✅ Admin não pode deletar a si mesmo
- ✅ Validação de dados com Zod
- ✅ Suporte a roles: `customer`, `visitor`, `admin`

## 🎨 Como Usar (Interface)

### 1. Acessar Gerenciamento de Usuários
- Vá para `/dashboard` → Aba "Usuários"

### 2. Filtrar por Tipo
- Use o dropdown no topo
- Opções: "Todos", "Clientes", **"Visitantes"**, "Administradores"

### 3. Alterar Role de um Usuário
Na tabela (desktop) ou cards (mobile):
- Clique no dropdown do usuário
- Selecione: Cliente, **Visitante**, ou Admin
- A mudança é aplicada imediatamente!

### 4. Badges Visuais
Cada usuário exibe sua cor:
- Roxo = Admin
- **Amarelo = Visitante** ⭐
- Azul = Cliente

## 📝 Exemplo: Criar um Visitante via Interface

1. **Criar um novo usuário** (se ainda não existir):
   ```bash
   npx ts-node prisma/create-test-users.ts
   # Ou criar manualmente via API de signup
   ```

2. **Ir para Dashboard → Usuários**
   - Encontre o usuário na lista

3. **Alterar Role**
   - Clique no dropdown
   - Selecione "Visitante"
   - ✅ Pronto! Usuário é agora visitante

## 🧪 Testes

### Teste 1: Mudar para Visitante
```bash
1. Acesse http://localhost:3000/dashboard
2. Vá para aba "Usuários"
3. Clique no dropdown de um usuário
4. Selecione "Visitante"
5. Refresh a página - deve manter como "Visitante"
```

### Teste 2: Filtrar Visitantes
```bash
1. Na aba Usuários
2. Use o filtro no topo: "Visitantes"
3. Deve mostrar apenas usuários com role "visitor"
```

### Teste 3: API de Atualização
```bash
curl -X PUT http://localhost:3000/api/users/2 \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$(cat cookie.txt)" \
  -d '{"role": "visitor"}'
```

## ✨ Recursos

### Validação
- ✅ Role deve ser: `customer`, `visitor` ou `admin`
- ✅ Email deve ser válido
- ✅ Nome deve ter entre 1 e 255 caracteres

### Segurança
- ✅ Apenas admin pode atualizar
- ✅ Apenas admin pode deletar
- ✅ Admin não pode deletar a si mesmo
- ✅ JWT é obrigatório
- ✅ Role é validado no servidor

## 🚀 Próximos Passos

1. ✅ Já está pronto para usar!
2. Teste a interface
3. Crie alguns visitantes
4. Observe que eles têm acesso somente leitura ao dashboard

## 📊 Antes e Depois

### Antes (Limitado)
```
Dropdown de Roles: Cliente | Admin
Filtro: Todos | Clientes | Administradores
Cores: 2 opções (azul, roxo)
```

### Depois (Completo) ✨
```
Dropdown de Roles: Cliente | Visitante | Admin
Filtro: Todos | Clientes | Visitantes | Administradores
Cores: 3 opções (azul, amarelo, roxo)
```

## 🎓 Resumo

Agora você pode gerenciar **3 tipos de usuários** completamente pela interface:

| Tipo | Dashboard | Criar | Editar | Deletar | Config |
|------|-----------|-------|--------|---------|--------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Visitante** ⭐ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cliente | ❌ | ❌ | ❌ | ❌ | ❌ |

---

**Tudo está pronto! Teste mudando um usuário para "Visitante" e veja ele acessar o dashboard apenas para visualização.** 🎉
