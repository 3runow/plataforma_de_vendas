# Sistema de Cupons de Desconto

## Visão Geral
O sistema de cupons permite que administradores criem cupons de desconto personalizados que os clientes podem aplicar durante o checkout para obter descontos em suas compras.

## Características Principais

### Para Administradores

#### Gerenciamento de Cupons (Dashboard)
- **Localização**: Dashboard > Aba "Cupons"
- **Funcionalidades**:
  - ✅ Criar novos cupons
  - ✅ Visualizar todos os cupons cadastrados
  - ✅ Ativar/desativar cupons
  - ✅ Deletar cupons
  - ✅ Acompanhar uso de cupons

#### Campos do Cupom
1. **Código** (obrigatório): Nome do cupom em maiúsculas (ex: DESCONTO10)
2. **Desconto** (obrigatório): Porcentagem de 0% a 100%
3. **Status**: Ativo/Inativo
4. **Data de Expiração** (opcional): Data limite para uso
5. **Limite de Uso** (opcional): Número máximo de vezes que pode ser usado
6. **Contador de Uso**: Rastreia quantas vezes foi usado

### Para Clientes

#### Aplicação no Checkout
- **Localização**: Página de Checkout > Seção de Pagamento
- **Como Usar**:
  1. Digite o código do cupom no campo específico
  2. Clique em "Aplicar"
  3. O desconto é calculado e aplicado automaticamente
  4. O resumo do pedido mostra:
     - Subtotal
     - Frete
     - **Desconto (código do cupom)**
     - Total final

#### Validações Automáticas
- ❌ Cupom não encontrado
- ❌ Cupom inativo
- ❌ Cupom expirado
- ❌ Limite de uso atingido
- ✅ Cupom válido - desconto aplicado!

## Exemplos de Uso

### Criar Cupom de 10% de Desconto
```
Código: DESCONTO10
Desconto: 10
Status: Ativo
Data de Expiração: (vazio para sem limite)
Limite de Uso: (vazio para ilimitado)
```

### Criar Cupom Promocional Limitado
```
Código: BLACKFRIDAY
Desconto: 25
Status: Ativo
Data de Expiração: 30/11/2025
Limite de Uso: 100
```

### Criar Cupom para Primeiro Cliente
```
Código: BEMVINDO
Desconto: 15
Status: Ativo
Data de Expiração: (vazio)
Limite de Uso: 1
```

## Fluxo Técnico

### 1. Cliente Aplica Cupom
- Input valida código
- Envia para `/api/coupons/validate`
- API verifica:
  - Cupom existe?
  - Está ativo?
  - Não expirou?
  - Não atingiu limite?
- Retorna desconto ou erro

### 2. Cálculo do Desconto
```javascript
subtotal = produtos + frete
desconto = subtotal × (cupom.discount / 100)
total = subtotal - desconto
```

### 3. Finalização do Pedido
- Pedido criado com valor já descontado
- Contador de uso do cupom é incrementado
- Código do cupom salvo no pedido (para referência)

## APIs Disponíveis

### `GET /api/coupons`
- Listar todos os cupons (admin only)

### `POST /api/coupons`
- Criar novo cupom (admin only)

### `POST /api/coupons/validate`
- Validar cupom (público)
- Body: `{ "code": "DESCONTO10" }`

### `PATCH /api/coupons/[id]`
- Atualizar cupom (admin only)

### `DELETE /api/coupons/[id]`
- Deletar cupom (admin only)

## Modelo de Dados

```prisma
model Coupon {
  id          Int       @id @default(autoincrement())
  code        String    @unique
  discount    Float
  isActive    Boolean   @default(true)
  expiresAt   DateTime?
  usageLimit  Int?
  usedCount   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## Dicas de Uso

### Para Administradores
- 💡 Use códigos curtos e memoráveis (ex: DESCONTO10, FRETEGRATIS)
- 💡 Defina datas de expiração para cupons sazonais
- 💡 Use limite de uso para promoções especiais
- 💡 Desative cupons temporariamente sem deletá-los
- 💡 Monitore o contador de uso para analisar efetividade

### Para Desenvolvimento
- Os cupons são validados em tempo real
- O desconto é aplicado antes do pagamento ser processado
- O valor total enviado ao Stripe já inclui o desconto
- Cupons expirados não podem ser usados
- O incremento do contador é automático após criação do pedido

## Troubleshooting

### "Cupom não encontrado"
- Verifique se o código está correto
- Códigos são case-insensitive (convertidos para maiúsculas)

### "Cupom inativo"
- Administrador precisa ativar o cupom no dashboard

### "Cupom expirado"
- Verifique a data de expiração no dashboard
- Crie novo cupom ou atualize a data

### "Cupom atingiu limite de uso"
- Aumente o limite de uso ou crie novo cupom
- Verifique contador no dashboard

## Próximos Passos Possíveis

- [ ] Adicionar descontos em valor fixo (além de porcentagem)
- [ ] Cupons específicos por produto/categoria
- [ ] Cupons exclusivos para primeiro pedido
- [ ] Sistema de geração automática de cupons
- [ ] Relatórios de uso de cupons
- [ ] Cupons personalizados por usuário
