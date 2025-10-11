import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./image-upload";
import { ProductFormData } from "../../../../../types/types";

interface ProductFormFieldsProps {
  formData: ProductFormData;
  imagePreview: string | null;
  onFormChange: (field: string, value: string) => void;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
}

export function ProductFormFields({
  formData,
  imagePreview,
  onFormChange,
  onPriceChange,
  onImageChange,
  onClearImage,
}: ProductFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onFormChange("name", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormChange("description", e.target.value)}
          required
        />
      </div>

      <ImageUpload
        imagePreview={imagePreview}
        onImageChange={onImageChange}
        onClearImage={onClearImage}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="text"
            value={formData.price}
            onChange={onPriceChange}
            placeholder="0,00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Estoque</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => onFormChange("stock", e.target.value)}
            required
          />
        </div>
      </div>
    </>
  );
}
