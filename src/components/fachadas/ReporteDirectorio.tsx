"use client";

import Image from "next/image";
import Link from "next/link";
import { HintMdeN } from "@/components/fachadas/HintMdeN";
import { EtiquetaM2 } from "@/components/fachadas/EtiquetaM2";
import { agregarIndicadores, esCompletaParaCostos, FILTRO_DASHBOARD_VACIO, superficieDashboard, tieneSuperficieM2, TIPO_INTERVENCION_FACHADA_LABEL } from "@/lib/fachadas/indicadores";
import { formatSuperficieEnteraCl } from "@/lib/fachadas/formato";
import {
  conteosEstado,
  listadoAIndicadores,
  quienEjecuto,
  trabajosRealizados,
} from "@/lib/fachadas/dashboard";
import {
  COLOR_TIPO,
  formatMesCortoCl,
  formatMillonesClp,
  LETRA_TIPO,
} from "@/lib/fachadas/ui";
import { hoyIsoChile } from "@/lib/fachadas/ficha";
import { formatMontoClp, subtipoHref } from "@/lib/trabajos";
import { cn } from "@/lib/utils";
import "./fachadas.css";
import type { FachadaListadoItem, PortadaIntervencion } from "@/lib/fachadas/tipos";
import type { IntervencionIndicadores } from "@/lib/fachadas/indicadores";

const MESES_TIT = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

export function ReporteDirectorio({
  categoriaId,
  subtipoId,
  fachadas,
  intervenciones,
  portadas,
  modoDemo = false,
  hoy: hoyProp,
}: {
  categoriaId: string;
  subtipoId: string;
  fachadas: FachadaListadoItem[];
  intervenciones: IntervencionIndicadores[];
  portadas: PortadaIntervencion[];
  modoDemo?: boolean;
  hoy?: string;
}) {
  const anio = hoyProp ? Number(hoyProp.slice(0, 4)) : new Date().getFullYear();
  const hoy = hoyProp ?? hoyIsoChile();
  const filtro = {
    ...FILTRO_DASHBOARD_VACIO,
    fechaDesde: `${anio}-01-01`,
    fechaHasta: hoy,
  };
  const ints = intervenciones.filter((i) => {
    const fechas = [i.fechaInicio, i.fechaTermino].filter(Boolean) as string[];
    if (fechas.length === 0) return false;
    return fechas.some((f) => f >= filtro.fechaDesde! && f <= filtro.fechaHasta!);
  });
  const dash = agregarIndicadores(ints);
  const superficie = superficieDashboard(
    fachadas.map(listadoAIndicadores),
    ints,
    filtro,
  );
  const estados = conteosEstado(fachadas, intervenciones, hoy);
  const trabajos = trabajosRealizados(ints.filter(esCompletaParaCostos));
  const quien = quienEjecuto(ints.filter(esCompletaParaCostos));
  const portadaPorInt = new Map(portadas.map((p) => [p.intervencionId, p]));
  const galeria = ints
    .filter((i) => i.estado === "terminada")
    .filter((i) => {
      const p = portadaPorInt.get(i.id);
      return Boolean(p?.antesUrl && p?.despuesUrl);
    })
    .slice()
    .sort((a, b) =>
      (b.fechaTermino || b.fechaInicio || "").localeCompare(
        a.fechaTermino || a.fechaInicio || "",
      ),
    );
  const netoCostoM2 = agregarIndicadores(
    ints.filter((i) => {
      const f = fachadas.find((x) => x.id === i.fachadaId);
      return tieneSuperficieM2(f?.superficieM2);
    }),
  ).costos.totalNeto;
  const costoM2 =
    superficie.m2Intervenidos > 0 && netoCostoM2 > 0
      ? Math.round(netoCostoM2 / superficie.m2Intervenidos)
      : null;
  const mesHasta = MESES_TIT[new Date(`${hoy}T00:00:00`).getMonth()] ?? "";
  const periodo = `ENE – ${mesHasta} ${anio}`;

  return (
    <div className="fachadas-scope min-h-full bg-white px-8 py-8">
      {!modoDemo ? (
      <div className="fachadas-print-hide mb-6 flex justify-end gap-2">
        <Link
          href={subtipoHref(categoriaId, subtipoId)}
          className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium"
        >
          Volver a Fachadas
        </Link>
        <button
          type="button"
          className="fd-btn-primary h-10 px-4 text-sm"
          onClick={() => window.print()}
        >
          Imprimir / PDF
        </button>
      </div>
      ) : null}

      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <div>
          <div className="flex items-center">
            <Image
              src="/logo-bodetek.png"
              alt="Bodetek"
              width={148}
              height={36}
              className="h-8 w-auto"
            />
          </div>
          <p className="fd-kicker mt-6">Informe al directorio · {periodo}</p>
          <h1 className="fd-title mt-2 text-[2.4rem] leading-[1.05]">
            Mantención de fachadas
          </h1>
          <p className="mt-6 fd-kpi-value">
            {estados.intervenidas}{" "}
            <span className="text-lg font-medium text-muted-foreground">
              de {estados.total} fachadas intervenidas
            </span>
          </p>
          <div className="fd-progress mt-2 max-w-xs">
            <span
              style={{
                width: `${estados.total ? (estados.intervenidas / estados.total) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="fd-hint mt-2">
            {estados.al_dia} al día · {estados.en_ejecucion} en ejecución ·{" "}
            {estados.pendientes} pendientes
          </p>

          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <p className="fd-kpi-label">Inversión neta</p>
              <p className="fd-kpi-value">{formatMillonesClp(dash.costos.totalNeto)}</p>
              <p className="fd-hint">
                Materiales {formatMillonesClp(dash.costos.materialesNeto)}
              </p>
            </div>
            <div>
              <p className="fd-kpi-label">Superficie</p>
              {superficie.cobertura.m === 0 ? (
                <>
                  <p className="fd-kpi-value">
                    <EtiquetaM2 m2={null} />
                  </p>
                  <HintMdeN
                    className="mt-1"
                    m={superficie.cobertura.m}
                    n={superficie.cobertura.n}
                  />
                </>
              ) : (
                <>
                  <p className="fd-kpi-value">
                    {formatSuperficieEnteraCl(superficie.m2Intervenidos)} m²
                  </p>
                  <p className="fd-hint">
                    de {formatSuperficieEnteraCl(superficie.m2Totales)} m² · quedan{" "}
                    {formatSuperficieEnteraCl(superficie.m2Restantes)}
                  </p>
                  {superficie.cobertura.m < superficie.cobertura.n ? (
                    <HintMdeN
                      className="mt-1"
                      m={superficie.cobertura.m}
                      n={superficie.cobertura.n}
                    />
                  ) : null}
                </>
              )}
            </div>
            <div>
              <p className="fd-kpi-label">Costo neto / m²</p>
              <p className="fd-kpi-value">
                {costoM2 != null ? formatMontoClp(costoM2) : "—"}
              </p>
              {superficie.cobertura.m < superficie.cobertura.n ? (
                <HintMdeN
                  className="mt-1"
                  m={superficie.cobertura.m}
                  n={superficie.cobertura.n}
                />
              ) : null}
            </div>
            <div>
              <p className="fd-kpi-label">Hecho en casa</p>
              <p className="fd-kpi-value">
                {quien.maestrosFachadas}{" "}
                <span className="text-lg font-medium text-muted-foreground">
                  de {quien.intervenidas || estados.intervenidas}
                </span>
              </p>
            </div>
          </div>

          <ul className="mt-8 space-y-2 text-sm">
            {trabajos.map((t) => (
              <li key={t.key} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <span className={cn("fd-letter", COLOR_TIPO[t.key].letter)}>
                    {LETRA_TIPO[t.key]}
                  </span>
                  {t.key === "hojalateria"
                    ? "Hojalatería"
                    : TIPO_INTERVENCION_FACHADA_LABEL[t.key]}{" "}
                  <span className="text-muted-foreground">
                    {t.fachadasN} fach.
                    {t.key !== "hojalateria" ? ` · ${t.dias} días` : ""}
                  </span>
                </span>
                <span className="font-semibold">{formatMillonesClp(t.neto)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {galeria.length === 0 ? (
            <p className="fd-hint col-span-2">
              Aún no hay intervenciones terminadas con portada de antes y después.
            </p>
          ) : (
            galeria.map((u) => {
              const f = fachadas.find((x) => x.id === u.fachadaId);
              const p = portadaPorInt.get(u.id);
              const tipos = u.tipos.filter((t) => t.dias > 0).map((t) => t.tipo);
              return (
                <article key={u.id}>
                  <div className="grid grid-cols-2 overflow-hidden rounded-lg">
                    <div className="relative aspect-[4/5] bg-[#eceae7]">
                      {p?.antesUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.antesUrl}
                          alt="Antes"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      <span className="fd-badge-antes">Antes</span>
                    </div>
                    <div className="relative aspect-[4/5] bg-[#eceae7]">
                      {p?.despuesUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.despuesUrl}
                          alt="Después"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      <span className="fd-badge-despues">
                        Después · {formatMesCortoCl(u.fechaTermino || u.fechaInicio)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold">
                      {f?.nombre ?? "Fachada"}
                      <span className="ml-1 inline-flex gap-0.5 align-middle">
                        {tipos.map((t) => (
                          <span
                            key={t}
                            className={cn("fd-letter", COLOR_TIPO[t].letter)}
                          >
                            {LETRA_TIPO[t]}
                          </span>
                        ))}
                        {u.requiereHojalateria ? (
                          <span className={cn("fd-letter", COLOR_TIPO.hojalateria.letter)}>
                            H
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {formatMesCortoCl(u.fechaTermino || u.fechaInicio)}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <footer className="mx-auto mt-10 flex max-w-5xl justify-between gap-4 text-xs text-muted-foreground">
        <p>
          Bodetek · {fachadas.length} fachadas
        </p>
        <p>
          {modoDemo
            ? "Datos de ejemplo · se genera desde la sección Fachadas"
            : "Se genera desde la sección Fachadas"}
        </p>
      </footer>
    </div>
  );
}
