"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Ticket,
  MoreHorizontal,
  Trash2,
  Edit,
  Copy,
  TrendingUp,
  Calendar,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface Coupon {
  id: number;
  code: string;
  discount: number;
  isActive: boolean;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CouponsManagementProps {
  coupons: Coupon[];
}

export function CouponsManagement({
  coupons: initialCoupons,
}: CouponsManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discount: "",
    isActive: true,
    expiresAt: "",
    usageLimit: "",
  });

  const resetForm = () => {
    setFormData({
      code: "",
      discount: "",
      isActive: true,
      expiresAt: "",
      usageLimit: "",
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Sem expiração";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const expiresAt = coupon.expiresAt ? new Date(coupon.expiresAt) : null;

    if (!coupon.isActive) {
      return <Badge variant="secondary">Inativo</Badge>;
    }

    if (expiresAt && expiresAt < now) {
      return <Badge variant="destructive">Expirado</Badge>;
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return <Badge variant="destructive">Limite atingido</Badge>;
    }

    return <Badge className="bg-green-500">Ativo</Badge>;
  };

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/coupons");
      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error("Erro ao buscar cupons:", error);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discount: parseFloat(formData.discount),
          isActive: formData.isActive,
          expiresAt: formData.expiresAt || null,
          usageLimit: formData.usageLimit
            ? parseInt(formData.usageLimit)
            : null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Cupom criado!",
          description: `O cupom ${formData.code} foi criado com sucesso.`,
          duration: 3000,
        });
        setIsAddDialogOpen(false);
        resetForm();
        fetchCoupons();
        router.refresh();
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao criar cupom",
          description: error.error || "Ocorreu um erro ao criar o cupom.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao criar cupom:", error);
      toast({
        title: "Erro ao criar cupom",
        description: "Ocorreu um erro ao criar o cupom.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleEditCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoupon) return;

    try {
      const response = await fetch(`/api/coupons/${selectedCoupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          discount: parseFloat(formData.discount),
          isActive: formData.isActive,
          expiresAt: formData.expiresAt || null,
          usageLimit: formData.usageLimit
            ? parseInt(formData.usageLimit)
            : null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Cupom atualizado!",
          description: `O cupom ${formData.code} foi atualizado com sucesso.`,
          duration: 3000,
        });
        setIsEditDialogOpen(false);
        setSelectedCoupon(null);
        resetForm();
        fetchCoupons();
        router.refresh();
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao atualizar cupom",
          description: error.error || "Ocorreu um erro ao atualizar o cupom.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar cupom:", error);
      toast({
        title: "Erro ao atualizar cupom",
        description: "Ocorreu um erro ao atualizar o cupom.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleDeleteCoupon = async (id: number, code: string) => {
    if (!confirm(`Tem certeza que deseja deletar o cupom ${code}?`)) return;

    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Cupom deletado!",
          description: `O cupom ${code} foi deletado com sucesso.`,
          duration: 3000,
        });
        fetchCoupons();
        router.refresh();
      } else {
        toast({
          title: "Erro ao deletar cupom",
          description: "Ocorreu um erro ao deletar o cupom.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao deletar cupom:", error);
      toast({
        title: "Erro ao deletar cupom",
        description: "Ocorreu um erro ao deletar o cupom.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast({
          title: "Status atualizado!",
          description: `O cupom foi ${!currentStatus ? "ativado" : "desativado"} com sucesso.`,
          duration: 3000,
        });
        fetchCoupons();
        router.refresh();
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount: coupon.discount.toString(),
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt
        ? new Date(coupon.expiresAt).toISOString().split("T")[0]
        : "",
      usageLimit: coupon.usageLimit?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: `O código ${code} foi copiado para a área de transferência.`,
      duration: 2000,
    });
  };

  // Estatísticas
  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalUsage = coupons.reduce((acc, c) => acc + c.usedCount, 0);

  return (
    <>
      {/* Estatísticas */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total de Cupons
            </CardTitle>
            <Ticket className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {coupons.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeCoupons} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Usos Totais
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">em todos os cupons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Desconto Médio
            </CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {coupons.length > 0
                ? (
                    coupons.reduce((acc, c) => acc + c.discount, 0) /
                    coupons.length
                  ).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">média de desconto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Próximo Expirando
            </CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xs sm:text-sm font-bold">
              {(() => {
                const validCoupons = coupons
                  .filter(
                    (c) => c.expiresAt && new Date(c.expiresAt) > new Date()
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.expiresAt!).getTime() -
                      new Date(b.expiresAt!).getTime()
                  );
                return validCoupons.length > 0
                  ? formatDate(validCoupons[0].expiresAt)
                  : "Nenhum";
              })()}
            </div>
            <p className="text-xs text-muted-foreground">próxima expiração</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Cupons */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                Gerenciar Cupons
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gerencie os cupons de desconto da sua loja
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
              className="w-full sm:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cupom
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Código</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Desconto
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Uso</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Validade
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhum cupom cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono font-bold">
                          <div className="flex items-center gap-2">
                            <span>{coupon.code}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(coupon.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="font-semibold text-green-600">
                            {coupon.discount}%
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(coupon)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">
                            <span className="font-medium">
                              {coupon.usedCount}
                            </span>
                            {coupon.usageLimit && (
                              <span className="text-muted-foreground">
                                {" / "}
                                {coupon.usageLimit}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {formatDate(coupon.expiresAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => copyToClipboard(coupon.code)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar código
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openEditDialog(coupon)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleActive(coupon.id, coupon.isActive)
                                }
                              >
                                {coupon.isActive ? "Desativar" : "Ativar"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  handleDeleteCoupon(coupon.id, coupon.code)
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deletar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para Adicionar Cupom */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Cupom</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar um novo cupom de desconto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCoupon}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">
                  Código do Cupom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Ex: DESCONTO10"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="discount">
                  Desconto (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="discount"
                  type="number"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: e.target.value })
                  }
                  placeholder="Ex: 10"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Data de Expiração</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="usageLimit">Limite de Uso</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  placeholder="Deixe vazio para ilimitado"
                  min="1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Cupom Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Criar Cupom</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Cupom */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Cupom</DialogTitle>
            <DialogDescription>
              Atualize os dados do cupom {selectedCoupon?.code}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCoupon}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-code">
                  Código do Cupom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Ex: DESCONTO10"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-discount">
                  Desconto (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-discount"
                  type="number"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: e.target.value })
                  }
                  placeholder="Ex: 10"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-expiresAt">Data de Expiração</Label>
                <Input
                  id="edit-expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-usageLimit">Limite de Uso</Label>
                <Input
                  id="edit-usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  placeholder="Deixe vazio para ilimitado"
                  min="1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="edit-isActive">Cupom Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedCoupon(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
