/**
 * TESTES DO SISTEMA DE ENVIOS
 * 
 * Execute com: npm run test (adicione o script ao package.json)
 * ou teste manualmente as funções abaixo
 */

// ============================================
// IMPORTS
// ============================================

import { getMelhorEnvioService } from '@/lib/melhor-envio';

// ============================================
// CONFIGURAÇÃO DE TESTES
// ============================================

const TEST_CONFIG = {
  // Use CEPs válidos para teste
  FROM_ZIP: '01310100', // Av Paulista, SP
  TO_ZIP: '20040020',   // Centro, RJ
  
  // Dados de produto de teste
  PRODUCT: {
    weight: 0.5, // kg
    width: 20,   // cm
    height: 10,  // cm
    length: 30,  // cm
    value: 100,  // R$
  },
  
  // Dados de endereço de teste
  TEST_ADDRESS: {
    name: 'João Silva',
    phone: '21987654321',
    email: 'teste@example.com',
    document: '12345678900',
    address: 'Rua Teste',
    number: '123',
    complement: 'Apto 101',
    district: 'Centro',
    city: 'Rio de Janeiro',
    state_abbr: 'RJ',
    country_id: 'BR',
    postal_code: '20040020',
  },
};

// ============================================
// TESTE 1: VALIDAR TOKEN
// ============================================

export async function testValidateToken() {
  console.log('🧪 Teste 1: Validar Token do Melhor Envio\n');
  
  try {
    const melhorEnvio = getMelhorEnvioService();
    const isValid = await melhorEnvio.validateToken();
    
    if (isValid) {
      console.log('✅ Token válido!');
      console.log('✅ Conexão com Melhor Envio estabelecida\n');
      return true;
    } else {
      console.log('❌ Token inválido!');
      console.log('Verifique a variável MELHOR_ENVIO_TOKEN no .env\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao validar token:', error);
    return false;
  }
}

// ============================================
// TESTE 2: CALCULAR FRETE
// ============================================

export async function testCalculateShipping() {
  console.log('🧪 Teste 2: Calcular Frete\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/shipping/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [{ id: 1, quantity: 1 }],
        toZipCode: TEST_CONFIG.TO_ZIP,
        fromZipCode: TEST_CONFIG.FROM_ZIP,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok && data.options?.length > 0) {
      console.log('✅ Cotação realizada com sucesso!');
      console.log(`✅ ${data.options.length} opções de frete encontradas\n`);
      
      console.log('📦 Opções disponíveis:');
      data.options.forEach(
        (
          option: {
            company: string;
            name: string;
            discountedPrice: number;
            deliveryTime: number;
          },
          index: number,
        ) => {
        console.log(`\n${index + 1}. ${option.company} - ${option.name}`);
        console.log(`   Preço: R$ ${option.discountedPrice.toFixed(2)}`);
        console.log(`   Prazo: ${option.deliveryTime} dias úteis`);
      });
      console.log();
      
      return data;
    } else {
      console.log('❌ Falha ao calcular frete');
      console.log('Resposta:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao calcular frete:', error);
    return null;
  }
}

// ============================================
// TESTE 3: VERIFICAR SALDO
// ============================================

export async function testCheckBalance() {
  console.log('🧪 Teste 3: Verificar Saldo\n');
  
  try {
    const melhorEnvio = getMelhorEnvioService();
    const balance = await melhorEnvio.getBalance();
    
    console.log('✅ Saldo obtido com sucesso!');
    console.log(`💰 Saldo disponível: R$ ${balance.toFixed(2)}\n`);
    
    if (balance < 10) {
      console.log('⚠️  Aviso: Saldo baixo! Adicione saldo na carteira do Melhor Envio\n');
    }
    
    return balance;
  } catch (error) {
    console.error('❌ Erro ao verificar saldo:', error);
    return null;
  }
}

// ============================================
// TESTE 4: COTAÇÃO DIRETA (Serviço)
// ============================================

export async function testDirectQuote() {
  console.log('🧪 Teste 4: Cotação Direta (usando serviço)\n');
  
  try {
    const melhorEnvio = getMelhorEnvioService();
    
    const quotes = await melhorEnvio.calculateShipping({
      from: {
        postal_code: TEST_CONFIG.FROM_ZIP,
      },
      to: {
        postal_code: TEST_CONFIG.TO_ZIP,
      },
      package: {
        weight: TEST_CONFIG.PRODUCT.weight,
        width: TEST_CONFIG.PRODUCT.width,
        height: TEST_CONFIG.PRODUCT.height,
        length: TEST_CONFIG.PRODUCT.length,
      },
      options: {
        insurance_value: TEST_CONFIG.PRODUCT.value,
      },
    });
    
    const validQuotes = quotes.filter((q) => !q.error);
    
    console.log('✅ Cotação realizada com sucesso!');
    console.log(`✅ ${validQuotes.length} serviços disponíveis\n`);
    
    console.log('📦 Detalhes das cotações:');
    validQuotes.forEach((quote) => {
      console.log(`\n${quote.company.name} - ${quote.name}`);
      console.log(`  ID: ${quote.id}`);
      console.log(`  Preço: R$ ${quote.price}`);
      console.log(`  Desconto: R$ ${quote.discount}`);
      console.log(`  Preço final: R$ ${quote.custom_price || quote.price}`);
      console.log(`  Prazo: ${quote.delivery_time} dias`);
    });
    console.log();
    
    return validQuotes;
  } catch (error) {
    console.error('❌ Erro ao fazer cotação direta:', error);
    return null;
  }
}

// ============================================
// TESTE 5: LISTAR AGÊNCIAS
// ============================================

export async function testListAgencies() {
  console.log('🧪 Teste 5: Listar Agências\n');
  
  try {
    const melhorEnvio = getMelhorEnvioService();
    const agencies = await melhorEnvio.getAgencies({
      state: 'SP',
      city: 'São Paulo',
    });
    
    console.log('✅ Agências obtidas com sucesso!');
    console.log(`✅ ${agencies.length} agências encontradas em São Paulo\n`);
    
    if (agencies.length > 0) {
      console.log('📍 Primeiras 5 agências:');
      agencies.slice(0, 5).forEach((agency, index) => {
        console.log(`\n${index + 1}. ${agency.name}`);
        console.log(`   Endereço: ${agency.address}`);
      });
      console.log();
    }
    
    return agencies;
  } catch (error) {
    console.error('❌ Erro ao listar agências:', error);
    return null;
  }
}

// ============================================
// TESTE 6: TESTE COMPLETO DE API
// ============================================

export async function testCompleteAPIFlow() {
  console.log('🧪 Teste 6: Fluxo Completo de API\n');
  console.log('Este teste simula o fluxo completo de envio\n');
  
  const results = {
    validateToken: false,
    calculateShipping: false,
    checkBalance: false,
  };
  
  // 1. Validar token
  console.log('1️⃣ Validando token...');
  results.validateToken = await testValidateToken();
  
  if (!results.validateToken) {
    console.log('❌ Teste interrompido: Token inválido\n');
    return results;
  }
  
  // 2. Verificar saldo
  console.log('2️⃣ Verificando saldo...');
  const balance = await testCheckBalance();
  results.checkBalance = balance !== null && balance > 0;
  
  // 3. Calcular frete
  console.log('3️⃣ Calculando frete...');
  const quotes = await testCalculateShipping();
  results.calculateShipping = quotes !== null;
  
  // Resumo
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(50));
  console.log(`Validar Token: ${results.validateToken ? '✅' : '❌'}`);
  console.log(`Verificar Saldo: ${results.checkBalance ? '✅' : '❌'}`);
  console.log(`Calcular Frete: ${results.calculateShipping ? '✅' : '❌'}`);
  console.log('='.repeat(50) + '\n');
  
  const allPassed = Object.values(results).every(Boolean);
  
  if (allPassed) {
    console.log('🎉 Todos os testes passaram!');
    console.log('✅ Sistema de envios está funcionando corretamente\n');
  } else {
    console.log('⚠️  Alguns testes falharam');
    console.log('Verifique a configuração e tente novamente\n');
  }
  
  return results;
}

// ============================================
// TESTE 7: VALIDAÇÃO DE DADOS
// ============================================

export async function testDataValidation() {
  console.log('🧪 Teste 7: Validação de Dados\n');
  
  const tests = {
    cepValid: /^\d{8}$/.test(TEST_CONFIG.FROM_ZIP),
    weightValid: TEST_CONFIG.PRODUCT.weight > 0 && TEST_CONFIG.PRODUCT.weight <= 30,
    dimensionsValid: 
      TEST_CONFIG.PRODUCT.width > 0 &&
      TEST_CONFIG.PRODUCT.height > 0 &&
      TEST_CONFIG.PRODUCT.length > 0,
  };
  
  console.log('Validações:');
  console.log(`CEP válido: ${tests.cepValid ? '✅' : '❌'}`);
  console.log(`Peso válido (0-30kg): ${tests.weightValid ? '✅' : '❌'}`);
  console.log(`Dimensões válidas: ${tests.dimensionsValid ? '✅' : '❌'}`);
  console.log();
  
  return Object.values(tests).every(Boolean);
}

// ============================================
// RUNNER PRINCIPAL
// ============================================

export async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 EXECUTANDO TODOS OS TESTES DO SISTEMA DE ENVIOS');
  console.log('='.repeat(60) + '\n');
  
  const startTime = Date.now();
  
  // Executar todos os testes
  await testDataValidation();
  await testCompleteAPIFlow();
  await testDirectQuote();
  await testListAgencies();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('='.repeat(60));
  console.log(`✅ Testes concluídos em ${duration}s`);
  console.log('='.repeat(60) + '\n');
}

// ============================================
// TESTES INDIVIDUAIS PARA DEBUG
// ============================================

// Descomente para executar testes individuais:

// testValidateToken();
// testCalculateShipping();
// testCheckBalance();
// testDirectQuote();
// testListAgencies();
// testDataValidation();
// testCompleteAPIFlow();

// Executar todos:
// runAllTests();

// ============================================
// EXPORTAÇÕES
// ============================================

const shippingTests = {
  testValidateToken,
  testCalculateShipping,
  testCheckBalance,
  testDirectQuote,
  testListAgencies,
  testDataValidation,
  testCompleteAPIFlow,
  runAllTests,
};

export default shippingTests;

// ============================================
// INSTRUÇÕES DE USO
// ============================================

/**
 * COMO USAR ESTES TESTES:
 * 
 * 1. No terminal Node.js:
 *    ```
 *    node --experimental-modules tests/shipping.test.ts
 *    ```
 * 
 * 2. Em um arquivo separado:
 *    ```typescript
 *    import { runAllTests } from './tests/shipping.test';
 *    runAllTests();
 *    ```
 * 
 * 3. Via API Route (criar /api/test/shipping):
 *    ```typescript
 *    export async function GET() {
 *      const results = await runAllTests();
 *      return Response.json(results);
 *    }
 *    ```
 * 
 * 4. No browser console (adicionar ao seu app):
 *    ```typescript
 *    import tests from '@/tests/shipping.test';
 *    window.shippingTests = tests;
 *    // Depois: shippingTests.runAllTests()
 *    ```
 */
