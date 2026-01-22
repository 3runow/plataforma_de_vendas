/**
 * Script para criar usuários de teste (ADMIN e VISITANTE)
 * 
 * Uso:
 * npx ts-node prisma/create-test-users.ts
 * 
 * Ou via npm script (adicione ao package.json):
 * "seed:users": "ts-node prisma/create-test-users.ts"
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log("🔐 Criando usuários de teste...\n");

    // Hash para senha "senha123"
    const hashedPassword = await bcrypt.hash("senha123", 10);

    // Criar/atualizar ADMIN
    const admin = await prisma.user.upsert({
      where: { email: "admin@demo.com" },
      update: {
        role: "admin",
      },
      create: {
        name: "Admin Demo",
        email: "admin@demo.com",
        password: hashedPassword,
        role: "admin",
        isGuest: false,
      },
    });

    console.log("✅ Admin criado/atualizado:");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}\n`);

    // Criar/atualizar VISITANTE
    const visitor = await prisma.user.upsert({
      where: { email: "visitante@demo.com" },
      update: {
        role: "visitor",
      },
      create: {
        name: "Visitante Demo",
        email: "visitante@demo.com",
        password: hashedPassword,
        role: "visitor",
        isGuest: false,
      },
    });

    console.log("✅ Visitante criado/atualizado:");
    console.log(`   Email: ${visitor.email}`);
    console.log(`   Role: ${visitor.role}`);
    console.log(`   ID: ${visitor.id}\n`);

    console.log("📝 Credenciais de teste:");
    console.log("   Email: admin@demo.com / visitante@demo.com");
    console.log("   Senha: senha123\n");

    console.log("✨ Usuários de teste criados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao criar usuários:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
