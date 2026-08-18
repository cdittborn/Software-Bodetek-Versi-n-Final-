"use client";

import { useEffect, useRef, useState } from "react";
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
  ESTADOS_EMERGENCIA,
  ESTADO_TRABAJO_LABEL,
  etiquetaRecintoSelector,
  type EmergenciaListado,
  type EstadoEmergencia,
  type RecintoOption,
} from "@/lib/trabajos";

const emergencySchema = z.object({
  recintoId: z.string().min(1, "Selecciona la bodega afectada"),
  descripcion: z.string().min(1, "Describe el problema"),
  planAccion: z.string().optional(),
  estado: z.enum(ESTADOS_EMERGENCIA),
});

type EmergencyFormValues = z.infer<typeof emergencySchema>;

export type FormularioEmergenciaProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaId: string;
  subtipoId: string;
  recintos: RecintoOption[];
  emergencia?: EmergenciaListado | null;
  onSuccess: (trabajoId?: string) => void;
};

function kindFromFile(file: File): "foto" | "video" {
  if (file.type.startsWith("video/")) return "video";
  return "foto";
}

async function subirArchivosATrabajo(trabajoId: string, files: File[]) {
  const supabase = createClient();

  for (const file of files) {
    const presignRes = await fetch("/api/storage/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreArchivo:
          file.name ||
          `captura.${file.type.startsWith("video/") ? "mp4" : "jpg"}`,
        tipoArchivo: file.type || "application/octet-stream",
        carpeta: `trabajos/${trabajoId}`,
      }),
    });
    const presign = (await presignRes.json()) as {
      url?: string;
      key?: string;
      error?: string;
    };
    if (!presignRes.ok || !presign.url || !presign.key) {
      throw new Error(presign.error ?? "No se pudo firmar la subida");
    }

    const put = await fetch(presign.url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });
    if (!put.ok) {
      throw new Error(
        `R2 rechazó el archivo (${put.status}). Revisa CORS del bucket si es un PUT desde el navegador.`,
      );
    }

    const { error: insertError } = await supabase.from("trabajo_media").insert({
      trabajo_id: trabajoId,
      tipo: "antes",
      tipo_archivo: kindFromFile(file),
      url: presign.key,
    });
    if (insertError) throw new Error(insertError.message);
  }
}

export function FormularioEmergencia({
  open,
  onOpenChange,
  categoriaId,
  subtipoId,
  recintos,
  emergencia = null,
  onSuccess,
}: FormularioEmergenciaProps) {
  const isEdit = Boolean(emergencia?.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [archivos, setArchivos] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmergencyFormValues>({
    resolver: zodResolver(emergencySchema),
    defaultValues: {
      recintoId: "",
      descripcion: "",
      planAccion: "",
      estado: "pendiente",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      recintoId: emergencia?.recinto_id ?? "",
      descripcion: emergencia?.descripcion ?? "",
      planAccion: emergencia?.plan_accion ?? "",
      estado: (emergencia?.estado as EstadoEmergencia) ?? "pendiente",
    });
    setServerError(null);
    setArchivos([]);
    if (fileRef.current) fileRef.current.value = "";
  }, [open, emergencia, reset]);

  async function onSubmit(values: EmergencyFormValues) {
    setServerError(null);

    const recinto = recintos.find((r) => r.id === values.recintoId);
    const titulo = recinto
      ? `Lluvias y temporales — ${recinto.codigo}`
      : "Lluvias y temporales";

    const payload = {
      titulo,
      descripcion: values.descripcion.trim(),
      plan_accion: values.planAccion?.trim() || null,
      estado: values.estado,
      recinto_id: values.recintoId,
      categoria_id: categoriaId,
      subtipo_id: subtipoId,
      updated_at: new Date().toISOString(),
    };

    const supabase = createClient();
    let trabajoId = emergencia?.id ?? null;

    try {
      if (isEdit && trabajoId) {
        const { error } = await supabase
          .from("trabajos")
          .update(payload)
          .eq("id", trabajoId);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase
          .from("trabajos")
          .insert(payload)
          .select("id")
          .single();
        if (error || !data) {
          throw new Error(error?.message ?? "No se pudo crear");
        }
        trabajoId = data.id;
      }

      if (archivos.length > 0 && trabajoId) {
        await subirArchivosATrabajo(trabajoId, archivos);
      }

      onOpenChange(false);
      onSuccess(trabajoId ?? undefined);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar filtración-proyecto" : "Filtración-Proyecto"}
          </DialogTitle>
          <DialogDescription>
            Una bodega afectada. Podés adjuntar fotos o videos ahora.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label>Bodega y recinto *</Label>
            <Controller
              name="recintoId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(v) => field.onChange(v ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar bodega" />
                  </SelectTrigger>
                  <SelectContent>
                    {recintos.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {etiquetaRecintoSelector(r)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.recintoId ? (
              <p className="text-sm text-destructive">{errors.recintoId.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción del problema *</Label>
            <Textarea id="descripcion" rows={3} {...register("descripcion")} />
            {errors.descripcion ? (
              <p className="text-sm text-destructive">
                {errors.descripcion.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="planAccion">Plan de acción</Label>
            <Textarea id="planAccion" rows={3} {...register("planAccion")} />
          </div>

          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Controller
              name="estado"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) =>
                    field.onChange((v as EstadoEmergencia) ?? "pendiente")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_EMERGENCIA.map((e) => (
                      <SelectItem key={e} value={e}>
                        {ESTADO_TRABAJO_LABEL[e]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fotos y videos</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                const next = e.target.files ? Array.from(e.target.files) : [];
                setArchivos((prev) => [...prev, ...next]);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => fileRef.current?.click()}
            >
              Subir fotos y videos
            </Button>
            {archivos.length > 0 ? (
              <ul className="text-xs text-muted-foreground">
                {archivos.map((f, i) => (
                  <li key={`${f.name}-${i}`}>{f.name}</li>
                ))}
              </ul>
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
