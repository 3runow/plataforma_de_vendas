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
import { DisableIfNoPermission, ProtectedSection } from "@/components/protected-action";
import { UserRole } from "@/lib/permissions";

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  imageUrl: string | null;
}

interface StockManagementProps {
  products: Product[];
  userRole?: string;
}

export default function StockManagement({ products, userRole = "customer" }: StockManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [operation, setOperation] = useState<"add" | "remove">("add");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Defensive: ensure products is an array before filtering (prevents runtime errors
  // when an API returns an error object or undefined)
  const safeProducts = Array.isArray(products) ? products : [];
  const filteredProducts = safeProducts.filter((product) =>
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
        <Badge variant="destructive" className="font-semibold text-[10px] sm:text-xs">
          ESGOTADO
        </Badge>
      );
    }
    if (stock < 10) {
      return (
        <Badge
          variant="secondary"
          className="bg-orange-500 text-white hover:bg-orange-600 font-semibold text-[10px] sm:text-xs"
        >
          {stock} un.
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="bg-green-500 text-white hover:bg-green-600 font-semibold text-[10px] sm:text-xs"
      >
        {stock} un.
      </Badge>
    );
  };

  const renderDialogContent = (product: Product) => (
    <>
      <DialogHeader>
        <DialogTitle className="text-sm sm:text-base">Ajustar Estoque</DialogTitle>
        <DialogDescription className="text-xs sm:text-sm">
          Produto: <strong>{product.name}</strong>
          <br />
          Estoque atual: <strong>{product.stock} unidades</strong>
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={operation === "add" ? "default" : "outline"}
            onClick={() => setOperation("add")}
            size="sm"
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Adicionar
          </Button>
          <Button
            variant={operation === "remove" ? "default" : "outline"}
            onClick={() => setOperation("remove")}
            size="sm"
            className="text-xs sm:text-sm h-8 sm:h-9"
          >
            <Minus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Remover
          </Button>
        </div>
        <div>
          <label className="text-xs sm:text-sm font-medium">Quantidade</label>
          <Input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            placeholder="Digite a quantidade"
            className="mt-1 text-xs sm:text-sm h-8 sm:h-9"
          />
        </div>
        <div className="rounded-md bg-gray-100 p-2 sm:p-3">
          <p className="text-xs sm:text-sm text-gray-600">
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
          className="w-full text-xs sm:text-sm h-8 sm:h-9"
        >
          {isLoading ? "Atualizando..." : "Confirmar Ajuste"}
        </Button>
      </div>
    </>
  );

  return (
    <Card>
      <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Controle de Estoque
          </CardTitle>
          <Input
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm h-8 sm:h-10"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500 text-xs sm:text-sm px-3">
            Nenhum produto encontrado
          </div>
        ) : (
          <>
            {/* Desktop/Tablet - Tabela (md e acima) */}
            <div className="hidden md:block overflow-x-auto px-6 pb-6">
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
                            {userRole === "admin" && (
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
                            )}
                            <DialogContent className="sm:max-w-md">
                              {renderDialogContent(product)}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile - Cards (abaixo de md) */}
            <div className="md:hidden space-y-2 px-3 pb-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs sm:text-sm truncate">
                          {product.name}
                        </h3>
                        <p className="text-sm sm:text-base font-bold text-primary mt-0.5">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                      {getStockBadge(product.stock)}
                    </div>
                    <Dialog>
                      {userRole === "admin" && (
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setQuantity(0);
                              setOperation("add");
                            }}
                            className="w-full text-xs h-8"
                          >
                            Ajustar Estoque
                          </Button>
                        </DialogTrigger>
                      )}
                      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
                        {renderDialogContent(product)}
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
