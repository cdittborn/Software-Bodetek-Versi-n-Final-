"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormularioFachada } from "@/components/fachadas/FormularioFachada";
import { UploaderArchivoSimple } from "@/components/fachadas/UploaderArchivoSimple";
import { SeccionErrorBoundary } from "@/components/fachadas/SeccionErrorBoundary";
import { ChipEstadoFachada } from "@/components/fachadas/ChipEstadoFachada";
import { ComparadorAntesDespues } from "@/components/fachadas/ComparadorAntesDespues";
import { GaleriaEstadoFachada } from "@/components/fachadas/GaleriaEstadoFachada";
import {
  CATEGORIA_DOCUMENTO_FACHADA_LABEL,
  ESTADO_COTIZACION_DOC_LABEL,
  ESTADO_FACTURA_DOC_LABEL,
  TIPO_INTERVENCION_FACHADA_LABEL,
  TIPOS_INTERVENCION_FACHADA,
  costoNetoIntervencion,
  detalleAIndicadores,
  estadoCalculadoFachada,
  etiquetaChipVencimiento,
  formatDiasCl,
  materialesNetoPorTipo,
  proximasPorTipo,
  type CategoriaDocumentoFachada,
  type CostoNetoIntervencion,
  type FachadaIndicadores,
  type TipoIntervencionFachada,
} from "@/lib/fachadas/indicadores";
import { formatMetrosCl } from "@/lib/fachadas/formato";
import { EtiquetaM2 } from "@/components/fachadas/EtiquetaM2";
import {
  EJECUTADO_POR_LABEL,
  formatMontoClp,
  subtipoHref,
  type RecintoOption,
} from "@/lib/trabajos";
import { intervencionHref } from "@/lib/fachadas/rutas";
import { borrarFachada, crearIntervencion, guardarArchivoFachada } from "@/lib/fachadas/guardar";
import { carpetaFachadaPlano } from "@/lib/fachadas/upload";
import { esImagen } from "@/lib/fachadas/url";
import {
  chipsTiposIntervencion,
  diferenciaFacturadoMenosCotizado,
  filasHistorialFachada,
  hoyIsoChile,
  registrosAnterioresAlSistema,
  totalHistoricoNeto,
} from "@/lib/fachadas/ficha";
import { cn } from "@/lib/utils";
import { COLOR_TIPO, formatDiaMes, formatDiaMesCorto, formatMesCortoCl, formatRangoDiaMes } from "@/lib/fachadas/ui";
import "./fachadas.css";
import type {
  ConteosBorrarFachada,
  DocumentoFachada,
  FachadaDetalle,
  IntervencionDetalle,
  MediaFachada,
} from "@/lib/fachadas/tipos";
import type { ProveedorOption } from "@/lib/proveedores";

function labelEstadoDoc(doc: DocumentoFachada): string {
  if (doc.tipoDocumento === "cotizacion") {
    return ESTADO_COTIZACION_DOC_LABEL[
      doc.estado as keyof typeof ESTADO_COTIZACION_DOC_LABEL
    ] ?? doc.estado;
  }
  return (
    ESTADO_FACTURA_DOC_LABEL[doc.estado as keyof typeof ESTADO_FACTURA_DOC_LABEL] ??
    doc.estado
  );
}

function frecuenciaMeses(
  fachada: FachadaDetalle,
  tipo: TipoIntervencionFachada,
): number {
  if (tipo === "limpieza") return fachada.frecuenciaLimpiezaMeses;
  if (tipo === "reparacion") return fachada.frecuenciaReparacionMeses;
  return fachada.frecuenciaPinturaMeses;
}

function nombreProveedor(
  id: string | null,
  proveedores: ProveedorOption[],
): string {
  if (!id) return "—";
  return proveedores.find((p) => p.id === id)?.nombre_empresa ?? "—";
}

export function DetalleFachadaVista({
  categoriaId,
  subtipoId,
  fachada,
  intervenciones: intervencionesProp,
  recintos,
  proveedores,
  puedeEditar,
  puedeBorrar,
  conteos,
  modoDemo = false,
  hoy: hoyProp,
}: {
  categoriaId: string;
  subtipoId: string;
  fachada: FachadaDetalle;
  intervenciones: IntervencionDetalle[];
  recintos: RecintoOption[];
  proveedores: ProveedorOption[];
  puedeEditar: boolean;
  puedeBorrar: boolean;
  conteos: ConteosBorrarFachada;
  modoDemo?: boolean;
  hoy?: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [borrarOpen, setBorrarOpen] = useState(false);
  const [confirmNombre, setConfirmNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [intervenciones, setIntervenciones] = useState(intervencionesProp);
  const [seleccionId, setSeleccionId] = useState<string | null>(
    intervencionesProp[0]?.id ?? null,
  );

  useEffect(() => {
    setIntervenciones(intervencionesProp);
    setSeleccionId((id) =>
      id && intervencionesProp.some((i) => i.id === id)
        ? id
        : (intervencionesProp[0]?.id ?? null),
    );
  }, [intervencionesProp]);

  const indicadores = useMemo(
    () =>
      intervenciones.map((i) =>
        detalleAIndicadores({
          ...i,
          recintoId: fachada.recintoId,
          documentos: i.documentos,
        }),
      ),
    [intervenciones, fachada.recintoId],
  );
  const [filtroHistorial, setFiltroHistorial] = useState<
    "todos" | TipoIntervencionFachada | "hojalateria"
  >("todos");
  const hoy = hoyProp ?? hoyIsoChile();
  const fachadaInd = useMemo((): FachadaIndicadores => ({
    id: fachada.id,
    nombre: fachada.nombre,
    recintoId: fachada.recintoId,
    superficieM2: fachada.superficieM2,
    frecuenciaLimpiezaMeses: fachada.frecuenciaLimpiezaMeses,
    frecuenciaReparacionMeses: fachada.frecuenciaReparacionMeses,
    frecuenciaPinturaMeses: fachada.frecuenciaPinturaMeses,
    ultimaLimpiezaFecha: fachada.ultimaLimpiezaFecha,
    ultimaReparacionFecha: fachada.ultimaReparacionFecha,
    ultimaPinturaFecha: fachada.ultimaPinturaFecha,
  }), [fachada]);
  const estado = estadoCalculadoFachada(fachadaInd, indicadores, hoy);
  const proximas = proximasPorTipo(fachadaInd, indicadores, hoy);
  const anteriores = useMemo(
    () => registrosAnterioresAlSistema(fachada),
    [fachada],
  );
  const historialFiltrado = filasHistorialFachada(
    intervenciones,
    anteriores,
    filtroHistorial,
  );
  const seleccion =
    intervenciones.find((i) => i.id === seleccionId) ?? intervenciones[0] ?? null;
  const indSel = seleccion
    ? indicadores.find((i) => i.id === seleccion.id)
    : null;
  const costoSel = indSel ? costoNetoIntervencion(indSel) : null;
  const historico = totalHistoricoNeto(indicadores);

  async function nuevaIntervencion() {
    if (modoDemo) {
      router.push("/trabajos/fachadas/demo/intervencion");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await crearIntervencion(fachada.id);
      router.push(intervencionHref(categoriaId, subtipoId, fachada.id, id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
      setBusy(false);
    }
  }

  async function confirmarBorrar() {
    if (confirmNombre.trim() !== fachada.nombre) {
      setError("Escribe el nombre exacto de la fachada para confirmar");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await borrarFachada(fachada.id);
      router.push(subtipoHref(categoriaId, subtipoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar");
      setBusy(false);
    }
  }

  function onNuevaFoto(media: MediaFachada) {
    if (!seleccion) return;
    setIntervenciones((list) =>
      list.map((i) =>
        i.id === seleccion.id ? { ...i, media: [...i.media, media] } : i,
      ),
    );
    router.refresh();
  }

  const cotizaciones = (seleccion?.documentos ?? []).filter(
    (d) => d.tipoDocumento === "cotizacion",
  );
  const facturas = (seleccion?.documentos ?? []).filter(
    (d) => d.tipoDocumento === "factura" || d.tipoDocumento === "boleta",
  );

  return (
    <SeccionErrorBoundary titulo="No se pudo mostrar la ficha de la fachada.">
      <div className="fachadas-scope fachadas-ficha mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">
        <nav className="fd-hint">
          <Link href={modoDemo ? "/trabajos/fachadas/demo" : subtipoHref(categoriaId, subtipoId)} className="hover:underline">
            Fachadas
          </Link>
          <span aria-hidden> / </span>
          <span>{fachada.nombre}</span>
        </nav>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="fd-title text-[1.85rem] max-md:line-clamp-2 max-md:text-[1.55rem]">
                {fachada.nombre}
              </h1>
              <ChipEstadoFachada estado={estado} />
            </div>
            <p className="hidden text-sm text-muted-foreground md:block">
              Alto{" "}
              <span className="font-semibold text-foreground">
                {fachada.altoM != null && fachada.altoM > 0
                  ? `${formatMetrosCl(fachada.altoM)} m`
                  : "—"}
              </span>
              {"  "}Ancho{" "}
              <span className="font-semibold text-foreground">
                {fachada.anchoM != null && fachada.anchoM > 0
                  ? `${formatMetrosCl(fachada.anchoM)} m`
                  : "—"}
              </span>
              {"  "}Superficie{" "}
              <span className="font-semibold text-foreground">
                <EtiquetaM2 m2={fachada.superficieM2} decimales={2} />
              </span>
            </p>
            <ul className="mt-2 grid grid-cols-3 gap-2 md:hidden">
              {(
                [
                  ["Alto", fachada.altoM != null && fachada.altoM > 0 ? `${formatMetrosCl(fachada.altoM)} m` : "—"],
                  ["Ancho", fachada.anchoM != null && fachada.anchoM > 0 ? `${formatMetrosCl(fachada.anchoM)} m` : "—"],
                  ["Superficie", null],
                ] as const
              ).map(([label, valor]) => (
                <li key={label} className="rounded-xl bg-[#eceae7] px-2 py-2 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-bold">
                    {label === "Superficie" ? (
                      <EtiquetaM2 m2={fachada.superficieM2} decimales={2} />
                    ) : (
                      valor
                    )}
                  </p>
                </li>
              ))}
            </ul>
            <ul className="mt-2 hidden flex-col gap-2 max-md:flex">
              {proximas.map((p) => (
                <li
                  key={`m-${p.tipo}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#e6e3de] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {TIPO_INTERVENCION_FACHADA_LABEL[p.tipo]}
                    </p>
                    <p className="fd-hint">Cada {frecuenciaMeses(fachada, p.tipo)} meses</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {p.proximaFecha ? formatMesCortoCl(p.proximaFecha) : "—"}
                    </p>
                    <span
                      className={cn(
                        "mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                        p.estado === "al_dia" && "bg-emerald-100 text-emerald-800",
                        p.estado === "vence_pronto" && "bg-amber-100 text-amber-800",
                        p.estado === "vencido" && "bg-red-100 text-[#c8102e]",
                      )}
                    >
                      {etiquetaChipVencimiento(p)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm max-md:hidden">
              {proximas.map((p) => (
                <li key={p.tipo} className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="text-muted-foreground">
                    Próxima {TIPO_INTERVENCION_FACHADA_LABEL[p.tipo].toLowerCase()}
                  </span>
                  <span className="font-semibold">
                    {p.proximaFecha ? formatMesCortoCl(p.proximaFecha) : "—"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      p.estado === "al_dia" && "bg-emerald-100 text-emerald-800",
                      p.estado === "vence_pronto" && "bg-amber-100 text-amber-800",
                      p.estado === "vencido" && "bg-red-100 text-[#c8102e]",
                    )}
                  >
                    {etiquetaChipVencimiento(p)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex w-full flex-wrap gap-2 max-md:flex-col md:w-auto">
            {puedeEditar ? (
              <>
                <Button
                  type="button"
                  className="fd-btn-primary h-12 min-h-12 rounded-xl px-4 max-md:order-1 max-md:w-full md:order-2 md:h-10 md:min-h-10"
                  disabled={busy}
                  onClick={() => void nuevaIntervencion()}
                >
                  + Nueva intervención
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 min-h-12 rounded-xl px-4 max-md:order-2 max-md:w-full md:order-1 md:h-10 md:min-h-10"
                  onClick={() => setEditOpen(true)}
                >
                  Editar fachada
                </Button>
              </>
            ) : null}
            {puedeBorrar ? (
              <Button
                type="button"
                variant="ghost"
                className="hidden h-10 min-h-10 px-3 md:inline-flex"
                onClick={() => setBorrarOpen(true)}
              >
                Eliminar
              </Button>
            ) : null}
          </div>
        </header>

        <GaleriaEstadoFachada
          fachadaId={fachada.id}
          iniciales={
            fachada.archivos.length > 0
              ? fachada.archivos
              : fachada.foto.key
                ? [
                    {
                      id: `legacy-${fachada.id}`,
                      tipoArchivo: "foto",
                      objectKey: fachada.foto.key,
                      nombreArchivo: fachada.foto.nombre,
                      thumbnailKey: null,
                      publicUrl: fachada.foto.url,
                      thumbnailUrl: fachada.foto.url,
                      esPortada: true,
                      orden: 0,
                      fecha: null,
                    },
                  ]
                : []
          }
          puedeEditar={puedeEditar}
          puedeBorrar={puedeBorrar}
          modoDemo={modoDemo}
        />

        <div className="fd-ficha-grid grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
          <ComparadorAntesDespues
            fachadaId={fachada.id}
            fotoInicial={fachada.foto}
            intervenciones={intervenciones}
            seleccionId={seleccion?.id ?? null}
            onSelect={setSeleccionId}
            puedeEditar={puedeEditar && !modoDemo}
            onNuevaFoto={onNuevaFoto}
          />

          <div className="fd-ficha-side flex flex-col gap-4">
        <section className="fd-card fd-ficha-plano p-4">
          <h2 className="text-sm font-semibold">Plano de la fachada</h2>
          {fachada.plano.key ? (
            <div className="mt-3">
              {fachada.plano.url &&
              (fachada.plano.url.startsWith("data:image") ||
                esImagen(fachada.plano.nombre, fachada.plano.key)) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fachada.plano.url}
                  alt=""
                  className="max-h-40 w-full rounded-md object-contain"
                />
              ) : (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-[#e6e3de] bg-[#faf9f7] text-xs">
                  PDF
                </div>
              )}
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="truncate text-sm">{fachada.plano.nombre ?? "Plano"}</p>
                {fachada.plano.url ? (
                  <a
                    href={fachada.plano.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-[#e30613] hover:underline"
                  >
                    Descargar
                  </a>
                ) : null}
              </div>
              {puedeEditar ? (
                modoDemo ? (
                  <p className="mt-2 text-sm font-medium text-[#e30613]">Reemplazar</p>
                ) : (
                  <div className="mt-2">
                    <UploaderArchivoSimple
                      etiqueta=""
                      textoBoton="Reemplazar"
                      soloBoton
                      carpeta={carpetaFachadaPlano(fachada.id)}
                      accept="image/*,.pdf,application/pdf"
                      actualUrl={fachada.plano.url}
                      actualNombre={fachada.plano.nombre}
                      actualKey={fachada.plano.key}
                      puedeEditar={puedeEditar}
                      onUploaded={async (key, nombre) => {
                        await guardarArchivoFachada(fachada.id, "plano", key, nombre);
                        router.refresh();
                      }}
                      onCleared={async () => {
                        await guardarArchivoFachada(fachada.id, "plano", null, null);
                        router.refresh();
                      }}
                    />
                  </div>
                )
              ) : null}
            </div>
          ) : puedeEditar ? (
            modoDemo ? (
              <p className="mt-3 text-sm font-medium">Subir plano</p>
            ) : (
              <div className="mt-3">
                <UploaderArchivoSimple
                  etiqueta=""
                  textoBoton="Subir plano"
                  soloBoton
                  carpeta={carpetaFachadaPlano(fachada.id)}
                  accept="image/*,.pdf,application/pdf"
                  actualUrl={null}
                  actualNombre={null}
                  actualKey={null}
                  puedeEditar={puedeEditar}
                  onUploaded={async (key, nombre) => {
                    await guardarArchivoFachada(fachada.id, "plano", key, nombre);
                    router.refresh();
                  }}
                  onCleared={async () => {
                    await guardarArchivoFachada(fachada.id, "plano", null, null);
                    router.refresh();
                  }}
                />
              </div>
            )
          ) : (
            <p className="fd-hint mt-3">Sin plano</p>
          )}
        </section>

        <TarjetaDocumentos
          className="fd-ficha-cot"
          titulo="Cotizaciones"
          vacio="No hay cotizaciones en esta intervención."
          docs={cotizaciones}
          proveedores={proveedores}
          hrefEditar={
            seleccion
              ? modoDemo
                ? "/trabajos/fachadas/demo/intervencion"
                : intervencionHref(categoriaId, subtipoId, fachada.id, seleccion.id)
              : null
          }
          puedeEditar={puedeEditar}
        />
        <TarjetaDocumentos
          className="fd-ficha-fact"
          titulo="Facturas"
          vacio="No hay facturas ni boletas en esta intervención."
          docs={facturas}
          proveedores={proveedores}
          hrefEditar={
            seleccion
              ? modoDemo
                ? "/trabajos/fachadas/demo/intervencion"
                : intervencionHref(categoriaId, subtipoId, fachada.id, seleccion.id)
              : null
          }
          puedeEditar={puedeEditar}
        />
        {costoSel ? <LineaDiferencias className="fd-ficha-diff" costo={costoSel} /> : null}
          </div>
        </div>

        {seleccion && indSel && costoSel ? (
          <section className="fd-card fd-ficha-detalle p-4">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">
                Detalle de la intervención · {formatMesCortoCl(seleccion.fechaInicio)}
                <span className="ml-2 font-normal text-muted-foreground">
                  {nombreProveedor(seleccion.proveedorId, proveedores)}
                  {seleccion.fechaInicio
                    ? ` · ${formatRangoDiaMes(seleccion.fechaInicio, seleccion.fechaTermino)}`
                    : ""}
                </span>
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Tiempo por trabajo
              </p>
              <div className="mt-2 space-y-2">
                {TIPOS_INTERVENCION_FACHADA.map((tipo) => {
                  const dias =
                    seleccion.tipos.find((t) => t.tipo === tipo)?.dias ?? 0;
                  const max = Math.max(
                    1,
                    ...seleccion.tipos.map((t) => t.dias),
                    1,
                  );
                  return (
                    <div key={tipo} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">
                          {TIPO_INTERVENCION_FACHADA_LABEL[tipo]}
                        </span>
                        <span>{formatDiasCl(dias)} días</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", COLOR_TIPO[tipo].bar)}
                          style={{ width: `${Math.min(100, (dias / max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="pt-1 text-sm font-semibold">
                  Total {formatDiasCl(seleccion.tipos.reduce((a, t) => a + t.dias, 0))} días hábiles
                </p>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Costos · valor neto
              </p>
              <dl className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <dt>Mano de obra</dt>
                  <dd>{formatMontoClp(costoSel.manoDeObra.neto)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Materiales</dt>
                  <dd>{formatMontoClp(costoSel.materiales.neto)}</dd>
                </div>
                {(() => {
                  const mt = seleccion ? materialesNetoPorTipo(indSel) : { pintura: 0, otros: 0 };
                  const otrosLabel =
                    seleccion?.materiales.find((m) => m.tipo === "otros")?.material ??
                    "Otros";
                  return (
                    <>
                      {mt.pintura > 0 ? (
                        <div className="flex justify-between pl-3 text-muted-foreground">
                          <dt>Pintura</dt>
                          <dd>{formatMontoClp(mt.pintura)}</dd>
                        </div>
                      ) : null}
                      {mt.otros > 0 ? (
                        <div className="flex justify-between pl-3 text-muted-foreground">
                          <dt>{otrosLabel}</dt>
                          <dd>{formatMontoClp(mt.otros)}</dd>
                        </div>
                      ) : null}
                    </>
                  );
                })()}
                <div className="flex justify-between">
                  <dt>Hojalatería</dt>
                  <dd>{formatMontoClp(costoSel.hojalateria.neto)}</dd>
                </div>
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <dt>Total neto</dt>
                  <dd>{formatMontoClp(costoSel.totalNeto)}</dd>
                </div>
                {costoSel.costoPorM2 != null ? (
                  <p className="fd-hint">
                    Costo por m² {formatMontoClp(costoSel.costoPorM2)}
                  </p>
                ) : null}
              </dl>
            </div>
            <div className="text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Hojalatería
              </p>
              {seleccion.requiereHojalateria && seleccion.hojalaterias.length > 0 ? (
                <div className="mt-2 space-y-1">
                  <p className="font-medium">Sí hubo hojalatería</p>
                  {seleccion.hojalaterias.map((h) => (
                    <div key={h.id}>
                      <p className="fd-hint">Proveedor</p>
                      <p className="font-semibold">
                        {nombreProveedor(h.proveedorId, proveedores)}
                      </p>
                      {h.descripcion ? (
                        <p className="mt-1 text-muted-foreground">{h.descripcion}</p>
                      ) : null}
                      <p className="mt-2 flex justify-between font-medium">
                        <span>Valor neto</span>
                        <span>{formatMontoClp(h.valorNeto || costoSel.hojalateria.neto)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-muted-foreground">
                  No hubo trabajo de hojalatería.
                </p>
              )}
              <Link
                href={
                  modoDemo
                    ? "/trabajos/fachadas/demo/intervencion"
                    : intervencionHref(
                        categoriaId,
                        subtipoId,
                        fachada.id,
                        seleccion.id,
                      )
                }
                className="mt-3 inline-flex text-sm text-[#e30613] hover:underline"
              >
                Editar intervención
              </Link>
            </div>
            </div>
          </section>
        ) : null}

        <section className="fd-card fd-ficha-historial p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold">Historial de intervenciones</h2>
            <p className="fd-hint">
              Total histórico {formatMontoClp(historico)} neto
              {intervenciones.length
                ? ` · ${formatDiasCl(
                    intervenciones.reduce(
                      (a, i) => a + i.tipos.reduce((s, t) => s + t.dias, 0),
                      0,
                    ),
                  )} días`
                : ""}
            </p>
          </div>
          <div className="mb-3 flex flex-nowrap gap-1 overflow-x-auto rounded-lg bg-[#eceae7] p-1 md:flex-wrap">
            {(
              [
                ["todos", "Todos"],
                ["limpieza", "Limpieza"],
                ["reparacion", "Reparación"],
                ["pintura", "Pintura"],
                ["hojalateria", "Hojalatería"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFiltroHistorial(id)}
                  className={cn(
                  "h-8 shrink-0 rounded-md px-3 text-sm font-medium",
                  filtroHistorial === id ? "bg-white shadow-sm" : "text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {historialFiltrado.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Todavía no hay intervenciones
              {filtroHistorial === "todos" ? " en esta fachada." : " con ese tipo."}
            </p>
          ) : (
            <ul className="divide-y">
              {historialFiltrado.map((fila) => {
                if (fila.kind === "anterior") {
                  return (
                    <li
                      key={`anterior-${fila.tipo}-${fila.fecha}`}
                      className="bg-[#eceae7]/80"
                    >
                      <div className="grid grid-cols-1 gap-2 py-3 md:grid-cols-[9.5rem_1fr_10rem_7rem] md:items-center">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {formatDiaMesCorto(fila.fecha)}
                          </p>
                          <p className="fd-hint">Registro anterior al sistema</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              COLOR_TIPO[fila.tipo].chip,
                            )}
                          >
                            {TIPO_INTERVENCION_FACHADA_LABEL[fila.tipo]}
                          </span>
                        </div>
                        <p className="fd-hint">Sin costos ni fotos</p>
                        <p className="text-right text-sm text-muted-foreground">—</p>
                      </div>
                    </li>
                  );
                }
                const i = intervenciones.find((x) => x.id === fila.id);
                if (!i) return null;
                const ind = indicadores.find((x) => x.id === i.id);
                const costo = ind ? costoNetoIntervencion(ind) : null;
                const on = i.id === seleccion?.id;
                const antesN = i.media.filter((m) => m.tipo === "antes").length;
                const despuesN = i.media.filter((m) => m.tipo === "despues").length;
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => setSeleccionId(i.id)}
                      className={cn(
                        "grid w-full grid-cols-1 gap-2 py-3 text-left md:grid-cols-[9.5rem_1fr_10rem_7rem] md:items-center",
                        on && "rounded-lg bg-[#faf9f7]",
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatRangoDiaMes(i.fechaInicio, i.fechaTermino)}
                        </p>
                        <p className="fd-hint">
                          {formatDiasCl(i.tipos.reduce((a, t) => a + t.dias, 0))} días hábiles
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {chipsTiposIntervencion(i.tipos).map((c) =>
                          c.realizado ? (
                            <span
                              key={c.tipo}
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                COLOR_TIPO[c.tipo].chip,
                              )}
                            >
                              {c.label}
                            </span>
                          ) : (
                            <span
                              key={c.tipo}
                              className="rounded-full px-2 py-0.5 text-[11px] text-muted-foreground line-through"
                            >
                              {c.label}
                            </span>
                          ),
                        )}
                        {i.requiereHojalateria ? (
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              COLOR_TIPO.hojalateria.chip,
                            )}
                          >
                            Hojalatería
                          </span>
                        ) : (
                          <span className="rounded-full px-2 py-0.5 text-[11px] text-muted-foreground line-through">
                            Hojalatería
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm">
                          {i.ejecutadoPor
                            ? i.ejecutadoPor === "proveedor_externo"
                              ? nombreProveedor(i.proveedorId, proveedores)
                              : EJECUTADO_POR_LABEL[i.ejecutadoPor]
                            : "Sin ejecutor"}
                        </p>
                        <p className="fd-hint">
                          {i.ejecutadoPor ? EJECUTADO_POR_LABEL[i.ejecutadoPor] : ""}
                          {` · ${antesN} antes · ${despuesN} después`}
                        </p>
                      </div>
                      <p className="text-right text-sm font-semibold">
                        {costo ? formatMontoClp(costo.totalNeto) : "—"}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {puedeBorrar ? (
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-xl border-[#e30613] text-[#e30613] md:hidden"
            onClick={() => setBorrarOpen(true)}
          >
            Eliminar fachada
          </Button>
        ) : null}

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <FormularioFachada
          open={editOpen}
          onOpenChange={setEditOpen}
          fachada={fachada}
          modoDemo={modoDemo}
          onSuccess={() => {
            if (modoDemo) {
              setEditOpen(false);
              return;
            }
            router.refresh();
          }}
        />

        {borrarOpen ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">Eliminar fachada</p>
            <p className="mt-2 text-sm text-red-800">
              Se borrarán {conteos.intervenciones} intervención
              {conteos.intervenciones === 1 ? "" : "es"}, {conteos.cotizaciones}{" "}
              cotización{conteos.cotizaciones === 1 ? "" : "es"} y {conteos.fotos}{" "}
              foto{conteos.fotos === 1 ? "" : "s"}. Esto no se puede deshacer.
            </p>
            <p className="mt-2 text-sm">
              Escribe <strong>{fachada.nombre}</strong> para confirmar.
            </p>
            <Input
              className="mt-2 h-10 min-h-10"
              value={confirmNombre}
              onChange={(e) => setConfirmNombre(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 min-h-10 px-3"
                onClick={() => setBorrarOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="h-10 min-h-10 px-3"
                disabled={busy}
                onClick={() => void confirmarBorrar()}
              >
                Eliminar definitivamente
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </SeccionErrorBoundary>
  );
}

function TarjetaDocumentos({
  titulo,
  vacio,
  docs,
  proveedores,
  hrefEditar,
  puedeEditar,
  className,
}: {
  titulo: string;
  vacio: string;
  docs: DocumentoFachada[];
  proveedores: ProveedorOption[];
  hrefEditar: string | null;
  puedeEditar: boolean;
  className?: string;
}) {
  return (
    <section className={cn("fd-card p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        <div className="flex items-center gap-3">
          <span className="fd-hint uppercase tracking-wide">Valor neto</span>
          {puedeEditar && hrefEditar ? (
            <Link
              href={hrefEditar}
              className="text-sm font-semibold text-[#e30613] hover:underline"
            >
              {titulo === "Cotizaciones" ? "+ Subir cotización" : "+ Subir factura"}
            </Link>
          ) : null}
        </div>
      </div>
      {docs.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {docs.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-start gap-2">
                <span className="fd-pdf mt-0.5">PDF</span>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {nombreProveedor(d.proveedorId, proveedores)}
                    {d.numero ? ` · ${d.numero}` : ""}
                  </p>
                  <p className="fd-hint uppercase tracking-wide">
                    {CATEGORIA_DOCUMENTO_FACHADA_LABEL[d.categoria]} ·{" "}
                    {formatDiaMes(d.fecha)} · {labelEstadoDoc(d)}
                  </p>
                </div>
              </div>
              <p className="shrink-0 font-semibold">{formatMontoClp(d.valorNeto)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LineaDiferencias({
  costo,
  className,
}: {
  costo: CostoNetoIntervencion;
  className?: string;
}) {
  const partes = (
    [
      ["mano_de_obra", costo.manoDeObra],
      ["materiales", costo.materiales],
      ["hojalateria", costo.hojalateria],
    ] as const
  )
    .map(([cat, c]) => {
      const d = diferenciaFacturadoMenosCotizado(c);
      if (c.cotizadoNeto === 0 && c.facturadoNeto === 0) return null;
      if (d === 0) return null;
      return `${CATEGORIA_DOCUMENTO_FACHADA_LABEL[cat as CategoriaDocumentoFachada]}: ${formatMontoClp(d)} vs. cotización`;
    })
    .filter(Boolean);
  if (partes.length === 0) return null;
  return <p className={cn("fd-hint px-1", className)}>{partes.join(" · ")}</p>;
}
