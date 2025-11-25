"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, ExternalLink, Printer, Package2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ReturnLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  labelUrl: string;
  trackingCode: string | null;
  protocol: string | null;
  carrier: string | null;
  serviceName: string | null;
  orderId: number;
}

export function ReturnLabelModal({
  isOpen,
  onClose,
  labelUrl,
  trackingCode,
  protocol,
  carrier,
  serviceName,
  orderId,
}: ReturnLabelModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Usar a rota da API com parâmetro download=true para baixar o PDF direto
      const response = await fetch(`/api/order/${orderId}/return-label?download=true`);
      
      if (!response.ok) {
        throw new Error('Erro ao baixar etiqueta');
      }

      // Criar blob e fazer download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etiqueta-devolucao-pedido-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      // Fallback: abrir a URL direta do Melhor Envio
      window.open(labelUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open(labelUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Package2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <DialogTitle>Etiqueta de Devolução</DialogTitle>
              <DialogDescription>Pedido #{orderId}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status de sucesso */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">
                  Etiqueta gerada com sucesso!
                </p>
                <p className="text-sm text-green-800 mt-1">
                  Sua etiqueta está pronta para impressão. Siga as instruções abaixo.
                </p>
              </div>
            </div>
          </div>

          {/* Informações da etiqueta */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Informações do Envio</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {trackingCode && (
                <div>
                  <p className="text-gray-500">Código de Rastreamento</p>
                  <p className="font-mono font-semibold">{trackingCode}</p>
                </div>
              )}
              {protocol && (
                <div>
                  <p className="text-gray-500">Protocolo</p>
                  <p className="font-mono font-semibold">{protocol}</p>
                </div>
              )}
              {carrier && (
                <div>
                  <p className="text-gray-500">Transportadora</p>
                  <p className="font-semibold">{carrier}</p>
                </div>
              )}
              {serviceName && (
                <div>
                  <p className="text-gray-500">Serviço</p>
                  <p className="font-semibold">{serviceName}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Instruções */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Instruções para Devolução</h4>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold text-blue-600 shrink-0">1.</span>
                <span>Baixe ou imprima a etiqueta usando os botões abaixo</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-600 shrink-0">2.</span>
                <span>Cole a etiqueta na parte externa da embalagem</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-600 shrink-0">3.</span>
                <span>Leve o pacote à agência dos Correios ou ponto de coleta</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-600 shrink-0">4.</span>
                <span>Guarde o comprovante de postagem</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-600 shrink-0">5.</span>
                <span>Acompanhe o rastreamento pela plataforma</span>
              </li>
            </ol>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              className="flex-1 gap-2"
              variant="default"
              disabled={isDownloading}
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Baixando..." : "Baixar Etiqueta (PDF)"}
            </Button>
            <Button
              onClick={handlePrint}
              className="flex-1 gap-2"
              variant="outline"
            >
              <Printer className="h-4 w-4" />
              Imprimir Direto
            </Button>
          </div>

          {/* Link para rastreamento */}
          {trackingCode && (
            <div className="text-center">
              <Button
                variant="link"
                className="gap-2"
                onClick={() => window.open(`/rastreamento/${trackingCode}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Acompanhar rastreamento
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
