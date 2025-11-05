"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, X } from "lucide-react";

const couponSchema = z.object({
  code: z
    .string()
    .min(1, "Digite um código de cupom")
    .min(3, "O código deve ter no mínimo 3 caracteres")
    .max(20, "O código deve ter no máximo 20 caracteres")
    .regex(/^[A-Za-z0-9]+$/, "Use apenas letras e números")
    .transform((val) => val.toUpperCase()),
});

type CouponFormData = z.infer<typeof couponSchema>;

interface CouponInputProps {
  onApplyCouponAction: (code: string, discount: number) => void;
  onRemoveCouponAction: () => void;
  appliedCoupon: { code: string; discount: number } | null;
}

export default function CouponInput({
  onApplyCouponAction,
  onRemoveCouponAction,
  appliedCoupon,
}: CouponInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
  });

  const onSubmit = async (data: CouponFormData) => {
    setIsValidating(true);
    setApiError("");

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: data.code }),
      });

      const result = await response.json();

      if (response.ok) {
        onApplyCouponAction(result.code, result.discount);
        reset();
        setApiError("");
      } else {
        setApiError(result.error || "Cupom inválido");
      }
    } catch (err) {
      console.error("Erro ao validar cupom:", err);
      setApiError("Erro ao validar cupom");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onRemoveCouponAction();
    reset();
    setApiError("");
  };

  if (appliedCoupon) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                Cupom aplicado: {appliedCoupon.code}
              </p>
              <p className="text-xs text-green-700">
                Desconto de {appliedCoupon.discount}%
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            className="text-green-700 hover:text-green-900 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-gray-700">
        Cupom de Desconto
      </label>
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input
            type="text"
            {...register("code")}
            placeholder="Digite o código do cupom"
            className="h-10 pl-10 text-white"
            disabled={isValidating}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(onSubmit)();
              }
            }}
          />
        </div>
        <Button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={isValidating}
          className="h-10 bg-[#022044] hover:bg-[#033363] text-white"
        >
          {isValidating ? "Validando..." : "Aplicar"}
        </Button>
      </div>
      {(errors.code || apiError) && (
        <p className="mt-2 text-sm text-red-600">
          {errors.code?.message || apiError}
        </p>
      )}
    </div>
  );
}
