import { Suspense } from "react";
import Header from "@/components/header";
import ProductsSection from "@/components/products-section";
import Hero from "@/components/hero";

function ProductsSectionFallback() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-lg text-gray-500">Carregando produtos...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <Hero />

      <main className="flex-1 bg-gray-50">
        <Suspense fallback={<ProductsSectionFallback />}>
          <ProductsSection />
        </Suspense>
      </main>
    </div>
  );
}
