# Logística Reversa - Melhor Envio

## 📦 Visão Geral

Sistema de devolução de produtos integrado com a API de Logística Reversa do Melhor Envio.

## ✨ Funcionalidades Implementadas

### Interface do Cliente
- ✅ Botão "Solicitar Devolução" nos pedidos entregues
- ✅ Confirmação antes de solicitar devolução
- ✅ Feedback visual durante processamento
- ✅ Toast de sucesso/erro

### API
- ✅ Endpoint `/api/shipping/reverse-logistics` (POST)
- ✅ Validação de autenticação
- ✅ Verificação de status do pedido (apenas 'delivered')
- ✅ Registro da solicitação no banco
- ⏳ Integração com API Melhor Envio (pendente)

## 🚀 Como Funciona

### 1. Cliente Solicita Devolução
1. Cliente visualiza pedidos em "Minha Conta"
2. Para pedidos com status "Entregue", aparece o botão "Solicitar Devolução"
3. Ao clicar, uma confirmação é exibida
4. Se confirmado, a solicitação é enviada para o backend

### 2. Processamento Backend
```typescript
POST /api/shipping/reverse-logistics
Body: { orderId: number }
```

**Validações:**
- ✅ Usuário autenticado
- ✅ Pedido existe
- ✅ Pedido pertence ao usuário
- ✅ Pedido está com status 'delivered'

**Ações:**
- Atualiza status do pedido para 'return_requested'
- (Futuro) Cria etiqueta de logística reversa no Melhor Envio
- (Futuro) Envia email com instruções

## 📋 Status de Pedidos

| Status | Descrição | Permite Devolução |
|--------|-----------|-------------------|
| `pending` | Aguardando pagamento | ❌ |
| `processing` | Processando pedido | ❌ |
| `shipped` | Enviado | ❌ |
| `delivered` | Entregue | ✅ |
| `return_requested` | Devolução solicitada | ❌ |
| `cancelled` | Cancelado | ❌ |

## 🔧 Integração com Melhor Envio (TODO)

### Pré-requisitos
1. Token de acesso da API Melhor Envio
2. Cadastro completo do remetente (sua empresa)
3. Saldo suficiente na conta Melhor Envio

### Endpoint da API
```
POST https://melhorenvio.com.br/api/v2/me/shipment/reverse
```

### Dados Necessários

#### FROM (Cliente devolvendo)
```typescript
{
  name: string,          // Nome do cliente
  phone: string,         // Telefone do cliente
  address: string,       // Endereço completo
  number: string,        // Número
  complement: string,    // Complemento (opcional)
  district: string,      // Bairro
  city: string,          // Cidade
  state_abbr: string,    // UF (2 letras)
  postal_code: string    // CEP (sem formatação)
}
```

#### TO (Seu armazém/loja)
```typescript
{
  name: 'Sua Empresa',
  phone: '(11) 1234-5678',
  address: 'Rua da sua loja',
  number: '123',
  complement: 'Galpão 5',
  district: 'Centro',
  city: 'São Paulo',
  state_abbr: 'SP',
  postal_code: '01234567'
}
```

#### Produtos
```typescript
products: [
  {
    name: string,
    quantity: number,
    unitary_value: number
  }
]
```

### Exemplo de Implementação

```typescript
const melhorEnvioToken = process.env.MELHOR_ENVIO_TOKEN;

const response = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/reverse', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${melhorEnvioToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    service: order.shippingService, // Ex: 'correios_pac', 'jadlog'
    from: {
      name: order.address.recipientName,
      phone: order.user.phone,
      address: order.address.street,
      number: order.address.number,
      complement: order.address.complement || '',
      district: order.address.neighborhood,
      city: order.address.city,
      state_abbr: order.address.state,
      postal_code: order.address.cep.replace(/\D/g, ''),
    },
    to: {
      // Dados da sua empresa/armazém
      name: process.env.COMPANY_NAME,
      phone: process.env.COMPANY_PHONE,
      address: process.env.COMPANY_ADDRESS,
      number: process.env.COMPANY_NUMBER,
      district: process.env.COMPANY_DISTRICT,
      city: process.env.COMPANY_CITY,
      state_abbr: process.env.COMPANY_STATE,
      postal_code: process.env.COMPANY_CEP,
    },
    products: order.items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      unitary_value: item.product.price,
    })),
  }),
});

const data = await response.json();

// Resposta de sucesso
{
  id: 'abc123',
  protocol: 'REV123456',
  tracking: 'AA123456789BR',
  label: {
    url: 'https://...' // URL da etiqueta em PDF
  }
}
```

## 📧 Notificações (TODO)

### Email para Cliente
Quando a devolução for aprovada, enviar email com:
- Código de rastreamento
- Link para etiqueta (PDF)
- Instruções de como enviar o pacote
- Prazo para postagem
- Endereço de destino

### Email para Administrador
Notificar sobre:
- Nova solicitação de devolução
- Código do pedido
- Motivo da devolução (adicionar campo)
- Dados do cliente

## 🗃️ Modelo de Dados (Sugestão Futura)

Adicionar tabela específica para devoluções:

```prisma
model ReverseLogistics {
  id                  Int       @id @default(autoincrement())
  orderId             Int       @unique
  status              String    @default("requested")
  reason              String?
  melhorEnvioId       String?
  trackingCode        String?
  labelUrl            String?
  requestedAt         DateTime  @default(now())
  approvedAt          DateTime?
  completedAt         DateTime?
  order               Order     @relation(fields: [orderId], references: [id])
}
```

**Status possíveis:**
- `requested` - Solicitado pelo cliente
- `approved` - Aprovado pelo admin
- `label_generated` - Etiqueta gerada
- `in_transit` - Em trânsito
- `completed` - Concluído
- `rejected` - Rejeitado

## 🔐 Variáveis de Ambiente Necessárias

Adicionar ao `.env`:

```env
# Melhor Envio API
MELHOR_ENVIO_TOKEN=seu_token_aqui

# Dados da Empresa (para logística reversa)
COMPANY_NAME="Nome da Sua Empresa"
COMPANY_PHONE="11987654321"
COMPANY_ADDRESS="Rua Principal"
COMPANY_NUMBER="123"
COMPANY_DISTRICT="Centro"
COMPANY_CITY="São Paulo"
COMPANY_STATE="SP"
COMPANY_CEP="01234567"
```

## 📚 Documentação Melhor Envio

- [Logística Reversa](https://docs.melhorenvio.com.br/docs/reverse-logistics)
- [Autenticação](https://docs.melhorenvio.com.br/docs/authentication)
- [Referência da API](https://docs.melhorenvio.com.br/reference)

## 🎯 Próximos Passos

1. [ ] Adicionar campo "motivo da devolução" no formulário
2. [ ] Implementar integração real com API Melhor Envio
3. [ ] Criar modelo ReverseLogistics no Prisma
4. [ ] Adicionar sistema de notificações por email
5. [ ] Criar painel administrativo para gerenciar devoluções
6. [ ] Implementar rastreamento de devoluções
7. [ ] Adicionar prazo limite para solicitação de devolução (ex: 7 dias)
8. [ ] Permitir upload de fotos do produto na devolução
9. [ ] Adicionar sistema de reembolso automático

## 💡 Melhorias Futuras

- Dashboard de devoluções para admin
- Estatísticas de devoluções por produto
- Integração com sistema de estoque (reposição automática)
- Workflow de aprovação de devoluções
- Chat para comunicação sobre devolução
- Voucher/crédito para próximas compras
