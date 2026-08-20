"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
  tituloDesdeDescripcion,
  type TareaPrivadaListado,
} from "@/lib/trabajos";

const schema = z.object({
  descripcion: z.string().min(1, "La descripción es obligatoria"),
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { descripcion: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({ descripcion: tarea?.descripcion ?? "" });
    setServerError(null);
  }, [open, tarea, reset]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const descripcion = values.descripcion.trim();
    const payload = {
      titulo: tituloDesdeDescripcion(descripcion),
      descripcion,
      estado: "planificado" as const,
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
            Solo descripción y archivos (en el detalle). Visible únicamente para
            ti.
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
