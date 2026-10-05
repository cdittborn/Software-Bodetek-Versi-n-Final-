"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertaFaltantesInforme } from "@/components/informe-seguro/AlertaFaltantesInforme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listarFaltantes } from "@/lib/informe-seguro/faltantes";
import { formatHorasCl, parseHorasHombre } from "@/lib/informe-seguro/formato";
import type { FuenteMedia, FuenteProyecto } from "@/lib/informe-seguro/fuente";
import type { ResultadoPersistir, VersionLista } from "@/lib/informe-seguro/resultado";
import {
  EJECUTOR_INFORME_LABEL,
  armarSnapshot,
  type BorradorInforme,
  type EncabezadoInforme,
  type SeleccionMedia,
} from "@/lib/informe-seguro/snapshot";
import { eventoDashboardHref, trabajoHref } from "@/lib/trabajos";
import { TIPO_PROBLEMA_LABEL, type TipoProblema } from "@/lib/filtracion/problemas";

type EditorInformeSeguroProps = {
  fuente: FuenteProyecto[];
  inicial: BorradorInforme;
  previews: Record<string, string>;
  versiones: VersionLista[];
  tokenActivo: boolean;
  linkPath: string | null;
  tieneInforme: boolean;
  categoriaId: string;
  subtipoId: string;
  eventoId: string;
  modoDemo?: boolean;
  onGuardar: (
    borrador: BorradorInforme,
    publicar: boolean,
    confirmarFaltantes: boolean,
  ) => Promise<ResultadoPersistir>;
  onDesactivar: () => Promise<ResultadoPersistir>;
  onRegenerar: () => Promise<ResultadoPersistir>;
};

function fechaInput(value: string | null): string {
  return value ?? "";
}

function fechaValor(value: string): string | null {
  return value.trim() ? value : null;
}

export function EditorInformeSeguro({
  fuente,
  inicial,
  previews,
  versiones,
  tokenActivo,
  linkPath,
  tieneInforme,
  categoriaId,
  subtipoId,
  eventoId,
  modoDemo = false,
  onGuardar,
  onDesactivar,
  onRegenerar,
}: EditorInformeSeguroProps) {
  const router = useRouter();
  const [borrador, setBorrador] = useState(inicial);
  const [activo, setActivo] = useState(tokenActivo);
  const [link, setLink] = useState(linkPath);
  const [historial, setHistorial] = useState(versiones);
  const [mensaje, setMensaje] = useState<string | null>(
    modoDemo ? "Vista de ejemplo. No escribe en la base ni publica un link." : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});

  const snapshot = useMemo(() => armarSnapshot(fuente, borrador), [fuente, borrador]);
  const faltantes = useMemo(
    () => listarFaltantes(fuente, borrador),
    [fuente, borrador],
  );

  function patchEncabezado(parcial: Partial<EncabezadoInforme>) {
    setBorrador((prev) => ({
      ...prev,
      encabezado: { ...prev.encabezado, ...parcial },
    }));
  }

  function patchRecinto(trabajoId: string, parcial: { incluido?: boolean; descripcionSeguro?: string }) {
    setBorrador((prev) => ({
      ...prev,
      recintos: prev.recintos.map((r) =>
        r.trabajoId === trabajoId ? { ...r, ...parcial } : r,
      ),
    }));
  }

  function patchSub(
    trabajoId: string,
    tipo: TipoProblema,
    parcial: { incluido?: boolean; descripcionSeguro?: string },
  ) {
    setBorrador((prev) => ({
      ...prev,
      subproyectos: prev.subproyectos.map((s) =>
        s.trabajoId === trabajoId && s.tipo === tipo ? { ...s, ...parcial } : s,
      ),
    }));
  }

  function patchMedia(id: string, parcial: Partial<SeleccionMedia>) {
    setBorrador((prev) => ({
      ...prev,
      media: prev.media.map((m) => (m.trabajoMediaId === id ? { ...m, ...parcial } : m)),
    }));
  }

  function mediaDe(items: FuenteMedia[]) {
    return items
      .map((item) => ({
        item,
        sel: borrador.media.find((m) => m.trabajoMediaId === item.id),
      }))
      .filter((row) => row.sel)
      .sort((a, b) => (a.sel!.orden - b.sel!.orden) || a.item.id.localeCompare(b.item.id));
  }

  function mover(items: FuenteMedia[], id: string, direccion: -1 | 1) {
    const ordenados = mediaDe(items);
    const index = ordenados.findIndex((row) => row.item.id === id);
    const vecino = ordenados[index + direccion];
    const actual = ordenados[index];
    if (!vecino || !actual?.sel || !vecino.sel) return;
    const ordenActual = actual.sel.orden;
    const ordenVecino = vecino.sel.orden;
    setBorrador((prev) => ({
      ...prev,
      media: prev.media.map((m) => {
        if (m.trabajoMediaId === actual.item.id) return { ...m, orden: ordenVecino };
        if (m.trabajoMediaId === vecino.item.id) return { ...m, orden: ordenActual };
        return m;
      }),
    }));
  }

  function portada(items: FuenteMedia[], id: string) {
    const ids = new Set(items.map((m) => m.id));
    setBorrador((prev) => ({
      ...prev,
      media: prev.media.map((m) =>
        ids.has(m.trabajoMediaId) ? { ...m, esPortada: m.trabajoMediaId === id } : m,
      ),
    }));
  }

  async function aplicar(resultado: ResultadoPersistir, publicar: boolean) {
    if (!resultado.ok) {
      if (resultado.requiereConfirmacion) {
        setConfirmar(true);
        return;
      }
      setError(resultado.error ?? "No se pudo guardar.");
      return;
    }
    setConfirmar(false);
    if (resultado.tokenActivo != null) setActivo(resultado.tokenActivo);
    if ("linkPath" in resultado) setLink(resultado.linkPath ?? null);
    if (modoDemo) {
      setMensaje(publicar ? "Demo: la versión no se publicó." : "Demo: el borrador no se guardó.");
      return;
    }
    if (publicar) {
      setHistorial((prev) => [
        {
          numero: (prev[0]?.numero ?? 0) + 1,
          publicadoAt: new Date().toISOString(),
          publicadoPor: "Tú",
        },
        ...prev,
      ]);
    }
    setMensaje(publicar ? "Versión publicada. El link muestra esta copia." : "Borrador guardado.");
    router.refresh();
  }

  async function guardar(publicar: boolean, confirmarFaltantes: boolean) {
    setError(null);
    setOcupado(true);
    try {
      if (publicar && !confirmarFaltantes && faltantes.total > 0) {
        setConfirmar(true);
        return;
      }
      const resultado = await onGuardar(borrador, publicar, confirmarFaltantes);
      await aplicar(resultado, publicar);
    } finally {
      setOcupado(false);
    }
  }

  const e = borrador.encabezado;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-muted-foreground">
          <Link href={eventoDashboardHref(categoriaId, subtipoId, eventoId)} className="hover:underline">
            Dashboard general
          </Link>
          {" / Informe para seguro"}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Informe para seguro</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Los textos de esta pantalla son solo para el seguro. Las notas de la ficha no se copian.
          Las horas se leen del registro existente: para cambiarlas, ábrelas en la ficha.
        </p>
      </div>

      {mensaje ? (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          {mensaje}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-[#c8102e] bg-red-50 px-3 py-2 text-sm text-[#a4131f]">
          {error}
        </p>
      ) : null}

      <AlertaFaltantesInforme
        faltantes={faltantes}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
      />

      <section className="grid gap-4 rounded-xl border border-zinc-200 p-4 sm:grid-cols-2">
        <Campo label="Nombre del informe" className="sm:col-span-2">
          <Input className="h-11" value={e.nombre} onChange={(ev) => patchEncabezado({ nombre: ev.target.value })} />
        </Campo>
        <Campo label="Evento">
          <Input className="h-11" value={e.nombreEvento} onChange={(ev) => patchEncabezado({ nombreEvento: ev.target.value })} />
        </Campo>
        <Campo label="Fecha del evento">
          <Input className="h-11" type="date" value={fechaInput(e.fechaEvento)} onChange={(ev) => patchEncabezado({ fechaEvento: fechaValor(ev.target.value) })} />
        </Campo>
        <Campo label="Dirección del centro" className="sm:col-span-2">
          <Input className="h-11" value={e.direccionCentro} onChange={(ev) => patchEncabezado({ direccionCentro: ev.target.value })} />
        </Campo>
        <Campo label="N° de siniestro">
          <Input className="h-11" value={e.numeroSiniestro ?? ""} onChange={(ev) => patchEncabezado({ numeroSiniestro: fechaValor(ev.target.value) })} />
        </Campo>
        <Campo label="N° de póliza">
          <Input className="h-11" value={e.numeroPoliza ?? ""} onChange={(ev) => patchEncabezado({ numeroPoliza: fechaValor(ev.target.value) })} />
        </Campo>
        <Campo label="Contacto de Bodetek">
          <Input className="h-11" value={e.contactoBodetek} onChange={(ev) => patchEncabezado({ contactoBodetek: ev.target.value })} />
        </Campo>
        <Campo label="Fecha de emisión">
          <Input className="h-11" type="date" value={fechaInput(e.fechaEmision)} onChange={(ev) => patchEncabezado({ fechaEmision: fechaValor(ev.target.value) })} />
        </Campo>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(
          [
            ["Recintos", String(snapshot.resumen.recintos)],
            ["Subproyectos", String(snapshot.resumen.subproyectos)],
            ["Maestros Bodetek", String(snapshot.resumen.maestros)],
            ["Proveedor externo", String(snapshot.resumen.proveedor)],
            ["Horas de maestros", formatHorasCl(snapshot.resumen.horasMaestros)],
          ] as const
        ).map(([etiqueta, valor]) => (
          <div key={etiqueta} className="rounded-lg border border-zinc-200 px-3 py-2">
            <p className="text-xs text-zinc-500">{etiqueta}</p>
            <p className="text-xl font-semibold tabular-nums">{valor}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-4">
        {fuente.map((proyecto) => {
          const rec = borrador.recintos.find((r) => r.trabajoId === proyecto.trabajoId);
          if (!rec) return null;
          const tieneFalta = faltantes.sinEjecutor.concat(faltantes.sinHoras).some(
            (f) => f.trabajoId === proyecto.trabajoId,
          );
          const sueltas = proyecto.media.filter(
            (m) =>
              m.problemaTipo == null ||
              !proyecto.subproyectos.some((s) => s.tipo === m.problemaTipo),
          );
          const horas = snapshot.recintos.find((r) => r.trabajoId === proyecto.trabajoId)?.horasMaestros ?? 0;
          return (
            <details
              key={proyecto.trabajoId}
              open={abiertos[proyecto.trabajoId] ?? (tieneFalta || fuente.length <= 3)}
              onToggle={(event) => {
                const abierto = event.currentTarget.open;
                setAbiertos((prev) =>
                  prev[proyecto.trabajoId] === abierto
                    ? prev
                    : { ...prev, [proyecto.trabajoId]: abierto },
                );
              }}
              className="rounded-xl border border-zinc-200"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="font-semibold">{proyecto.recintoEtiqueta}</span>
                  <span className="mt-0.5 block text-sm text-zinc-500">
                    {proyecto.codigo} · {proyecto.titulo}
                    {rec.incluido ? "" : " · excluido"}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-zinc-600">{formatHorasCl(horas)} h</span>
              </summary>
              <div className="flex flex-col gap-4 border-t border-zinc-100 px-4 py-4">
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-5"
                    checked={rec.incluido}
                    onChange={(ev) => patchRecinto(proyecto.trabajoId, { incluido: ev.target.checked })}
                  />
                  Incluir este recinto
                </label>
                <Campo label="Descripción para el seguro">
                  <Textarea
                    value={rec.descripcionSeguro}
                    onChange={(ev) => patchRecinto(proyecto.trabajoId, { descripcionSeguro: ev.target.value })}
                  />
                </Campo>
                <GrupoMedia
                  items={sueltas}
                  previews={previews}
                  filas={mediaDe(sueltas)}
                  onIncluir={(id, incluido) => patchMedia(id, { incluido })}
                  onMover={(id, dir) => mover(sueltas, id, dir)}
                  onPortada={(id) => portada(sueltas, id)}
                />
                {proyecto.subproyectos.map((sub) => {
                  const sel = borrador.subproyectos.find(
                    (s) => s.trabajoId === proyecto.trabajoId && s.tipo === sub.tipo,
                  );
                  if (!sel) return null;
                  const fotos = proyecto.media.filter((m) => m.problemaTipo === sub.tipo);
                  const ejecutor =
                    sub.ejecutor === "maestros_bodetek" || sub.ejecutor === "proveedor_externo"
                      ? sub.ejecutor
                      : "sin_ejecutor";
                  return (
                    <div key={sub.tipo} className="rounded-lg border border-zinc-100 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold">{TIPO_PROBLEMA_LABEL[sub.tipo]}</h3>
                        <label className="flex min-h-11 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-5"
                            checked={sel.incluido}
                            onChange={(ev) => patchSub(proyecto.trabajoId, sub.tipo, { incluido: ev.target.checked })}
                          />
                          Incluir
                        </label>
                      </div>
                      <p className="text-sm text-zinc-700">
                        {EJECUTOR_INFORME_LABEL[ejecutor]}
                        {ejecutor === "proveedor_externo" && sub.proveedorNombre
                          ? ` · ${sub.proveedorNombre}`
                          : ""}
                        {ejecutor === "maestros_bodetek"
                          ? ` · ${formatHorasCl(parseHorasHombre(sub.horasTexto))} h`
                          : ""}
                      </p>
                      <Link
                        href={trabajoHref(categoriaId, subtipoId, proyecto.trabajoId)}
                        className="mt-1 inline-flex min-h-11 items-center text-sm text-zinc-700 underline"
                      >
                        {ejecutor === "maestros_bodetek" ? "Editar horas en la ficha" : "Abrir la ficha"}
                      </Link>
                      <div className="mt-3">
                        <Campo label="Descripción para el seguro">
                          <Textarea
                            value={sel.descripcionSeguro}
                            onChange={(ev) =>
                              patchSub(proyecto.trabajoId, sub.tipo, {
                                descripcionSeguro: ev.target.value,
                              })
                            }
                          />
                        </Campo>
                      </div>
                      <GrupoMedia
                        items={fotos}
                        previews={previews}
                        filas={mediaDe(fotos)}
                        onIncluir={(id, incluido) => patchMedia(id, { incluido })}
                        onMover={(id, dir) => mover(fotos, id, dir)}
                        onPortada={(id) => portada(fotos, id)}
                      />
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      <section className="rounded-xl border border-zinc-200 p-4">
        <h2 className="font-semibold">Link público</h2>
        <p className="mt-1 text-sm text-zinc-600">
          {activo && link
            ? "El link muestra la última versión publicada. Los cambios del borrador no se ven hasta volver a publicar."
            : "El link queda inactivo hasta que publiques una versión."}
        </p>
        {activo && link ? (
          <p className="mt-2 break-all text-sm font-medium">{link}</p>
        ) : null}
        <Campo label="Expira el" className="mt-3 max-w-xs">
          <Input
            className="h-11"
            type="date"
            value={fechaInput(borrador.tokenExpira)}
            onChange={(ev) =>
              setBorrador((prev) => ({ ...prev, tokenExpira: fechaValor(ev.target.value) }))
            }
          />
        </Campo>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-[44px]"
            disabled={!activo || !link || ocupado}
            onClick={() => {
              const url = `${window.location.origin}${link}`;
              void navigator.clipboard.writeText(url);
              setMensaje("Link copiado.");
            }}
          >
            Copiar link
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-[44px]"
            disabled={!tieneInforme || !activo || ocupado}
            onClick={() => {
              setOcupado(true);
              void onDesactivar()
                .then((r) => aplicar(r, false))
                .finally(() => setOcupado(false));
            }}
          >
            Desactivar link
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-[44px]"
            disabled={!tieneInforme || ocupado}
            onClick={() => {
              setOcupado(true);
              void onRegenerar()
                .then((r) => aplicar(r, false))
                .finally(() => setOcupado(false));
            }}
          >
            Generar link nuevo
          </Button>
        </div>
        {historial.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-1 text-sm text-zinc-600">
            {historial.map((v) => (
              <li key={v.numero}>
                Versión {v.numero} · {new Date(v.publicadoAt).toLocaleString("es-CL")}
                {v.publicadoPor ? ` · ${v.publicadoPor}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">Todavía no hay versiones publicadas.</p>
        )}
      </section>

      {confirmar ? (
        <section className="rounded-xl border border-[#c8102e] bg-red-50 p-4 text-[#a4131f]">
          <p className="font-semibold">
            Hay {faltantes.total} faltante{faltantes.total === 1 ? "" : "s"}. ¿Publicar igual?
          </p>
          <p className="mt-1 text-sm">
            {faltantes.sinEjecutor.length} sin ejecutor · {faltantes.sinHoras.length} sin horas de maestros.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="h-11 min-h-[44px] bg-[#c8102e] text-white hover:bg-[#a4131f]"
              disabled={ocupado}
              onClick={() => void guardar(true, true)}
            >
              Publicar igual
            </Button>
            <Button type="button" variant="outline" className="h-11 min-h-[44px]" onClick={() => setConfirmar(false)}>
              Volver
            </Button>
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-11 min-h-[44px]"
          disabled={ocupado}
          onClick={() => void guardar(false, false)}
        >
          Guardar borrador
        </Button>
        <Button
          type="button"
          className="h-11 min-h-[44px] bg-[#c8102e] text-white hover:bg-[#a4131f]"
          disabled={ocupado}
          onClick={() => void guardar(true, false)}
        >
          Publicar versión
        </Button>
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? ""}>
      <p className="mb-1.5 text-sm font-medium text-zinc-700">{label}</p>
      {children}
    </div>
  );
}

function GrupoMedia({
  items,
  previews,
  filas,
  onIncluir,
  onMover,
  onPortada,
}: {
  items: FuenteMedia[];
  previews: Record<string, string>;
  filas: { item: FuenteMedia; sel: SeleccionMedia | undefined }[];
  onIncluir: (id: string, incluido: boolean) => void;
  onMover: (id: string, direccion: -1 | 1) => void;
  onPortada: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {filas.map(({ item, sel }, index) => {
        if (!sel) return null;
        const src = item.thumbnailKey ? previews[item.thumbnailKey] : previews[item.key];
        return (
          <div key={item.id} className="rounded-lg border border-zinc-200 p-2">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={item.nombre ?? "Archivo"} className="aspect-[4/3] w-full rounded object-cover" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded bg-zinc-100 text-xs text-zinc-500">
                {item.tipoArchivo === "video" ? "▶ Video" : "Foto"}
              </div>
            )}
            <p className="mt-1 truncate text-xs text-zinc-600">{item.nombre ?? item.tipoArchivo}</p>
            <label className="mt-1 flex min-h-11 items-center gap-2 text-xs">
              <input
                type="checkbox"
                className="size-5"
                checked={sel.incluido}
                onChange={(ev) => onIncluir(item.id, ev.target.checked)}
              />
              Incluir
            </label>
            <div className="flex flex-wrap gap-1">
              <button type="button" className="min-h-11 px-2 text-xs underline" disabled={index === 0} onClick={() => onMover(item.id, -1)}>
                Subir
              </button>
              <button type="button" className="min-h-11 px-2 text-xs underline" disabled={index === filas.length - 1} onClick={() => onMover(item.id, 1)}>
                Bajar
              </button>
              {item.tipoArchivo === "foto" ? (
                <button type="button" className="min-h-11 px-2 text-xs underline" onClick={() => onPortada(item.id)}>
                  {sel.esPortada ? "★ Portada" : "Portada"}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
