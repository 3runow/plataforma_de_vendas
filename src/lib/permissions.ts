/**
 * Sistema de permissões para o dashboard administrativo
 * Define os acessos permitidos para cada role de usuário
 */

export type UserRole = "admin" | "visitor" | "customer";

export interface PermissionSet {
  canViewDashboard: boolean;
  canViewReports: boolean;
  canViewMetrics: boolean;
  canViewOrders: boolean;
  canViewProducts: boolean;
  canViewUsers: boolean;
  canViewShipping: boolean;
  canViewCoupons: boolean;
  canViewStock: boolean;
  // Operações de criação
  canCreateProducts: boolean;
  canCreateOrders: boolean;
  canCreateCoupons: boolean;
  // Operações de atualização
  canEditProducts: boolean;
  canEditOrders: boolean;
  canEditUsers: boolean;
  canEditCoupons: boolean;
  canEditShipping: boolean;
  // Operações de exclusão
  canDeleteProducts: boolean;
  canDeleteOrders: boolean;
  canDeleteUsers: boolean;
  canDeleteCoupons: boolean;
  // Acesso a configurações sensíveis
  canAccessSettings: boolean;
  canManageUsers: boolean;
  canUploadFiles: boolean;
}

// Definir permissões por role
const PERMISSIONS: Record<UserRole, PermissionSet> = {
  admin: {
    // Visualização
    canViewDashboard: true,
    canViewReports: true,
    canViewMetrics: true,
    canViewOrders: true,
    canViewProducts: true,
    canViewUsers: true,
    canViewShipping: true,
    canViewCoupons: true,
    canViewStock: true,
    // Criação
    canCreateProducts: true,
    canCreateOrders: true,
    canCreateCoupons: true,
    // Edição
    canEditProducts: true,
    canEditOrders: true,
    canEditUsers: true,
    canEditCoupons: true,
    canEditShipping: true,
    // Exclusão
    canDeleteProducts: true,
    canDeleteOrders: true,
    canDeleteUsers: true,
    canDeleteCoupons: true,
    // Configurações
    canAccessSettings: true,
    canManageUsers: true,
    canUploadFiles: true,
  },
  visitor: {
    // Visualização - PERMITIDO
    canViewDashboard: true,
    canViewReports: true,
    canViewMetrics: true,
    canViewOrders: true,
    canViewProducts: true,
    canViewUsers: false, // Não pode ver lista completa de usuários
    canViewShipping: true,
    canViewCoupons: false, // Visitante não vê cupons
    canViewStock: true,
    // Criação - NÃO PERMITIDO
    canCreateProducts: false,
    canCreateOrders: false,
    canCreateCoupons: false,
    // Edição - NÃO PERMITIDO (nem mesmo estoque)
    canEditProducts: false,
    canEditOrders: false,
    canEditUsers: false,
    canEditCoupons: false,
    canEditShipping: false,
    // Exclusão - NÃO PERMITIDO
    canDeleteProducts: false,
    canDeleteOrders: false,
    canDeleteUsers: false,
    canDeleteCoupons: false,
    // Configurações - NÃO PERMITIDO
    canAccessSettings: false,
    canManageUsers: false,
    canUploadFiles: false,
  },
  customer: {
    // Visualização
    canViewDashboard: false,
    canViewReports: false,
    canViewMetrics: false,
    canViewOrders: false,
    canViewProducts: false,
    canViewUsers: false,
    canViewShipping: false,
    canViewCoupons: false,
    canViewStock: false,
    // Criação
    canCreateProducts: false,
    canCreateOrders: false,
    canCreateCoupons: false,
    // Edição
    canEditProducts: false,
    canEditOrders: false,
    canEditUsers: false,
    canEditCoupons: false,
    canEditShipping: false,
    // Exclusão
    canDeleteProducts: false,
    canDeleteOrders: false,
    canDeleteUsers: false,
    canDeleteCoupons: false,
    // Configurações
    canAccessSettings: false,
    canManageUsers: false,
    canUploadFiles: false,
  },
};

/**
 * Obtém as permissões para um role específico
 */
export function getPermissions(role: UserRole): PermissionSet {
  return PERMISSIONS[role] || PERMISSIONS.customer;
}

/**
 * Verifica se um usuário tem uma permissão específica
 */
export function hasPermission(
  role: UserRole,
  permission: keyof PermissionSet
): boolean {
  const permissions = getPermissions(role);
  return permissions[permission];
}

/**
 * Verifica se um usuário pode executar uma ação específica no dashboard
 */
export function canAccess(role: UserRole, resource: "orders" | "products" | "users" | "settings" | "shipping" | "coupons" | "stock" | "reports"): boolean {
  const permissions = getPermissions(role);
  
  switch (resource) {
    case "orders":
      return permissions.canViewOrders;
    case "products":
      return permissions.canViewProducts;
    case "users":
      return permissions.canViewUsers;
    case "settings":
      return permissions.canAccessSettings;
    case "shipping":
      return permissions.canViewShipping;
    case "coupons":
      return permissions.canViewCoupons;
    case "stock":
      return permissions.canViewStock;
    case "reports":
      return permissions.canViewReports;
    default:
      return false;
  }
}

/**
 * Verifica se um usuário pode criar um recurso
 */
export function canCreate(
  role: UserRole,
  resource: "products" | "orders" | "coupons"
): boolean {
  const permissions = getPermissions(role);
  
  switch (resource) {
    case "products":
      return permissions.canCreateProducts;
    case "orders":
      return permissions.canCreateOrders;
    case "coupons":
      return permissions.canCreateCoupons;
    default:
      return false;
  }
}

/**
 * Verifica se um usuário pode editar um recurso
 */
export function canEdit(
  role: UserRole,
  resource: "products" | "orders" | "users" | "coupons" | "shipping"
): boolean {
  const permissions = getPermissions(role);
  
  switch (resource) {
    case "products":
      return permissions.canEditProducts;
    case "orders":
      return permissions.canEditOrders;
    case "users":
      return permissions.canEditUsers;
    case "coupons":
      return permissions.canEditCoupons;
    case "shipping":
      return permissions.canEditShipping;
    default:
      return false;
  }
}

/**
 * Verifica se um usuário pode deletar um recurso
 */
export function canDelete(
  role: UserRole,
  resource: "products" | "orders" | "users" | "coupons"
): boolean {
  const permissions = getPermissions(role);
  
  switch (resource) {
    case "products":
      return permissions.canDeleteProducts;
    case "orders":
      return permissions.canDeleteOrders;
    case "users":
      return permissions.canDeleteUsers;
    case "coupons":
      return permissions.canDeleteCoupons;
    default:
      return false;
  }
}
