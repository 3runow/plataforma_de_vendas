"use client";

import { useEffect, useState } from "react";
import jwt from "jsonwebtoken";
import { UserRole } from "@/lib/permissions";

/**
 * Hook que extrai o role do usuário do JWT armazenado em cookie
 * Usado para proteger ações no lado do cliente
 */
export function useUserRole(): UserRole | null {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Pega o token do cookie
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      // Decodifica o JWT sem verificar a assinatura (JWT é verificado no servidor)
      // Isso é seguro porque o token vem do servidor com assinatura válida
      const decoded = jwt.decode(token) as { role?: string } | null;

      if (decoded && typeof decoded === "object" && "role" in decoded) {
        setRole((decoded.role as UserRole) || null);
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return role;
}
