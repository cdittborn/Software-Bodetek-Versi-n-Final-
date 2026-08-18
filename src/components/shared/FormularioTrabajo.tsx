"use client";

import { useEffect, useMemo, useState } from "react";
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
  ESTADOS_TRABAJO,
  ESTADO_TRABAJO_LABEL,
  type CategoriaOption,
  type EstadoTrabajo,
  type PerfilOption,
  type RecintoOption,
  type SubtipoOption,
  type TrabajoListado,
} from "@/lib/trabajos";

const NONE = "__none__";

const workFormSchema = z
  .object({
    title: z.string().min(1, "El título es obligatorio"),
    description: z.string().optional(),
    categoryId: z.string().min(1, "Selecciona una categoría"),
    subtypeId: z.string().optional(),
    premisesId: z.string().optional(),
    status: z.enum(ESTADOS_TRABAJO),
    assigneeId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    periodicityDays: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "La fecha de término no puede ser anterior a la de inicio",
      });
    }

    if (values.status === "mantencion_periodica") {
      const days = Number(values.periodicityDays);
      if (!values.periodicityDays || Number.isNaN(days) || days <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["periodicityDays"],
          message: "Indica una periodicidad en días mayor a 0",
        });
      }
    }
  });

type WorkFormValues = z.infer<typeof workFormSchema>;

export type FormularioTrabajoProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trabajo?: TrabajoListado | null;
  categorias: CategoriaOption[];
  subtipos: SubtipoOption[];
  recintos: RecintoOption[];
  perfiles: PerfilOption[];
  onSuccess: () => void;
};

function emptyValues(): WorkFormValues {
  return {
    title: "",
    description: "",
    categoryId: "",
    subtypeId: NONE,
    premisesId: NONE,
    status: "planificado",
    assigneeId: NONE,
    startDate: "",
    endDate: "",
    periodicityDays: "",
  };
}

function valuesFromTrabajo(trabajo: TrabajoListado): WorkFormValues {
  return {
    title: trabajo.titulo,
    description: trabajo.descripcion ?? "",
    categoryId: trabajo.categoria_id ?? "",
    subtypeId: trabajo.subtipo_id ?? NONE,
    premisesId: trabajo.recinto_id ?? NONE,
    status: (ESTADOS_TRABAJO.includes(trabajo.estado as EstadoTrabajo)
      ? trabajo.estado
      : "planificado") as EstadoTrabajo,
    assigneeId: trabajo.responsable_id ?? NONE,
    startDate: trabajo.fecha_inicio ?? "",
    endDate: trabajo.fecha_termino ?? "",
    periodicityDays:
      trabajo.periodicidad_dias != null ? String(trabajo.periodicidad_dias) : "",
  };
}

function addDaysIso(baseIso: string, days: number): string {
  const date = new Date(`${baseIso}T00:00:00`);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayIso(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function optionalUuid(value: string | undefined): string | null {
  if (!value || value === NONE) return null;
  return value;
}

export function FormularioTrabajo({
  open,
  onOpenChange,
  trabajo = null,
  categorias,
  subtipos,
  recintos,
  perfiles,
  onSuccess,
}: FormularioTrabajoProps) {
  const isEdit = Boolean(trabajo?.id);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WorkFormValues>({
    resolver: zodResolver(workFormSchema),
    defaultValues: emptyValues(),
  });

  const categoryId = useWatch({ control, name: "categoryId" });
  const status = useWatch({ control, name: "status" });

  const filteredSubtypes = useMemo(() => {
    if (!categoryId) return [];
    return subtipos.filter((s) => s.categoria_id === categoryId);
  }, [subtipos, categoryId]);

  useEffect(() => {
    if (!open) return;
    reset(trabajo ? valuesFromTrabajo(trabajo) : emptyValues());
    setServerError(null);
  }, [open, trabajo, reset]);

  async function onSubmit(values: WorkFormValues) {
    setServerError(null);

    const periodicity =
      values.status === "mantencion_periodica" && values.periodicityDays
        ? Number(values.periodicityDays)
        : null;

    let nextMaintenance: string | null = null;
    if (values.status === "mantencion_periodica" && periodicity) {
      const base = values.endDate || todayIso();
      nextMaintenance = addDaysIso(base, periodicity);
    }

    const payload = {
      titulo: values.title.trim(),
      descripcion: values.description?.trim() || null,
      categoria_id: values.categoryId,
      subtipo_id: optionalUuid(values.subtypeId),
      recinto_id: optionalUuid(values.premisesId),
      estado: values.status,
      responsable: optionalUuid(values.assigneeId),
      fecha_inicio: values.startDate || null,
      fecha_termino: values.endDate || null,
      periodicidad_dias: periodicity,
      proxima_mantencion: nextMaintenance,
      updated_at: new Date().toISOString(),
    };

    const supabase = createClient();

    const result = isEdit
      ? await supabase.from("trabajos").update(payload).eq("id", trabajo!.id)
      : await supabase.from("trabajos").insert(payload);

    if (result.error) {
      setServerError(result.error.message);
      return;
    }

    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar trabajo" : "Nuevo trabajo"}</DialogTitle>
          <DialogDescription>
            Completa los datos del trabajo. Los campos marcados son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" {...register("title")} />
            {errors.title ? (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Categoría *</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => {
                      field.onChange(v ?? "");
                      // Relación dependiente: al cambiar categoría, reset del subtipo
                      setValue("subtypeId", NONE);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId ? (
                <p className="text-sm text-destructive">
                  {errors.categoryId.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Subtipo</Label>
              <Controller
                name="subtypeId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v ?? NONE)}
                    disabled={!categoryId || filteredSubtypes.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin subtipo</SelectItem>
                      {filteredSubtypes.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Recinto</Label>
              <Controller
                name="premisesId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v ?? NONE)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin recinto</SelectItem>
                      {recintos.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.codigo} — {r.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange((v as EstadoTrabajo) ?? "planificado")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_TRABAJO.map((e) => (
                        <SelectItem key={e} value={e}>
                          {ESTADO_TRABAJO_LABEL[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Responsable</Label>
            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || NONE}
                  onValueChange={(v) => field.onChange(v ?? NONE)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin responsable</SelectItem>
                    {perfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre ?? p.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Perfiles del sistema (la columna en BD es un UUID).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Fecha inicio</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">Fecha término</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
              {errors.endDate ? (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              ) : null}
            </div>
          </div>

          {status === "mantencion_periodica" ? (
            <div className="space-y-1.5">
              <Label htmlFor="periodicityDays">Periodicidad (días)</Label>
              <Input
                id="periodicityDays"
                type="number"
                min={1}
                {...register("periodicityDays")}
              />
              {errors.periodicityDays ? (
                <p className="text-sm text-destructive">
                  {errors.periodicityDays.message}
                </p>
              ) : null}
            </div>
          ) : null}

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
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
