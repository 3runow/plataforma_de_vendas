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
import { Plus, ListChecks } from "lucide-react";
import { ProductsTable } from "./products-table";
import { ProductFormDialog } from "./product-form-dialog";
import { BulkEditDialog } from "./bulk-edit-dialog";
import { useProductForm } from "./use-product-form";
import { Product } from "../../../../../types/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface ProductsManagementProps {
  products: Product[];
}

export function ProductsManagement({
  products: initialProducts,
}: ProductsManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    formData,
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
  } = useProductForm();

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const uploadedUrls = await uploadImages();
      const allUrls = [...(formData.imageUrls || []), ...uploadedUrls].filter(
        Boolean
      );
      const imageUrl = allUrls[0] || formData.imageUrl || undefined;

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price.replace(/\./g, "").replace(",", ".")),
        stock: parseInt(formData.stock),
        imageUrl,
        imageUrls: allUrls.length > 0 ? allUrls : undefined,
        discount:
          formData.discount && formData.discount !== ""
            ? parseFloat(formData.discount)
            : 0,
        isNew: formData.isNew || false,
        isFeatured: formData.isFeatured || false,
      };

      console.log("Adicionando produto com dados:", productData);

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast({
          title: "Produto adicionado!",
          description: `${formData.name} foi adicionado com sucesso.`,
          duration: 3000,
        });
        setIsAddDialogOpen(false);
        resetForm();

        // Buscar produtos atualizados - valida resposta antes de setar o state
        const resp = await fetch("/api/products");
        if (resp.ok) {
          const updatedProducts = await resp.json();
          if (Array.isArray(updatedProducts)) {
            setProducts(updatedProducts);
          } else {
            console.error(
              "/api/products retornou dados inesperados:",
              updatedProducts
            );
          }
        } else {
          const err = await resp.json().catch(() => ({}));
          console.error("Erro ao buscar produtos:", err);
        }
        router.refresh();
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao adicionar produto",
          description: error.error || "Ocorreu um erro ao adicionar o produto.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast({
        title: "Erro ao adicionar produto",
        description: "Ocorreu um erro ao adicionar o produto.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const uploadedUrls = await uploadImages();

      // Manter a imagem principal atual se existir
      const currentMainImage = selectedProduct.imageUrl || formData.imageUrl;

      // Combinar URLs existentes com as novas
      const existingUrls =
        formData.imageUrls || selectedProduct.imageUrls || [];
      const allUrls = [...existingUrls, ...uploadedUrls].filter(Boolean);

      // Se há imagem principal, garantir que ela esteja no array de URLs também
      const finalImageUrls =
        currentMainImage && !allUrls.includes(currentMainImage)
          ? [currentMainImage, ...allUrls]
          : allUrls;

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price.replace(/\./g, "").replace(",", ".")),
        stock: parseInt(formData.stock),
        imageUrl: currentMainImage, // Mantém a imagem principal
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
        discount:
          formData.discount && formData.discount !== ""
            ? parseFloat(formData.discount)
            : 0,
        isNew: formData.isNew || false,
        isFeatured: formData.isFeatured || false,
      };

      console.log("Enviando dados do produto:", productData);

      const response = await fetch(`/api/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast({
          title: "Produto atualizado!",
          description: `${formData.name} foi atualizado com sucesso.`,
          duration: 3000,
        });
        setIsEditDialogOpen(false);
        setSelectedProduct(null);
        resetForm();

        // Buscar produtos atualizados - valida resposta antes de setar o state
        const resp = await fetch("/api/products");
        if (resp.ok) {
          const updatedProducts = await resp.json();
          if (Array.isArray(updatedProducts)) {
            setProducts(updatedProducts);
          } else {
            console.error(
              "/api/products retornou dados inesperados:",
              updatedProducts
            );
          }
        } else {
          const err = await resp.json().catch(() => ({}));
          console.error("Erro ao buscar produtos:", err);
        }
        router.refresh();
      } else {
        const error = await response.json();
        console.error("Erro ao editar produto:", error);
        toast({
          title: "Erro ao editar produto",
          description: error.details
            ? error.details
                .map(
                  (d: { path: string; message: string }) =>
                    `${d.path}: ${d.message}`
                )
                .join(", ")
            : error.error || "Ocorreu um erro ao editar o produto.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Erro ao editar produto:", error);
      toast({
        title: "Erro ao editar produto",
        description: "Ocorreu um erro ao editar o produto.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Produto deletado!",
          description: "O produto foi removido com sucesso.",
          duration: 3000,
        });
        setProducts(products.filter((p) => p.id !== id));
        router.refresh();
      } else {
        toast({
          title: "Erro ao deletar produto",
          description: "Ocorreu um erro ao deletar o produto.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      toast({
        title: "Erro ao deletar produto",
        description: "Ocorreu um erro ao deletar o produto.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    loadProductData(product);
    setIsEditDialogOpen(true);
  };

  const handleBulkUpdate = async () => {
    // Buscar produtos atualizados
    const resp = await fetch("/api/products");
    if (resp.ok) {
      const updatedProducts = await resp.json();
      if (Array.isArray(updatedProducts)) {
        setProducts(updatedProducts);
      }
    }
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">
              Gerenciamento de Produtos
            </CardTitle>
            <CardDescription className="text-sm">
              Adicione, edite ou remova produtos do catálogo
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsBulkEditDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <ListChecks className="mr-2 h-4 w-4" />
              Editar em Massa
            </Button>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="px-4 sm:px-0">
          <ProductsTable
            products={products}
            onEdit={openEditDialog}
            onDelete={handleDeleteProduct}
          />
        </div>

        <ProductFormDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          title="Adicionar Novo Produto"
          description="Preencha os dados do novo produto"
          formData={formData}
          imagePreviews={imagePreviews}
          isUploading={isUploading}
          onSubmit={handleAddProduct}
          onFormChange={handleFormChange}
          onPriceChange={handlePriceChange}
          onImageChange={handleImageChange}
          onClearImage={clearImageSelection}
          onUrlsChange={handleUrlsChange}
          onReorder={handleReorder}
          submitButtonText="Adicionar"
        />

        <ProductFormDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          title="Editar Produto"
          description="Atualize os dados do produto"
          formData={formData}
          imagePreviews={imagePreviews}
          isUploading={isUploading}
          onSubmit={handleEditProduct}
          onFormChange={handleFormChange}
          onPriceChange={handlePriceChange}
          onImageChange={handleImageChange}
          onClearImage={clearImageSelection}
          onUrlsChange={handleUrlsChange}
          onReorder={handleReorder}
          submitButtonText="Salvar Alterações"
        />

        <BulkEditDialog
          isOpen={isBulkEditDialogOpen}
          onOpenChange={setIsBulkEditDialogOpen}
          products={products}
          onUpdate={handleBulkUpdate}
        />
      </CardContent>
    </Card>
  );
}
