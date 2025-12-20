import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface CheckoutCustomerData {
  name: string;
  email: string;
  cpf: string;
  phone?: string;
}

function sanitizeDigits(value?: string | null) {
  if (!value) {
    return "";
  }
  return value.replace(/\D/g, "");
}

export async function resolveCheckoutUser(customer: CheckoutCustomerData) {
  const email = customer.email.trim().toLowerCase();
  const cleanCpf = sanitizeDigits(customer.cpf);
  const cleanPhone = sanitizeDigits(customer.phone);

  if (!email) {
    throw new Error("Email é obrigatório para concluir o checkout.");
  }

  if (cleanCpf.length !== 11) {
    throw new Error("CPF inválido para concluir o checkout.");
  }

  let user: User | null = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.findUnique({ where: { cpf: cleanCpf } });
  }

  if (user) {
    const dataToUpdate: Record<string, unknown> = {};

    if (!user.cpf) {
      dataToUpdate.cpf = cleanCpf;
    }

    if (!user.phone && cleanPhone) {
      dataToUpdate.phone = cleanPhone;
    }

    if (!user.name && customer.name) {
      dataToUpdate.name = customer.name;
    }

    if (Object.keys(dataToUpdate).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: dataToUpdate,
      });
    }

    return { user, created: false } as const;
  }

  const randomPassword = crypto.randomBytes(24).toString("hex");
  const hashedPassword = await bcrypt.hash(randomPassword, 10);

  const newUser = await prisma.user.create({
    data: {
      name: customer.name,
      email,
      password: hashedPassword,
      cpf: cleanCpf,
      phone: cleanPhone || null,
      isGuest: true,
    },
  });

  return { user: newUser, created: true } as const;
}
