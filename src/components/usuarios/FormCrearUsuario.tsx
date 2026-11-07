"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// nombre_completo viaja en el body/API/metadata de Auth;
// en DB se persiste como perfiles.nombre vía el trigger.
const createUserSchema = z.object({
  nombre_completo: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  capacidad: z.enum(["ver", "editar"]),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

const CAPACIDADES: { value: CreateUserValues["capacidad"]; etiqueta: string }[] = [
  { value: "ver", etiqueta: "Solo ver" },
  { value: "editar", etiqueta: "Ver y editar" },
];

export function FormCrearUsuario({ onCreado }: { onCreado?: (id: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      nombre_completo: "",
      email: "",
      password: "",
      capacidad: "ver",
    },
  });

  async function onSubmit(values: CreateUserValues) {
    setServerError(null);

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre_completo: values.nombre_completo,
        email: values.email,
        password: values.password,
        rol: values.capacidad === "editar" ? "asistente" : "socio",
      }),
    });

    const data = (await res.json()) as { error?: string; user?: { id?: string } };

    if (!res.ok || !data.user?.id) {
      setServerError(data.error ?? "No se pudo crear la persona");
      return;
    }

    onCreado?.(data.user.id);
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" className="min-h-11" onClick={() => setOpen(true)}>
        Nueva persona
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setServerError(null);
            reset();
          }
        }}
      >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Podrá entrar con este correo. Después eliges qué categorías ve.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nombre_completo">Nombre</Label>
            <Input id="nombre_completo" {...register("nombre_completo")} />
            {errors.nombre_completo ? (
              <p className="text-sm text-destructive">
                {errors.nombre_completo.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="off" {...register("email")} />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña temporal</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Qué puede hacer</Label>
            <Controller
              name="capacidad"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (value === "ver" || value === "editar") field.onChange(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAPACIDADES.map((opcion) => (
                      <SelectItem key={opcion.value} value={opcion.value}>
                        {opcion.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.capacidad ? (
              <p className="text-sm text-destructive">{errors.capacidad.message}</p>
            ) : null}
          </div>

          {serverError ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" className="min-h-11" disabled={isSubmitting}>
              {isSubmitting ? "Creando…" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
