"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader } from "./ui/dialog";
import {
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { Button } from "./ui/button";
import { Mail } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import WhatsAppLogo from "./icons/whats-app";

const contactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório."),
  email: z.string().email("Insira um e-mail válido."),
  message: z.string().min(8, "A mensagem deve ter no mínimo 8 caracteres."),
});

type FormData = z.infer<typeof contactSchema>;

export default function ContactModal() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(contactSchema),
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
      setSuccessMsg("");
      setErrorMsg("");
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await fetch(
        "https://formsubmit.co/ajax/devlucasbarros@gmail.com",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        setSuccessMsg("Mensagem enviada com sucesso!");
        reset();
      } else {
        throw new Error("Falha ao enviar mensagem.");
      }
    } catch (error) {
      console.log(error);
      setErrorMsg("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <p className="text-zinc-50 font-medium hover:underline cursor-pointer">
            Contato
          </p>
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg sm:text-xl">
              Entre em Contato
            </DialogTitle>
            <DialogDescription className="text-sm">
              Preencha o formulário abaixo e entraremos em contato em breve.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 mb-4">
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <Mail className="h-4 w-4 text-[#022044] flex-shrink-0" />
              <span className="break-all">devlucasbarros@gmail.com</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <WhatsAppLogo className="h-4 w-4 flex-shrink-0" />
              <a
                href="https://wa.me/5513996222102"
                target="_blank"
                rel="noreferrer"
              >
                (13) 99622-2102
              </a>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Nome</Label>
              <Input
                id="contact-name"
                type="text"
                placeholder="Seu nome"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">E-Mail</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="seu@email.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">Mensagem</Label>
              <Textarea
                id="contact-message"
                placeholder="Como podemos ajudar?"
                {...register("message")}
                className={errors.message ? "border-red-500" : ""}
                rows={4}
              />
              {errors.message && (
                <p className="text-red-500 text-sm">{errors.message.message}</p>
              )}
            </div>

            {successMsg && (
              <p className="text-green-600 text-sm font-medium">{successMsg}</p>
            )}
            {errorMsg && (
              <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
