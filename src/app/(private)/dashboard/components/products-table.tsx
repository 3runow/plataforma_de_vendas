import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductTableRow } from "./product-table-row";
import { Product } from "../../../../../types/types";
import { Edit, Trash2 } from "lucide-react";

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export function ProductsTable({
  products,
  onEdit,
  onDelete,
}: ProductsTableProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Badges</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  Nenhum produto cadastrado
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhum produto cadastrado
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Imagem */}
                  <div className="flex-shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs">
                        Sem imagem
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base truncate">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          ID: {product.id}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => onDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                      <span className="font-semibold text-green-600">
                        R$ {product.price.toFixed(2)}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span
                        className={
                          product.stock < 10 ? "text-red-600 font-semibold" : ""
                        }
                      >
                        Estoque: {product.stock}
                      </span>
                    </div>

                    {/* Badges */}
                    {(product.isNew ||
                      product.isFeatured ||
                      (product.discount && product.discount > 0)) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.isNew && (
                          <Badge className="bg-blue-500 text-xs">Novo</Badge>
                        )}
                        {product.isFeatured && (
                          <Badge className="bg-purple-500 text-xs">
                            Destaque
                          </Badge>
                        )}
                        {product.discount && product.discount > 0 && (
                          <Badge className="bg-green-500 text-xs">
                            -{product.discount}%
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
