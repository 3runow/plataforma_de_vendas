# 🎨 Guia Rápido: Opção Visitante no Dashboard

## 📍 Onde Encontrar

### Passo 1: Acesse o Dashboard
```
URL: http://localhost:3000/dashboard
```

### Passo 2: Vá para Aba "Usuários"
```
Clique na aba "Usuários" ou "User" (em mobile)
```

## 🎯 O que Mudou

### Novo Filtro
```
┌─────────────────────────────────┐
│ Filtro por tipo:                │
│ ┌─────────────────────────────┐ │
│ │ Todos                    ▼ │ │
│ ├─────────────────────────────┤ │
│ │ • Todos                     │ │
│ │ • Clientes                  │ │
│ │ • Visitantes        ⭐ NEW │ │
│ │ • Administradores           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Novo Dropdown de Mudança de Role
```
Na tabela de usuários, coluna "Ações":

Antes:
┌──────────────────┐
│ Cliente      ▼ │
├──────────────────┤
│ • Cliente        │
│ • Admin          │
└──────────────────┘

Depois:
┌──────────────────┐
│ Cliente      ▼ │  ⭐ Agora maior
├──────────────────┤
│ • Cliente        │
│ • Visitante  ⭐ │  ⭐ NOVO!
│ • Admin          │
└──────────────────┘
```

## 🔄 Como Alterar Um Usuário para Visitante

### Desktop (Tabela)
```
1. Procure o usuário na tabela
2. Vá até a coluna "Tipo" (Ações)
3. Clique no dropdown onde está "Cliente" ou "Admin"
4. Selecione "Visitante"
5. ✅ Pronto! Usuário agora é visitante
6. A badge ao lado muda para "Visitante" (cor amarela)
```

### Mobile (Cards)
```
1. Deslize até encontrar o usuário
2. Ele aparece em um card
3. Na seção "Ações" na base do card
4. Clique no dropdown
5. Selecione "Visitante"
6. ✅ Pronto!
```

## 🎨 Cores

```
┌──────────────────────────────────────┐
│ Badge de Tipo de Usuário             │
├──────────────────────────────────────┤
│ 🟣 Admin         → Roxo/Purple       │
│ 🟨 Visitante ⭐ → Amarelo/Amber      │
│ 🟦 Cliente       → Azul/Blue         │
└──────────────────────────────────────┘
```

## 📊 Exemplo Visual Completo

```
┌─── DASHBOARD: USUÁRIOS ────────────────────────────────┐
│                                                         │
│ 👥 Gerenciamento de Usuários                           │
│ Visualize e gerencie usuários da plataforma           │
│                                                         │
│ Filtrar por tipo: [Todos ▼]                            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Desktop View (lg screens)                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ID │ Nome       │ Email      │ Tipo          │ Ações  │
│────┼────────────┼────────────┼───────────────┼────────│
│ 1  │ João Admin │ john@...   │ 🟣 Admin      │ [Admin▼]
│ 2  │ Maria Visit│ maria@...  │ 🟨 Visitante  │ [Visit▼]
│ 3  │ Pedro Cli  │ pedro@...  │ 🟦 Cliente    │ [Clien▼]
│                                                         │
│ [Cliente ▼]                                            │
│ ├─ Cliente                                             │
│ ├─ Visitante ⭐ NEW                                    │
│ └─ Admin                                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## ⚡ Ações Rápidas

### Mudar para Visitante
```
Usuário atual: Cliente
              ↓
Click dropdown [Cliente ▼]
              ↓
Selecionar "Visitante"
              ↓
✅ Usuário agora é VISITANTE
   Badge muda para 🟨 Visitante
```

### Filtrar Visitantes
```
Filtro: [Todos ▼]
         ↓
Click em "Visitantes"
         ↓
✅ Mostra apenas usuários com role "visitor"
```

## 📱 Em Dispositivos Diferentes

### Desktop
- Tabela completa com todas as colunas
- Dropdown larger em cada linha
- Melhor visualização

### Tablet
- Cards em grid
- Dropdown adaptado
- Mais compacto

### Mobile
- Cards em stack (um abaixo do outro)
- Dropdown responsivo
- Menos espaço, mesmo funcional

## 🆘 Troubleshooting

### Dropdown não aparece "Visitante"?
```
1. Refresh a página (F5)
2. Limpe cache do navegador (Ctrl+Shift+Delete)
3. Verifique console para erros (F12)
```

### Não consegue mudar para Visitante?
```
1. Verifique se você é ADMIN
2. Verifique conexão com servidor
3. Veja a aba Network no DevTools
4. Deve retornar status 200
```

### Cor não muda para Amarelo?
```
1. Refresh a página
2. Verifique se o CSS foi carregado
3. Abra DevTools e inspecione o elemento
```

## 🎓 Resumo Visual

```
┌─────────────────────────────────────────────┐
│         ANTES vs DEPOIS                     │
├─────────────────────────────────────────────┤
│                                             │
│ ANTES:                   DEPOIS:            │
│ 📋 Opções: 2            📋 Opções: 3      │
│ ├─ Cliente              ├─ Cliente        │
│ └─ Admin                ├─ Visitante ⭐   │
│                         └─ Admin          │
│                                             │
│ 🎨 Cores: 2            🎨 Cores: 3      │
│ ├─ 🟦 Blue             ├─ 🟦 Blue        │
│ └─ 🟣 Purple           ├─ 🟨 Amber ⭐   │
│                        └─ 🟣 Purple      │
│                                             │
│ 🔍 Filtros: 3           🔍 Filtros: 4   │
│ ├─ Todos                ├─ Todos         │
│ ├─ Clientes             ├─ Clientes      │
│ └─ Admins               ├─ Visitantes ⭐ │
│                         └─ Admins        │
└─────────────────────────────────────────────┘
```

## ✅ Checklist de Uso

- [ ] Acessa `/dashboard`
- [ ] Clica em "Usuários"
- [ ] Vê filtro com "Visitantes"
- [ ] Clica num dropdown de usuário
- [ ] Vê "Visitante" como opção
- [ ] Seleciona "Visitante"
- [ ] Vê badge mudar para 🟨 Visitante
- [ ] Filtra por "Visitantes"
- [ ] Vê apenas visitantes na lista

## 🎉 Pronto!

Você consegue agora alterar qualquer usuário para VISITANTE direto pelo dashboard!

---

**Próximo passo:** Teste fazer login com um visitante e veja o acesso restrito ao dashboard! 🔐
