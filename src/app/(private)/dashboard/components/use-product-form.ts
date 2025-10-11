import { useState } from "react";
import { Product, ProductFormData } from "../../../../../types/types";

export function useProductForm() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
    discount: "0",
    isNew: false,
    isFeatured: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", imageFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao fazer upload da imagem");
        return null;
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao fazer upload da imagem");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      imageUrl: "",
      discount: "0",
      isNew: false,
      isFeatured: false,
    });
    setImageFile(null);
    setImagePreview(null);
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
      discount: product.discount?.toString() || "0",
      isNew: product.isNew || false,
      isFeatured: product.isFeatured || false,
    });
    setImagePreview(product.imageUrl || null);
    setImageFile(null);
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  return {
    formData,
    imageFile,
    imagePreview,
    isUploading,
    handlePriceChange,
    handleImageChange,
    uploadImage,
    clearImageSelection,
    resetForm,
    loadProductData,
    handleFormChange,
  };
}
