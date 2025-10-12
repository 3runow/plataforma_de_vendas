import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductFormFields } from "./product-form-fields";
import { ProductFormData } from "../../../../../types/types";

interface ProductFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  formData: ProductFormData;
  imagePreview: string | null;
  isUploading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (field: string, value: string | boolean) => void;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onUrlChange?: (url: string) => void;
  submitButtonText: string;
}

export function ProductFormDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  formData,
  imagePreview,
  isUploading,
  onSubmit,
  onFormChange,
  onPriceChange,
  onImageChange,
  onClearImage,
  onUrlChange,
  submitButtonText,
}: ProductFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <ProductFormFields
            formData={formData}
            imagePreview={imagePreview}
            onFormChange={onFormChange}
            onPriceChange={onPriceChange}
            onImageChange={onImageChange}
            onClearImage={onClearImage}
            onUrlChange={onUrlChange}
          />
          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? "Enviando..." : submitButtonText}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
