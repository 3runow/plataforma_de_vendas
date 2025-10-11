import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
}

export function ImageUpload({
  imagePreview,
  onImageChange,
  onClearImage,
}: ImageUploadProps) {
  return (
    <div className="space-y-2">
      <Label>Imagem do Produto</Label>
      <div className="flex flex-col gap-2">
        {imagePreview ? (
          <div className="relative w-full h-48 border rounded-lg overflow-hidden">
            <Image
              src={imagePreview}
              alt="Preview"
              fill
              className="object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={onClearImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Nenhuma imagem selecionada
            </p>
          </div>
        )}
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={onImageChange}
          className="cursor-pointer"
        />
        <p className="text-xs text-muted-foreground">
          Formatos aceitos: JPG, PNG, WEBP, GIF (máx. 5MB)
        </p>
      </div>
    </div>
  );
}
