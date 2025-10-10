import { Plus, Minus, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({
  id,
  name,
  price,
  quantity,
  image,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) {
  return (
    <div className="flex gap-4 bg-muted/30 p-3 rounded-lg">
      <div className="relative h-20 w-20 flex-shrink-0 bg-white rounded-md overflow-hidden">
        <Image src={image} alt={name} fill className="object-contain" />
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-medium text-sm">{name}</h4>
          <p className="text-sm font-semibold text-primary mt-1">
            R$ {price.toFixed(2)}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onUpdateQuantity(id, quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center text-sm font-medium">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onUpdateQuantity(id, quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onRemove(id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
