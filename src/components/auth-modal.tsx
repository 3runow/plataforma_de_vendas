"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthModalProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export default function AuthModal({
  open,
  onOpenChangeAction,
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Erro ao fazer login"
        );
      }

      // Mostrar toast de sucesso
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta! Você foi autenticado com sucesso.",
        duration: 3000,
      });

      onOpenChangeAction(false);

      // Disparar evento para atualizar header
      window.dispatchEvent(new Event("auth-change"));

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      let responseData: any = null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        responseData = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          `Resposta inesperada do servidor (${
            res.status
          }). Conteúdo: ${text.slice(0, 200)}`
        );
      }

      if (!res.ok) {
        setError(responseData?.error || "Erro ao criar conta.");
        return;
      }

      if (responseData?.error) {
        setError(responseData.error);
      } else {
        setMessage("Conta criada com sucesso! Faça login agora.");
        registerForm.reset();
        setTimeout(() => {
          setIsLogin(true);
          setMessage("");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro. Tente novamente.");
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setMessage("");
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isLogin ? "Login" : "Criar Conta"}
          </DialogTitle>
          <DialogDescription>
            {isLogin
              ? "Entre com seu email e senha para acessar sua conta"
              : "Preencha os dados abaixo para criar sua conta"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            isLogin
              ? loginForm.handleSubmit(onLoginSubmit)
              : registerForm.handleSubmit(onRegisterSubmit)
          }
          className="space-y-4"
        >
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Seu nome completo"
                {...registerForm.register("name")}
                disabled={registerForm.formState.isSubmitting}
              />
              {registerForm.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...(isLogin
                ? loginForm.register("email")
                : registerForm.register("email"))}
              disabled={
                isLogin
                  ? loginForm.formState.isSubmitting
                  : registerForm.formState.isSubmitting
              }
            />
            {isLogin
              ? loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.email.message}
                  </p>
                )
              : registerForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...(isLogin
                ? loginForm.register("password")
                : registerForm.register("password"))}
              disabled={
                isLogin
                  ? loginForm.formState.isSubmitting
                  : registerForm.formState.isSubmitting
              }
            />
            {isLogin
              ? loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.password.message}
                  </p>
                )
              : registerForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isLogin
                ? loginForm.formState.isSubmitting
                : registerForm.formState.isSubmitting
            }
          >
            {(isLogin
              ? loginForm.formState.isSubmitting
              : registerForm.formState.isSubmitting) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isLogin ? "Entrar" : "Criar Conta"}
          </Button>

          <div className="text-sm text-center text-muted-foreground">
            {isLogin ? "Não tem conta ainda? " : "Já tem uma conta? "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Cadastre-se" : "Fazer login"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
