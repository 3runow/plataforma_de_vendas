"use client";

import { useState, useEffect } from "react";
import ProductCard from "./product-card";
import { SerializableProduct } from "../../types/types";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ProductsFilter } from "./products-filter";

interface ProductListProps {
  products: SerializableProduct[];
  onAddToCart?: (product: SerializableProduct, quantity: number) => void;
  itemsPerPage?: number;
  selectedFilters?: string[];
  onFilterChange?: (filters: string[]) => void;
}

export default function ProductList({
  products,
  onAddToCart,
  itemsPerPage = 8,
  selectedFilters = [],
  onFilterChange,
}: ProductListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // calcula produtos da página atual
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  // função para mudar de página
  const goToPage = (page: number) => {
    setCurrentPage(page);
    // scroll suave para o topo da lista
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // gerar números de página para exibir
  const getPageNumbers = (isMobile: boolean = false) => {
    const pages: (number | string)[] = [];
    const maxVisible = isMobile ? 3 : 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (isMobile) {
        // Para mobile: apenas página atual e vizinhos imediatos
        if (currentPage === 1) {
          pages.push(1, 2, "ellipsis", totalPages);
        } else if (currentPage === totalPages) {
          pages.push(1, "ellipsis", totalPages - 1, totalPages);
        } else {
          pages.push(1, "ellipsis", currentPage, "ellipsis", totalPages);
        }
      } else {
        // Para desktop: lógica original
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push("ellipsis");
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push("ellipsis");
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push("ellipsis");
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push("ellipsis");
          pages.push(totalPages);
        }
      }
    }

    return pages;
  };

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Nossos Produtos</h2>
            <p className="text-gray-600">Encontre os melhores produtos para você</p>
          </div>
          {onFilterChange && (
            <div className="flex items-center gap-3">
              <ProductsFilter
                selectedFilters={selectedFilters}
                onFilterChange={onFilterChange}
              />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {startIndex + 1}-{Math.min(endIndex, products.length)} de{" "}
            {products.length} produtos
          </p>
          {selectedFilters.length > 0 && (
            <p className="text-sm text-gray-600">
              {selectedFilters.length} filtro{selectedFilters.length > 1 ? "s" : ""} ativo{selectedFilters.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Nenhum produto disponível no momento.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {currentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent className="flex-wrap gap-2">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) goToPage(currentPage - 1);
                    }}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {getPageNumbers(isMobile).map((page, index) => (
                  <PaginationItem key={index}>
                    {page === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goToPage(page as number);
                        }}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) goToPage(currentPage + 1);
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </>
  );
}
