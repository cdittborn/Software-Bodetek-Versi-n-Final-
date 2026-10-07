"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Eye, Link2, Maximize2, MoreHorizontal, Play } from "lucide-react";
import type { FuenteMedia, FuenteProyecto, MomentoMedia } from "@/lib/informe-seguro/fuente";
import type { ResultadoPersistir } from "@/lib/informe-seguro/resultado";
import type { BorradorInforme } from "@/lib/informe-seguro/snapshot";
import { TIPO_PROBLEMA_LABEL } from "@/lib/filtracion/problemas";
import {
  armarVistaLiquidador,
  AVISO_CAMBIOS_SIN_GUARDAR,
  conteoArchivosRecinto,
  contarMomento,
  mediaSeleccionada,
  puedeValidarRecinto,
  resumenPantalla,
  textoEnInforme,
  textoQuePaso,
} from "@/lib/informe-seguro/vista";

type PantallaInformeSeguroProps = {
  modo: "edicion" | "liquidador";
  controles: boolean;
  fuente: FuenteProyecto[];
  inicial: BorradorInforme;
  urls: Record<string, string>;
  recintoCodigo: string | null;
  onElegirRecinto: (codigo: string) => void;
  onVolverLista: () => void;
  dashboardHref?: string;
  linkPath?: string | null;
  tokenActivo?: boolean;
  onGuardar?: (borrador: BorradorInforme) => Promise<ResultadoPersistir>;
  onActivar?: () => Promise<ResultadoPersistir>;
  onDesactivar?: () => Promise<ResultadoPersistir>;
  onRegenerar?: () => Promise<ResultadoPersistir>;
  onAlternarModo?: () => void;
};

function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}

function firmaBorrador(borrador: BorradorInforme): string {
  return JSON.stringify({
    tokenExpira: borrador.tokenExpira,
    recintos: borrador.recintos.map((r) => [r.trabajoId, r.descripcionValidada]),
    subproyectos: borrador.subproyectos.map((s) => [s.trabajoId, s.tipo, s.descripcionSeguro.trim()]),
    media: borrador.media.map((m) => [m.trabajoMediaId, m.incluido]),
  });
}

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 759px)");
    const aplicar = () => setNarrow(mq.matches);
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, []);
  return narrow;
}

export function PantallaInformeSeguro({
  modo,
  controles,
  fuente,
  inicial,
  urls,
  recintoCodigo,
  onElegirRecinto,
  onVolverLista,
  dashboardHref,
  linkPath = null,
  tokenActivo = false,
  onGuardar,
  onActivar,
  onDesactivar,
  onRegenerar,
  onAlternarModo,
}: PantallaInformeSeguroProps) {
  const narrow = useNarrow();
  const editando = modo === "edicion";
  const [borrador, setBorrador] = useState(inicial);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [copiado, setCopiado] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtroMedia, setFiltroMedia] = useState<Record<string, "todos" | "informe" | "fuera">>({});
  const [baseFirma, setBaseFirma] = useState(() => firmaBorrador(inicial));
  const [ocupado, setOcupado] = useState(false);
  const [mas, setMas] = useState<Record<string, boolean>>({});
  const [visor, setVisor] = useState<{ trabajoId: string; momento: MomentoMedia; index: number } | null>(null);
  const [activo, setActivo] = useState(tokenActivo);
  const [link, setLink] = useState(linkPath);

  useEffect(() => {
    setBorrador(inicial);
    setOverrides({});
    setBaseFirma(firmaBorrador(inicial));
  }, [inicial]);

  useEffect(() => {
    setActivo(tokenActivo);
    setLink(linkPath);
  }, [tokenActivo, linkPath]);

  const sinGuardar = firmaBorrador(borrador) !== baseFirma;
  useEffect(() => {
    if (!controles || !sinGuardar) return;
    const avisar = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = AVISO_CAMBIOS_SIN_GUARDAR;
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [controles, sinGuardar]);

  const vista = useMemo(
    () => (editando ? null : armarVistaLiquidador(fuente, borrador)),
    [editando, fuente, borrador],
  );
  const proyectos = vista?.fuente ?? fuente;
  const borradorVista = vista?.borrador ?? borrador;
  const resumen = useMemo(
    () => resumenPantalla(proyectos, borradorVista),
    [proyectos, borradorVista],
  );
  const encontrado = proyectos.findIndex((p) => p.codigo === recintoCodigo);
  const indice = encontrado >= 0 ? encontrado : !recintoCodigo && proyectos.length > 0 ? 0 : -1;
  const abierto = Boolean(recintoCodigo) && encontrado >= 0;
  const actual = indice >= 0 ? proyectos[indice] ?? null : null;

  function textoDe(trabajoId: string, tipo: string, guardado: string, nota: string): string {
    const key = `${trabajoId}:${tipo}`;
    if (!editando) return guardado.trim();
    if (key in overrides) return overrides[key] ?? "";
    if (textoEnInforme(guardado)) return guardado;
    return textoQuePaso("", nota);
  }

  async function guardar() {
    if (!onGuardar) return null;
    setOcupado(true);
    setError(null);
    try {
      const resultado = await onGuardar(borrador);
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo guardar.");
        return null;
      }
      setBaseFirma(firmaBorrador(borrador));
      setAviso(null);
      if (resultado.linkPath) setLink(resultado.linkPath);
      if (resultado.tokenActivo != null) setActivo(resultado.tokenActivo);
      setMensaje("Cambios guardados.");
      return resultado;
    } finally {
      setOcupado(false);
    }
  }

  async function copiar() {
    setAviso(sinGuardar ? AVISO_CAMBIOS_SIN_GUARDAR : null);
    if (!onActivar) {
      setError("Guarda los cambios antes de copiar el link.");
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      const resultado = await onActivar();
      const path = resultado.linkPath ?? link;
      if (!resultado.ok || !path || typeof window === "undefined") {
        setError(resultado.error ?? "Guarda los cambios antes de copiar el link.");
        return;
      }
      if (resultado.tokenActivo != null) setActivo(resultado.tokenActivo);
      setLink(path);
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } finally {
      setOcupado(false);
    }
  }

  async function ejecutarLink(accion: () => Promise<ResultadoPersistir>) {
    setOcupado(true);
    setError(null);
    try {
      const resultado = await accion();
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo actualizar el link.");
        return;
      }
      if (resultado.tokenActivo != null) setActivo(resultado.tokenActivo);
      if (resultado.linkPath) setLink(resultado.linkPath);
      setMensaje(resultado.tokenActivo ? "Link nuevo generado." : "Link desactivado.");
    } finally {
      setOcupado(false);
    }
  }

  function cambiarTexto(trabajoId: string, tipo: string, valor: string) {
    if (!valor.trim()) {
      quitarTexto(trabajoId, tipo);
      return;
    }
    setOverrides((prev) => ({ ...prev, [`${trabajoId}:${tipo}`]: valor }));
    setBorrador((prev) => ({
      ...prev,
      subproyectos: prev.subproyectos.map((s) =>
        s.trabajoId === trabajoId && s.tipo === tipo ? { ...s, descripcionSeguro: valor } : s,
      ),
      recintos: prev.recintos.map((r) =>
        r.trabajoId === trabajoId ? { ...r, descripcionValidada: false } : r,
      ),
    }));
  }

  function pasarTexto(trabajoId: string, tipo: string, texto: string) {
    const limpio = texto.trim();
    if (!limpio) {
      setError("No hay texto para pasar al informe.");
      return;
    }
    setError(null);
    setOverrides((prev) => ({ ...prev, [`${trabajoId}:${tipo}`]: limpio }));
    setBorrador((prev) => ({
      ...prev,
      subproyectos: prev.subproyectos.map((s) =>
        s.trabajoId === trabajoId && s.tipo === tipo ? { ...s, descripcionSeguro: limpio } : s,
      ),
      recintos: prev.recintos.map((r) =>
        r.trabajoId === trabajoId ? { ...r, descripcionValidada: false } : r,
      ),
    }));
  }

  function quitarTexto(trabajoId: string, tipo: string) {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[`${trabajoId}:${tipo}`];
      return next;
    });
    setBorrador((prev) => ({
      ...prev,
      subproyectos: prev.subproyectos.map((s) =>
        s.trabajoId === trabajoId && s.tipo === tipo ? { ...s, descripcionSeguro: "" } : s,
      ),
      recintos: prev.recintos.map((r) =>
        r.trabajoId === trabajoId ? { ...r, descripcionValidada: false } : r,
      ),
    }));
  }

  function marcarIds(ids: string[], incluido: boolean) {
    const setIds = new Set(ids);
    setBorrador((prev) => ({
      ...prev,
      media: prev.media.map((m) => (setIds.has(m.trabajoMediaId) ? { ...m, incluido } : m)),
    }));
  }

  function alternarMedia(id: string) {
    setBorrador((prev) => ({
      ...prev,
      media: prev.media.map((m) =>
        m.trabajoMediaId === id ? { ...m, incluido: !m.incluido } : m,
      ),
    }));
  }

  const n = proyectos.length;
  const anterior = indice > 0 ? proyectos[indice - 1] : null;
  const siguiente = indice >= 0 && indice < n - 1 ? proyectos[indice + 1] : null;

  return (
    <div className="min-h-full bg-[#F5F5F2] text-[#1A1D21]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 px-4 py-4 pb-12 min-[760px]:gap-6 min-[760px]:px-6 min-[760px]:py-7 min-[760px]:pb-16">
        <div className={abierto ? "max-[759px]:hidden" : undefined}>
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] text-[#5B6169]">
              {dashboardHref ? (
                <Link
                  href={dashboardHref}
                  className="hover:underline"
                  onClick={(event) => {
                    if (!sinGuardar) return;
                    if (!window.confirm(AVISO_CAMBIOS_SIN_GUARDAR)) event.preventDefault();
                  }}
                >
                  Dashboard general
                </Link>
              ) : (
                "Dashboard general"
              )}
              {" / Informe para el seguro"}
            </p>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl leading-tight font-extrabold tracking-tight min-[760px]:text-[30px]">
                  Informe para el seguro
                </h1>
                <p className="text-[17px] font-semibold text-[#3A3F46] min-[760px]:text-xl">
                  Daños por temporal agosto 2026
                </p>
              </div>
              {controles ? (
                <div className="flex w-full flex-col gap-2 min-[760px]:w-auto min-[760px]:flex-1 min-[760px]:flex-row min-[760px]:flex-wrap min-[760px]:justify-end">
                  {onAlternarModo ? (
                    <button
                      type="button"
                      onClick={onAlternarModo}
                      className="inline-flex h-11 min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border px-4 text-sm font-semibold whitespace-nowrap min-[760px]:w-auto"
                      style={
                        modo === "liquidador"
                          ? { borderColor: "#1F4FD1", background: "#E8EEFC", color: "#163A9E" }
                          : { borderColor: "#D5D7D3", background: "#FFFFFF", color: "#1A1D21" }
                      }
                    >
                      <Eye className="size-[18px] shrink-0" aria-hidden />
                      {modo === "liquidador" ? "Volver a editar" : "Ver como liquidador"}
                    </button>
                  ) : null}
                  <div className="flex w-full gap-2 min-[760px]:contents">
                    <button
                      type="button"
                      onClick={() => void copiar()}
                      disabled={ocupado || !onActivar}
                      className="inline-flex h-11 min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-[10px] border border-[#D5D7D3] bg-white px-4 text-sm font-semibold whitespace-nowrap min-[760px]:w-auto min-[760px]:flex-none"
                    >
                      <Link2 className="size-[18px] shrink-0" aria-hidden />
                      {copiado ? "Link copiado" : "Copiar link del liquidador"}
                    </button>
                    <button
                      type="button"
                      aria-label="Más opciones del link"
                      aria-expanded={menu}
                      onClick={() => setMenu((v) => !v)}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-[#D5D7D3] bg-white"
                    >
                      <MoreHorizontal className="size-5" aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void guardar()}
                    disabled={ocupado || !onGuardar || !editando}
                    className="h-11 min-h-11 w-full rounded-[10px] border border-[#1F4FD1] bg-[#1F4FD1] px-4 text-sm font-bold whitespace-nowrap text-white min-[760px]:w-auto"
                  >
                    Guardar cambios
                  </button>
                </div>
              ) : null}
            </div>
            {controles ? (
              <p className="text-[13px] text-[#5B6169]">
                El liquidador ve siempre lo último que guardes. Puedes ir completando el informe de a poco.
              </p>
            ) : null}
            {menu && controles ? (
              <MenuLink
                borrador={borrador}
                tokenActivo={activo}
                ocupado={ocupado}
                onExpira={(fecha) =>
                  setBorrador((prev) => ({ ...prev, tokenExpira: fecha }))
                }
                onDesactivar={() => {
                  if (onDesactivar) void ejecutarLink(onDesactivar);
                }}
                onRegenerar={() => {
                  if (onRegenerar) void ejecutarLink(onRegenerar);
                }}
              />
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-[#E3E4E1] bg-[#E3E4E1] min-[760px]:grid-cols-4">
            <Dato etiqueta="Recintos afectados" valor={String(resumen.recintos)} />
            <Dato
              etiqueta="Descripciones validadas"
              valor={String(resumen.validadas)}
              detalle={`de ${resumen.recintos}`}
            />
            <Dato
              etiqueta="Fotos y videos para el liquidador"
              valor={String(resumen.seleccionados)}
              detalle={`de ${resumen.totalMedia}`}
            />
            <Dato
              etiqueta="Con fotos de después"
              valor={String(resumen.conDespues)}
              detalle={`de ${resumen.recintos}`}
            />
          </div>
        </div>

        {controles && !editando ? (
          <p className="rounded-[10px] bg-[#E8EEFC] px-4 py-3 text-sm font-semibold text-[#163A9E]">
            Así verá el informe el liquidador: sin botones de edición, solo la información.
          </p>
        ) : null}
        {aviso ? <p className="text-sm font-semibold text-[#7A4300]">{aviso}</p> : null}
        {mensaje ? <p className="text-sm text-[#3A3F46]">{mensaje}</p> : null}
        {error ? <p className="text-sm font-semibold text-[#a4131f]">{error}</p> : null}

        <div className="flex flex-col items-start gap-5 min-[760px]:flex-row">
          <aside
            className={`w-full shrink-0 overflow-hidden rounded-[14px] border border-[#E3E4E1] bg-white min-[760px]:w-[320px] ${
              abierto ? "max-[759px]:hidden" : ""
            }`}
          >
            <p className="border-b border-[#E3E4E1] px-4 py-3.5 text-[13px] font-bold tracking-[0.06em] text-[#5B6169] uppercase">
              Recintos ({n})
            </p>
            <div className="min-[760px]:max-h-[860px] min-[760px]:overflow-y-auto">
              {proyectos.map((proyecto, i) => {
                const ok = borrador.recintos.find((r) => r.trabajoId === proyecto.trabajoId)
                  ?.descripcionValidada;
                const conteo = conteoArchivosRecinto(proyecto, borrador);
                const seleccionado = i === indice && !narrow;
                return (
                  <button
                    key={proyecto.trabajoId}
                    type="button"
                    onClick={() => {
                      setError(null);
                      onElegirRecinto(proyecto.codigo);
                    }}
                    className="flex min-h-[60px] w-full items-center justify-between gap-2.5 border-b border-[#EFEFEC] px-4 py-2.5 text-left"
                    style={{ background: seleccionado ? "#E8EEFC" : "#FFFFFF" }}
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-bold">{proyecto.recintoCodigo}</span>
                      <span className="block truncate text-[13px] text-[#5B6169]">
                        {proyecto.arrendatario}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {editando ? (
                        <>
                          <span className="text-xs font-semibold whitespace-nowrap text-[#5B6169]">
                            {conteo.enInforme} de {conteo.total}
                          </span>
                          <span
                            className="rounded-md px-2 py-0.5 text-xs font-bold whitespace-nowrap"
                            style={
                              ok
                                ? { background: "#DDF2E8", color: "#0B5E3E" }
                                : { background: "#FBEBD0", color: "#7A4300" }
                            }
                          >
                            {ok ? "Validada" : "Por validar"}
                          </span>
                        </>
                      ) : null}
                      <ChevronRight className="size-[18px] text-[#5B6169] min-[760px]:hidden" aria-hidden />
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {actual ? (
            <section
              className={`w-full min-w-0 min-[760px]:flex-1 ${abierto ? "" : "max-[759px]:hidden"}`}
            >
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  onVolverLista();
                }}
                className="mb-3 inline-flex h-11 items-center gap-1.5 rounded-[10px] border border-[#D5D7D3] bg-white pr-3.5 pl-2 text-[15px] font-bold min-[760px]:hidden"
              >
                <ChevronLeft className="size-5" aria-hidden />
                Todos los recintos
              </button>
              <Detalle
                proyecto={actual}
                posicion={indice + 1}
                total={n}
                borrador={borradorVista}
                urls={urls}
                editando={editando}
                narrow={narrow}
                mas={mas}
                filtroMedia={filtroMedia}
                textoDe={textoDe}
                onTexto={cambiarTexto}
                onPasar={pasarTexto}
                onQuitar={quitarTexto}
                onValidar={() => {
                  if (!puedeValidarRecinto(borrador, actual.trabajoId)) {
                    setError("Para validar este recinto, pasa al menos un texto al informe.");
                    return;
                  }
                  setError(null);
                  setBorrador((prev) => ({
                    ...prev,
                    recintos: prev.recintos.map((r) =>
                      r.trabajoId === actual.trabajoId
                        ? { ...r, descripcionValidada: true }
                        : r,
                    ),
                  }));
                }}
                onAlternar={alternarMedia}
                onMarcar={marcarIds}
                onFiltro={(clave, valor) =>
                  setFiltroMedia((prev) => ({ ...prev, [clave]: valor }))
                }
                onMas={(clave) => setMas((prev) => ({ ...prev, [clave]: !prev[clave] }))}
                onAbrir={(momento, id) => {
                  const items = (editando
                    ? actual.media
                    : actual.media.filter((m) => mediaSeleccionada(borrador, m.id))
                  ).filter((m) => m.momento === momento);
                  const encontrado = items.findIndex((m) => m.id === id);
                  setVisor({
                    trabajoId: actual.trabajoId,
                    momento,
                    index: encontrado < 0 ? 0 : encontrado,
                  });
                }}
                anterior={anterior}
                siguiente={siguiente}
                onElegir={(codigo) => {
                  setError(null);
                  onElegirRecinto(codigo);
                }}
              />
            </section>
          ) : (
            <p className="text-sm text-[#5B6169]">
              {editando && fuente.length === 0
                ? "No hay recintos con daños activos en este evento."
                : !editando && proyectos.length === 0
                  ? "Todavía no hay recintos validados en este informe."
                  : "Ese recinto no está en el informe."}
            </p>
          )}
        </div>
      </div>
      {visor && actual ? (
        <Visor
          items={(editando ? actual.media : actual.media.filter((m) => mediaSeleccionada(borrador, m.id))).filter(
            (m) => m.momento === visor.momento,
          )}
          index={visor.index}
          urls={urls}
          onCerrar={() => setVisor(null)}
          onIndex={(index) => setVisor({ ...visor, index })}
        />
      ) : null}
    </div>
  );
}

function Dato({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 bg-white px-4 py-3.5">
      <p className="text-[13px] text-[#5B6169]">{etiqueta}</p>
      <p className="text-[22px] font-extrabold">
        {valor}{" "}
        {detalle ? <span className="text-sm font-semibold text-[#5B6169]">{detalle}</span> : null}
      </p>
    </div>
  );
}

function MenuLink({
  borrador,
  tokenActivo,
  ocupado,
  onExpira,
  onDesactivar,
  onRegenerar,
}: {
  borrador: BorradorInforme;
  tokenActivo: boolean;
  ocupado: boolean;
  onExpira: (fecha: string | null) => void;
  onDesactivar: () => void;
  onRegenerar: () => void;
}) {
  return (
    <div className="flex max-w-md flex-col gap-3 rounded-[14px] border border-[#E3E4E1] bg-white p-4">
      <p className="text-sm text-[#5B6169]">
        {tokenActivo ? "El link está activo." : "El link está desactivado."}
      </p>
      <label className="text-sm font-medium">
        Vence el
        <input
          type="date"
          value={borrador.tokenExpira ?? ""}
          onChange={(event) => onExpira(event.target.value || null)}
          className="mt-1 h-11 w-full rounded-[10px] border border-[#C9CBC6] px-3 text-base"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <p className="text-[13px] text-[#5B6169]">La fecha se guarda con Guardar cambios.</p>
        <button type="button" className="h-11 rounded-[10px] border border-[#D5D7D3] bg-white px-3 text-sm font-semibold" onClick={onDesactivar} disabled={ocupado}>
          Desactivar link
        </button>
        <button type="button" className="h-11 rounded-[10px] border border-[#D5D7D3] bg-white px-3 text-sm font-semibold" onClick={onRegenerar} disabled={ocupado}>
          Generar link nuevo
        </button>
      </div>
    </div>
  );
}

function Detalle(props: {
  proyecto: FuenteProyecto;
  posicion: number;
  total: number;
  borrador: BorradorInforme;
  urls: Record<string, string>;
  editando: boolean;
  narrow: boolean;
  mas: Record<string, boolean>;
  filtroMedia: Record<string, "todos" | "informe" | "fuera">;
  textoDe: (trabajoId: string, tipo: string, guardado: string, nota: string) => string;
  onTexto: (trabajoId: string, tipo: string, valor: string) => void;
  onPasar: (trabajoId: string, tipo: string, texto: string) => void;
  onQuitar: (trabajoId: string, tipo: string) => void;
  onValidar: () => void;
  onAlternar: (id: string) => void;
  onMarcar: (ids: string[], incluido: boolean) => void;
  onFiltro: (clave: string, valor: "todos" | "informe" | "fuera") => void;
  onMas: (clave: string) => void;
  onAbrir: (momento: MomentoMedia, id: string) => void;
  anterior: FuenteProyecto | null;
  siguiente: FuenteProyecto | null;
  onElegir: (codigo: string) => void;
}) {
  const { proyecto, borrador, editando } = props;
  const validada =
    borrador.recintos.find((r) => r.trabajoId === proyecto.trabajoId)?.descripcionValidada === true;
  const visibles = editando
    ? proyecto.media
    : proyecto.media.filter((m) => mediaSeleccionada(borrador, m.id));

  return (
    <div className="flex flex-col gap-[22px] rounded-[14px] border border-[#E3E4E1] bg-white px-4 py-[18px] min-[760px]:gap-7 min-[760px]:p-7">
      <div>
        <p className="text-[13px] text-[#5B6169]">
          Recinto {props.posicion} de {props.total} · {proyecto.codigo}
        </p>
        <h2 className="mt-2 text-[22px] leading-tight font-extrabold min-[760px]:text-[28px]">
          {proyecto.recintoCodigo}{" "}
          <span className="font-semibold text-[#3A3F46]">· {proyecto.arrendatario}</span>
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-[#5B6169]">Zonas dañadas:</span>
          {proyecto.subproyectos.map((sub) => (
            <span key={sub.tipo} className="rounded-full bg-[#F0F1EE] px-2.5 py-1 text-[13px] font-semibold text-[#3A3F46]">
              {TIPO_PROBLEMA_LABEL[sub.tipo]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        <div>
          <h3 className="text-lg font-extrabold">Qué pasó</h3>
          {editando ? (
            <p className="text-[13px] text-[#5B6169]">
              Cada texto parte de lo anotado en la ficha {proyecto.codigo}. El liquidador solo ve lo que pases al informe.
            </p>
          ) : null}
        </div>
        {proyecto.subproyectos.map((sub) => {
          const guardado =
            borrador.subproyectos.find((s) => s.trabajoId === proyecto.trabajoId && s.tipo === sub.tipo)
              ?.descripcionSeguro ?? "";
          if (!editando && !textoEnInforme(guardado)) return null;
          const texto = props.textoDe(proyecto.trabajoId, sub.tipo, guardado, sub.notaAnotada);
          const enInforme = textoEnInforme(guardado);
          const id = `desc-${proyecto.trabajoId}-${sub.tipo}`;
          return (
            <div key={sub.tipo} className="flex flex-col gap-1.5 rounded-[10px] border border-[#E3E4E1] bg-[#FAFAF8] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor={id} className="text-[15px] font-extrabold">
                  {TIPO_PROBLEMA_LABEL[sub.tipo]}
                </label>
                {editando ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-xs font-bold"
                      style={
                        enInforme
                          ? { background: "#DDF2E8", color: "#0B5E3E" }
                          : { background: "#F0F1EE", color: "#5B6169" }
                      }
                    >
                      {enInforme ? "En el informe" : "Solo en la ficha"}
                    </span>
                    {enInforme ? (
                      <button
                        type="button"
                        onClick={() => props.onQuitar(proyecto.trabajoId, sub.tipo)}
                        className="h-11 rounded-lg border border-[#D5D7D3] bg-white px-3 text-[13px] font-semibold text-[#3A3F46]"
                      >
                        Quitar del informe
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => props.onPasar(proyecto.trabajoId, sub.tipo, texto)}
                        disabled={!texto.trim()}
                        className="h-11 rounded-lg border border-[#D5D7D3] bg-white px-3 text-[13px] font-semibold text-[#3A3F46] disabled:opacity-50"
                      >
                        Pasar al informe
                      </button>
                    )}
                  </span>
                ) : null}
              </div>
              {editando ? (
                <textarea
                  id={id}
                  rows={3}
                  value={texto}
                  onChange={(event) => props.onTexto(proyecto.trabajoId, sub.tipo, event.target.value)}
                  className="w-full resize-y rounded-lg border border-[#C9CBC6] bg-white px-3 py-2.5 text-base leading-normal"
                />
              ) : (
                <p className="text-base leading-relaxed">{texto}</p>
              )}
            </div>
          );
        })}
        {editando ? (
          validada ? (
            <span className="inline-flex h-11 items-center gap-1.5 self-start rounded-[10px] bg-[#DDF2E8] px-3.5 text-sm font-bold text-[#0B5E3E]">
              <Check className="size-4" aria-hidden />
              Descripción validada
            </span>
          ) : (
            <button
              type="button"
              onClick={props.onValidar}
              className="h-11 w-full self-start rounded-[10px] border border-[#0B6B47] bg-[#0B6B47] text-sm font-bold text-white min-[760px]:w-auto min-[760px]:px-4"
            >
              Validar descripción
            </button>
          )
        ) : null}
      </div>

      <CajaMomento
        momento="antes"
        proyecto={proyecto}
        items={visibles.filter((m) => m.momento === "antes")}
        todos={proyecto.media.filter((m) => m.momento === "antes")}
        borrador={borrador}
        urls={props.urls}
        editando={editando}
        narrow={props.narrow}
        filtro={props.filtroMedia[`${proyecto.trabajoId}:antes`] ?? "todos"}
        abierto={Boolean(props.mas[`${proyecto.trabajoId}:antes`])}
        onFiltro={(valor) => props.onFiltro(`${proyecto.trabajoId}:antes`, valor)}
        onMas={() => props.onMas(`${proyecto.trabajoId}:antes`)}
        onAlternar={props.onAlternar}
        onMarcar={props.onMarcar}
        onAbrir={(id) => props.onAbrir("antes", id)}
      />
      <CajaMomento
        momento="despues"
        proyecto={proyecto}
        items={visibles.filter((m) => m.momento === "despues")}
        todos={proyecto.media.filter((m) => m.momento === "despues")}
        borrador={borrador}
        urls={props.urls}
        editando={editando}
        narrow={props.narrow}
        filtro={props.filtroMedia[`${proyecto.trabajoId}:despues`] ?? "todos"}
        abierto={Boolean(props.mas[`${proyecto.trabajoId}:despues`])}
        onFiltro={(valor) => props.onFiltro(`${proyecto.trabajoId}:despues`, valor)}
        onMas={() => props.onMas(`${proyecto.trabajoId}:despues`)}
        onAlternar={props.onAlternar}
        onMarcar={props.onMarcar}
        onAbrir={(id) => props.onAbrir("despues", id)}
      />

      <div className="flex flex-wrap justify-between gap-2.5 border-t border-[#E3E4E1] pt-5">
        {props.anterior ? (
          <button
            type="button"
            onClick={() => props.onElegir(props.anterior!.codigo)}
            className="min-h-11 flex-1 basis-[200px] rounded-[10px] border border-[#D5D7D3] bg-white px-4 py-2 text-left text-sm font-semibold"
          >
            ← {props.anterior.recintoCodigo} · {props.anterior.arrendatario}
          </button>
        ) : null}
        {props.siguiente ? (
          <button
            type="button"
            onClick={() => props.onElegir(props.siguiente!.codigo)}
            className="min-h-11 flex-1 basis-[200px] rounded-[10px] border border-[#D5D7D3] bg-white px-4 py-2 text-right text-sm font-semibold"
          >
            {props.siguiente.recintoCodigo} · {props.siguiente.arrendatario} →
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CajaMomento({
  momento,
  proyecto,
  items,
  todos,
  borrador,
  urls,
  editando,
  narrow,
  filtro,
  abierto,
  onFiltro,
  onMas,
  onAlternar,
  onMarcar,
  onAbrir,
}: {
  momento: MomentoMedia;
  proyecto: FuenteProyecto;
  items: FuenteMedia[];
  todos: FuenteMedia[];
  borrador: BorradorInforme;
  urls: Record<string, string>;
  editando: boolean;
  narrow: boolean;
  filtro: "todos" | "informe" | "fuera";
  abierto: boolean;
  onFiltro: (valor: "todos" | "informe" | "fuera") => void;
  onMas: () => void;
  onAlternar: (id: string) => void;
  onMarcar: (ids: string[], incluido: boolean) => void;
  onAbrir: (id: string) => void;
}) {
  const antes = momento === "antes";
  const base = editando ? todos : items;
  const filtrados = !editando
    ? base
    : filtro === "informe"
      ? base.filter((m) => mediaSeleccionada(borrador, m.id))
      : filtro === "fuera"
        ? base.filter((m) => !mediaSeleccionada(borrador, m.id))
        : base;
  const cuenta = contarMomento(base, momento);
  const partes = [
    cuenta.fotos ? plural(cuenta.fotos, "foto", "fotos") : "",
    cuenta.videos ? plural(cuenta.videos, "video", "videos") : "",
  ].filter(Boolean);
  const limite = narrow ? 6 : 8;
  const mostrados = abierto ? filtrados : filtrados.slice(0, limite);
  const seleccionadas = todos.filter((m) => mediaSeleccionada(borrador, m.id)).length;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-3.5 min-[760px]:p-5"
      style={
        antes
          ? { background: "#FFF8EC", borderColor: "#F3DFB8" }
          : { background: "#EEF8F3", borderColor: "#C4E6D5" }
      }
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <span
          className="rounded-md px-3 py-1 text-[13px] font-extrabold tracking-[0.08em] text-white"
          style={{ background: antes ? "#8A4B00" : "#0B5E3E" }}
        >
          {antes ? "ANTES" : "DESPUÉS"}
        </span>
        <span className="text-base font-bold">
          {antes ? "Cómo quedó con el temporal" : "Cómo quedó reparado"}
        </span>
        <span className="text-sm" style={{ color: antes ? "#6B5A3E" : "#3E5A4C" }}>
          {partes.join(" · ") || "0 archivos"}
        </span>
      </div>
      {editando && todos.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm" style={{ color: antes ? "#3A2A10" : "#1A3A2A" }}>
            Toca una foto o video para pasarla al informe o quitarla.{" "}
            <strong>
              {seleccionadas} de {todos.length} en el informe.
            </strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["todos", "Todos"],
                ["informe", "En el informe"],
                ["fuera", "Sin pasar"],
              ] as const
            ).map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                onClick={() => onFiltro(valor)}
                className="h-11 rounded-[10px] border px-3 text-[13px] font-bold"
                style={
                  filtro === valor
                    ? { borderColor: "#1F4FD1", background: "#E8EEFC", color: "#163A9E" }
                    : { borderColor: antes ? "#E2CFA6" : "#A9D5BF", background: "#FFFFFF", color: antes ? "#6B4200" : "#0B5E3E" }
                }
              >
                {etiqueta}
              </button>
            ))}
          </div>
          <span className="flex flex-wrap gap-2">
            <button type="button" disabled={filtrados.length === 0} onClick={() => onMarcar(filtrados.map((m) => m.id), true)} className="h-11 rounded-[10px] border bg-white px-3.5 text-[13px] font-bold disabled:opacity-50" style={{ borderColor: antes ? "#E2CFA6" : "#A9D5BF", color: antes ? "#6B4200" : "#0B5E3E" }}>
              Pasar los {filtrados.length} visibles
            </button>
            <button type="button" disabled={filtrados.length === 0} onClick={() => onMarcar(filtrados.map((m) => m.id), false)} className="h-11 rounded-[10px] border bg-white px-3.5 text-[13px] font-bold disabled:opacity-50" style={{ borderColor: antes ? "#E2CFA6" : "#A9D5BF", color: antes ? "#6B4200" : "#0B5E3E" }}>
              Quitar los {filtrados.length} visibles
            </button>
          </span>
        </div>
      ) : null}
      {filtrados.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-[10px] border-2 border-dashed px-4 py-6 text-center"
          style={{ borderColor: antes ? "#E2CFA6" : "#A9D5BF" }}
        >
          <p className="text-[15px]" style={{ color: antes ? "#6B5A3E" : "#3E5A4C" }}>
            {todos.length === 0
              ? antes
                ? "Todavía no hay fotos ni videos de antes en la ficha de este recinto."
                : "Todavía no hay fotos ni videos de después en la ficha de este recinto."
              : "Ningún archivo con este filtro."}
          </p>
          {editando && todos.length === 0 ? (
            <p className="text-[13px]" style={{ color: antes ? "#6B5A3E" : "#3E5A4C" }}>
              Cuando se suban en la ficha {proyecto.codigo} aparecerán aquí para que elijas cuáles mostrar.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 min-[760px]:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          {mostrados.map((media) => (
            <Miniatura
              key={media.id}
              media={media}
              url={urls[media.thumbnailKey ?? ""] || urls[media.key]}
              seleccionada={mediaSeleccionada(borrador, media.id)}
              editando={editando}
              onAlternar={() => onAlternar(media.id)}
              onAbrir={() => onAbrir(media.id)}
            />
          ))}
        </div>
      )}
      {filtrados.length > limite ? (
        <button
          type="button"
          onClick={onMas}
          className="h-11 w-full rounded-[10px] border bg-white text-sm font-bold min-[760px]:w-auto min-[760px]:self-start min-[760px]:px-4"
          style={{ borderColor: antes ? "#E2CFA6" : "#A9D5BF", color: antes ? "#6B4200" : "#0B5E3E" }}
        >
          {abierto ? "Ver menos" : `Ver los ${filtrados.length} archivos`}
        </button>
      ) : null}
    </div>
  );
}

function Miniatura({
  media,
  url,
  seleccionada,
  editando,
  onAlternar,
  onAbrir,
}: {
  media: FuenteMedia;
  url: string | undefined;
  seleccionada: boolean;
  editando: boolean;
  onAlternar: () => void;
  onAbrir: () => void;
}) {
  const etiqueta = media.nombre?.trim() || (media.tipoArchivo === "video" ? "Video" : "Foto");
  return (
    <div
      className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#E4DED2]"
      style={
        editando && seleccionada
          ? { outline: "3px solid #1F4FD1", outlineOffset: "-3px" }
          : undefined
      }
    >
      {editando ? (
        <label className="absolute inset-0 cursor-pointer">
          <input
            type="checkbox"
            checked={seleccionada}
            onChange={onAlternar}
            aria-label={
              seleccionada ? `Quitar ${etiqueta} del informe` : `Pasar ${etiqueta} al informe`
            }
            className="absolute top-1.5 left-1.5 z-10 m-0 size-[22px] accent-[#1F4FD1]"
          />
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-[#6B5A3E]">
              {media.tipoArchivo === "video" ? <Play className="size-7" /> : null}
            </span>
          )}
          {seleccionada ? (
            <span className="absolute bottom-1.5 left-1.5 rounded bg-[#1F4FD1] px-1.5 py-0.5 text-[11px] font-bold text-white">
              En el informe
            </span>
          ) : null}
        </label>
      ) : (
        <button type="button" onClick={onAbrir} className="absolute inset-0" aria-label={`Abrir ${etiqueta}`}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={etiqueta} className="size-full object-cover" />
          ) : null}
        </button>
      )}
      {media.tipoArchivo === "video" ? (
        <Play className="pointer-events-none absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" aria-hidden />
      ) : null}
      <button
        type="button"
        onClick={onAbrir}
        aria-label={`Ampliar ${etiqueta}`}
        className="absolute top-0 right-0 z-20 flex size-11 items-center justify-center text-white"
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-black/55">
          <Maximize2 className="size-4" aria-hidden />
        </span>
      </button>
    </div>
  );
}

function Visor({
  items,
  index,
  urls,
  onCerrar,
  onIndex,
}: {
  items: FuenteMedia[];
  index: number;
  urls: Record<string, string>;
  onCerrar: () => void;
  onIndex: (index: number) => void;
}) {
  const media = items[index];
  const [origen, setOrigen] = useState<number | null>(null);
  if (!media) return null;
  const src = urls[media.key] || urls[media.thumbnailKey ?? ""];
  const video = media.tipoArchivo === "video" && src && !src.startsWith("data:");

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Archivo del informe"
      onTouchStart={(event) => setOrigen(event.changedTouches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        if (origen == null) return;
        const dx = (event.changedTouches[0]?.clientX ?? origen) - origen;
        if (dx > 40) onIndex((index - 1 + items.length) % items.length);
        if (dx < -40) onIndex((index + 1) % items.length);
        setOrigen(null);
      }}
    >
      <div className="flex h-14 items-center justify-between px-3">
        <button type="button" onClick={onCerrar} className="h-11 px-3 text-sm font-semibold">
          Cerrar
        </button>
        <p className="text-sm">
          {index + 1} de {items.length}
        </p>
        <span className="w-16" />
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-3">
        {video ? (
          <video src={src} controls playsInline className="max-h-full max-w-full" />
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={media.nombre ?? "Archivo"} className="max-h-full max-w-full object-contain" />
        ) : null}
      </div>
      <div className="flex justify-between p-3">
        <button type="button" className="h-11 px-4" onClick={() => onIndex((index - 1 + items.length) % items.length)}>
          Anterior
        </button>
        <button type="button" className="h-11 px-4" onClick={() => onIndex((index + 1) % items.length)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
