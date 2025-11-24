'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface SyncResult {
  success: boolean;
  total: number;
  synchronized: number;
  errors: number;
  message?: string;
}

export function SyncOrdersButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      toast({
        title: '🔄 Sincronizando pedidos...',
        description: 'Buscando dados atualizados do Melhor Envio',
      });

      const response = await fetch('/api/sync-orders', {
        method: 'POST',
        credentials: 'include',
      });

      const data: SyncResult = await response.json();

      if (data.success) {
        toast({
          title: '✅ Sincronização concluída!',
          description: `${data.synchronized} de ${data.total} pedido(s) sincronizado(s). ${data.errors > 0 ? `${data.errors} erro(s).` : ''}`,
          variant: 'default',
        });
        
        // Recarregar a página para mostrar os dados atualizados
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast({
          title: '❌ Erro na sincronização',
          description: data.message || 'Não foi possível sincronizar os pedidos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao sincronizar pedidos:', error);
      toast({
        title: '❌ Erro na sincronização',
        description: 'Ocorreu um erro ao tentar sincronizar os pedidos',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isSyncing ? 'Sincronizando...' : 'Sincronizar com Melhor Envio'}
    </Button>
  );
}
