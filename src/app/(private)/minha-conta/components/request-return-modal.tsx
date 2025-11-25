"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { AlertCircle, Package } from "lucide-react";

interface RequestReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  orderId: number;
  isLoading?: boolean;
}

export function RequestReturnModal({
  isOpen,
  onClose,
  onSubmit,
  orderId,
  isLoading = false,
}: RequestReturnModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError("Por favor, informe o motivo da devolução");
      return;
    }

    if (reason.trim().length < 10) {
      setError("O motivo deve ter pelo menos 10 caracteres");
      return;
    }

    onSubmit(reason);
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>Solicitar Devolução</DialogTitle>
              <DialogDescription>Pedido #{orderId}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Antes de solicitar:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>O produto deve estar em perfeitas condições</li>
                  <li>Embalagem original preservada</li>
                  <li>Prazo de até 7 dias após o recebimento</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo da devolução <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Ex: Produto veio com defeito, tamanho não corresponde à descrição, etc."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              className={error ? "border-red-500" : ""}
              rows={4}
              maxLength={500}
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                <span className="text-gray-500">Mínimo 10 caracteres</span>
              )}
              <span className="text-gray-400">
                {reason.length}/500
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? "Enviando..." : "Enviar Solicitação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
