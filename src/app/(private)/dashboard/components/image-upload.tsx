import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  GripVertical,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ImageUploadProps {
  imagePreviews: string[];
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: (index?: number) => void;
  onUrlsChange?: (urls: string[]) => void;
  onReorder?: (newOrder: string[]) => void;
}

interface SortableImageProps {
  id: string;
  preview: string;
  index: number;
  onRemove: (index: number) => void;
}

function SortableImage({ id, preview, index, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-full h-36 border rounded-lg overflow-hidden group"
    >
      <Image
        src={preview}
        alt={`Preview ${index + 1}`}
        fill
        className="object-cover"
      />
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 bg-white/80 rounded p-1 cursor-grab active:cursor-grabbing hover:bg-white transition-colors"
      >
        <GripVertical className="h-4 w-4 text-gray-600" />
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2"
        onClick={() => onRemove(index)}
      >
        <X className="h-4 w-4" />
      </Button>
      {index === 0 && (
        <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
          Principal
        </div>
      )}
    </div>
  );
}

export function ImageUpload({
  imagePreviews,
  onImageChange,
  onClearImage,
  onUrlsChange,
  onReorder,
}: ImageUploadProps) {
  const [urlsText, setUrlsText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = imagePreviews.findIndex(
        (_, i) => `image-${i}` === active.id
      );
      const newIndex = imagePreviews.findIndex(
        (_, i) => `image-${i}` === over.id
      );

      const newOrder = arrayMove(imagePreviews, oldIndex, newIndex);
      if (onReorder) {
        onReorder(newOrder);
      }
    }
  };

  const handleUrlSubmit = () => {
    if (!onUrlsChange) return;
    const urls = urlsText
      .split(/\n|,/) // quebra por linha ou vírgula
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    onUrlsChange(urls);
  };

  return (
    <div className="space-y-2">
      <Label>Imagens do Produto</Label>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">URL Externa</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-2">
          <div className="flex flex-col gap-2">
            {imagePreviews.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={imagePreviews.map((_, i) => `image-${i}`)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {imagePreviews.map((preview, idx) => (
                      <SortableImage
                        key={`image-${idx}`}
                        id={`image-${idx}`}
                        preview={preview}
                        index={idx}
                        onRemove={onClearImage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
              multiple
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
            {imagePreviews.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Cole uma ou várias URLs (uma por linha ou separadas por
                  vírgula)
                </p>
              </div>
            )}
            <Textarea
              placeholder="https://exemplo.com/img1.jpg\nhttps://exemplo.com/img2.jpg"
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
            />
            <Button type="button" onClick={handleUrlSubmit} variant="secondary">
              Adicionar URLs
            </Button>
            <p className="text-xs text-muted-foreground">
              Cole URLs de imagens hospedadas (ImgBB, Imgur, etc.)
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
