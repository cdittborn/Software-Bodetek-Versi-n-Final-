"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ESTADOS_EMERGENCIA,
  ESTADO_TRABAJO_LABEL,
  etiquetaRecintoSelector,
  type EstadoEmergencia,
  type ProyectoPatenteListado,
  type RecintoOption,
} from "@/lib/trabajos";

const schema = z.object({
  titulo: z.string().min(1, "El nombre es obligatorio"),
  recintoId: z.string().optional(),
  descripcion: z.string().optional(),
  fechaTermino: z.string().optional(),
  estado: z.enum(ESTADOS_EMERGENCIA),
});

type FormValues = z.infer<typeof schema>;

export type VariantePatente = "clientes" | "recepcion";

type FormularioProyectoPatenteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variante: VariantePatente;
  categoriaId: string;
  subtipoId: string;
  recintos: RecintoOption[];
  proyecto?: ProyectoPatenteListado | null;
  onSuccess: (trabajoId?: string) => void;
};

export function FormularioProyectoPatente({
  open,
  onOpenChange,
  variante,
  categoriaId,
  subtipoId,
  recintos,
  proyecto = null,
  onSuccess,
}: FormularioProyectoPatenteProps) {
  const isEdit = Boolean(proyecto?.id);
  const [serverError, setServerError] = useState<string | null>(null);
  const esRecepcion = variante === "recepcion";

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: "",
      recintoId: "none",
      descripcion: "",
      fechaTermino: "",
      estado: "en_proceso",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      titulo: proyecto?.titulo ?? "",
      recintoId: proyecto?.recinto_id ?? "none",
      descripcion: proyecto?.descripcion ?? "",
      fechaTermino: proyecto?.fecha_termino ?? "",
      estado: (proyecto?.estado as EstadoEmergencia) ?? "en_proceso",
    });
    setServerError(null);
  }, [open, proyecto, reset]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const payload = {
      titulo: values.titulo.trim(),
      descripcion: values.descripcion?.trim() || null,
      estado: values.estado,
      categoria_id: categoriaId,
      subtipo_id: subtipoId,
      recinto_id:
        !esRecepcion && values.recintoId && values.recintoId !== "none"
          ? values.recintoId
          : null,
      fecha_termino: esRecepcion && values.fechaTermino ? values.fechaTermino : null,
    };

    if (isEdit && proyecto) {
      const { error } = await supabase
        .from("trabajos")
        .update(payload)
        .eq("id", proyecto.id);
      if (error) {
        setServerError(error.message);
        return;
      }
      onOpenChange(false);
      onSuccess(proyecto.id);
      return;
    }

    const { data, error } = await supabase
      .from("trabajos")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) {
      setServerError(error?.message ?? "No se pudo crear el proyecto");
      return;
    }
    onOpenChange(false);
    onSuccess(data.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Editar proyecto"
              : esRecepcion
                ? "Nuevo proyecto de recepción de obras"
                : "Nuevo proyecto"}
          </DialogTitle>
          <DialogDescription>
            {esRecepcion
              ? "Describe el proyecto, su fecha de entrega y el estado."
              : "Cada cliente en proceso es un proyecto. Puedes asociar un recinto."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="titulo">
              {esRecepcion ? "Nombre del proyecto *" : "Cliente / proyecto *"}
            </Label>
            <Input
              id="titulo"
              placeholder={
                esRecepcion ? "Recepción de obras — Galpón A" : "Nombre del cliente"
              }
              {...register("titulo")}
            />
            {errors.titulo ? (
              <p className="text-sm text-destructive">{errors.titulo.message}</p>
            ) : null}
          </div>

          {!esRecepcion ? (
            <div className="space-y-1.5">
              <Label>Recinto</Label>
              <Controller
                name="recintoId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) => field.onChange(v ?? "none")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin recinto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin recinto</SelectItem>
                      {recintos.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {etiquetaRecintoSelector(r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">
              {esRecepcion ? "Descripción general" : "Comentario general"}
            </Label>
            <Textarea
              id="descripcion"
              rows={4}
              placeholder={
                esRecepcion
                  ? "Alcance, contexto y observaciones del proyecto"
                  : "Observaciones, estado de la patente, conversaciones con la DOM…"
              }
              {...register("descripcion")}
            />
          </div>

          {esRecepcion ? (
            <div className="space-y-1.5">
              <Label htmlFor="fechaTermino">Fecha de entrega del proyecto</Label>
              <Input id="fechaTermino" type="date" {...register("fechaTermino")} />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Controller
              name="estado"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) =>
                    field.onChange((v as EstadoEmergencia) ?? "en_proceso")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_EMERGENCIA.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {ESTADO_TRABAJO_LABEL[estado]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar" : "Crear proyecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
