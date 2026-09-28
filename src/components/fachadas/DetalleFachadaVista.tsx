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
import {
  CATEGORIA_DOCUMENTO_FACHADA_LABEL,
  ESTADO_COTIZACION_DOC_LABEL,
  ESTADO_FACTURA_DOC_LABEL,
  TIPO_INTERVENCION_FACHADA_LABEL,
  TIPOS_INTERVENCION_FACHADA,
  costoNetoIntervencion,
  detalleAIndicadores,
  estadoCalculadoFachada,
  formatDiasCl,
  formatM2Cl,
  hintSuperficie,
  materialesNetoPorTipo,
  proximaRevision,
  type CategoriaDocumentoFachada,
  type CostoNetoIntervencion,
} from "@/lib/fachadas/indicadores";
import {
  EJECUTADO_POR_LABEL,
  formatMontoClp,
  subtipoHref,
  type RecintoOption,
} from "@/lib/trabajos";
import { intervencionHref } from "@/lib/fachadas/rutas";
import { borrarFachada, crearIntervencion, guardarArchivoFachada } from "@/lib/fachadas/guardar";
import { carpetaFachadaPlano } from "@/lib/fachadas/upload";
import { esImagen, esPdf } from "@/lib/fachadas/url";
import {
  chipsTiposIntervencion,
  diferenciaFacturadoMenosCotizado,
  hoyIsoChile,
  totalHistoricoNeto,
} from "@/lib/fachadas/ficha";
import { cn } from "@/lib/utils";
import { COLOR_TIPO, formatDiaMes, formatMesCortoCl, formatRangoDiaMes } from "@/lib/fachadas/ui";
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

  const hint = hintSuperficie(fachada.altoM, fachada.anchoM, fachada.superficieM2);
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
  const hoy = hoyProp ?? hoyIsoChile();
  const estado = estadoCalculadoFachada(
    {
      id: fachada.id,
      recintoId: fachada.recintoId,
      superficieM2: fachada.superficieM2,
      frecuenciaRevisionMeses: fachada.frecuenciaRevisionMeses,
      letra: fachada.letra,
      codigoRecinto: fachada.recintoCodigo,
    },
    indicadores,
    hoy,
  );
  const proxima = proximaRevision(
    {
      id: fachada.id,
      recintoId: fachada.recintoId,
      superficieM2: fachada.superficieM2,
      frecuenciaRevisionMeses: fachada.frecuenciaRevisionMeses,
    },
    indicadores,
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
          <span>{fachada.recintoEtiqueta}</span>
          <span aria-hidden> / </span>
          <span>Fachada {fachada.letra ?? fachada.nombre}</span>
        </nav>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="fd-title text-[1.85rem]">
                {fachada.recintoEtiqueta}
                {fachada.letra ? ` · Fachada ${fachada.letra}` : ` · ${fachada.nombre}`}
              </h1>
              <ChipEstadoFachada estado={estado} />
            </div>
            <p className="text-sm text-muted-foreground">
              Recinto{" "}
              <span className="font-semibold text-foreground">
                {fachada.recintoEtiqueta}
              </span>
              {"  "}Alto{" "}
              <span className="font-semibold text-foreground">
                {formatM2Cl(fachada.altoM)} m
              </span>
              {"  "}Ancho{" "}
              <span className="font-semibold text-foreground">
                {formatM2Cl(fachada.anchoM)} m
              </span>
              {"  "}Superficie{" "}
              <span className="font-semibold text-foreground">
                {formatM2Cl(fachada.superficieM2)} m²
              </span>
              {"  "}Próxima revisión{" "}
              <span className="font-semibold text-foreground">
                {formatMesCortoCl(proxima)}
              </span>
            </p>
            {hint ? <p className="fd-hint">{hint}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {puedeEditar ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 min-h-10 rounded-xl px-4"
                  onClick={() => setEditOpen(true)}
                >
                  Editar fachada
                </Button>
                <Button
                  type="button"
                  className="fd-btn-primary h-10 min-h-10 rounded-xl px-4"
                  disabled={busy}
                  onClick={() => void nuevaIntervencion()}
                >
                  + Nueva intervención
                </Button>
              </>
            ) : null}
            {puedeBorrar ? (
              <Button
                type="button"
                variant="ghost"
                className="h-10 min-h-10 px-3"
                onClick={() => setBorrarOpen(true)}
              >
                Eliminar
              </Button>
            ) : null}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
          <ComparadorAntesDespues
            fachadaId={fachada.id}
            fotoInicial={fachada.foto}
            intervenciones={intervenciones}
            seleccionId={seleccion?.id ?? null}
            onSelect={setSeleccionId}
            puedeEditar={puedeEditar && !modoDemo}
            onNuevaFoto={onNuevaFoto}
          />

          <div className="flex flex-col gap-4">
        <section className="fd-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Plano de la fachada</h2>
            {puedeEditar ? (
              modoDemo ? (
                <span className="text-sm font-medium text-muted-foreground">Reemplazar</span>
              ) : (
              <UploaderArchivoSimple
                etiqueta="Reemplazar"
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
              )
            ) : null}
          </div>
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
            ) : fachada.plano.url && esPdf(fachada.plano.nombre, fachada.plano.key) ? (
              <div className="flex h-32 items-center justify-center rounded-md bg-muted text-xs">
                PDF
              </div>
            ) : (
              <p className="fd-hint">Sin plano</p>
            )}
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="truncate text-sm">
                <span className="mr-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                  PDF
                </span>
                {fachada.plano.nombre ?? "Sin archivo"}
              </p>
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
          </div>
        </section>

        <TarjetaDocumentos
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
        {costoSel ? <LineaDiferencias costo={costoSel} /> : null}
          </div>
        </div>

        {seleccion && indSel && costoSel ? (
          <section className="fd-card p-4">
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

        <section className="fd-card p-4">
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
          {intervenciones.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Todavía no hay intervenciones en esta fachada.
            </p>
          ) : (
            <ul className="divide-y">
              {intervenciones.map((i) => {
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

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <FormularioFachada
          open={editOpen}
          onOpenChange={setEditOpen}
          recintos={recintos}
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
}: {
  titulo: string;
  vacio: string;
  docs: DocumentoFachada[];
  proveedores: ProveedorOption[];
  hrefEditar: string | null;
  puedeEditar: boolean;
}) {
  return (
    <section className="fd-card p-4">
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

function LineaDiferencias({ costo }: { costo: CostoNetoIntervencion }) {
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
  return <p className="fd-hint px-1">{partes.join(" · ")}</p>;
}
