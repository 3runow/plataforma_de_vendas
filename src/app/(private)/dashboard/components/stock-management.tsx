"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Minus, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  imageUrl: string | null;
}

interface StockManagementProps {
  products: Product[];
}

export default function StockManagement({ products }: StockManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [operation, setOperation] = useState<"add" | "remove">("add");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStockUpdate = async () => {
    if (!selectedProduct || quantity <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Por favor, insira uma quantidade válida.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const newStock =
        operation === "add"
          ? selectedProduct.stock + quantity
          : Math.max(0, selectedProduct.stock - quantity);

      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stock: newStock,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar estoque");
      }

      toast({
        title: "Estoque atualizado!",
        description: `${
          operation === "add" ? "Adicionado" : "Removido"
        } ${quantity} unidade(s) de ${selectedProduct.name}`,
        duration: 3000,
      });

      setSelectedProduct(null);
      setQuantity(0);
      router.refresh();
    } catch {
      toast({
        title: "Erro ao atualizar estoque",
        description: "Ocorreu um erro ao tentar atualizar o estoque.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="font-semibold">
          ESGOTADO
        </Badge>
      );
    }
    if (stock < 10) {
      return (
        <Badge
          variant="secondary"
          className="bg-orange-500 text-white hover:bg-orange-600 font-semibold"
        >
          {stock} un.
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="bg-green-500 text-white hover:bg-green-600 font-semibold"
      >
        {stock} un.
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Controle de Estoque
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>R$ {product.price.toFixed(2)}</TableCell>
                  <TableCell>{getStockBadge(product.stock)}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(product);
                            setQuantity(0);
                            setOperation("add");
                          }}
                        >
                          Ajustar Estoque
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajustar Estoque</DialogTitle>
                          <DialogDescription>
                            Produto: <strong>{product.name}</strong>
                            <br />
                            Estoque atual:{" "}
                            <strong>{product.stock} unidades</strong>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="flex gap-2">
                            <Button
                              variant={
                                operation === "add" ? "default" : "outline"
                              }
                              onClick={() => setOperation("add")}
                              className="flex-1"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar
                            </Button>
                            <Button
                              variant={
                                operation === "remove" ? "default" : "outline"
                              }
                              onClick={() => setOperation("remove")}
                              className="flex-1"
                            >
                              <Minus className="h-4 w-4 mr-2" />
                              Remover
                            </Button>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Quantidade
                            </label>
                            <Input
                              type="number"
                              min="0"
                              value={quantity}
                              onChange={(e) =>
                                setQuantity(parseInt(e.target.value) || 0)
                              }
                              placeholder="Digite a quantidade"
                              className="mt-1"
                            />
                          </div>
                          <div className="rounded-md bg-gray-100 p-3">
                            <p className="text-sm text-gray-600">
                              Novo estoque:{" "}
                              <strong className="text-gray-900">
                                {operation === "add"
                                  ? product.stock + quantity
                                  : Math.max(0, product.stock - quantity)}{" "}
                                unidades
                              </strong>
                            </p>
                          </div>
                          <Button
                            onClick={handleStockUpdate}
                            disabled={isLoading || quantity <= 0}
                            className="w-full"
                          >
                            {isLoading ? "Atualizando..." : "Confirmar Ajuste"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum produto encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
