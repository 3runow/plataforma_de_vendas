"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { User, LogOut, Package, LayoutDashboard, Heart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Bom dia";
  } else if (hour >= 12 && hour < 18) {
    return "Boa tarde";
  } else {
    return "Boa noite";
  }
}

export default function UserDropdown() {
  const router = useRouter();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const greeting = getGreeting();

  useEffect(() => {
    // busca dados do usuário
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          // pega apenas o primeiro nome
          const firstName = data.user.name?.split(" ")[0] || "Usuário";
          setUserName(firstName);
          // verifica se é admin
          setIsAdmin(data.user.role === "admin");
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar dados do usuário:", error);
      });
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (response.ok) {
        // Mostrar toast de sucesso (vermelho para logout)
        toast({
          title: "Logout realizado!",
          description: "Você saiu da sua conta com sucesso. Até logo!",
          variant: "destructive",
          duration: 3000,
        });

        // Disparar evento para atualizar header
        window.dispatchEvent(new Event("auth-change"));

        // Aguardar um pouco antes de redirecionar
        setTimeout(() => {
          router.refresh();
          router.push("/");
        }, 500);
      } else {
        console.error("Erro no logout:", response.status);
        toast({
          title: "Erro ao sair",
          description: "Ocorreu um erro ao fazer logout. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"outline"}
          size="icon"
          className="text-[#f7f7f7] hover:text-[#f7f7f7] bg-[#022044] hover:bg-[#01152d]"
        >
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          {userName ? `${greeting}, ${userName}!` : "Minha Conta"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard Administrativo</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Package className="mr-2 h-4 w-4" />
          <span>Meus Pedidos</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/favoritos")}>
          <Heart className="mr-2 h-4 w-4" />
          <span>Meus Favoritos</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
