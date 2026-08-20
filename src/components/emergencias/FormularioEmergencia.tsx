"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
  EJECUTADO_POR_LABEL,
  EJECUTADO_POR_OPCIONES,
  ESTADO_TRABAJO_LABEL,
  ESTADOS_LLUVIAS,
  GRAVEDAD_LLUVIAS_LABEL,
  GRAVEDADES_LLUVIAS,
  etiquetaRecintoSelector,
  kindFromFile,
  type EmergenciaListado,
  type EstadoLluvias,
  type EjecutadoPor,
  type GravedadLluvias,
  type RecintoOption,
} from "@/lib/trabajos";

const NONE = "none";

const emergencySchema = z.object({
  recintoId: z.string().min(1, "Selecciona la bodega afectada"),
  descripcion: z.string().min(1, "Describe el problema"),
  planAccion: z.string().optional(),
  estado: z.enum(ESTADOS_LLUVIAS),
  gravedad: z.enum(GRAVEDADES_LLUVIAS).optional().or(z.literal("")),
  ejecutadoPor: z.enum(EJECUTADO_POR_OPCIONES).optional().or(z.literal(NONE)),
  proveedor: z.string().optional(),
  valorReparacion: z.string().optional(),
});

type EmergencyFormValues = z.infer<typeof emergencySchema>;

export type FormularioEmergenciaProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaId: string;
  subtipoId: string;
  eventoId?: string;
  recintos: RecintoOption[];
  emergencia?: EmergenciaListado | null;
  onSuccess: (trabajoId?: string) => void;
};

async function subirMedia(
  trabajoId: string,
  files: File[],
  tipo: "antes" | "plano_filtraciones" | "cotizacion",
) {
  const supabase = createClient();
  for (const file of files) {
    const presignRes = await fetch("/api/storage/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreArchivo: file.name || "archivo",
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
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });
    if (!put.ok) {
      throw new Error(`R2 rechazó el archivo (${put.status})`);
    }
    const tipoArchivo =
      tipo === "cotizacion" || tipo === "plano_filtraciones"
        ? kindFromFile(file) === "foto" || kindFromFile(file) === "video"
          ? kindFromFile(file)
          : "documento"
        : kindFromFile(file) === "video"
          ? "video"
          : "foto";
    const { error } = await supabase.from("trabajo_media").insert({
      trabajo_id: trabajoId,
      tipo,
      tipo_archivo: tipoArchivo,
      url: presign.key,
      nombre_archivo: file.name || null,
    });
    if (error) throw new Error(error.message);
  }
}

export function FormularioEmergencia({
  open,
  onOpenChange,
  categoriaId,
  subtipoId,
  eventoId,
  recintos,
  emergencia = null,
  onSuccess,
}: FormularioEmergenciaProps) {
  const isEdit = Boolean(emergencia?.id);
  const evidenciaRef = useRef<HTMLInputElement>(null);
  const planoRef = useRef<HTMLInputElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [evidencia, setEvidencia] = useState<File[]>([]);
  const [planos, setPlanos] = useState<File[]>([]);

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
      estado: "sin_asignar",
      gravedad: "",
      ejecutadoPor: NONE,
      proveedor: "",
      valorReparacion: "",
    },
  });

  const ejecutadoPor = useWatch({ control, name: "ejecutadoPor" });
  const mostrarProveedor =
    ejecutadoPor === "proveedor_externo" || ejecutadoPor === "ambos";

  useEffect(() => {
    if (!open) return;
    reset({
      recintoId: emergencia?.recinto_id ?? "",
      descripcion: emergencia?.descripcion ?? "",
      planAccion: emergencia?.plan_accion ?? "",
      estado: (emergencia?.estado as EstadoLluvias) ?? "sin_asignar",
      gravedad: (emergencia?.gravedad as GravedadLluvias) ?? "",
      ejecutadoPor: (emergencia?.ejecutado_por as EjecutadoPor) ?? NONE,
      proveedor: emergencia?.proveedor ?? "",
      valorReparacion:
        emergencia?.valor_reparacion != null
          ? String(emergencia.valor_reparacion)
          : "",
    });
    setServerError(null);
    setEvidencia([]);
    setPlanos([]);
    if (evidenciaRef.current) evidenciaRef.current.value = "";
    if (planoRef.current) planoRef.current.value = "";
  }, [open, emergencia, reset]);

  async function onSubmit(values: EmergencyFormValues) {
    setServerError(null);
    const recinto = recintos.find((r) => r.id === values.recintoId);
    const titulo = recinto
      ? `Filtración — ${recinto.arrendatario_actual?.trim() || recinto.codigo}`
      : "Filtración";

    const valor = values.valorReparacion?.trim()
      ? Number(values.valorReparacion.replace(",", "."))
      : null;

    const payload = {
      titulo,
      descripcion: values.descripcion.trim(),
      plan_accion: values.planAccion?.trim() || null,
      estado: values.estado,
      gravedad: values.gravedad || null,
      ejecutado_por:
        !values.ejecutadoPor || values.ejecutadoPor === NONE
          ? null
          : values.ejecutadoPor,
      proveedor: mostrarProveedor
        ? values.proveedor?.trim() || null
        : null,
      valor_reparacion:
        valor != null && Number.isFinite(valor) ? valor : null,
      recinto_id: values.recintoId,
      categoria_id: categoriaId,
      subtipo_id: subtipoId,
      updated_at: new Date().toISOString(),
      ...(eventoId ? { evento_id: eventoId } : {}),
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

      if (trabajoId) {
        if (evidencia.length > 0) {
          await subirMedia(trabajoId, evidencia, "antes");
        }
        if (planos.length > 0) {
          await subirMedia(trabajoId, planos, "plano_filtraciones");
        }
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
            Bodega afectada, estado, gravedad y adjuntos del temporal.
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
                  <SelectTrigger className="h-10 w-full min-h-10">
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
                      field.onChange((v as EstadoLluvias) ?? "sin_asignar")
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_LLUVIAS.map((e) => (
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
              <Label>Gravedad</Label>
              <Controller
                name="gravedad"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) =>
                      field.onChange(v === NONE || !v ? "" : v)
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Sin gravedad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin gravedad</SelectItem>
                      {GRAVEDADES_LLUVIAS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {GRAVEDAD_LLUVIAS_LABEL[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ejecutado por</Label>
            <Controller
              name="ejecutadoPor"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v ?? NONE)}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin asignar</SelectItem>
                    {EJECUTADO_POR_OPCIONES.map((op) => (
                      <SelectItem key={op} value={op}>
                        {EJECUTADO_POR_LABEL[op]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {mostrarProveedor ? (
            <div className="space-y-1.5">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Input
                id="proveedor"
                placeholder="Nombre del proveedor externo"
                {...register("proveedor")}
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="valorReparacion">Valor de reparación</Label>
            <Input
              id="valorReparacion"
              inputMode="decimal"
              placeholder="Ej. 1500000"
              {...register("valorReparacion")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Fotos y videos</Label>
            <input
              ref={evidenciaRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                const next = e.target.files ? Array.from(e.target.files) : [];
                setEvidencia((prev) => [...prev, ...next]);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={() => evidenciaRef.current?.click()}
            >
              Subir fotos y videos
            </Button>
            {evidencia.length > 0 ? (
              <ul className="text-xs text-muted-foreground">
                {evidencia.map((f, i) => (
                  <li key={`${f.name}-${i}`}>{f.name}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Plano con marcas</Label>
            <input
              ref={planoRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                const next = e.target.files ? Array.from(e.target.files) : [];
                setPlanos((prev) => [...prev, ...next]);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={() => planoRef.current?.click()}
            >
              Subir plano con marcas de filtraciones y problemas
            </Button>
            {planos.length > 0 ? (
              <ul className="text-xs text-muted-foreground">
                {planos.map((f, i) => (
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

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-10 w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
