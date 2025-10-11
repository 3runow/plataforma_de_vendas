"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ProductsTable } from "./products-table";
import { ProductFormDialog } from "./product-form-dialog";
import { useProductForm } from "./use-product-form";
import { Product } from "../../../../../types/types";

interface ProductsManagementProps {
  products: Product[];
}

export function ProductsManagement({
  products: initialProducts,
}: ProductsManagementProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
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
  } = useProductForm();

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imageUrl = formData.imageUrl;

      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(
            formData.price.replace(/\./g, "").replace(",", ".")
          ),
          stock: parseInt(formData.stock),
          imageUrl: imageUrl || undefined,
        }),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        resetForm();
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      alert("Erro ao adicionar produto");
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      let imageUrl = formData.imageUrl;

      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(
            formData.price.replace(/\./g, "").replace(",", ".")
          ),
          stock: parseInt(formData.stock),
          imageUrl: imageUrl || undefined,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedProduct(null);
        resetForm();
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao editar produto:", error);
      alert("Erro ao editar produto");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      alert("Erro ao deletar produto");
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    loadProductData(product);
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gerenciamento de Produtos</CardTitle>
            <CardDescription>
              Adicione, edite ou remova produtos do catálogo
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ProductsTable
          products={products}
          onEdit={openEditDialog}
          onDelete={handleDeleteProduct}
        />

        <ProductFormDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          title="Adicionar Novo Produto"
          description="Preencha os dados do novo produto"
          formData={formData}
          imagePreview={imagePreview}
          isUploading={isUploading}
          onSubmit={handleAddProduct}
          onFormChange={handleFormChange}
          onPriceChange={handlePriceChange}
          onImageChange={handleImageChange}
          onClearImage={clearImageSelection}
          submitButtonText="Adicionar"
        />

        <ProductFormDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="Editar Produto"
          description="Atualize os dados do produto"
          formData={formData}
          imagePreview={imagePreview}
          isUploading={isUploading}
          onSubmit={handleEditProduct}
          onFormChange={handleFormChange}
          onPriceChange={handlePriceChange}
          onImageChange={handleImageChange}
          onClearImage={clearImageSelection}
          submitButtonText="Salvar Alterações"
        />
      </CardContent>
    </Card>
  );
}
