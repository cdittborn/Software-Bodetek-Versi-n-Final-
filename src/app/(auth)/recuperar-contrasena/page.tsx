"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const recoverSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
});

type RecoverFormValues = z.infer<typeof recoverSchema>;

export default function RecuperarContrasenaPage() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoverFormValues>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RecoverFormValues) {
    setFormError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/nueva-contrasena`;
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo-bodetek.png"
            alt="Bodetek"
            width={180}
            height={44}
            priority
            className="mb-6 h-10 w-auto"
          />
          <h1 className="text-base font-medium">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Te enviaremos un link para definir una nueva clave
          </p>
        </div>

        {sent ? (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
            Si el correo existe, te llegará un link en unos minutos.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>

            {formError ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando…" : "Enviar link de recuperación"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm">
          <Link
            href="/login"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Volver al login
          </Link>
        </p>
      </div>
    </main>
  );
}
