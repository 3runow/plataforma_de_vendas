import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "./image-upload";
import { ProductFormData } from "../../../../../types/types";

interface ProductFormFieldsProps {
  formData: ProductFormData;
  imagePreview: string | null;
  onFormChange: (field: string, value: string | boolean) => void;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onUrlChange?: (url: string) => void;
}

export function ProductFormFields({
  formData,
  imagePreview,
  onFormChange,
  onPriceChange,
  onImageChange,
  onClearImage,
  onUrlChange,
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
        onUrlChange={onUrlChange}
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

      <div className="space-y-2">
        <Label htmlFor="discount">Desconto (%)</Label>
        <Input
          id="discount"
          type="number"
          min="0"
          max="100"
          value={formData.discount || ""}
          onChange={(e) => onFormChange("discount", e.target.value)}
          placeholder="0"
        />
        <p className="text-xs text-gray-500">
          Digite o percentual de desconto (0-100)
        </p>
      </div>

      <div className="space-y-4">
        <Label>Badges do Produto</Label>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isNew"
            checked={formData.isNew || false}
            onCheckedChange={(checked) => onFormChange("isNew", !!checked)}
          />
          <label
            htmlFor="isNew"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Novo / Lançamento
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isFeatured"
            checked={formData.isFeatured || false}
            onCheckedChange={(checked) => onFormChange("isFeatured", !!checked)}
          />
          <label
            htmlFor="isFeatured"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Produto em Destaque
          </label>
        </div>

        <p className="text-xs text-gray-500">
          Os badges &quot;Desconto&quot; e &quot;Últimas Unidades&quot; são
          automáticos baseados no desconto e estoque
        </p>
      </div>
    </>
  );
}
