"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
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

const eventoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
});

type EventoFormValues = z.infer<typeof eventoSchema>;

type FormularioEventoProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtipoId: string;
  onSuccess: (eventoId: string) => void;
};

export function FormularioEvento({
  open,
  onOpenChange,
  subtipoId,
  onSuccess,
}: FormularioEventoProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventoFormValues>({
    resolver: zodResolver(eventoSchema),
    defaultValues: { nombre: "", fecha: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      nombre: "",
      fecha: new Date().toISOString().slice(0, 10),
    });
    setServerError(null);
  }, [open, reset]);

  async function onSubmit(values: EventoFormValues) {
    setServerError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("eventos")
      .insert({
        subtipo_id: subtipoId,
        nombre: values.nombre.trim(),
        fecha: values.fecha,
      })
      .select("id")
      .single();

    if (error || !data) {
      setServerError(error?.message ?? "No se pudo crear el evento");
      return;
    }
    onOpenChange(false);
    onSuccess(data.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo evento</DialogTitle>
          <DialogDescription>
            Un temporal o período de lluvias que agrupa filtración-proyectos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Lluvias agosto 2026"
              {...register("nombre")}
            />
            {errors.nombre ? (
              <p className="text-sm text-destructive">{errors.nombre.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha *</Label>
            <Input id="fecha" type="date" {...register("fecha")} />
            {errors.fecha ? (
              <p className="text-sm text-destructive">{errors.fecha.message}</p>
            ) : null}
          </div>
          {serverError ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando…" : "Crear evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
