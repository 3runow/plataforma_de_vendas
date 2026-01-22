"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Trash2 } from "lucide-react";
import { DisableIfNoPermission, ProtectedSection } from "@/components/protected-action";
import { UserRole } from "@/lib/permissions";

interface User {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UsersManagementProps {
  users: User[];
  userRole?: string;
}

export function UsersManagement({ users: initialUsers, userRole = "customer" }: UsersManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [filterRole, setFilterRole] = useState<string>("all");

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(new Date(date));
  };

  const getRoleColor = (role: string) => {
    if (role === "admin") return "bg-purple-100 text-purple-800";
    if (role === "visitor") return "bg-amber-100 text-amber-800";
    return "bg-blue-100 text-blue-800";
  };

  const getRoleLabel = (role: string) => {
    if (role === "admin") return "Administrador";
    if (role === "visitor") return "Visitante";
    return "Cliente";
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      alert("Erro ao atualizar permissão do usuário");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      alert("Erro ao deletar usuário");
    }
  };

  const filteredUsers =
    filterRole === "all"
      ? users
      : users.filter((user) => user.role === filterRole);

  return (
    <Card>
      <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg mb-1">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Gerenciamento de Usuários
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Visualize e gerencie usuários da plataforma
            </CardDescription>
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-8 sm:h-10">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="customer">Clientes</SelectItem>
              <SelectItem value="visitor">Visitantes</SelectItem>
              <SelectItem value="admin">Administradores</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm px-3">
            Nenhum usuário encontrado
          </div>
        ) : (
          <>
            {/* Desktop/Tablet - Tabela (lg e acima) */}
            <div className="hidden lg:block overflow-x-auto px-6 pb-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-sm">{user.id}</TableCell>
                        <TableCell className="text-sm">{user.name}</TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]">
                          {user.email}
                        </TableCell>
                        <TableCell className="text-sm">{user.cpf || "-"}</TableCell>
                        <TableCell className="text-sm">{user.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge className={`${getRoleColor(user.role)} text-xs`}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleRoleChange(user.id, value)}
                            >
                              <SelectTrigger className="w-[140px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Cliente</SelectItem>
                                <SelectItem value="visitor">Visitante</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Deletar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile/Tablet - Cards (abaixo de lg) */}
            <div className="lg:hidden space-y-3 px-3 pb-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2">
                      {/* Cabeçalho */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm">
                              ID {user.id}
                            </span>
                            <Badge className={`${getRoleColor(user.role)} text-[10px] sm:text-xs`}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </div>
                          <p className="font-semibold text-sm sm:text-base truncate">
                            {user.name}
                          </p>
                        </div>
                      </div>

                      {/* Informações */}
                      <div className="pt-2 border-t space-y-1.5">
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-xs sm:text-sm truncate">{user.email}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">CPF</p>
                            <p className="text-xs sm:text-sm">{user.cpf || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Telefone</p>
                            <p className="text-xs sm:text-sm">{user.phone || "-"}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Cadastrado em</p>
                          <p className="text-xs sm:text-sm">{formatDateShort(user.createdAt)}</p>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="pt-2 border-t flex gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="flex-1 text-xs sm:text-sm h-8 sm:h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Cliente</SelectItem>
                            <SelectItem value="visitor">Visitante</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-8 sm:h-9 px-2 sm:px-3"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="ml-1 text-xs sm:text-sm hidden sm:inline">
                            Deletar
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
