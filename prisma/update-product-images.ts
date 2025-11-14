
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const prisma = new PrismaClient();

async function main() {
  const imageDir = path.join(__dirname, "../public/assets/image");
  const files = fs.readdirSync(imageDir);

  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    // Extrai nome do produto do arquivo
    // Exemplo: 2025-09-BRICKS-MARIO.jpg => BRICKS MARIO
    const match = file.match(/2025-09-BRICKS-(.*)\.jpg/i);
    if (!match) continue;
    const productName = "BRICKS " + match[1].replace(/_/g, " ").replace(/-/g, " ").toUpperCase();
    const imageUrl = `/assets/image/${file}`;

    // Atualiza produto no banco
    const result = await prisma.product.updateMany({
      where: { name: productName },
      data: { imageUrl },
    });
    if (result.count > 0) {
      updated++;
      console.log(`✅ Atualizado: ${productName} -> ${imageUrl}`);
    } else {
      skipped++;
      console.log(`⏭️  Produto não encontrado: ${productName}`);
    }
  }

  console.log(`\n${updated} produtos atualizados, ${skipped} ignorados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
