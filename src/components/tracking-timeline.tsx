'use client';

import { useState, useEffect } from 'react';
import { Package, MapPin, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TrackingEvent {
  id: number;
  status: string;
  description: string;
  location?: string;
  occurred_at: string;
}

interface TrackingData {
  code: string;
  status: string;
  protocol: string;
  createdAt: string;
  paidAt?: string;
  postedAt?: string;
  deliveredAt?: string;
  canceledAt?: string;
  events: TrackingEvent[];
}

interface TrackingTimelineProps {
  trackingCode: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // em segundos
}

export function TrackingTimeline({ 
  trackingCode, 
  autoRefresh = true, 
  refreshInterval = 60 
}: TrackingTimelineProps) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trackingCode) {
      fetchTracking();

      if (autoRefresh) {
        const interval = setInterval(fetchTracking, refreshInterval * 1000);
        return () => clearInterval(interval);
      }
    }
  }, [trackingCode]);

  const fetchTracking = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shipping/track/${trackingCode}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar rastreamento');
      }

      setTracking(data.tracking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar rastreamento');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('entregue') || statusLower.includes('delivered')) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    if (statusLower.includes('cancelado') || statusLower.includes('canceled')) {
      return <XCircle className="h-6 w-6 text-red-500" />;
    }
    if (statusLower.includes('postado') || statusLower.includes('posted')) {
      return <Truck className="h-6 w-6 text-blue-500" />;
    }
    return <Package className="h-6 w-6 text-orange-500" />;
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('entregue') || statusLower.includes('delivered')) {
      return 'bg-green-500';
    }
    if (statusLower.includes('cancelado') || statusLower.includes('canceled')) {
      return 'bg-red-500';
    }
    if (statusLower.includes('postado') || statusLower.includes('posted')) {
      return 'bg-blue-500';
    }
    return 'bg-orange-500';
  };

  if (loading && !tracking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Rastreamento de Envio
          </CardTitle>
          <CardDescription>Código: {trackingCode}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            <span className="ml-3">Carregando rastreamento...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Rastreamento de Envio
          </CardTitle>
          <CardDescription>Código: {trackingCode}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-red-50 p-4 text-red-800">
            <p className="font-medium">Erro ao buscar rastreamento</p>
            <p className="text-sm">{error}</p>
            <Button onClick={fetchTracking} variant="outline" className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tracking) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(tracking.status)}
              Rastreamento de Envio
            </CardTitle>
            <CardDescription className="mt-1">
              Código: <span className="font-mono font-semibold">{tracking.code}</span>
            </CardDescription>
            <CardDescription>
              Protocolo: <span className="font-mono">{tracking.protocol}</span>
            </CardDescription>
          </div>
          <Button onClick={fetchTracking} variant="outline" size="sm" disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Status Resumo */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Criado</p>
            <p className="text-sm font-medium">{formatDate(tracking.createdAt)}</p>
          </div>
          {tracking.paidAt && (
            <div className="rounded-lg border bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Pago</p>
              <p className="text-sm font-medium">{formatDate(tracking.paidAt)}</p>
            </div>
          )}
          {tracking.postedAt && (
            <div className="rounded-lg border bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Postado</p>
              <p className="text-sm font-medium">{formatDate(tracking.postedAt)}</p>
            </div>
          )}
          {tracking.deliveredAt && (
            <div className="rounded-lg border bg-green-50 p-3">
              <p className="text-xs text-green-700">Entregue</p>
              <p className="text-sm font-medium text-green-800">{formatDate(tracking.deliveredAt)}</p>
            </div>
          )}
          {tracking.canceledAt && (
            <div className="rounded-lg border bg-red-50 p-3">
              <p className="text-xs text-red-700">Cancelado</p>
              <p className="text-sm font-medium text-red-800">{formatDate(tracking.canceledAt)}</p>
            </div>
          )}
        </div>

        {/* Timeline de Eventos */}
        {tracking.events.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-semibold">Histórico de Movimentação</h3>
            <div className="relative space-y-6 pl-6">
              {/* Linha vertical */}
              <div className="absolute left-[11px] top-2 h-[calc(100%-2rem)] w-0.5 bg-gray-200" />

              {tracking.events.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Ponto na timeline */}
                  <div
                    className={`absolute -left-[25px] h-6 w-6 rounded-full ${
                      index === 0 ? getStatusColor(event.status) : 'bg-gray-300'
                    }`}
                  />

                  {/* Conteúdo do evento */}
                  <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{event.status}</p>
                        <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                        {event.location && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(event.occurred_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
            <Package className="mx-auto mb-2 h-8 w-8" />
            <p>Nenhum evento de rastreamento disponível ainda</p>
            <p className="text-sm">Aguarde a postagem do pacote</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
