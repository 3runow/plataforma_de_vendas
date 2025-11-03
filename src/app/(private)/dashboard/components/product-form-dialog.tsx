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
  imagePreviews: string[];
  isUploading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onFormChange: (field: string, value: string | boolean) => void;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: (index?: number) => void;
  onUrlsChange?: (urls: string[]) => void;
  onReorder?: (newOrder: string[]) => void;
  submitButtonText: string;
}

export function ProductFormDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  formData,
  imagePreviews,
  isUploading,
  onSubmit,
  onFormChange,
  onPriceChange,
  onImageChange,
  onClearImage,
  onUrlsChange,
  onReorder,
  submitButtonText,
}: ProductFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <ProductFormFields
            formData={formData}
            imagePreviews={imagePreviews}
            onFormChange={onFormChange}
            onPriceChange={onPriceChange}
            onImageChange={onImageChange}
            onClearImage={onClearImage}
            onUrlsChange={onUrlsChange}
            onReorder={onReorder}
          />
          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? "Enviando..." : submitButtonText}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
