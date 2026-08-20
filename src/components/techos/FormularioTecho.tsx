"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { proximaRevisionIso, type TechoListado } from "@/lib/trabajos";

const schema = z.object({
  titulo: z.string().min(1, "El nombre del techo es obligatorio"),
  materiales: z.string().optional(),
  descripcion: z.string().optional(),
  planAccion: z.string().optional(),
  fechaUltimaRevision: z.string().optional(),
  periodicidadDias: z.string().min(1, "Indica el intervalo en días"),
});

type FormValues = z.infer<typeof schema>;

type FormularioTechoProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaId: string;
  subtipoId: string;
  techo?: TechoListado | null;
  onSuccess: (trabajoId?: string) => void;
};

export function FormularioTecho({
  open,
  onOpenChange,
  categoriaId,
  subtipoId,
  techo = null,
  onSuccess,
}: FormularioTechoProps) {
  const isEdit = Boolean(techo?.id);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: "",
      materiales: "",
      descripcion: "",
      planAccion: "",
      fechaUltimaRevision: "",
      periodicidadDias: "90",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      titulo: techo?.titulo ?? "",
      materiales: techo?.materiales ?? "",
      descripcion: techo?.descripcion ?? "",
      planAccion: techo?.plan_accion ?? "",
      fechaUltimaRevision: techo?.fecha_ultima_revision ?? "",
      periodicidadDias:
        techo?.periodicidad_dias != null ? String(techo.periodicidad_dias) : "90",
    });
    setServerError(null);
  }, [open, techo, reset]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const periodicidad = Number(values.periodicidadDias);
    if (!Number.isFinite(periodicidad) || periodicidad <= 0) {
      setServerError("El intervalo debe ser un número de días mayor a 0");
      return;
    }

    const fechaUltima = values.fechaUltimaRevision || null;
    const payload = {
      titulo: values.titulo.trim(),
      materiales: values.materiales?.trim() || null,
      descripcion: values.descripcion?.trim() || null,
      plan_accion: values.planAccion?.trim() || null,
      fecha_ultima_revision: fechaUltima,
      periodicidad_dias: periodicidad,
      proxima_mantencion: proximaRevisionIso(fechaUltima, periodicidad),
      recinto_id: null,
      estado: "mantencion_periodica",
      categoria_id: categoriaId,
      subtipo_id: subtipoId,
    };

    const supabase = createClient();
    if (isEdit && techo) {
      const { error } = await supabase
        .from("trabajos")
        .update(payload)
        .eq("id", techo.id);
      if (error) {
        setServerError(error.message);
        return;
      }
      onOpenChange(false);
      onSuccess(techo.id);
      return;
    }

    const { data, error } = await supabase
      .from("trabajos")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) {
      setServerError(error?.message ?? "No se pudo crear el techo");
      return;
    }
    onOpenChange(false);
    onSuccess(data.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar techo" : "Nuevo techo"}</DialogTitle>
          <DialogDescription>
            Recurso físico a revisar de forma periódica. No va ligado a un recinto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="titulo">Nombre *</Label>
            <Input
              id="titulo"
              placeholder="Techo 3 / Techo Galpón 2"
              {...register("titulo")}
            />
            {errors.titulo ? (
              <p className="text-sm text-destructive">{errors.titulo.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="materiales">Materiales</Label>
            <Textarea id="materiales" rows={2} {...register("materiales")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Estado del techo y materiales</Label>
            <Textarea id="descripcion" rows={3} {...register("descripcion")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="planAccion">Plan de acción</Label>
            <Textarea id="planAccion" rows={3} {...register("planAccion")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fechaUltimaRevision">Última revisión</Label>
              <Input
                id="fechaUltimaRevision"
                type="date"
                {...register("fechaUltimaRevision")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="periodicidadDias">Intervalo (días) *</Label>
              <Input
                id="periodicidadDias"
                inputMode="numeric"
                placeholder="90"
                {...register("periodicidadDias")}
              />
              {errors.periodicidadDias ? (
                <p className="text-sm text-destructive">
                  {errors.periodicidadDias.message}
                </p>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            La próxima revisión se calcula sola: última revisión + intervalo.
          </p>
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
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar" : "Crear techo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
