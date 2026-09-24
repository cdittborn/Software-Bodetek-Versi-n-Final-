"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormularioFachada } from "@/components/fachadas/FormularioFachada";
import { UploaderArchivoSimple } from "@/components/fachadas/UploaderArchivoSimple";
import { formatM2Cl } from "@/lib/fachadas/indicadores";
import { labelEstadoFachada } from "@/lib/fachadas/estado";
import {
  EJECUTADO_POR_LABEL,
  formatFechaCl,
  formatMontoClp,
  subtipoHref,
} from "@/lib/trabajos";
import { intervencionHref } from "@/lib/fachadas/rutas";
import {
  borrarFachada,
  crearIntervencion,
  guardarArchivoFachada,
} from "@/lib/fachadas/guardar";
import { carpetaFachadaGeneral, carpetaFachadaPlano } from "@/lib/fachadas/upload";
import { hintSuperficie } from "@/lib/fachadas/indicadores";
import type { ConteosBorrarFachada, FachadaDetalle } from "@/lib/fachadas/tipos";
import type { RecintoOption } from "@/lib/trabajos";

export function DetalleFachadaVista({
  categoriaId,
  subtipoId,
  fachada,
  recintos,
  puedeEditar,
  puedeBorrar,
  conteos,
}: {
  categoriaId: string;
  subtipoId: string;
  fachada: FachadaDetalle;
  recintos: RecintoOption[];
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
  const hint = hintSuperficie(fachada.altoM, fachada.anchoM, fachada.superficieM2);

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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={subtipoHref(categoriaId, subtipoId)} className="underline">
              Fachadas
            </Link>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{fachada.nombre}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{fachada.recintoEtiqueta}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeEditar ? (
            <>
              <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
              <Button type="button" disabled={busy} onClick={() => void nuevaIntervencion()}>
                + Nueva intervención
              </Button>
            </>
          ) : null}
          {puedeBorrar ? (
            <Button type="button" variant="ghost" onClick={() => setBorrarOpen(true)}>
              Eliminar
            </Button>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-sm font-medium">Medidas</h2>
        <p className="mt-2 text-sm">
          Alto {formatM2Cl(fachada.altoM)} m · Ancho {formatM2Cl(fachada.anchoM)} m ·{" "}
          {formatM2Cl(fachada.superficieM2)} m²
        </p>
        {hint ? <p className="mt-1 text-xs text-amber-700">{hint}</p> : null}
        {fachada.notas ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {fachada.notas}
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <UploaderArchivoSimple
            etiqueta="Foto general"
            carpeta={carpetaFachadaGeneral(fachada.id)}
            accept="image/*"
            actualUrl={fachada.foto.url}
            actualNombre={fachada.foto.nombre}
            actualKey={fachada.foto.key}
            puedeEditar={puedeEditar}
            onUploaded={async (key, nombre) => {
              await guardarArchivoFachada(fachada.id, "foto", key, nombre);
              router.refresh();
            }}
            onCleared={async () => {
              await guardarArchivoFachada(fachada.id, "foto", null, null);
              router.refresh();
            }}
          />
        </section>
        <section className="rounded-xl border bg-card p-4">
          <UploaderArchivoSimple
            etiqueta="Plano (PDF o imagen)"
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
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Intervenciones</h2>
        {fachada.intervenciones.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Todavía no hay intervenciones en esta fachada.
          </p>
        ) : (
          <ul className="space-y-2">
            {fachada.intervenciones.map((i) => (
              <li key={i.id}>
                <Link
                  href={intervencionHref(categoriaId, subtipoId, fachada.id, i.id)}
                  className="block rounded-xl border bg-card p-3 hover:border-primary/40"
                >
                  <p className="font-medium">{labelEstadoFachada(i.estado)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFechaCl(i.fechaInicio)} — {formatFechaCl(i.fechaTermino)}
                    {i.ejecutadoPor
                      ? ` · ${EJECUTADO_POR_LABEL[i.ejecutadoPor]}`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm">
                    {formatMontoClp(i.costoTotalBruto)}
                    {i.costoPorM2 != null
                      ? ` · ${formatMontoClp(i.costoPorM2)} / m²`
                      : ""}
                  </p>
                </Link>
              </li>
            ))}
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
            className="mt-2"
            value={confirmNombre}
            onChange={(e) => setConfirmNombre(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" onClick={() => setBorrarOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void confirmarBorrar()}
            >
              Eliminar definitivamente
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
