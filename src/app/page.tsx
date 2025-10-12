import Header from "@/components/header";
import ProductsSection from "@/components/products-section";
import Hero from "@/components/hero";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <Hero />

      <main className="flex-1 bg-gray-50">
        <ProductsSection />
      </main>
    </div>
  );
}
