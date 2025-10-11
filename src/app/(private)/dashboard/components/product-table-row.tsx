import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { Product } from "../../../../../types/types";

interface ProductTableRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export function ProductTableRow({
  product,
  onEdit,
  onDelete,
}: ProductTableRowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <TableRow>
      <TableCell>
        {product.imageUrl ? (
          <div className="relative w-16 h-16 rounded-md overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{product.id}</TableCell>
      <TableCell>{product.name}</TableCell>
      <TableCell className="max-w-xs truncate">{product.description}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>{formatCurrency(product.price)}</span>
          {product.discount && product.discount > 0 && (
            <Badge variant="destructive" className="w-fit">
              -{product.discount}% OFF
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span
            className={product.stock < 10 ? "text-red-600 font-semibold" : ""}
          >
            {product.stock}
          </span>
          {product.stock > 0 && product.stock <= 5 && (
            <Badge
              variant="secondary"
              className="w-fit bg-orange-500 text-white"
            >
              Baixo estoque
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {product.isNew && (
            <Badge variant="default" className="bg-blue-500">
              Novo
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="default" className="bg-purple-500">
              Destaque
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
