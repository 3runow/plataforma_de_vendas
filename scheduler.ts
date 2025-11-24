import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { getMelhorEnvioService } from './src/lib/melhor-envio';

const prisma = new PrismaClient();

let isRunning = false;

async function syncOrders() {
  if (isRunning) {
    console.log('⚠️  Sincronização já em andamento, pulando...');
    return;
  }

  isRunning = true;
  const startTime = new Date();
  
  try {
    console.log('\n' + '='.repeat(80));
    console.log(`🔄 [${startTime.toISOString()}] Iniciando sincronização automática de pedidos`);
    console.log('='.repeat(80));

    const ordersWithShipment = await prisma.order.findMany({
      where: {
        shipment: {
          melhorEnvioId: {
            not: null,
          },
          // Apenas pedidos não entregues ou não cancelados
          OR: [
            { delivered: false },
            { status: { notIn: ['delivered', 'canceled'] } },
          ],
        },
      },
      include: {
        shipment: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (ordersWithShipment.length === 0) {
      console.log('ℹ️  Nenhum pedido pendente para sincronizar');
      return;
    }

    console.log(`📊 ${ordersWithShipment.length} pedido(s) para sincronizar\n`);

    const melhorEnvio = getMelhorEnvioService();
    let successCount = 0;
    let errorCount = 0;
    let updatedCount = 0;

    for (const order of ordersWithShipment) {
      if (!order.shipment?.melhorEnvioId) continue;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderInfo = await melhorEnvio.getOrder(order.shipment.melhorEnvioId) as any;

        const updateData: {
          trackingCode?: string;
          status: string;
          protocol?: string;
          serviceName?: string;
          carrier?: string;
          posted?: boolean;
          postedAt?: Date;
          delivered?: boolean;
          deliveredAt?: Date;
          canceled?: boolean;
          canceledAt?: Date;
        } = {
          status: orderInfo.status || 'pending',
        };

        let hasChanges = false;

        // Verificar mudanças antes de atualizar
        if (orderInfo.tracking && orderInfo.tracking !== order.shipment.trackingCode) {
          updateData.trackingCode = orderInfo.tracking;
          hasChanges = true;
        }
        if (orderInfo.protocol && orderInfo.protocol !== order.shipment.protocol) {
          updateData.protocol = orderInfo.protocol;
          hasChanges = true;
        }
        if (orderInfo.service) {
          if (orderInfo.service.name !== order.shipment.serviceName) {
            updateData.serviceName = orderInfo.service.name;
            hasChanges = true;
          }
          if (orderInfo.service.company && orderInfo.service.company.name !== order.shipment.carrier) {
            updateData.carrier = orderInfo.service.company.name;
            hasChanges = true;
          }
        }
        if (orderInfo.posted_at && !order.shipment.posted) {
          updateData.posted = true;
          updateData.postedAt = new Date(orderInfo.posted_at);
          hasChanges = true;
        }
        if (orderInfo.delivered_at && !order.shipment.delivered) {
          updateData.delivered = true;
          updateData.deliveredAt = new Date(orderInfo.delivered_at);
          hasChanges = true;
        }
        if (orderInfo.canceled_at && !order.shipment.canceled) {
          updateData.canceled = true;
          updateData.canceledAt = new Date(orderInfo.canceled_at);
          hasChanges = true;
        }
        if (orderInfo.status !== order.shipment.status) {
          hasChanges = true;
        }

        if (hasChanges) {
          // Atualizar shipment
          await prisma.shipment.update({
            where: { id: order.shipment.id },
            data: updateData,
          });

          // Atualizar pedido
          const orderUpdateData: {
            shippingTrackingCode?: string;
            status?: string;
          } = {};

          if (updateData.trackingCode && updateData.trackingCode !== order.shippingTrackingCode) {
            orderUpdateData.shippingTrackingCode = updateData.trackingCode;
          }

          if (orderInfo.status === 'delivered' && order.status !== 'delivered') {
            orderUpdateData.status = 'delivered';
          } else if ((orderInfo.status === 'posted' || orderInfo.status === 'in_transit') && order.status !== 'shipped') {
            orderUpdateData.status = 'shipped';
          } else if (orderInfo.status === 'canceled' && order.status !== 'cancelled') {
            orderUpdateData.status = 'cancelled';
          }

          if (Object.keys(orderUpdateData).length > 0) {
            await prisma.order.update({
              where: { id: order.id },
              data: orderUpdateData,
            });
          }

          updatedCount++;
          console.log(`✅ Pedido #${order.id} atualizado - Status: ${orderInfo.status}`);
        } else {
          console.log(`ℹ️  Pedido #${order.id} sem mudanças`);
        }

        successCount++;

      } catch (error) {
        errorCount++;
        console.error(`❌ Erro ao sincronizar pedido #${order.id}:`, error instanceof Error ? error.message : error);
      }

      // Aguardar 500ms entre requisições
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const endTime = new Date();
    const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DA SINCRONIZAÇÃO');
    console.log('='.repeat(80));
    console.log(`⏱️  Duração: ${duration}s`);
    console.log(`📦 Total processado: ${ordersWithShipment.length}`);
    console.log(`✅ Sucesso: ${successCount}`);
    console.log(`🔄 Atualizados: ${updatedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Erro crítico na sincronização:', error);
  } finally {
    isRunning = false;
  }
}

// Configurar agendamentos
export function startScheduler() {
  console.log('🚀 Iniciando agendador de sincronização de pedidos\n');

  // A cada 30 minutos
  cron.schedule('*/30 * * * *', () => {
    console.log('⏰ Executando sincronização agendada (a cada 30 minutos)');
    syncOrders();
  });

  // A cada hora (backup)
  cron.schedule('0 * * * *', () => {
    console.log('⏰ Executando sincronização agendada (horária)');
    syncOrders();
  });

  // Às 8h, 12h, 18h e 22h
  cron.schedule('0 8,12,18,22 * * *', () => {
    console.log('⏰ Executando sincronização agendada (horário fixo)');
    syncOrders();
  });

  console.log('✅ Agendamentos configurados:');
  console.log('   - A cada 30 minutos');
  console.log('   - A cada hora (backup)');
  console.log('   - Às 8h, 12h, 18h e 22h');
  console.log('\n');

  // Executar uma vez ao iniciar
  console.log('🔄 Executando sincronização inicial...');
  setTimeout(() => syncOrders(), 5000); // Aguardar 5s após iniciar
}

// Se executado diretamente
if (require.main === module) {
  startScheduler();
  
  // Manter o processo rodando
  process.on('SIGINT', async () => {
    console.log('\n\n⏹️  Encerrando agendador...');
    await prisma.$disconnect();
    process.exit(0);
  });
}
