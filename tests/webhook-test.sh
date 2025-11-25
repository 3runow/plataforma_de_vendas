#!/bin/bash

# Script de teste para Webhooks do Melhor Envio
# Uso: ./webhook-test.sh [URL] [TRACKING_CODE]

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
URL="${1:-http://localhost:3001/api/webhooks/melhor-envio/tracking}"
TRACKING_CODE="${2:-PX123456789BR}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🧪 TESTE DE WEBHOOK MELHOR ENVIO${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "URL: ${YELLOW}$URL${NC}"
echo -e "Tracking Code: ${YELLOW}$TRACKING_CODE${NC}"
echo ""

# Função para testar um status específico
test_status() {
    local status=$1
    local message=$2
    
    echo -e "${BLUE}📦 Testando status: ${YELLOW}$status${NC}"
    echo -e "   Mensagem: $message"
    
    PAYLOAD=$(cat <<EOF
{
  "tracking": "$TRACKING_CODE",
  "status": "$status",
  "message": "$message",
  "occurred_at": "$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")",
  "location": {
    "city": "São Paulo",
    "state": "SP"
  }
}
EOF
)
    
    echo ""
    echo -e "${YELLOW}Payload:${NC}"
    echo "$PAYLOAD" | jq '.'
    echo ""
    
    RESPONSE=$(curl -s -X POST "$URL" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$URL" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")
    
    echo -e "${YELLOW}HTTP Status Code: $HTTP_CODE${NC}"
    echo ""
    
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ Resposta:${NC}"
        echo "$RESPONSE" | jq '.'
    else
        echo -e "${RED}❌ Erro:${NC}"
        echo "$RESPONSE" | jq '.'
    fi
    
    echo ""
    echo -e "${BLUE}----------------------------------------${NC}"
    echo ""
    
    # Aguardar 2 segundos entre testes
    sleep 2
}

# Testes de diferentes status

echo -e "${GREEN}=== TESTE 1: Pedido Postado ===${NC}"
test_status "posted" "Objeto postado nos Correios"

echo -e "${GREEN}=== TESTE 2: Em Trânsito ===${NC}"
test_status "transit" "Objeto em trânsito para a cidade de destino"

echo -e "${GREEN}=== TESTE 3: Saiu para Entrega ===${NC}"
test_status "out_for_delivery" "Objeto saiu para entrega ao destinatário"

echo -e "${GREEN}=== TESTE 4: Entregue ===${NC}"
test_status "delivered" "Objeto entregue ao destinatário"

# Teste de regressão (deve ser bloqueado)
echo -e "${RED}=== TESTE 5: Regressão (deve falhar) ===${NC}"
echo -e "${RED}Tentando retroceder de 'delivered' para 'transit'${NC}"
test_status "transit" "Tentativa de regressão de status"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ TESTES CONCLUÍDOS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}💡 Dicas:${NC}"
echo "   - Verifique os logs do servidor para mais detalhes"
echo "   - Confira o banco de dados para ver as mudanças"
echo "   - O último teste (regressão) deve ter sido bloqueado"
echo ""
