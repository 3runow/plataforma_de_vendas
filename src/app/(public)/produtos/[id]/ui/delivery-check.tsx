"use client";

import { useState } from "react";
import { Truck } from "lucide-react";
import type { Address } from "./types";

interface DeliveryCheckProps {
  cep: string;
  address?: Address;
  onCepChangeAction: (cep: string) => void;
  onCheckDeliveryAction: (cep: string) => Promise<void>;
  cepError?: string | null;
}

export default function DeliveryCheck({
  cep,
  address,
  onCepChangeAction,
  onCheckDeliveryAction,
  cepError,
}: DeliveryCheckProps) {
  const [isChecking, setIsChecking] = useState(false);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    await onCheckDeliveryAction(cep);
    setIsChecking(false);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCepChangeAction(formatCep(e.target.value));
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
      <div className="flex items-center space-x-2">
        <Truck className="w-5 h-5 text-blue-600" />
        <h3 className="font-medium text-gray-900">Consultar Entrega</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="flex-1">
          <input
            type="text"
            value={cep}
            onChange={handleCepChange}
            placeholder="Digite o CEP"
            maxLength={9}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={cep.replace(/\D/g, "").length < 8 || isChecking}
          className={`px-4 py-2 font-medium rounded-md text-white shadow-sm ${
            cep.replace(/\D/g, "").length < 8 || isChecking
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }`}
        >
          {isChecking ? "Verificando..." : "Verificar"}
        </button>
      </form>

      {cepError && (
        <div className="flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2">
          <span className="text-lg font-bold text-red-600">✕</span>
          <p className="font-semibold text-red-600">{cepError}</p>
        </div>
      )}

      {!cepError && address && (
        <div className="space-y-1 bg-white p-3 rounded-md border border-gray-200 text-sm">
          <p className="font-medium text-gray-900">Entrega disponível para:</p>
          <p className="text-gray-700">{address.logradouro}</p>
          {address.complemento && (
            <p className="text-gray-700">{address.complemento}</p>
          )}
          <p className="text-gray-700">
            {address.bairro}, {address.localidade} - {address.uf}
          </p>
          <p className="text-gray-700">CEP: {address.cep}</p>
          <div className="pt-2">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              <p className="text-green-600 font-medium">Entrega em até 3 dias úteis</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


