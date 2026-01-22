"use client";

import { ReactNode } from "react";
import { canCreate, canDelete, canEdit, canAccess, UserRole } from "@/lib/permissions";

interface ProtectedActionProps {
  role: UserRole;
  permission: "create" | "edit" | "delete" | "access";
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
  showTooltip?: boolean;
}

/**
 * Componente que controla acesso a ações baseado em permissões
 * Desabilita o elemento se não tiver permissão
 */
export function ProtectedAction({
  role,
  permission,
  resource,
  children,
  fallback,
  showTooltip = true,
}: ProtectedActionProps) {
  let hasPermission = false;

  if (permission === "create") {
    hasPermission = canCreate(role, resource as "products" | "orders" | "coupons");
  } else if (permission === "edit") {
    hasPermission = canEdit(role, resource as "products" | "orders" | "users" | "coupons" | "shipping");
  } else if (permission === "delete") {
    hasPermission = canDelete(role, resource as "products" | "orders" | "users" | "coupons");
  } else if (permission === "access") {
    hasPermission = canAccess(role, resource as "orders" | "products" | "users" | "settings" | "shipping" | "coupons" | "stock" | "reports");
  }

  // Se não tem permissão, retorna fallback ou null
  if (!hasPermission) {
    return fallback || null;
  }

  // Se tem permissão, retorna o componente
  return children;
}

interface ProtectedSectionProps {
  role: UserRole;
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que oculta uma seção inteira se não tiver permissão
 */
export function ProtectedSection({
  role,
  resource,
  children,
  fallback,
}: ProtectedSectionProps) {
  const hasPermission = canAccess(role, resource as "orders" | "products" | "users" | "settings" | "shipping" | "coupons" | "stock" | "reports");

  if (!hasPermission) {
    return fallback || null;
  }

  return children;
}

interface DisableIfNoPermissionProps {
  role: UserRole;
  permission: "create" | "edit" | "delete";
  resource: string;
  children: ReactNode;
  tooltipText?: string;
}

/**
 * Wrapper que desabilita um elemento visualmente se não tiver permissão
 */
export function DisableIfNoPermission({
  role,
  permission,
  resource,
  children,
  tooltipText = "Você não tem permissão para esta ação",
}: DisableIfNoPermissionProps) {
  let hasPermission = false;

  if (permission === "create") {
    hasPermission = canCreate(role, resource as "products" | "orders" | "coupons");
  } else if (permission === "edit") {
    hasPermission = canEdit(role, resource as "products" | "orders" | "users" | "coupons" | "shipping");
  } else if (permission === "delete") {
    hasPermission = canDelete(role, resource as "products" | "orders" | "users" | "coupons");
  }

  // Se tem permissão, renderiza normalmente
  if (hasPermission) {
    return children;
  }

  // Se não tem permissão, renderiza desabilitado com title
  return (
    <div 
      className="opacity-50 cursor-not-allowed pointer-events-none"
      title={tooltipText}
    >
      {children}
    </div>
  );
}
