export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  discount?: number | null;
  isNew?: boolean;
  isFeatured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipo serializável para uso em componentes client
export interface SerializableProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  discount?: number | null;
  isNew?: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  imageUrls?: string[];
  discount?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  discount?: number;
}
