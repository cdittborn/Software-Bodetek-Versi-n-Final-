"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  FileImage,
  FileText,
  Info,
  ImageIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormularioEmergencia } from "@/components/emergencias/FormularioEmergencia";
import { BotonMediaListado } from "@/components/emergencias/BotonMediaListado";
import { InfoProyectoDialog } from "@/components/emergencias/InfoProyectoDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EJECUTADO_POR_LABEL,
  ESTADO_LLUVIAS_BADGE,
  ESTADO_TRABAJO_LABEL,
  GRAVEDAD_LLUVIAS_BADGE,
  GRAVEDAD_LLUVIAS_LABEL,
  eventoDashboardHref,
  formatFechaCl,
  formatMontoClp,
  isEstadoLluvias,
  isGravedadLluvias,
  subtipoHref,
  type EmergenciaConMedia,
  type EjecutadoPor,
  type RecintoOption,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type EmergenciasListadoProps = {
  emergencias: EmergenciaConMedia[];
  recintos: RecintoOption[];
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
  eventoNombre: string;
  puedeEditar: boolean;
};

function BotonesMedia({ e }: { e: EmergenciaConMedia }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <BotonMediaListado
        label="Antes"
        icon={<Camera className="size-3.5" />}
        items={e.media.antes}
      />
      <BotonMediaListado
        label="Después"
        icon={<ImageIcon className="size-3.5" />}
        items={e.media.despues}
      />
      <BotonMediaListado
        label="Plano"
        icon={<FileImage className="size-3.5" />}
        items={e.media.plano_filtraciones}
      />
      <BotonMediaListado
        label="Cotizaciones"
        icon={<FileText className="size-3.5" />}
        items={e.media.cotizacion}
      />
      <BotonInfo e={e} />
    </div>
  );
}

function BotonInfo({ e }: { e: EmergenciaConMedia }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        title="Información"
        aria-label="Ver problema y plan de acción"
        className="h-8 gap-1 px-2 text-xs"
        onClick={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          setOpen(true);
        }}
      >
        <Info className="size-3.5" />
      </Button>
      <InfoProyectoDialog
        open={open}
        onOpenChange={setOpen}
        titulo={e.recinto_codigo ?? e.titulo}
        descripcion={e.descripcion}
        planAccion={e.plan_accion}
      />
    </>
  );
}

function ejecutadoLabel(value: string | null) {
  if (!value) return "—";
  return EJECUTADO_POR_LABEL[value as EjecutadoPor] ?? value;
}

export function EmergenciasListado({
  emergencias,
  recintos,
  categoriaId,
  subtipoId,
  eventoId,
  eventoNombre,
  puedeEditar,
}: EmergenciasListadoProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const base = subtipoHref(categoriaId, subtipoId);
  const dashboardHref = eventoDashboardHref(categoriaId, subtipoId, eventoId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={base} className="hover:underline">
              Lluvias y temporales
            </Link>
            {" / Eventos"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{eventoNombre}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {emergencias.length} filtración-proyecto
            {emergencias.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href={dashboardHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 w-full justify-center sm:w-auto",
            )}
          >
            Dashboard de avance
          </Link>
          {puedeEditar ? (
            <Button
              type="button"
              className="h-10 w-full sm:w-auto"
              onClick={() => setOpen(true)}
            >
              Filtración-Proyecto
            </Button>
          ) : null}
        </div>
      </div>

      {emergencias.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay proyectos registrados todavía
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {emergencias.map((e) => (
              <li
                key={e.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`${base}/${e.id}`}
                      className="font-medium hover:underline"
                    >
                      {e.recinto_codigo ?? "Sin recinto"}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {e.recinto_arrendatario?.trim() || "Sin arrendatario"}
                    </p>
                  </div>
                  {e.gravedad && isGravedadLluvias(e.gravedad) ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                        GRAVEDAD_LLUVIAS_BADGE[e.gravedad],
                      )}
                    >
                      {GRAVEDAD_LLUVIAS_LABEL[e.gravedad]}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      isEstadoLluvias(e.estado)
                        ? ESTADO_LLUVIAS_BADGE[e.estado]
                        : "bg-muted",
                    )}
                  >
                    {ESTADO_TRABAJO_LABEL[e.estado] ?? e.estado}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <div>
                    <dt className="font-medium text-foreground/70">Creación</dt>
                    <dd>{formatFechaCl(e.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground/70">
                      Entrega est.
                    </dt>
                    <dd>
                      {e.fecha_entrega_estimada
                        ? formatFechaCl(e.fecha_entrega_estimada)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground/70">
                      Ejecutado por
                    </dt>
                    <dd>{ejecutadoLabel(e.ejecutado_por)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground/70">Valor</dt>
                    <dd>
                      {e.valor_reparacion != null
                        ? formatMontoClp(e.valor_reparacion)
                        : "—"}
                    </dd>
                  </div>
                  {e.proveedor?.trim() ? (
                    <div className="col-span-2">
                      <dt className="font-medium text-foreground/70">
                        Proveedor
                      </dt>
                      <dd>{e.proveedor}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-3 border-t border-border pt-3">
                  <BotonesMedia e={e} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recinto</TableHead>
                  <TableHead>Arrendatario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Gravedad</TableHead>
                  <TableHead>Creación</TableHead>
                  <TableHead>Entrega est.</TableHead>
                  <TableHead>Antes</TableHead>
                  <TableHead>Después</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Cotiz.</TableHead>
                  <TableHead>Info</TableHead>
                  <TableHead>Ejecutado por</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emergencias.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link
                        href={`${base}/${e.id}`}
                        className="font-medium hover:underline"
                      >
                        {e.recinto_codigo ?? "Sin recinto"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {e.recinto_arrendatario?.trim() || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          isEstadoLluvias(e.estado)
                            ? ESTADO_LLUVIAS_BADGE[e.estado]
                            : "bg-muted",
                        )}
                      >
                        {ESTADO_TRABAJO_LABEL[e.estado] ?? e.estado}
                      </span>
                    </TableCell>
                    <TableCell>
                      {e.gravedad && isGravedadLluvias(e.gravedad) ? (
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                            GRAVEDAD_LLUVIAS_BADGE[e.gravedad],
                          )}
                        >
                          {GRAVEDAD_LLUVIAS_LABEL[e.gravedad]}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatFechaCl(e.created_at)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {e.fecha_entrega_estimada
                        ? formatFechaCl(e.fecha_entrega_estimada)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <BotonMediaListado
                        label="Antes"
                        icon={<Camera className="size-3.5" />}
                        items={e.media.antes}
                      />
                    </TableCell>
                    <TableCell>
                      <BotonMediaListado
                        label="Después"
                        icon={<ImageIcon className="size-3.5" />}
                        items={e.media.despues}
                      />
                    </TableCell>
                    <TableCell>
                      <BotonMediaListado
                        label="Plano"
                        icon={<FileImage className="size-3.5" />}
                        items={e.media.plano_filtraciones}
                      />
                    </TableCell>
                    <TableCell>
                      <BotonMediaListado
                        label="Cotizaciones"
                        icon={<FileText className="size-3.5" />}
                        items={e.media.cotizacion}
                      />
                    </TableCell>
                    <TableCell>
                      <BotonInfo e={e} />
                    </TableCell>
                    <TableCell className="max-w-[10rem] text-sm">
                      {ejecutadoLabel(e.ejecutado_por)}
                    </TableCell>
                    <TableCell className="max-w-[8rem] truncate text-sm">
                      {e.proveedor?.trim() || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {e.valor_reparacion != null
                        ? formatMontoClp(e.valor_reparacion)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <FormularioEmergencia
        open={open}
        onOpenChange={setOpen}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        eventoId={eventoId}
        recintos={recintos}
        onSuccess={(id) => {
          if (id) router.push(`${base}/${id}`);
          else router.refresh();
        }}
      />
    </div>
  );
}
