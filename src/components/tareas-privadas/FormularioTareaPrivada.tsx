"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
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
  ESTADOS_TAREA_PRIVADA,
  ESTADO_TAREA_PRIVADA_LABEL,
  PRIORIDADES_TAREA_PRIVADA,
  PRIORIDAD_TAREA_PRIVADA_LABEL,
  tituloDesdeDescripcion,
  type EstadoTareaPrivada,
  type PrioridadTareaPrivada,
  type TareaPrivadaListado,
} from "@/lib/trabajos";

const schema = z.object({
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  estado: z.enum(ESTADOS_TAREA_PRIVADA),
  prioridad: z.enum(PRIORIDADES_TAREA_PRIVADA),
});

type FormValues = z.infer<typeof schema>;

type FormularioTareaPrivadaProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaId: string;
  subtipoId: string;
  tarea?: TareaPrivadaListado | null;
  onSuccess: (trabajoId?: string) => void;
};

export function FormularioTareaPrivada({
  open,
  onOpenChange,
  categoriaId,
  subtipoId,
  tarea = null,
  onSuccess,
}: FormularioTareaPrivadaProps) {
  const isEdit = Boolean(tarea?.id);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      descripcion: "",
      estado: "pendiente",
      prioridad: "media",
    },
  });

  useEffect(() => {
    if (!open) return;
    const estado =
      tarea?.estado &&
      (ESTADOS_TAREA_PRIVADA as readonly string[]).includes(tarea.estado)
        ? (tarea.estado as EstadoTareaPrivada)
        : "pendiente";
    const prioridad =
      tarea?.prioridad &&
      (PRIORIDADES_TAREA_PRIVADA as readonly string[]).includes(tarea.prioridad)
        ? (tarea.prioridad as PrioridadTareaPrivada)
        : "media";
    reset({
      descripcion: tarea?.descripcion ?? "",
      estado,
      prioridad,
    });
    setServerError(null);
  }, [open, tarea, reset]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const descripcion = values.descripcion.trim();
    const payload = {
      titulo: tituloDesdeDescripcion(descripcion),
      descripcion,
      estado: values.estado,
      prioridad: values.prioridad,
      categoria_id: categoriaId,
      subtipo_id: subtipoId,
      recinto_id: null,
    };

    if (isEdit && tarea) {
      const { error } = await supabase
        .from("trabajos")
        .update(payload)
        .eq("id", tarea.id);
      if (error) {
        setServerError(error.message);
        return;
      }
      onSuccess(tarea.id);
      onOpenChange(false);
      return;
    }

    const { data, error } = await supabase
      .from("trabajos")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      setServerError(error.message);
      return;
    }
    onSuccess(data.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            Descripción, estado, prioridad y archivos (en el detalle). Solo tú
            la ves.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              rows={6}
              placeholder="Qué hay que hacer…"
              {...register("descripcion")}
            />
            {errors.descripcion ? (
              <p className="text-sm text-destructive">
                {errors.descripcion.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange((v as EstadoTareaPrivada) ?? "pendiente")
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_TAREA_PRIVADA.map((e) => (
                        <SelectItem key={e} value={e}>
                          {ESTADO_TAREA_PRIVADA_LABEL[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Prioridad</Label>
              <Controller
                name="prioridad"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange((v as PrioridadTareaPrivada) ?? "media")
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES_TAREA_PRIVADA.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORIDAD_TAREA_PRIVADA_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
