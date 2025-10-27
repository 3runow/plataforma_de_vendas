import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  
  console.log(`\n📦 Total de produtos no banco: ${products.length}\n`);
  
  if (products.length === 0) {
    console.log("❌ Nenhum produto encontrado!");
    console.log("💡 Execute: npx tsx ./prisma/seed.ts para criar produtos de teste");
  } else {
    console.log("✅ Produtos encontrados:");
    products.slice(0, 5).forEach((p: { id: number; name: string; stock: number }) => {
      console.log(`  - ${p.name} (ID: ${p.id}, Estoque: ${p.stock})`);
    });
    if (products.length > 5) {
      console.log(`  ... e mais ${products.length - 5} produtos`);
    }
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
