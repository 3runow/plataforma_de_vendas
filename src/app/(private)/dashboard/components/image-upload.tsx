import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ImageUploadProps {
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onUrlChange?: (url: string) => void;
}

export function ImageUpload({
  imagePreview,
  onImageChange,
  onClearImage,
  onUrlChange,
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState("");

  const handleUrlSubmit = () => {
    if (imageUrl.trim() && onUrlChange) {
      onUrlChange(imageUrl.trim());
    }
  };

  return (
    <div className="space-y-2">
      <Label>Imagem do Produto</Label>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">URL Externa</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-2">
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
        </TabsContent>

        <TabsContent value="url" className="space-y-2">
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
                <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Cole a URL da imagem
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://exemplo.com/imagem.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleUrlSubmit}
                variant="secondary"
              >
                Carregar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole a URL de uma imagem hospedada online (ImgBB, Imgur, etc.)
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
