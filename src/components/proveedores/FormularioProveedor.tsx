"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Proveedor } from "@/lib/proveedores";
import {
  RUBROS_PROVEEDOR,
  RUBRO_PROVEEDOR_LABEL,
  type RubroProveedor,
} from "@/lib/fachadas/indicadores";

const schema = z.object({
  nombreEmpresa: z.string().min(1, "La empresa es obligatoria"),
  nombreContacto: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  presenteAntofagasta: z.enum(["si", "no"]),
  rubros: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

type FormularioProveedorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor?: Proveedor | null;
  onSuccess: (proveedor: Proveedor) => void;
};

export function FormularioProveedor({
  open,
  onOpenChange,
  proveedor = null,
  onSuccess,
}: FormularioProveedorProps) {
  const isEdit = Boolean(proveedor?.id);
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
      nombreEmpresa: "",
      nombreContacto: "",
      celular: "",
      email: "",
      presenteAntofagasta: "no",
      rubros: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      nombreEmpresa: proveedor?.nombre_empresa ?? "",
      nombreContacto: proveedor?.nombre_contacto ?? "",
      celular: proveedor?.celular ?? "",
      email: proveedor?.email ?? "",
      presenteAntofagasta: proveedor?.presente_antofagasta ? "si" : "no",
      rubros: proveedor?.rubros ?? [],
    });
  }, [open, proveedor, reset]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const payload = {
      nombre_empresa: values.nombreEmpresa.trim(),
      nombre_contacto: values.nombreContacto?.trim() || null,
      celular: values.celular?.trim() || null,
      email: values.email?.trim() || null,
      presente_antofagasta: values.presenteAntofagasta === "si",
    };

    const rubros = values.rubros.filter((r): r is RubroProveedor =>
      (RUBROS_PROVEEDOR as readonly string[]).includes(r),
    );

    async function persistirRubros(proveedorId: string) {
      const { error: delErr } = await supabase
        .from("proveedor_rubros")
        .delete()
        .eq("proveedor_id", proveedorId);
      if (delErr) {
        if (
          /proveedor_rubros|fachadas|fachada_/i.test(delErr.message) &&
          /does not exist|schema cache|could not find/i.test(delErr.message)
        ) {
          return;
        }
        throw new Error(delErr.message);
      }
      if (rubros.length === 0) return;
      const { error: insErr } = await supabase.from("proveedor_rubros").insert(
        rubros.map((rubro) => ({ proveedor_id: proveedorId, rubro })),
      );
      if (insErr) throw new Error(insErr.message);
    }

    try {
      if (isEdit && proveedor) {
        const { data, error } = await supabase
          .from("proveedores")
          .update(payload)
          .eq("id", proveedor.id)
          .select(
            "id, nombre_empresa, nombre_contacto, celular, email, presente_antofagasta, created_at",
          )
          .single();
        if (error || !data) {
          setServerError(error?.message ?? "No se pudo guardar");
          return;
        }
        await persistirRubros(data.id);
        onSuccess({ ...data, rubros } as Proveedor);
        onOpenChange(false);
        return;
      }

      const { data, error } = await supabase
        .from("proveedores")
        .insert(payload)
        .select(
          "id, nombre_empresa, nombre_contacto, celular, email, presente_antofagasta, created_at",
        )
        .single();
      if (error || !data) {
        setServerError(error?.message ?? "No se pudo crear");
        return;
      }
      await persistirRubros(data.id);
      onSuccess({ ...data, rubros } as Proveedor);
      onOpenChange(false);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setServerError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar proveedor" : "Nuevo proveedor"}
          </DialogTitle>
          <DialogDescription>
            Empresa, contacto, rubros y si está presente en Antofagasta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="nombreEmpresa">Nombre empresa *</Label>
            <Input id="nombreEmpresa" {...register("nombreEmpresa")} />
            {errors.nombreEmpresa ? (
              <p className="text-sm text-destructive">
                {errors.nombreEmpresa.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nombreContacto">Nombre contacto</Label>
            <Input id="nombreContacto" {...register("nombreContacto")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="celular">Celular</Label>
            <Input id="celular" {...register("celular")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Rubros</Label>
            <div className="grid grid-cols-2 gap-2">
              {RUBROS_PROVEEDOR.map((rubro) => (
                <label key={rubro} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    {...register("rubros")}
                    value={rubro}
                  />
                  {RUBRO_PROVEEDOR_LABEL[rubro]}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Presente en Antofagasta *</Label>
            <Controller
              name="presenteAntofagasta"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? "no")}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
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
              {isSubmitting ? "Guardando…" : isEdit ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
