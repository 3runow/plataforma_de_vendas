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
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
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
    } catch (err: unknown) {
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
    setIsForgotPassword(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    loginForm.reset();
    registerForm.reset();
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    if (!forgotPasswordEmail || !forgotPasswordEmail.includes("@")) {
      setError("Por favor, insira um email válido");
      return;
    }

    setIsSendingResetEmail(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao enviar email de recuperação");
      }

      setMessage(
        "Email de recuperação enviado! Verifique sua caixa de entrada."
      );
      setForgotPasswordEmail("");

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para recuperar sua senha.",
        duration: 5000,
      });

      setTimeout(() => {
        setIsForgotPassword(false);
        setMessage("");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar email");
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isForgotPassword
              ? "Recuperar Senha"
              : isLogin
                ? "Login"
                : "Criar Conta"}
          </DialogTitle>
          <DialogDescription>
            {isForgotPassword
              ? "Digite seu email para receber instruções de recuperação"
              : isLogin
                ? "Entre com seu email e senha para acessar sua conta"
                : "Preencha os dados abaixo para criar sua conta"}
          </DialogDescription>
        </DialogHeader>

        {isForgotPassword ? (
          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                disabled={isSendingResetEmail}
              />
            </div>

            <Button
              onClick={handleForgotPassword}
              className="w-full"
              disabled={isSendingResetEmail}
            >
              {isSendingResetEmail && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enviar Email de Recuperação
            </Button>

            <div className="text-sm text-center text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError("");
                  setMessage("");
                }}
                className="text-primary hover:underline font-medium"
              >
                Voltar ao login
              </button>
            </div>
          </div>
        ) : (
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...(isLogin
                    ? loginForm.register("password")
                    : registerForm.register("password"))}
                  disabled={
                    isLogin
                      ? loginForm.formState.isSubmitting
                      : registerForm.formState.isSubmitting
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
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

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...registerForm.register("confirmPassword")}
                    disabled={registerForm.formState.isSubmitting}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}

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

            {isLogin && (
              <div className="text-sm text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError("");
                    setMessage("");
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

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
        )}
      </DialogContent>
    </Dialog>
  );
}
