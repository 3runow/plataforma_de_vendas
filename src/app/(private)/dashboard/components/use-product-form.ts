import { useState } from "react";
import { Product, ProductFormData } from "../../../../../types/types";

export function useProductForm() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
    imageUrls: [],
    discount: "",
    isNew: false,
    isFeatured: false,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const formatPriceInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbers = value.replace(/\D/g, "");

    if (numbers === "") {
      setFormData({ ...formData, price: "" });
      return;
    }

    const formatted = formatPriceInput(numbers);
    setFormData({ ...formData, price: formatted });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, String(reader.result)]);
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    setIsUploading(true);
    try {
      const results: string[] = [];
      for (const file of imageFiles) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        });
        if (response.ok) {
          const data = await response.json();
          results.push(data.url);
        } else {
          const error = await response.json();
          alert(error.error || "Erro ao fazer upload da imagem");
        }
      }
      return results;
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao fazer upload da imagem");
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const clearImageSelection = (index?: number) => {
    if (typeof index === "number") {
      // Remover da lista de arquivos
      setImageFiles((prev) => prev.filter((_, i) => i !== index));

      // Pegar a URL que será removida
      const urlToRemove = imagePreviews[index];

      // Remover do preview
      setImagePreviews((prev) => prev.filter((_, i) => i !== index));

      // Remover do formData.imageUrls
      setFormData((prev) => ({
        ...prev,
        imageUrls: (prev.imageUrls || []).filter((url) => url !== urlToRemove),
        // Se a URL removida era a principal, definir a primeira URL restante como principal
        imageUrl:
          prev.imageUrl === urlToRemove
            ? (prev.imageUrls || []).filter((url) => url !== urlToRemove)[0] ||
              ""
            : prev.imageUrl,
      }));
      return;
    }
    setImageFiles([]);
    setImagePreviews([]);
    setFormData({ ...formData, imageUrl: "", imageUrls: [] });
  };

  const handleUrlsChange = (urls: string[]) => {
    const sanitized = urls.map((u) => u.trim()).filter((u) => u.length > 0);
    setFormData({
      ...formData,
      imageUrls: sanitized,
      imageUrl: sanitized[0] || formData.imageUrl,
    });
    // add urls to previews for visual feedback
    setImagePreviews((prev) => {
      const existing = new Set(prev);
      const toAdd = sanitized.filter((u) => !existing.has(u));
      return [...prev, ...toAdd];
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      imageUrl: "",
      imageUrls: [],
      discount: "",
      isNew: false,
      isFeatured: false,
    });
    setImageFiles([]);
    setImagePreviews([]);
  };

  const loadProductData = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || "",
      imageUrls: product.imageUrls || [],
      discount:
        product.discount && product.discount > 0
          ? product.discount.toString()
          : "",
      isNew: product.isNew || false,
      isFeatured: product.isFeatured || false,
    });
    const previews = [
      ...(product.imageUrls || []),
      ...(product.imageUrl ? [product.imageUrl] : []),
    ];
    setImagePreviews(previews);
    setImageFiles([]);
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleReorder = (newOrder: string[]) => {
    setImagePreviews(newOrder);
    setFormData((prev) => ({
      ...prev,
      imageUrls: newOrder,
      imageUrl: newOrder[0] || prev.imageUrl,
    }));
  };

  return {
    formData,
    imageFiles,
    imagePreviews,
    isUploading,
    handlePriceChange,
    handleImageChange,
    uploadImages,
    clearImageSelection,
    handleUrlsChange,
    resetForm,
    loadProductData,
    handleFormChange,
    handleReorder,
  };
}
