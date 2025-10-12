"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, PackageX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
}

interface StockAlertsProps {
  products: Product[];
}

export default function StockAlerts({ products }: StockAlertsProps) {
  const criticalStock = products.filter((p) => p.stock === 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Produtos Esgotados */}
      {criticalStock.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-red-700">
              <PackageX className="h-5 w-5" />
              Produtos Esgotados ({criticalStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalStock.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-md bg-white p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  <Badge variant="destructive" className="ml-2">
                    ESGOTADO
                  </Badge>
                </div>
              ))}
              {criticalStock.length > 5 && (
                <p className="text-xs text-center text-red-600 mt-2">
                  + {criticalStock.length - 5} produtos esgotados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Produtos com Estoque Baixo */}
      {lowStock.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Estoque Baixo ({lowStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-md bg-white p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-orange-500 text-white hover:bg-orange-600"
                  >
                    {product.stock} un.
                  </Badge>
                </div>
              ))}
              {lowStock.length > 5 && (
                <p className="text-xs text-center text-orange-600 mt-2">
                  + {lowStock.length - 5} produtos com estoque baixo
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
