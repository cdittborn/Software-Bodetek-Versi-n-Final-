"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventoMaterialesHeader } from "@/components/emergencias/evento-materiales/EventoMaterialesHeader";
import { FormularioCompraMateriales } from "@/components/emergencias/evento-materiales/FormularioCompraMateriales";
import {
  MaterialesPopup,
  type MaterialesPopupAbierto,
} from "@/components/emergencias/evento-materiales/MaterialesPopup";
import { EtiquetaFaltaBadge } from "@/components/emergencias/evento-consolidado/ui/EtiquetaFaltaBadge";
import {
  agregarPorProyecto,
  totalesCompras,
  type CompraMaterial,
  type ProyectoOpcionMaterial,
} from "@/lib/filtracion/materiales";
import { formatFechaCl, formatMontoClp } from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type EventoMaterialesVistaProps = {
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
  eventoNombre: string;
  compras: CompraMaterial[];
  proyectos: ProyectoOpcionMaterial[];
  puedeEditar: boolean;
  tablasPendientes: boolean;
};

export function EventoMaterialesVista({
  categoriaId,
  subtipoId,
  eventoId,
  eventoNombre,
  compras,
  proyectos,
  puedeEditar,
  tablasPendientes,
}: EventoMaterialesVistaProps) {
  const router = useRouter();
  const [formAbierto, setFormAbierto] = useState(false);
  const [popup, setPopup] = useState<MaterialesPopupAbierto | null>(null);
  const totales = useMemo(() => totalesCompras(compras), [compras]);
  const porProyecto = useMemo(
    () => agregarPorProyecto(compras, proyectos),
    [compras, proyectos],
  );
  const maxBruto = Math.max(0, ...porProyecto.map((p) => p.bruto));

  const cerrarPopup = useCallback(() => setPopup(null), []);

  const etiquetaDe = useCallback(
    (id: string) => proyectos.find((p) => p.id === id)?.etiqueta ?? id,
    [proyectos],
  );

  return (
    <div className="flex flex-col gap-6">
      <EventoMaterialesHeader
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        eventoId={eventoId}
        eventoNombre={eventoNombre}
      />

      {tablasPendientes ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Las tablas de compras aún no existen en producción. El dry-run ya está
          en el PR; falta el COMMIT para poder guardar.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <TarjetaResumen
          titulo="Total bruto"
          valor={formatMontoClp(totales.bruto)}
          hint="materiales del evento"
        />
        <TarjetaResumen
          titulo="Total neto"
          valor={formatMontoClp(totales.neto)}
          hint="sin IVA"
        />
        <TarjetaResumen
          titulo="IVA"
          valor={formatMontoClp(totales.iva)}
          hint="19% acumulado"
        />
        <TarjetaResumen
          titulo="Sin factura adjunta"
          valor={String(totales.sinFactura)}
          hint={`de ${totales.n} compra${totales.n === 1 ? "" : "s"}`}
          alerta={totales.sinFactura > 0}
        />
      </div>

      {puedeEditar && !tablasPendientes ? (
        <div>
          <Button
            type="button"
            className={cn(
              "h-12 min-h-[48px] w-full sm:w-auto",
              formAbierto
                ? "border-[#c8102e] bg-white text-[#c8102e] hover:bg-[#fdeced]"
                : "bg-[#c8102e] text-white hover:bg-[#a4131f]",
            )}
            variant={formAbierto ? "outline" : "default"}
            onClick={() => setFormAbierto((v) => !v)}
          >
            {formAbierto ? "Cerrar formulario" : "+ Registrar compra"}
          </Button>
        </div>
      ) : null}

      {formAbierto && puedeEditar ? (
        <FormularioCompraMateriales
          eventoId={eventoId}
          proyectos={proyectos}
          onCancelar={() => setFormAbierto(false)}
          onGuardado={() => {
            setFormAbierto(false);
            router.refresh();
          }}
        />
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">Compras registradas</h2>
          <p className="text-sm text-muted-foreground">
            {totales.n} compra{totales.n === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-3 hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Material y proveedor</TableHead>
                <TableHead>Proyectos-Filtraciones</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead>Factura</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Aún no hay compras registradas.
                  </TableCell>
                </TableRow>
              ) : (
                compras.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{formatFechaCl(c.fechaCompra)}</TableCell>
                    <TableCell>
                      <p className="font-semibold">{c.material}</p>
                      <p className="text-xs text-muted-foreground">{c.proveedor}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.trabajoIds.map((id) => (
                          <span
                            key={id}
                            className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium"
                          >
                            {etiquetaDe(id)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMontoClp(c.valorNeto)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMontoClp(c.valorIva)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatMontoClp(c.valorBruto)}
                    </TableCell>
                    <TableCell>
                      <CeldaFactura compra={c} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {compras.length > 0 ? (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>
                    Total · {totales.n} compra{totales.n === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMontoClp(totales.neto)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMontoClp(totales.iva)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMontoClp(totales.bruto)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        </div>

        <div className="mt-3 flex flex-col gap-3 md:hidden">
          {compras.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Aún no hay compras registradas.
            </p>
          ) : (
            compras.map((c) => (
              <article
                key={c.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <p className="text-xs text-muted-foreground">
                  {formatFechaCl(c.fechaCompra)}
                </p>
                <p className="mt-1 font-semibold">{c.material}</p>
                <p className="text-sm text-muted-foreground">{c.proveedor}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.trabajoIds.map((id) => (
                    <span
                      key={id}
                      className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium"
                    >
                      {etiquetaDe(id)}
                    </span>
                  ))}
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Neto</dt>
                    <dd className="tabular-nums">{formatMontoClp(c.valorNeto)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">IVA</dt>
                    <dd className="tabular-nums">{formatMontoClp(c.valorIva)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Bruto</dt>
                    <dd className="font-medium tabular-nums">
                      {formatMontoClp(c.valorBruto)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <CeldaFactura compra={c} />
                </div>
              </article>
            ))
          )}
          {compras.length > 0 ? (
            <p className="px-1 text-sm font-medium">
              Total · {totales.n} · {formatMontoClp(totales.bruto)} bruto
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
        <h2 className="text-base font-semibold">
          Materiales por &apos;Proyecto-Filtración&apos;
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Haz clic en un monto para ver qué compras lo componen
        </p>

        <div className="mt-3 hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto-Filtración</TableHead>
                <TableHead className="text-right">Compras</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porProyecto.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Este evento aún no tiene proyectos-filtración.
                  </TableCell>
                </TableRow>
              ) : (
                porProyecto.map((fila) => (
                  <TableRow
                    key={fila.trabajoId}
                    className="cursor-pointer"
                    onClick={() =>
                      setPopup({
                        titulo: fila.etiqueta,
                        categoria: "Materiales",
                        items: fila.partes.map((p) => ({
                          key: `${p.compra.id}:${fila.trabajoId}`,
                          compra: p.compra,
                          neto: p.neto,
                          iva: p.iva,
                          bruto: p.bruto,
                        })),
                      })
                    }
                  >
                    <TableCell>
                      <p className="font-medium">{fila.etiqueta}</p>
                      <BarraProporcion n={fila.bruto} max={maxBruto} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fila.comprasN}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMontoClp(fila.neto)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMontoClp(fila.iva)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatMontoClp(fila.bruto)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex flex-col gap-3 md:hidden">
          {porProyecto.map((fila) => (
            <button
              key={fila.trabajoId}
              type="button"
              className="rounded-xl border border-border bg-card p-4 text-left min-h-[44px]"
              onClick={() =>
                setPopup({
                  titulo: fila.etiqueta,
                  categoria: "Materiales",
                  items: fila.partes.map((p) => ({
                    key: `${p.compra.id}:${fila.trabajoId}`,
                    compra: p.compra,
                    neto: p.neto,
                    iva: p.iva,
                    bruto: p.bruto,
                  })),
                })
              }
            >
              <p className="font-semibold">{fila.etiqueta}</p>
              <BarraProporcion n={fila.bruto} max={maxBruto} />
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Compras</dt>
                  <dd className="tabular-nums">{fila.comprasN}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Neto</dt>
                  <dd className="tabular-nums">{formatMontoClp(fila.neto)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">IVA</dt>
                  <dd className="tabular-nums">{formatMontoClp(fila.iva)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Bruto</dt>
                  <dd className="font-medium tabular-nums">
                    {formatMontoClp(fila.bruto)}
                  </dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      </section>

      {popup ? (
        <MaterialesPopup popup={popup} onCerrar={cerrarPopup} />
      ) : null}
    </div>
  );
}

function TarjetaResumen({
  titulo,
  valor,
  hint,
  alerta,
}: {
  titulo: string;
  valor: string;
  hint: string;
  alerta?: boolean;
}) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
      <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
        {titulo}
      </p>
      <p
        className={cn(
          "mt-2 text-[28px] font-semibold leading-none tabular-nums md:text-[32px]",
          alerta ? "text-[#c8102e]" : "text-zinc-900",
        )}
      >
        {valor}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
    </article>
  );
}

function BarraProporcion({ n, max }: { n: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((n / max) * 100);
  return (
    <div className="mt-1.5 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-zinc-200">
      <div
        className="h-full rounded-full bg-[#c8102e]"
        style={{ width: `${pct}%` }}
        aria-hidden
      />
    </div>
  );
}

function CeldaFactura({ compra }: { compra: CompraMaterial }) {
  if (!compra.facturaKey) return <EtiquetaFaltaBadge />;
  if (compra.facturaUrl) {
    return (
      <a
        href={compra.facturaUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-[44px] items-center text-sm font-medium text-[#c8102e] underline-offset-4 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        Ver factura
      </a>
    );
  }
  return (
    <span className="text-sm text-emerald-700">
      {compra.facturaNombre || "Adjunta"}
    </span>
  );
}
