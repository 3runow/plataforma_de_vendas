import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Limpar produtos existentes
  await prisma.product.deleteMany();

  // Lista de produtos BRICKS
  const products = [
    {
      name: "BRICKS ANGEL",
      description: "Figura de blocos de montar estilo Angel",
      price: 49.90,
      stock: 20,
      imageUrl: "/assets/image/2025-09-BRICKS-ANGEL.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS BOB",
      description: "Figura de blocos de montar estilo Bob Esponja",
      price: 49.90,
      stock: 15,
      imageUrl: "/assets/image/2025-09-BRICKS-BOB.jpg",
      isNew: true,
      isFeatured: false,
    },
    {
      name: "BRICKS BURRO",
      description: "Figura de blocos de montar estilo Burro do Shrek",
      price: 49.90,
      stock: 18,
      imageUrl: "/assets/image/2025-09-BRICKS-BURRO.jpg",
      isNew: false,
      isFeatured: true,
    },
    {
      name: "BRICKS HELLO KITTY",
      description: "Figura de blocos de montar estilo Hello Kitty",
      price: 49.90,
      stock: 25,
      imageUrl: "/assets/image/2025-09-BRICKS-HELLO_KITTY.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS LEITÃO",
      description: "Figura de blocos de montar estilo Leitão",
      price: 49.90,
      stock: 12,
      imageUrl: "/assets/image/2025-09-BRICKS-LEITAO.jpg",
      isNew: false,
      isFeatured: false,
    },
    {
      name: "BRICKS LUIGI",
      description: "Figura de blocos de montar estilo Luigi",
      price: 49.90,
      stock: 22,
      imageUrl: "/assets/image/2025-09-BRICKS-LUIGI.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS LULA MOLUSCO",
      description: "Figura de blocos de montar estilo Lula Molusco",
      price: 49.90,
      stock: 16,
      imageUrl: "/assets/image/2025-09-BRICKS-LULA_MOLUSCO.jpg",
      isNew: false,
      isFeatured: false,
    },
    {
      name: "BRICKS MARCIANO",
      description: "Figura de blocos de montar estilo Marciano",
      price: 49.90,
      stock: 14,
      imageUrl: "/assets/image/2025-09-BRICKS-MARCIANO.jpg",
      isNew: true,
      isFeatured: false,
    },
    {
      name: "BRICKS MARGARIDA",
      description: "Figura de blocos de montar estilo Margarida",
      price: 49.90,
      stock: 19,
      imageUrl: "/assets/image/2025-09-BRICKS-MARGARIDA.jpg",
      isNew: false,
      isFeatured: true,
    },
    {
      name: "BRICKS MARIO",
      description: "Figura de blocos de montar estilo Mario",
      price: 49.90,
      stock: 30,
      imageUrl: "/assets/image/2025-09-BRICKS-MARIO.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS MICKEY",
      description: "Figura de blocos de montar estilo Mickey",
      price: 49.90,
      stock: 28,
      imageUrl: "/assets/image/2025-09-BRICKS-MICKEY.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS MINNIE ROSA",
      description: "Figura de blocos de montar estilo Minnie Rosa",
      price: 49.90,
      stock: 24,
      imageUrl: "/assets/image/2025-09-BRICKS-MINNIE_ROSA.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS PATETA",
      description: "Figura de blocos de montar estilo Pateta",
      price: 49.90,
      stock: 17,
      imageUrl: "/assets/image/2025-09-BRICKS-PATETA.jpg",
      isNew: false,
      isFeatured: false,
    },
    {
      name: "BRICKS PATO DONALD",
      description: "Figura de blocos de montar estilo Pato Donald",
      price: 49.90,
      stock: 21,
      imageUrl: "/assets/image/2025-09-BRICKS-PATO_DONALD.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS PATRICK",
      description: "Figura de blocos de montar estilo Patrick",
      price: 49.90,
      stock: 23,
      imageUrl: "/assets/image/2025-09-BRICKS-PATRICK.jpg",
      isNew: false,
      isFeatured: true,
    },
    {
      name: "BRICKS PIKACHU",
      description: "Figura de blocos de montar estilo Pikachu",
      price: 49.90,
      stock: 35,
      imageUrl: "/assets/image/2025-09-BRICKS-PIKACHU.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS PLUTO",
      description: "Figura de blocos de montar estilo Pluto",
      price: 49.90,
      stock: 18,
      imageUrl: "/assets/image/2025-09-BRICKS-PLUTO.jpg",
      isNew: false,
      isFeatured: false,
    },
    {
      name: "BRICKS POOH",
      description: "Figura de blocos de montar estilo Pooh",
      price: 49.90,
      stock: 26,
      imageUrl: "/assets/image/2025-09-BRICKS-POOH.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS PSYDUCK",
      description: "Figura de blocos de montar estilo Psyduck",
      price: 49.90,
      stock: 15,
      imageUrl: "/assets/image/2025-09-BRICKS-PSYDUCK.jpg",
      isNew: false,
      isFeatured: false,
    },
    {
      name: "BRICKS PUMBA",
      description: "Figura de blocos de montar estilo Pumba",
      price: 49.90,
      stock: 13,
      imageUrl: "/assets/image/2025-09-BRICKS-PUMBA.jpg",
      isNew: true,
      isFeatured: false,
    },
    {
      name: "BRICKS SIMBA",
      description: "Figura de blocos de montar estilo Simba",
      price: 49.90,
      stock: 20,
      imageUrl: "/assets/image/2025-09-BRICKS-SIMBA.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS SIRIGUEIJO",
      description: "Figura de blocos de montar estilo Sirigueijo",
      price: 49.90,
      stock: 14,
      imageUrl: "/assets/image/2025-09-BRICKS-SIRIGUEIJO.jpg",
      isNew: false,
      isFeatured: false,
    },
    {
      name: "BRICKS STITCH",
      description: "Figura de blocos de montar estilo Stitch",
      price: 49.90,
      stock: 32,
      imageUrl: "/assets/image/2025-09-BRICKS-STITCH.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS TIGRAO",
      description: "Figura de blocos de montar estilo Tigrão",
      price: 49.90,
      stock: 16,
      imageUrl: "/assets/image/2025-09-BRICKS-TIGRAO.jpg",
      isNew: false,
      isFeatured: false,
    },
    {
      name: "BRICKS URSO TOY STORY",
      description: "Figura de blocos de montar estilo Lotso (Toy Story)",
      price: 49.90,
      stock: 20,
      imageUrl: "/assets/image/2025-09-BRICKS-URSO_TOY_STORY.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS HELLO KITTY AZUL",
      description: "Figura de blocos de montar estilo Hello Kitty Azul",
      price: 49.90,
      stock: 20,
      imageUrl: "/assets/image/2025-09-BRICKS-HELLO_KITTY_AZUL.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS JUDY",
      description: "Figura de blocos de montar estilo Judy",
      price: 49.90,
      stock: 20,
      imageUrl: "/assets/image/2025-09-BRICKS-JUDY.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS KUROMI",
      description: "Figura de blocos de montar estilo Kuromi",
      price: 49.90,
      stock: 20,
      imageUrl: "/assets/image/2025-09-BRICKS-KUROMI.jpg",
      isNew: true,
      isFeatured: true,
    },
    {
      name: "BRICKS NICK",
      description: "Figura de blocos de montar estilo Nick",
      price: 49.90,
      stock: 20,
      imageUrl: "/assets/image/2025-09-BRICKS-NICK.jpg",
      isNew: true,
      isFeatured: true,
    },
  ];

  // Criar produtos
  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log(`✅ ${products.length} produtos criados com sucesso!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
