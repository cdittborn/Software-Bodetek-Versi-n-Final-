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
  TIPO_DOCUMENTO_FACHADA_LABEL,
  TIPO_INTERVENCION_FACHADA_LABEL,
  TIPOS_INTERVENCION_FACHADA,
  costoNetoIntervencion,
  detalleAIndicadores,
  etiquetaCortaFachada,
  estadoCalculadoFachada,
  formatDiasCl,
  formatM2Cl,
  hintSuperficie,
  proximaRevision,
  type CategoriaDocumentoFachada,
  type CostoNetoIntervencion,
} from "@/lib/fachadas/indicadores";
import {
  EJECUTADO_POR_LABEL,
  formatFechaCl,
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
  diasCalendario,
  diferenciaFacturadoMenosCotizado,
  hoyIsoChile,
  totalHistoricoNeto,
} from "@/lib/fachadas/ficha";
import { cn } from "@/lib/utils";
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
  const hoy = hoyIsoChile();
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
  const corta = etiquetaCortaFachada(fachada.recintoCodigo, fachada.letra);

  async function nuevaIntervencion() {
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
      <div className="fachadas-ficha mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <nav className="text-sm text-muted-foreground">
          <Link href={subtipoHref(categoriaId, subtipoId)} className="underline">
            Fachadas
          </Link>
          <span aria-hidden> / </span>
          <span className="text-foreground">{fachada.nombre}</span>
        </nav>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {fachada.nombre}
              </h1>
              <ChipEstadoFachada estado={estado} />
              {corta ? (
                <span className="text-sm text-muted-foreground">{corta}</span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{fachada.recintoEtiqueta}</p>
            <p className="text-sm">
              Alto {formatM2Cl(fachada.altoM)} m · Ancho {formatM2Cl(fachada.anchoM)} m
              · {formatM2Cl(fachada.superficieM2)} m²
            </p>
            <p className="text-sm text-muted-foreground">
              Próxima revisión: {formatFechaCl(proxima)} · cada{" "}
              {fachada.frecuenciaRevisionMeses} meses
            </p>
            {hint ? <p className="text-xs text-amber-700">{hint}</p> : null}
            {fachada.notas ? (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {fachada.notas}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {puedeEditar ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 min-h-10 px-3"
                  onClick={() => setEditOpen(true)}
                >
                  Editar fachada
                </Button>
                <Button
                  type="button"
                  className="h-10 min-h-10 px-3"
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

        <ComparadorAntesDespues
          fachadaId={fachada.id}
          fotoInicial={fachada.foto}
          intervenciones={intervenciones}
          seleccionId={seleccion?.id ?? null}
          onSelect={setSeleccionId}
          puedeEditar={puedeEditar}
          onNuevaFoto={onNuevaFoto}
        />

        <section className="rounded-xl border bg-card p-4">
          <h2 className="text-sm font-medium">Plano</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
            {fachada.plano.url && esImagen(fachada.plano.nombre, fachada.plano.key) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fachada.plano.url}
                alt=""
                className="max-h-48 rounded-md border object-contain"
              />
            ) : fachada.plano.url && esPdf(fachada.plano.nombre, fachada.plano.key) ? (
              <div className="flex h-32 w-24 items-center justify-center rounded-md border bg-muted text-xs">
                PDF
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin plano</p>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-medium">
                {fachada.plano.nombre ?? "Sin archivo"}
              </p>
              {fachada.plano.url ? (
                <a
                  href={fachada.plano.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 min-h-10 items-center text-sm text-primary underline"
                >
                  Descargar
                </a>
              ) : null}
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
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <TarjetaDocumentos
            titulo="Cotizaciones"
            vacio="No hay cotizaciones en esta intervención."
            docs={cotizaciones}
            proveedores={proveedores}
            hrefEditar={
              seleccion
                ? intervencionHref(categoriaId, subtipoId, fachada.id, seleccion.id)
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
                ? intervencionHref(categoriaId, subtipoId, fachada.id, seleccion.id)
                : null
            }
            puedeEditar={puedeEditar}
          />
        </div>
        {costoSel ? <LineaDiferencias costo={costoSel} /> : null}

        {seleccion && indSel && costoSel ? (
          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium">
                Intervención {formatFechaCl(seleccion.fechaInicio)}
              </h2>
              <Link
                href={intervencionHref(
                  categoriaId,
                  subtipoId,
                  fachada.id,
                  seleccion.id,
                )}
                className="inline-flex h-10 min-h-10 items-center text-sm underline"
              >
                Abrir ficha de intervención
              </Link>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Tiempo por trabajo
              </p>
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
                      <span>{TIPO_INTERVENCION_FACHADA_LABEL[tipo]}</span>
                      <span>{formatDiasCl(dias)} d</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, (dias / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="text-sm font-medium">
                Total {formatDiasCl(seleccion.tipos.reduce((a, t) => a + t.dias, 0))} d
              </p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-xs font-medium text-muted-foreground">
                Costos (valor neto)
              </p>
              <p>
                Mano de obra: {formatMontoClp(costoSel.manoDeObra.neto)}
                {costoSel.manoDeObra.estimado ? " (estimado)" : ""}
              </p>
              <p>Materiales: {formatMontoClp(costoSel.materiales.neto)}</p>
              <p>Hojalatería: {formatMontoClp(costoSel.hojalateria.neto)}</p>
              <p className="font-medium">
                Costo neto {formatMontoClp(costoSel.totalNeto)}
                {costoSel.costoPorM2 != null
                  ? ` · ${formatMontoClp(costoSel.costoPorM2)} / m²`
                  : ""}
              </p>
            </div>
            {seleccion.requiereHojalateria && seleccion.hojalaterias.length > 0 ? (
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Hojalatería</p>
                {seleccion.hojalaterias.map((h) => (
                  <p key={h.id} className="mt-1 text-muted-foreground">
                    {nombreProveedor(h.proveedorId, proveedores)} · valor neto{" "}
                    {formatMontoClp(h.valorNeto)}
                    {h.descripcion ? ` · ${h.descripcion}` : ""}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hubo trabajo de hojalatería.
              </p>
            )}
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Historial de intervenciones</h2>
          {intervenciones.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Todavía no hay intervenciones en esta fachada.
            </p>
          ) : (
            <ul className="space-y-2">
              {intervenciones.map((i) => {
                const ind = indicadores.find((x) => x.id === i.id);
                const costo = ind ? costoNetoIntervencion(ind) : null;
                const dias = diasCalendario(i.fechaInicio, i.fechaTermino);
                const on = i.id === seleccion?.id;
                const fotosN = i.media.filter((m) => m.tipoArchivo === "foto").length;
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => setSeleccionId(i.id)}
                      className={cn(
                        "w-full rounded-xl border bg-card p-3 text-left hover:border-primary/40",
                        on && "border-primary",
                      )}
                    >
                      <p className="text-sm">
                        {formatFechaCl(i.fechaInicio)} — {formatFechaCl(i.fechaTermino)}
                        {dias != null ? ` · ${formatDiasCl(dias)} d` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {chipsTiposIntervencion(i.tipos).map((c) => (
                          <span
                            key={c.tipo}
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs",
                              c.realizado
                                ? "border-border"
                                : "text-muted-foreground line-through",
                            )}
                          >
                            {c.label}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {i.ejecutadoPor
                          ? EJECUTADO_POR_LABEL[i.ejecutadoPor]
                          : "Sin ejecutor"}{" "}
                        · {fotosN} foto{fotosN === 1 ? "" : "s"}
                        {costo
                          ? ` · costo neto ${formatMontoClp(costo.totalNeto)}`
                          : ""}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-sm font-medium">
            Total histórico (valor neto): {formatMontoClp(historico)}
          </p>
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
          onSuccess={() => router.refresh()}
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
    <section className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">{titulo}</h2>
        {puedeEditar && hrefEditar ? (
          <Link
            href={hrefEditar}
            className="inline-flex h-10 min-h-10 items-center text-sm underline"
          >
            Subir
          </Link>
        ) : null}
      </div>
      {docs.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {docs.map((d) => (
            <li key={d.id} className="border-b pb-2 text-sm last:border-0">
              <p className="font-medium">
                Valor neto {formatMontoClp(d.valorNeto)}
              </p>
              <p className="text-muted-foreground">
                {CATEGORIA_DOCUMENTO_FACHADA_LABEL[d.categoria]} ·{" "}
                {TIPO_DOCUMENTO_FACHADA_LABEL[d.tipoDocumento]} ·{" "}
                {nombreProveedor(d.proveedorId, proveedores)}
              </p>
              <p className="text-muted-foreground">
                N° {d.numero ?? "—"} · {formatFechaCl(d.fecha)} ·{" "}
                {labelEstadoDoc(d)}
              </p>
              {d.archivoUrl ? (
                <a
                  href={d.archivoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Ver archivo
                </a>
              ) : null}
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
      const signo = d > 0 ? "+" : "";
      return `${CATEGORIA_DOCUMENTO_FACHADA_LABEL[cat as CategoriaDocumentoFachada]}: facturado vs cotizado (neto) ${signo}${formatMontoClp(d)}`;
    })
    .filter(Boolean);
  return (
    <p className="text-sm text-muted-foreground">
      {partes.length > 0
        ? partes.join(" · ")
        : "Sin diferencias entre cotizado y facturado."}
    </p>
  );
}
