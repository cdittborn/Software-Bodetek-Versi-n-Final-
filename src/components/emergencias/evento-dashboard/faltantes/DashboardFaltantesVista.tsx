"use client";

import type { ReactNode } from "react";

import { TIPO_PROBLEMA_LABEL, TIPOS_PROBLEMA } from "@/lib/filtracion/problemas";
import {
  ESTADOS_S4_MAESTROS,
  ESTADOS_S4_PROVEEDOR,
  TIPO_PROBLEMA_CHIP,
  abrirCelda,
  desgloseDeFilaGravedad,
  desgloseDeFilaTipo,
  type CeldaFaltante,
  type DashboardFaltantes,
  type FilaGravedad,
  type FilaTipo,
  type PopupAbierto,
} from "@/lib/filtracion/dashboardFaltantes";
import { GRAVEDAD_LLUVIAS_LABEL } from "@/lib/trabajos";
import { BarraSegmentadaGravedad } from "@/components/emergencias/evento-dashboard/ui/BarraSegmentadaGravedad";
import { BarraSegmentadaTipo } from "@/components/emergencias/evento-dashboard/ui/BarraSegmentadaTipo";
import { ChipsGravedad } from "@/components/emergencias/evento-dashboard/ui/ChipsGravedad";
import { NumeroClicable } from "@/components/emergencias/evento-dashboard/ui/NumeroClicable";
import { cn } from "@/lib/utils";

const GRAVEDAD_COLS = ["critico", "medio", "bajo"] as const;

type OpenFn = (popup: PopupAbierto) => void;

function ChipTipo({
  tipo,
  n,
}: {
  tipo: (typeof TIPOS_PROBLEMA)[number];
  n: number;
}) {
  if (n <= 0) return null;
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        TIPO_PROBLEMA_CHIP[tipo],
      )}
    >
      {TIPO_PROBLEMA_LABEL[tipo]} {n}
    </span>
  );
}

function formatHoras(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(".", ",");
}

function BarraDosSegmentos({
  izquierda,
  derecha,
  classIzq,
  classDer,
}: {
  izquierda: number;
  derecha: number;
  classIzq: string;
  classDer: string;
}) {
  const total = izquierda + derecha;
  if (total === 0) {
    return <div className="mt-1.5 h-1.5 max-w-[180px] rounded-full bg-zinc-200" />;
  }
  return (
    <div className="mt-1.5 flex h-1.5 max-w-[180px] gap-0.5">
      {izquierda > 0 ? (
        <div className={cn("rounded-full", classIzq)} style={{ flex: izquierda }} />
      ) : null}
      {derecha > 0 ? (
        <div className={cn("rounded-full", classDer)} style={{ flex: derecha }} />
      ) : null}
    </div>
  );
}

function TablaGravedad({
  filas,
  onOpen,
}: {
  filas: {
    nombre: string;
    fila: FilaGravedad;
    alerta?: boolean;
  }[];
  onOpen: OpenFn;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="py-2 pr-3 font-medium"> </th>
            <th className="px-1 py-2 text-center font-medium">
              {GRAVEDAD_LLUVIAS_LABEL.critico}
            </th>
            <th className="px-1 py-2 text-center font-medium">
              {GRAVEDAD_LLUVIAS_LABEL.medio}
            </th>
            <th className="px-1 py-2 text-center font-medium">
              {GRAVEDAD_LLUVIAS_LABEL.bajo}
            </th>
            <th className="px-1 py-2 text-center font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(({ nombre, fila, alerta }) => {
            const labelRojo = Boolean(alerta && fila.total.n > 0);
            return (
              <tr key={nombre} className="border-b border-zinc-100 last:border-0">
                <td className="py-2 pr-3 align-middle">
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      labelRojo ? "font-medium text-[#c8102e]" : "text-zinc-800",
                    )}
                  >
                    {nombre}
                  </p>
                  <BarraSegmentadaGravedad
                    desglose={desgloseDeFilaGravedad(fila)}
                    pista="clara"
                    altura="h-1"
                    className="mt-1.5 max-w-[220px]"
                  />
                </td>
                {GRAVEDAD_COLS.map((g) => (
                  <td key={g} className="px-1 py-1 text-center">
                    <NumeroClicable
                      n={fila[g].n}
                      alerta={alerta}
                      ariaLabel={`${nombre}, ${GRAVEDAD_LLUVIAS_LABEL[g]}: ${fila[g].n}`}
                      onClick={() =>
                        onOpen(
                          abrirCelda(nombre, GRAVEDAD_LLUVIAS_LABEL[g], fila[g]),
                        )
                      }
                    />
                  </td>
                ))}
                <td className="px-1 py-1 text-center">
                  <NumeroClicable
                    n={fila.total.n}
                    alerta={alerta}
                    ariaLabel={`${nombre}, Total: ${fila.total.n}`}
                    onClick={() =>
                      onOpen(abrirCelda(nombre, "Total", fila.total))
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TablaTipo({
  filas,
  onOpen,
}: {
  filas: {
    nombre: string;
    fila: FilaTipo;
    alerta?: boolean;
  }[];
  onOpen: OpenFn;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="py-2 pr-3 font-medium"> </th>
            {TIPOS_PROBLEMA.map((tipo) => (
              <th key={tipo} className="px-1 py-2 text-center font-medium">
                {TIPO_PROBLEMA_LABEL[tipo]}
              </th>
            ))}
            <th className="px-1 py-2 text-center font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(({ nombre, fila, alerta }) => {
            const labelRojo = Boolean(alerta && fila.total.n > 0);
            return (
              <tr key={nombre} className="border-b border-zinc-100 last:border-0">
                <td className="py-2 pr-3 align-middle">
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      labelRojo ? "font-medium text-[#c8102e]" : "text-zinc-800",
                    )}
                  >
                    {nombre}
                  </p>
                  <BarraSegmentadaTipo
                    desglose={desgloseDeFilaTipo(fila)}
                    className="mt-1.5 max-w-[220px]"
                  />
                </td>
                {TIPOS_PROBLEMA.map((tipo) => (
                  <td key={tipo} className="px-1 py-1 text-center">
                    <NumeroClicable
                      n={fila[tipo].n}
                      alerta={alerta}
                      ariaLabel={`${nombre}, ${TIPO_PROBLEMA_LABEL[tipo]}: ${fila[tipo].n}`}
                      onClick={() =>
                        onOpen(
                          abrirCelda(
                            nombre,
                            TIPO_PROBLEMA_LABEL[tipo],
                            fila[tipo],
                          ),
                        )
                      }
                    />
                  </td>
                ))}
                <td className="px-1 py-1 text-center">
                  <NumeroClicable
                    n={fila.total.n}
                    alerta={alerta}
                    ariaLabel={`${nombre}, Total: ${fila.total.n}`}
                    onClick={() =>
                      onOpen(abrirCelda(nombre, "Total", fila.total))
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BarraEstado({ n, total, color }: { n: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((n / total) * 100);
  return (
    <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-zinc-200">
      <div
        className={cn("h-full rounded-full", color)}
        style={{ width: `${pct}%` }}
        aria-hidden
      />
    </div>
  );
}

const ESTADO_DOT_PROVEEDOR: Record<string, string> = {
  sin_empezar: "bg-sky-500",
  en_proceso: "bg-amber-500",
  ejecutado_pendiente_entrega: "bg-orange-500",
  entregado: "bg-emerald-500",
  sin_estado: "bg-[#c8102e]",
};

const ESTADO_DOT_MAESTROS: Record<string, string> = {
  sin_empezar: "bg-violet-500",
  en_proceso: "bg-amber-500",
  ejecutado_pendiente_entrega: "bg-orange-500",
  entregado: "bg-emerald-500",
  sin_estado: "bg-[#c8102e]",
};

const ESTADO_BAR_PROVEEDOR: Record<string, string> = {
  sin_empezar: "bg-sky-500",
  en_proceso: "bg-amber-500",
  ejecutado_pendiente_entrega: "bg-orange-500",
  entregado: "bg-emerald-500",
  sin_estado: "bg-[#c8102e]",
};

const ESTADO_BAR_MAESTROS: Record<string, string> = {
  sin_empezar: "bg-violet-500",
  en_proceso: "bg-amber-500",
  ejecutado_pendiente_entrega: "bg-orange-500",
  entregado: "bg-emerald-500",
  sin_estado: "bg-[#c8102e]",
};

function ListaEstados({
  items,
  total,
  categoria,
  onOpen,
  dots,
  bars,
}: {
  items: {
    key: string;
    label: string;
    celda: CeldaFaltante;
    alerta?: boolean;
  }[];
  total: number;
  categoria: string;
  onOpen: OpenFn;
  dots: Record<string, string>;
  bars: Record<string, string>;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map(({ key, label, celda, alerta }) => {
        const labelRojo = Boolean(alerta && celda.n > 0);
        return (
          <li key={key} className="flex items-center gap-3">
            <span
              className={cn("size-2.5 shrink-0 rounded-full", dots[key])}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm leading-snug",
                  labelRojo ? "font-medium text-[#c8102e]" : null,
                )}
              >
                {label}
              </p>
              <BarraEstado
                n={celda.n}
                total={total}
                color={bars[key] ?? "bg-zinc-400"}
              />
            </div>
            <NumeroClicable
              n={celda.n}
              alerta={alerta}
              ariaLabel={`${label}: ${celda.n}`}
              onClick={() => onOpen(abrirCelda(label, categoria, celda))}
            />
          </li>
        );
      })}
    </ul>
  );
}

function TarjetaSeccion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 md:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

type DashboardFaltantesVistaProps = {
  data: DashboardFaltantes;
  onOpen: OpenFn;
};

export function DashboardFaltantesVista({
  data,
  onOpen,
}: DashboardFaltantesVistaProps) {
  const { heros, s1, s2, s3, s4a, s4b } = data;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Cifras en negativo: lo que falta. Haz clic en un número para ver las
        fichas.
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <article className="rounded-xl bg-[#18181b] p-4 text-white md:p-5">
          <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">
            Proyectos-Filtraciones
          </p>
          <NumeroClicable
            n={heros.proyectos.n}
            grande
            className="mt-2 text-white hover:text-white"
            ariaLabel={`Proyectos-Filtraciones: ${heros.proyectos.n}`}
            onClick={() =>
              onOpen(
                abrirCelda(
                  "Proyectos-Filtraciones",
                  "Todos",
                  heros.proyectos,
                ),
              )
            }
          />
          <p className="mt-1 text-sm text-white/70">recintos + sectores comunes</p>
          <BarraSegmentadaGravedad
            desglose={heros.desgloseProyectos}
            className="mt-4"
            altura="h-2"
          />
          <ChipsGravedad
            desglose={heros.desgloseProyectos}
            invertido
            className="mt-3"
          />
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Subproyectos
          </p>
          <NumeroClicable
            n={heros.subproyectos.n}
            grande
            className="mt-2 text-zinc-900"
            ariaLabel={`Subproyectos: ${heros.subproyectos.n}`}
            onClick={() =>
              onOpen(abrirCelda("Subproyectos", "Todos", heros.subproyectos))
            }
          />
          <p className="mt-1 text-sm text-muted-foreground">
            descripción y planes de acción
          </p>
          <BarraSegmentadaTipo
            desglose={heros.desgloseSubproyectos}
            className="mt-4"
            altura="h-2"
          />
          <div className="mt-3 flex flex-wrap gap-1">
            {TIPOS_PROBLEMA.map((tipo) => (
              <ChipTipo
                key={tipo}
                tipo={tipo}
                n={heros.desgloseSubproyectos[tipo]}
              />
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Sin asignar
          </p>
          <NumeroClicable
            n={heros.sinAsignar.n}
            grande
            alerta
            className="mt-2"
            ariaLabel={`Sin asignar: ${heros.sinAsignar.n}`}
            onClick={() =>
              onOpen(
                abrirCelda("Sin asignar", "Subproyectos", heros.sinAsignar),
              )
            }
          />
          <p className="mt-1 text-sm text-muted-foreground">
            de {heros.totalSubproyectos} subproyectos
          </p>
          <div className="mt-4 flex h-2 w-full gap-0.5">
            {heros.totalSubproyectos === 0 ? (
              <div className="h-2 w-full rounded-full bg-zinc-200" aria-hidden />
            ) : (
              <>
                {heros.sinAsignar.n > 0 ? (
                  <div
                    className="rounded-full bg-[#c8102e]"
                    style={{ flex: heros.sinAsignar.n }}
                    aria-hidden
                  />
                ) : null}
                {heros.totalSubproyectos - heros.sinAsignar.n > 0 ? (
                  <div
                    className="rounded-full bg-zinc-200"
                    style={{
                      flex: heros.totalSubproyectos - heros.sinAsignar.n,
                    }}
                    aria-hidden
                  />
                ) : null}
              </>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-800">
              Proveedor externo {heros.proveedorN}
            </span>
            <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[11px] font-medium text-violet-800">
              Maestros Bodetek {heros.maestrosN}
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4 md:p-5">
          <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
            Sin fotos después
          </p>
          <NumeroClicable
            n={heros.sinFotosDespues.n}
            grande
            alerta
            className="mt-2"
            ariaLabel={`Sin fotos después: ${heros.sinFotosDespues.n}`}
            onClick={() =>
              onOpen(
                abrirCelda(
                  "Sin fotos después",
                  "Proyectos-Filtraciones",
                  heros.sinFotosDespues,
                ),
              )
            }
          />
          <p className="mt-1 text-sm text-muted-foreground">
            de {heros.totalProyectos} proyectos filtraciones
          </p>
          <BarraSegmentadaGravedad
            desglose={heros.desgloseSinFotosDespues}
            pista="clara"
            className="mt-4"
            altura="h-2"
          />
          <ChipsGravedad
            desglose={heros.desgloseSinFotosDespues}
            className="mt-3"
          />
        </article>
      </div>

      <TarjetaSeccion>
        <h2 className="text-base font-semibold">
          Datos generales &apos;Proyectos-Filtraciones&apos; (Recintos afectados +
          sectores comunes)
        </h2>
        <div className="mt-3">
          <TablaGravedad
            onOpen={onOpen}
            filas={[
              { nombre: "Cantidad de proyectos filtraciones", fila: s1.cantidad },
              {
                nombre: "Sin fotos de antes",
                fila: s1.sinFotosAntes,
                alerta: true,
              },
              {
                nombre: "Sin fotos después",
                fila: s1.sinFotosDespues,
                alerta: true,
              },
              {
                nombre: "Sin plano con marcas (Donde cayó agua)",
                fila: s1.sinPlanoAgua,
                alerta: true,
              },
              {
                nombre: "Sin plano con marcas (Donde hay que reparar)",
                fila: s1.sinPlanoReparacion,
                alerta: true,
              },
              {
                nombre: "Ejecutadas 100% por proveedor externo",
                fila: s1.cienProveedor,
              },
              {
                nombre: "Ejecutadas 100% por maestros Bodetek",
                fila: s1.cienMaestros,
              },
              {
                nombre: "Mix proveedor externo + maestros Bodetek",
                fila: s1.mix,
              },
            ]}
          />
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion>
        <h2 className="text-base font-semibold">
          Datos generales &apos;Subproyectos (Descripción y planes de acción)&apos;
        </h2>
        <div className="mt-3">
          <TablaTipo
            onOpen={onOpen}
            filas={[
              { nombre: "Cantidad de subproyectos", fila: s2.cantidad },
              { nombre: "Sin asignar", fila: s2.sinAsignar, alerta: true },
              {
                nombre: "Ejecutados por proveedores externos",
                fila: s2.proveedor,
              },
              {
                nombre: "Ejecutados por maestros Bodetek",
                fila: s2.maestros,
              },
            ]}
          />
        </div>
      </TarjetaSeccion>

      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">
          Completitud &apos;Subproyectos&apos; (Textos)
        </h2>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <article className="rounded-xl bg-[#18181b] p-5 text-white">
          <p className="text-sm text-white/70">Total subproyectos</p>
          <NumeroClicable
            n={s3.totalSub.n}
            grande
            className="mt-1 text-white hover:text-white"
            ariaLabel={`Total subproyectos: ${s3.totalSub.n}`}
            onClick={() =>
              onOpen(
                abrirCelda(
                  "Total subproyectos",
                  "Base de cálculo",
                  s3.totalSub,
                ),
              )
            }
          />
          <p className="mt-3 text-sm text-white/60">
            Base de cálculo de la completitud de textos
          </p>
        </article>
        <TarjetaSeccion>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Campo</th>
                  <th className="px-1 py-2 text-center font-medium">
                    Texto anotado
                  </th>
                  <th className="px-1 py-2 text-center font-medium">
                    Falta llenar
                  </th>
                  <th className="px-1 py-2 text-center font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    {
                      nombre: "Descripción del problema",
                      fila: s3.descripcion,
                    },
                    { nombre: "Plan de acción", fila: s3.plan },
                  ] as const
                ).map(({ nombre, fila }) => (
                  <tr
                    key={nombre}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="py-2 pr-3 align-middle">
                      <p className="text-sm">{nombre}</p>
                      <BarraDosSegmentos
                        izquierda={fila.anotado.n}
                        derecha={fila.falta.n}
                        classIzq="bg-emerald-500"
                        classDer="bg-[#c8102e]"
                      />
                    </td>
                    <td className="px-1 py-1 text-center">
                      <NumeroClicable
                        n={fila.anotado.n}
                        ariaLabel={`${nombre}, Texto anotado: ${fila.anotado.n}`}
                        onClick={() =>
                          onOpen(
                            abrirCelda(nombre, "Texto anotado", fila.anotado),
                          )
                        }
                      />
                    </td>
                    <td className="px-1 py-1 text-center">
                      <NumeroClicable
                        n={fila.falta.n}
                        alerta
                        ariaLabel={`${nombre}, Falta llenar: ${fila.falta.n}`}
                        onClick={() =>
                          onOpen(
                            abrirCelda(nombre, "Falta llenar", fila.falta),
                          )
                        }
                      />
                    </td>
                    <td className="px-1 py-1 text-center">
                      <NumeroClicable
                        n={fila.total.n}
                        ariaLabel={`${nombre}, Total: ${fila.total.n}`}
                        onClick={() =>
                          onOpen(abrirCelda(nombre, "Total", fila.total))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TarjetaSeccion>
        </div>
      </div>

      <TarjetaSeccion>
        <h2 className="text-base font-semibold">
          Info subproyectos &apos;Ejecutados por proveedor externo&apos;
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-700">
              4.1.- Datos generales
            </h3>
            <div className="mt-2">
              <TablaGravedad
                onOpen={onOpen}
                filas={[
                  {
                    nombre: "Total ejecutados por proveedor externo",
                    fila: s4a.total,
                  },
                  {
                    nombre: "Sin cotización adjunta (O factura)",
                    fila: s4a.sinCotizacion,
                    alerta: true,
                  },
                  {
                    nombre: "Sin valor recinto",
                    fila: s4a.sinValorRecinto,
                    alerta: true,
                  },
                  {
                    nombre: "Sin valor total",
                    fila: s4a.sinValorTotal,
                    alerta: true,
                  },
                ]}
              />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-700">
              4.2.- Estados de los &apos;Ejecutados por proveedor externo&apos;
            </h3>
            <div className="mt-3">
              <ListaEstados
                categoria="Proveedor externo"
                total={s4a.total.total.n}
                onOpen={onOpen}
                dots={ESTADO_DOT_PROVEEDOR}
                bars={ESTADO_BAR_PROVEEDOR}
                items={ESTADOS_S4_PROVEEDOR.map((e) => ({
                  key: e.key,
                  label: e.label,
                  celda: s4a.estados[e.key],
                  alerta: e.alerta,
                }))}
              />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Total de subproyectos ejecutados por proveedor externo:{" "}
              <NumeroClicable
                n={s4a.total.total.n}
                className="inline-flex align-middle text-sm"
                ariaLabel={`Total ejecutados por proveedor externo: ${s4a.total.total.n}`}
                onClick={() =>
                  onOpen(
                    abrirCelda(
                      "Total ejecutados por proveedor externo",
                      "Total",
                      s4a.total.total,
                    ),
                  )
                }
              />
            </p>
          </div>
        </div>
      </TarjetaSeccion>

      <TarjetaSeccion>
        <h2 className="text-base font-semibold">
          Info subproyectos &apos;Ejecutados por maestros Bodetek&apos;
        </h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-700">
              4.1.- Datos generales
            </h3>
            <div className="mt-2">
              <TablaGravedad
                onOpen={onOpen}
                filas={[
                  {
                    nombre: "Total ejecutados por maestros Bodetek",
                    fila: s4b.total,
                  },
                ]}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-zinc-200 p-3">
                <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                  Con &apos;Cantidad de horas trabajadas&apos; anotadas
                </p>
                <NumeroClicable
                  n={s4b.conHoras.n}
                  grande
                  className="mt-1 text-[32px] text-zinc-900 md:text-[34px]"
                  ariaLabel={`Con horas trabajadas anotadas: ${s4b.conHoras.n}`}
                  onClick={() =>
                    onOpen(
                      abrirCelda(
                        "Con 'Cantidad de horas trabajadas' anotadas",
                        "Maestros Bodetek",
                        s4b.conHoras,
                      ),
                    )
                  }
                />
                <p className="text-sm text-muted-foreground">
                  de {s4b.totalMaestros} subproyectos Bodetek
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 p-3">
                <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                  Horas de trabajo
                </p>
                <p className="mt-2 text-[32px] font-semibold tabular-nums leading-none text-zinc-900 md:text-[34px]">
                  {formatHoras(s4b.horasTrabajo)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  horas hombre acumuladas
                </p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-700">
              4.2.- Estados de los &apos;Ejecutados por maestros Bodetek&apos;
            </h3>
            <div className="mt-3">
              <ListaEstados
                categoria="Maestros Bodetek"
                total={s4b.total.total.n}
                onOpen={onOpen}
                dots={ESTADO_DOT_MAESTROS}
                bars={ESTADO_BAR_MAESTROS}
                items={ESTADOS_S4_MAESTROS.map((e) => ({
                  key: e.key,
                  label: e.label,
                  celda: s4b.estados[e.key],
                  alerta: e.alerta,
                }))}
              />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Total de subproyectos ejecutados por maestros Bodetek:{" "}
              <NumeroClicable
                n={s4b.total.total.n}
                className="inline-flex align-middle text-sm"
                ariaLabel={`Total ejecutados por maestros Bodetek: ${s4b.total.total.n}`}
                onClick={() =>
                  onOpen(
                    abrirCelda(
                      "Total ejecutados por maestros Bodetek",
                      "Total",
                      s4b.total.total,
                    ),
                  )
                }
              />
            </p>
          </div>
        </div>
      </TarjetaSeccion>
    </div>
  );
}
