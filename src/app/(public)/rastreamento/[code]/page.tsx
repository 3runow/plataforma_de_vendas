"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, PackageSearch, Truck, CheckCircle2, XCircle } from "lucide-react";

type TrackingEvent = {
  status: string;
  description?: string;
  message?: string;
  location?: string | null;
  occurred_at?: string;
  date?: string;
};

type TrackingData = {
  code: string;
  status: string;
  protocol?: string;
  createdAt?: string;
  postedAt?: string;
  deliveredAt?: string;
  canceledAt?: string;
  events: TrackingEvent[];
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  ready_for_shipping: "Pronto para envio",
  posted: "Postado",
  shipped: "Em trânsito",
  delivered: "Entregue",
  canceled: "Cancelado",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  ready_for_shipping: "bg-blue-100 text-blue-800",
  posted: "bg-blue-100 text-blue-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
};

export default function TrackingPage() {
  const params = useParams();
  const code = Array.isArray(params?.code) ? params.code[0] : params?.code;
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!code) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/shipping/track/${code}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Não foi possível rastrear o pacote.");
        }
        setTracking(data.tracking);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível rastrear o pacote.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
  }, [code]);

  const renderStatusBadge = (status: string) => {
    const label = statusLabel[status] || status;
    const color = statusColor[status] || "bg-gray-100 text-gray-800";
    return <Badge className={color}>{label}</Badge>;
  };

  if (!code) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold text-gray-700">
          Código de rastreamento não informado.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Buscando informações de rastreamento...
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-5 h-5" />
          <span>{error || "Não foi possível carregar o rastreamento."}</span>
        </div>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Truck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Rastreamento</h1>
          <p className="text-sm text-muted-foreground">
            Código: {tracking.code}
          </p>
        </div>
      </div>

      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-3">
          {tracking.status === "delivered" ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <PackageSearch className="w-6 h-6 text-blue-600" />
          )}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold">Status atual:</span>
              {renderStatusBadge(tracking.status)}
            </div>
            {tracking.protocol && (
              <span className="text-sm text-muted-foreground">
                Protocolo: {tracking.protocol}
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Linha do tempo</h2>
        {tracking.events && tracking.events.length > 0 ? (
          <div className="space-y-3">
            {tracking.events.map((event, idx) => (
              <div
                key={`${event.status}-${idx}`}
                className="flex flex-col border rounded-lg p-3 bg-white"
              >
                <div className="flex items-center gap-2">
                  {renderStatusBadge(event.status)}
                  <span className="text-sm text-muted-foreground">
                    {event.occurred_at || event.date || ""}
                  </span>
                </div>
                <p className="text-sm font-medium mt-1">
                  {event.description || event.message || "Atualização de status"}
                </p>
                {event.location && (
                  <p className="text-xs text-muted-foreground">
                    Local: {event.location}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ainda não há eventos para este código.
          </p>
        )}
      </Card>
    </div>
  );
}
