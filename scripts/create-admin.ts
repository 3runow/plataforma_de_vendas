import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Verificar se já existe
    const existing = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
    });

    if (existing) {
      console.log("✅ Usuário admin já existe!");
      console.log("Email:", existing.email);
      console.log("Role:", existing.role);
      return;
    }

    // Criar senha hash
    const hashedPassword = await bcrypt.hash("123456", 10);

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      },
    });

    console.log("✅ Usuário admin criado com sucesso!");
    console.log("Email: admin@example.com");
    console.log("Senha: 123456");
    console.log("Role:", admin.role);
  } catch (error) {
    console.error("❌ Erro ao criar usuário admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
