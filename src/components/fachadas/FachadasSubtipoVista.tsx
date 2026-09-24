"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardFachadas } from "@/components/fachadas/DashboardFachadas";
import { FormularioFachada } from "@/components/fachadas/FormularioFachada";
import { fachadaHref } from "@/lib/fachadas/rutas";
import { formatM2Cl } from "@/lib/fachadas/indicadores";
import { labelEstadoFachada } from "@/lib/fachadas/estado";
import type { FachadaListadoItem } from "@/lib/fachadas/tipos";
import type { IntervencionIndicadores } from "@/lib/fachadas/indicadores";
import type { RecintoOption } from "@/lib/trabajos";
import type { ProveedorOption } from "@/lib/proveedores";

export function FachadasSubtipoVista({
  categoriaId,
  subtipoId,
  titulo,
  subtitulo,
  fachadas,
  intervenciones,
  recintos,
  proveedores,
  puedeEditar,
  tablasAusentes,
  error,
}: {
  categoriaId: string;
  subtipoId: string;
  titulo: string;
  subtitulo: string;
  fachadas: FachadaListadoItem[];
  intervenciones: IntervencionIndicadores[];
  recintos: RecintoOption[];
  proveedores: ProveedorOption[];
  puedeEditar: boolean;
  tablasAusentes: boolean;
  error: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>
        </div>
        {puedeEditar && !tablasAusentes ? (
          <Button type="button" onClick={() => setOpen(true)}>
            + Nueva fachada
          </Button>
        ) : null}
      </header>

      {tablasAusentes ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          El módulo Fachadas aún no está habilitado en la base de datos. Hay que
          aplicar la migración (solo aditiva) antes de crear datos.
        </p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <>
          <DashboardFachadas
            intervenciones={intervenciones}
            proveedores={proveedores}
          />

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Fachadas</h2>
            {fachadas.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Aún no hay fachadas. Crea la primera para registrar
                  intervenciones, fotos, planos y costos.
                </p>
                {puedeEditar ? (
                  <Button className="mt-4" type="button" onClick={() => setOpen(true)}>
                    + Nueva fachada
                  </Button>
                ) : null}
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {fachadas.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={fachadaHref(categoriaId, subtipoId, f.id)}
                      className="flex gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:border-primary/40"
                    >
                      {f.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.fotoUrl}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                          Sin foto
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{f.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {f.recintoEtiqueta} · {formatM2Cl(f.superficieM2)} m²
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {f.intervencionesN} intervención
                          {f.intervencionesN === 1 ? "" : "es"} ·{" "}
                          {labelEstadoFachada(f.ultimoEstado)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <FormularioFachada
        open={open}
        onOpenChange={setOpen}
        recintos={recintos}
        onSuccess={(id) => {
          router.push(fachadaHref(categoriaId, subtipoId, id));
        }}
      />
    </div>
  );
}
