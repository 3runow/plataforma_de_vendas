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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Product } from "../../../../../types/types";
import { useToast } from "@/hooks/use-toast";

interface BulkEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onUpdate: () => void;
}

export function BulkEditDialog({
  isOpen,
  onOpenChange,
  products,
  onUpdate,
}: BulkEditDialogProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkChanges, setBulkChanges] = useState({
    discount: "",
    stock: "",
    isNew: null as boolean | null,
    isFeatured: null as boolean | null,
    priceAdjustment: "",
    adjustmentType: "fixed" as "fixed" | "percentage",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleProduct = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para atualizar.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const updates = selectedIds.map(async (id) => {
        const product = products.find((p) => p.id === id);
        if (!product) return;

        const updatedData: Record<string, string | number | boolean> = {};

        // Aplicar desconto se fornecido
        if (bulkChanges.discount !== "") {
          updatedData.discount = parseFloat(bulkChanges.discount);
        }

        // Aplicar estoque se fornecido
        if (bulkChanges.stock !== "") {
          updatedData.stock = parseInt(bulkChanges.stock);
        }

        // Aplicar badges
        if (bulkChanges.isNew !== null) {
          updatedData.isNew = bulkChanges.isNew;
        }
        if (bulkChanges.isFeatured !== null) {
          updatedData.isFeatured = bulkChanges.isFeatured;
        }

        // Aplicar ajuste de preço
        if (bulkChanges.priceAdjustment !== "") {
          const adjustment = parseFloat(bulkChanges.priceAdjustment);
          if (bulkChanges.adjustmentType === "percentage") {
            updatedData.price = product.price * (1 + adjustment / 100);
          } else {
            updatedData.price = product.price + adjustment;
          }
        }

        // Se não houver alterações, pular
        if (Object.keys(updatedData).length === 0) {
          return;
        }

        const response = await fetch(`/api/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Erro ao atualizar produto ${id}:`, error);
          throw new Error(`Erro ao atualizar produto ${id}`);
        }
      });

      await Promise.all(updates);

      toast({
        title: "Produtos atualizados!",
        description: `${selectedIds.length} produto(s) foram atualizados com sucesso.`,
        duration: 3000,
      });

      onUpdate();
      onOpenChange(false);
      setSelectedIds([]);
      setBulkChanges({
        discount: "",
        stock: "",
        isNew: null,
        isFeatured: null,
        priceAdjustment: "",
        adjustmentType: "fixed",
      });
    } catch (error) {
      console.error("Erro ao atualizar produtos em massa:", error);
      toast({
        title: "Erro ao atualizar produtos",
        description: "Ocorreu um erro ao atualizar os produtos.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Produtos em Massa</DialogTitle>
          <DialogDescription>
            Selecione os produtos e aplique alterações em todos de uma vez
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de produtos */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                Selecionar Produtos ({selectedIds.length}/{products.length})
              </h3>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedIds.length === products.length
                  ? "Desmarcar Todos"
                  : "Selecionar Todos"}
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
                >
                  <Checkbox
                    checked={selectedIds.includes(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      R$ {product.price.toFixed(2)} • Estoque: {product.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alterações em massa */}
          <div className="space-y-4">
            <h3 className="font-semibold">Alterações</h3>

            {/* Ajuste de Preço */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ajuste de Preço</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 10 ou -5"
                  value={bulkChanges.priceAdjustment}
                  onChange={(e) =>
                    setBulkChanges({
                      ...bulkChanges,
                      priceAdjustment: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Ajuste</Label>
                <select
                  className="w-full h-10 px-3 border rounded-md"
                  value={bulkChanges.adjustmentType}
                  onChange={(e) =>
                    setBulkChanges({
                      ...bulkChanges,
                      adjustmentType: e.target.value as "fixed" | "percentage",
                    })
                  }
                >
                  <option value="fixed">Valor Fixo (R$)</option>
                  <option value="percentage">Porcentagem (%)</option>
                </select>
              </div>
            </div>

            {/* Desconto */}
            <div className="space-y-2">
              <Label>Desconto (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Ex: 15"
                value={bulkChanges.discount}
                onChange={(e) =>
                  setBulkChanges({ ...bulkChanges, discount: e.target.value })
                }
              />
            </div>

            {/* Estoque */}
            <div className="space-y-2">
              <Label>Estoque</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ex: 50"
                value={bulkChanges.stock}
                onChange={(e) =>
                  setBulkChanges({ ...bulkChanges, stock: e.target.value })
                }
              />
            </div>

            {/* Badges */}
            <div className="space-y-3">
              <Label>Badges</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={bulkChanges.isNew === true}
                    onCheckedChange={(checked) =>
                      setBulkChanges({
                        ...bulkChanges,
                        isNew: checked ? true : null,
                      })
                    }
                  />
                  <label className="text-sm">Marcar como Novo</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={bulkChanges.isNew === false}
                    onCheckedChange={(checked) =>
                      setBulkChanges({
                        ...bulkChanges,
                        isNew: checked ? false : null,
                      })
                    }
                  />
                  <label className="text-sm">Remover badge Novo</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={bulkChanges.isFeatured === true}
                    onCheckedChange={(checked) =>
                      setBulkChanges({
                        ...bulkChanges,
                        isFeatured: checked ? true : null,
                      })
                    }
                  />
                  <label className="text-sm">Marcar como Destaque</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={bulkChanges.isFeatured === false}
                    onCheckedChange={(checked) =>
                      setBulkChanges({
                        ...bulkChanges,
                        isFeatured: checked ? false : null,
                      })
                    }
                  />
                  <label className="text-sm">Remover badge Destaque</label>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button onClick={handleBulkUpdate} disabled={isUpdating}>
              {isUpdating ? "Atualizando..." : "Atualizar Produtos"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
