"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { FiltracionFormShell } from "@/components/emergencias/filtracion-form/FiltracionFormShell";
import { FiltracionFormHeader } from "@/components/emergencias/filtracion-form/FiltracionFormHeader";
import { FiltracionCompletitudIndicador } from "@/components/emergencias/filtracion-form/FiltracionCompletitudIndicador";
import { FiltracionMediaResumen } from "@/components/emergencias/filtracion-form/FiltracionMediaResumen";
import { FiltracionSectionNav } from "@/components/emergencias/filtracion-form/FiltracionSectionNav";
import { FiltracionFormFooter } from "@/components/emergencias/filtracion-form/FiltracionFormFooter";
import { Seccion01Ubicacion } from "@/components/emergencias/filtracion-form/sections/Seccion01Ubicacion";
import { Seccion02Diagnostico } from "@/components/emergencias/filtracion-form/sections/Seccion02Diagnostico";
import { Seccion03AntesDespues } from "@/components/emergencias/filtracion-form/sections/Seccion03AntesDespues";
import { Seccion04Planos } from "@/components/emergencias/filtracion-form/sections/Seccion04Planos";
import { Seccion05Ejecucion } from "@/components/emergencias/filtracion-form/sections/Seccion05Ejecucion";
import { Seccion06Cotizacion } from "@/components/emergencias/filtracion-form/sections/Seccion06Cotizacion";
import { subirPendientes } from "@/components/emergencias/filtracion-form/fields/ZonaEvidenciaUpload";
import {
  calcularCompletitud,
  mediaCountsFromItems,
} from "@/components/emergencias/filtracion-form/lib/completitudFiltracion";
import {
  defaultFiltracionValues,
  filtracionFormSchema,
  NONE,
  type FiltracionFormSchema,
} from "@/components/emergencias/filtracion-form/lib/schemaFiltracion";
import {
  emptyEmergenciaMedia,
  etiquetaRecintoSelector,
  type EmergenciaListado,
  type EmergenciaListadoMedia,
  type EstadoLluvias,
  type EjecutadoPor,
  type RecintoOption,
} from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";

export type FormularioFiltracionProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriaId: string;
  subtipoId: string;
  eventoId?: string;
  recintos: RecintoOption[];
  proveedores: ProveedorOption[];
  emergencia?: EmergenciaListado | null;
  media?: EmergenciaListadoMedia;
  onSuccess: (trabajoId?: string) => void;
};

function parseMontoInput(value: string): number | null {
  const t = value.trim().replace(/\./g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function FormularioFiltracion({
  open,
  onOpenChange,
  categoriaId,
  subtipoId,
  eventoId,
  recintos,
  proveedores: proveedoresIniciales,
  emergencia = null,
  media = emptyEmergenciaMedia(),
  onSuccess,
}: FormularioFiltracionProps) {
  const router = useRouter();
  const isEdit = Boolean(emergencia?.id);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [proveedores, setProveedores] = useState(proveedoresIniciales);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingAntes, setPendingAntes] = useState<File[]>([]);
  const [pendingDespues, setPendingDespues] = useState<File[]>([]);
  const [pendingPlanoAgua, setPendingPlanoAgua] = useState<File[]>([]);
  const [pendingPlanoReparacion, setPendingPlanoReparacion] = useState<File[]>([]);
  const [pendingCotizacion, setPendingCotizacion] = useState<File[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const form = useForm<FiltracionFormSchema>({
    resolver: zodResolver(filtracionFormSchema),
    defaultValues: defaultFiltracionValues,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const values = useWatch({ control });
  const ejecutadoPor = values.ejecutadoPor ?? NONE;
  const mostrarCotizacion =
    ejecutadoPor === "proveedor_externo" || ejecutadoPor === "ambos";
  const mostrarProveedor = mostrarCotizacion;

  const recintoId = values.recintoId ?? "";
  const recinto =
    recintos.find((r) => r.id === recintoId) ??
    recintos.find((r) => r.id === emergencia?.recinto_id);

  const recintoLabel = recinto
    ? etiquetaRecintoSelector(recinto)
    : emergencia?.recinto_codigo ?? "Sin recinto";

  const pendingCounts = useMemo(
    () => ({
      antes: pendingAntes.length,
      despues: pendingDespues.length,
      plano_agua: pendingPlanoAgua.length,
      plano_reparacion: pendingPlanoReparacion.length,
      cotizacion: pendingCotizacion.length,
    }),
    [
      pendingAntes,
      pendingDespues,
      pendingPlanoAgua,
      pendingPlanoReparacion,
      pendingCotizacion,
    ],
  );

  const allMedia = useMemo(
    () => [
      ...media.antes,
      ...media.despues,
      ...media.plano_agua,
      ...media.plano_reparacion,
      ...media.cotizacion,
    ],
    [media, refreshKey],
  );

  const completitud = useMemo(
    () =>
      calcularCompletitud(
        {
          recintoId: values.recintoId ?? "",
          descripcion: values.descripcion ?? "",
          planAccion: values.planAccion ?? "",
          fechaEntregaEstimada: values.fechaEntregaEstimada ?? "",
          estado: values.estado ?? "sin_asignar",
          ejecutadoPor: values.ejecutadoPor ?? NONE,
          proveedorId: values.proveedorId ?? NONE,
          fechaEntregaReal: values.fechaEntregaReal ?? "",
          horasMaestros: values.horasMaestros ?? "",
          numeroCotizacion: values.numeroCotizacion ?? "",
          valorRecinto: values.valorRecinto ?? "",
          valorTotalCotizacion: values.valorTotalCotizacion ?? "",
        },
        mediaCountsFromItems(allMedia, pendingCounts),
      ),
    [values, allMedia, pendingCounts],
  );

  useEffect(() => {
    setProveedores(proveedoresIniciales);
  }, [proveedoresIniciales]);

  useEffect(() => {
    if (!open) return;
    reset({
      recintoId: emergencia?.recinto_id ?? "",
      descripcion: emergencia?.descripcion ?? "",
      planAccion: emergencia?.plan_accion ?? "",
      fechaEntregaEstimada: emergencia?.fecha_entrega_estimada ?? "",
      estado: (emergencia?.estado as EstadoLluvias) ?? "sin_asignar",
      ejecutadoPor: (emergencia?.ejecutado_por as EjecutadoPor) ?? NONE,
      proveedorId: emergencia?.proveedor_id ?? NONE,
      fechaEntregaReal: emergencia?.fecha_termino ?? "",
      horasMaestros:
        emergencia?.horas_maestros_bodetek != null
          ? String(emergencia.horas_maestros_bodetek)
          : "",
      numeroCotizacion: emergencia?.numero_cotizacion ?? "",
      valorRecinto:
        emergencia?.valor_reparacion != null
          ? String(emergencia.valor_reparacion)
          : "",
      valorTotalCotizacion:
        emergencia?.valor_total_cotizacion != null
          ? String(emergencia.valor_total_cotizacion)
          : "",
    });
    setServerError(null);
    setPendingAntes([]);
    setPendingDespues([]);
    setPendingPlanoAgua([]);
    setPendingPlanoReparacion([]);
    setPendingCotizacion([]);
  }, [open, emergencia, reset]);

  function scrollToSection(sectionId: string) {
    bodyRef.current
      ?.querySelector(`#${sectionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onUploaded() {
    setRefreshKey((k) => k + 1);
    router.refresh();
  }

  async function onSubmit(data: FiltracionFormSchema) {
    setServerError(null);

    const tieneDespues =
      media.despues.length + pendingDespues.length > 0;

    if (data.estado === "terminado" && !tieneDespues) {
      setServerError(
        "Para marcar como terminado necesitas al menos un archivo en «Después».",
      );
      scrollToSection("sec-03");
      return;
    }

    const recintoSel = recintos.find((r) => r.id === data.recintoId);
    const titulo = recintoSel
      ? `Filtración — ${recintoSel.arrendatario_actual?.trim() || recintoSel.codigo}`
      : "Filtración";

    const proveedorId =
      mostrarProveedor && data.proveedorId !== NONE ? data.proveedorId : null;

    const payload = {
      titulo,
      descripcion: data.descripcion.trim(),
      plan_accion: data.planAccion?.trim() || null,
      estado: data.estado,
      gravedad: emergencia?.gravedad ?? null,
      ejecutado_por:
        !data.ejecutadoPor || data.ejecutadoPor === NONE
          ? null
          : data.ejecutadoPor,
      proveedor_id: proveedorId,
      valor_reparacion: parseMontoInput(data.valorRecinto ?? ""),
      valor_total_cotizacion: parseMontoInput(data.valorTotalCotizacion ?? ""),
      numero_cotizacion: data.numeroCotizacion?.trim() || null,
      horas_maestros_bodetek: parseMontoInput(data.horasMaestros ?? ""),
      fecha_entrega_estimada: data.fechaEntregaEstimada?.trim() || null,
      fecha_termino: data.fechaEntregaReal?.trim() || null,
      recinto_id: data.recintoId,
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
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: row, error } = await supabase
          .from("trabajos")
          .insert({
            ...payload,
            ...(user ? { created_by: user.id } : {}),
          })
          .select("id")
          .single();
        if (error || !row) {
          throw new Error(error?.message ?? "No se pudo crear");
        }
        trabajoId = row.id;
      }

      if (!trabajoId) throw new Error("Sin id de trabajo");

      await subirPendientes(trabajoId, pendingAntes, "antes");
      await subirPendientes(trabajoId, pendingDespues, "despues");
      await subirPendientes(trabajoId, pendingPlanoAgua, "plano_agua");
      await subirPendientes(trabajoId, pendingPlanoReparacion, "plano_reparacion");
      await subirPendientes(
        trabajoId,
        pendingCotizacion,
        "cotizacion",
        proveedorId,
      );

      onOpenChange(false);
      onSuccess(trabajoId);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  const submitForm = handleSubmit(onSubmit);

  return (
    <FiltracionFormShell open={open} onOpenChange={onOpenChange}>
      <FiltracionFormHeader
        isEdit={isEdit}
        codigoFiltracion={emergencia?.codigo_filtracion ?? null}
        gravedad={emergencia?.gravedad ?? null}
        recintoLabel={recintoLabel}
        arrendatario={
          recinto?.arrendatario_actual ?? emergencia?.recinto_arrendatario ?? null
        }
        fechaReporte={emergencia?.created_at ?? new Date().toISOString()}
        autorNombre={emergencia?.created_by_nombre ?? null}
        onClose={() => onOpenChange(false)}
        onCancelMobile={() => onOpenChange(false)}
        onSaveMobile={() => void submitForm()}
        saving={isSubmitting}
      />

      <FiltracionCompletitudIndicador
        completitud={completitud}
        onNavigateToSection={scrollToSection}
      />

      <FiltracionMediaResumen
        media={media}
        pending={pendingCounts}
        mostrarCotizacion={mostrarCotizacion}
        onNavigate={scrollToSection}
      />

      <FiltracionSectionNav
        mostrarCotizacion={mostrarCotizacion}
        onNavigate={scrollToSection}
      />

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          void submitForm();
        }}
      >
        <div
          ref={bodyRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:max-h-[76vh] md:px-6"
        >
          <Seccion01Ubicacion
            control={control}
            errors={errors}
            recintos={recintos}
            completitud={completitud}
          />

          <Seccion02Diagnostico
            errors={errors}
            register={register}
            completitud={completitud}
          />

          <Seccion03AntesDespues
            trabajoId={emergencia?.id ?? null}
            puedeSubir
            mediaAntes={media.antes}
            mediaDespues={media.despues}
            pendingAntes={pendingAntes}
            pendingDespues={pendingDespues}
            onPendingAntes={setPendingAntes}
            onPendingDespues={setPendingDespues}
            onUploaded={onUploaded}
          />

          <Seccion04Planos
            trabajoId={emergencia?.id ?? null}
            puedeSubir
            completitud={completitud}
            mediaAgua={media.plano_agua}
            mediaReparacion={media.plano_reparacion}
            pendingAgua={pendingPlanoAgua}
            pendingReparacion={pendingPlanoReparacion}
            onPendingAgua={setPendingPlanoAgua}
            onPendingReparacion={setPendingPlanoReparacion}
            onUploaded={onUploaded}
          />

          <Seccion05Ejecucion
            control={control}
            ejecutadoPor={ejecutadoPor}
            completitud={completitud}
            proveedores={proveedores}
            onProveedoresChange={setProveedores}
          />

          {mostrarCotizacion ? (
            <Seccion06Cotizacion
              control={control}
              completitud={completitud}
              trabajoId={emergencia?.id ?? null}
              puedeSubir
              mediaCotizacion={media.cotizacion}
              pendingCotizacion={pendingCotizacion}
              onPendingCotizacion={setPendingCotizacion}
              onUploaded={onUploaded}
              proveedorId={
                values.proveedorId && values.proveedorId !== NONE
                  ? values.proveedorId
                  : null
              }
            />
          ) : null}

          {serverError ? (
            <p className="rounded-md bg-[#fdeced] px-3 py-2 text-sm text-[#a4131f]">
              {serverError}
            </p>
          ) : null}
        </div>

        <FiltracionFormFooter
          onCancel={() => onOpenChange(false)}
          saving={isSubmitting}
          isEdit={isEdit}
        />
      </form>
    </FiltracionFormShell>
  );
}
