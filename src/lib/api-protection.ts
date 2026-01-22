/**
 * Utilitário para proteger rotas da API baseado em permissões
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "./auth";
import { canCreate, canDelete, canEdit, UserRole } from "./permissions";

export interface AuthenticatedRequest {
  user: {
    id: number;
    email: string;
    role?: string;
  };
}

/**
 * Verifica se o usuário tem permissão para uma ação específica
 */
export async function checkPermission(
  request: NextRequest,
  action: "create" | "edit" | "delete",
  resource: "products" | "orders" | "users" | "coupons" | "shipping"
): Promise<{
  allowed: boolean;
  error?: string;
  user?: {
    id: number;
    email: string;
    role?: string;
  };
}> {
  try {
    // Verificar autenticação
    const user = await verifyAuth(request);
    if (!user) {
      return {
        allowed: false,
        error: "Não autorizado",
      };
    }

    const role = (user.role as UserRole) || "customer";

    // Verificar permissão específica
    let hasPermission = false;

    if (action === "create") {
      hasPermission = canCreate(
        role,
        resource as "products" | "orders" | "coupons"
      );
    } else if (action === "edit") {
      hasPermission = canEdit(
        role,
        resource as "products" | "orders" | "users" | "coupons" | "shipping"
      );
    } else if (action === "delete") {
      hasPermission = canDelete(
        role,
        resource as "products" | "orders" | "users" | "coupons"
      );
    }

    if (!hasPermission) {
      return {
        allowed: false,
        error: `Acesso negado. Você não tem permissão para ${
          action === "create"
            ? "criar"
            : action === "edit"
              ? "editar"
              : "deletar"
        } ${resource}.`,
      };
    }

    return {
      allowed: true,
      user,
    };
  } catch (error) {
    console.error("Erro ao verificar permissão:", error);
    return {
      allowed: false,
      error: "Erro ao verificar permissão",
    };
  }
}

/**
 * Wrapper para proteger endpoints de API
 * Exemplo: export async function PUT(request) { return withPermissionCheck(request, "edit", "products", async (user) => { ... }) }
 */
export async function withPermissionCheck(
  request: NextRequest,
  action: "create" | "edit" | "delete",
  resource: "products" | "orders" | "users" | "coupons" | "shipping",
  handler: (user: {
    id: number;
    email: string;
    role?: string;
  }) => Promise<NextResponse>
): Promise<NextResponse> {
  const permission = await checkPermission(request, action, resource);

  if (!permission.allowed) {
    return NextResponse.json({ error: permission.error }, { status: 403 });
  }

  if (!permission.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  return handler(permission.user);
}
