"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { subirPendientes } from "@/components/emergencias/filtracion-form/fields/ZonaEvidenciaUpload";
import {
  entregaAtrasadaDesdeProblemas,
  hayProblemaProveedor,
  mediaCountsFromItems,
  problemasDesdeEmergencia,
  textosDiagnostico,
  calcularCompletitud,
} from "@/lib/filtracion/completitud";
import {
  esEstadoCierreFiltracion,
  estadoAgregadoFicha,
  ejecutadoPorAgregadoFicha,
  fechaEntregaEstimadaFicha,
  fechaEntregaRealFicha,
  horasMaestrosAgregadas,
  parseProblemas,
  problemasVacios,
  TIPOS_PROBLEMA,
  tiposActivos,
  type TipoProblema,
} from "@/lib/filtracion/problemas";
import {
  defaultFiltracionValues,
  filtracionFormSchema,
  type FiltracionFormSchema,
} from "@/components/emergencias/filtracion-form/lib/schemaFiltracion";
import {
  emptyEmergenciaMedia,
  etiquetaRecintoSelector,
  type EmergenciaListado,
  type EmergenciaListadoMedia,
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

function sumMontosProblema(
  problemas: FiltracionFormSchema["problemas"],
  campo: "valorRecinto" | "valorTotalCotizacion",
): number | null {
  let sum = 0;
  let any = false;
  for (const tipo of tiposActivos(problemas)) {
    if (problemas[tipo].ejecutadoPor !== "proveedor_externo") continue;
    const n = parseMontoInput(problemas[tipo][campo]);
    if (n != null) {
      sum += n;
      any = true;
    }
  }
  return any ? sum : null;
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
  const [pendingCotizacionPorTipo, setPendingCotizacionPorTipo] = useState<
    Partial<Record<TipoProblema, File[]>>
  >({});
  const [refreshKey, setRefreshKey] = useState(0);

  const form = useForm<FiltracionFormSchema>({
    resolver: zodResolver(filtracionFormSchema),
    defaultValues: defaultFiltracionValues,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const values = useWatch({ control });
  const problemas = useMemo(
    () => parseProblemas(values.problemas ?? problemasVacios()),
    [values.problemas],
  );
  const mostrarCotizacion = hayProblemaProveedor(problemas);

  const recintoId = values.recintoId ?? "";
  const recinto =
    recintos.find((r) => r.id === recintoId) ??
    recintos.find((r) => r.id === emergencia?.recinto_id);

  const recintoLabel = recinto
    ? etiquetaRecintoSelector(recinto)
    : emergencia?.recinto_codigo ?? "Sin recinto";

  const pendingCotizacionTotal = useMemo(
    () =>
      TIPOS_PROBLEMA.reduce(
        (sum, tipo) => sum + (pendingCotizacionPorTipo[tipo]?.length ?? 0),
        0,
      ),
    [pendingCotizacionPorTipo],
  );

  const pendingCounts = useMemo(
    () => ({
      antes: pendingAntes.length,
      despues: pendingDespues.length,
      plano_agua: pendingPlanoAgua.length,
      plano_reparacion: pendingPlanoReparacion.length,
      cotizacion: pendingCotizacionTotal,
    }),
    [
      pendingAntes,
      pendingDespues,
      pendingPlanoAgua,
      pendingPlanoReparacion,
      pendingCotizacionTotal,
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

  const pendingCotizacionCounts = useMemo(() => {
    const counts: Partial<Record<TipoProblema, number>> = {};
    for (const tipo of TIPOS_PROBLEMA) {
      const n = pendingCotizacionPorTipo[tipo]?.length ?? 0;
      if (n) counts[tipo] = n;
    }
    return counts;
  }, [pendingCotizacionPorTipo]);

  const completitud = useMemo(
    () =>
      calcularCompletitud(
        {
          recintoId: values.recintoId ?? "",
          problemas,
        },
        mediaCountsFromItems(allMedia, pendingCounts, {
          problemas,
          pendingCotizacionPorTipo: pendingCotizacionCounts,
        }),
      ),
    [values.recintoId, problemas, allMedia, pendingCounts, pendingCotizacionCounts],
  );

  useEffect(() => {
    setProveedores(proveedoresIniciales);
  }, [proveedoresIniciales]);

  useEffect(() => {
    if (!open) return;
    reset({
      recintoId: emergencia?.recinto_id ?? "",
      problemas: emergencia
        ? problemasDesdeEmergencia(emergencia)
        : problemasVacios(),
    });
    setServerError(null);
    setPendingAntes([]);
    setPendingDespues([]);
    setPendingPlanoAgua([]);
    setPendingPlanoReparacion([]);
    setPendingCotizacionPorTipo({});
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
    const cierraAlguno = tiposActivos(data.problemas).some((t) =>
      esEstadoCierreFiltracion(data.problemas[t].estado),
    );

    if (!tieneDespues) {
      toast.warning(
        "No se puede cerrar la filtración sin al menos un archivo en «Después».",
      );
      if (cierraAlguno) {
        setServerError(
          "No se puede cerrar la filtración sin al menos un archivo en «Después».",
        );
        scrollToSection("sec-03");
        return;
      }
    }

    const recintoSel = recintos.find((r) => r.id === data.recintoId);
    const titulo = recintoSel
      ? `Filtración — ${recintoSel.arrendatario_actual?.trim() || recintoSel.codigo}`
      : "Filtración";

    const primerProveedor = tiposActivos(data.problemas).find(
      (t) => data.problemas[t].ejecutadoPor === "proveedor_externo",
    );
    const proveedorId = primerProveedor
      ? data.problemas[primerProveedor].proveedorId.trim() || null
      : null;
    const numeroCotizacion = primerProveedor
      ? data.problemas[primerProveedor].numeroCotizacion.trim() || null
      : null;

    const textos = textosDiagnostico(parseProblemas(data.problemas));
    const fechaEstimada = fechaEntregaEstimadaFicha(data.problemas) || null;
    const fechaReal = fechaEntregaRealFicha(data.problemas) || null;

    const payload = {
      titulo,
      descripcion: textos.descripcion || null,
      plan_accion: textos.plan || null,
      problemas: data.problemas,
      estado: estadoAgregadoFicha(data.problemas),
      gravedad: emergencia?.gravedad ?? null,
      ejecutado_por: ejecutadoPorAgregadoFicha(data.problemas),
      proveedor_id: proveedorId,
      valor_reparacion: sumMontosProblema(data.problemas, "valorRecinto"),
      valor_total_cotizacion: sumMontosProblema(
        data.problemas,
        "valorTotalCotizacion",
      ),
      numero_cotizacion: numeroCotizacion,
      horas_maestros_bodetek: horasMaestrosAgregadas(data.problemas),
      fecha_entrega_estimada: fechaEstimada,
      fecha_termino: fechaReal,
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
      for (const tipo of TIPOS_PROBLEMA) {
        const files = pendingCotizacionPorTipo[tipo] ?? [];
        if (!files.length) continue;
        const prov =
          data.problemas[tipo].proveedorId.trim() || proveedorId;
        await subirPendientes(
          trabajoId,
          files,
          "cotizacion",
          prov,
          tipo,
        );
      }

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
        atrasada={entregaAtrasadaDesdeProblemas(problemas)}
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

      <FiltracionSectionNav onNavigate={scrollToSection} />

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
            control={control}
            completitud={completitud}
            proveedores={proveedores}
            onProveedoresChange={setProveedores}
            trabajoId={emergencia?.id ?? null}
            puedeSubir
            mediaCotizacion={media.cotizacion}
            pendingCotizacionPorTipo={pendingCotizacionPorTipo}
            onPendingCotizacionPorTipo={(tipo, files) =>
              setPendingCotizacionPorTipo((prev) => ({
                ...prev,
                [tipo]: files,
              }))
            }
            onUploaded={onUploaded}
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
