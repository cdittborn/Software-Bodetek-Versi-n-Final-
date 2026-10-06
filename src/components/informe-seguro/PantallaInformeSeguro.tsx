"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Eye, Link2, Maximize2, MoreHorizontal, Play } from "lucide-react";
import type { FuenteMedia, FuenteProyecto, MomentoMedia } from "@/lib/informe-seguro/fuente";
import type { ResultadoPersistir } from "@/lib/informe-seguro/resultado";
import type { BorradorInforme } from "@/lib/informe-seguro/snapshot";
import { TIPO_PROBLEMA_LABEL } from "@/lib/filtracion/problemas";
import {
  contarMomento,
  mediaSeleccionada,
  resumenPantalla,
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
  onGuardar?: (
    borrador: BorradorInforme,
    opciones?: { activarLink?: boolean },
  ) => Promise<ResultadoPersistir>;
  onDesactivar?: () => Promise<ResultadoPersistir>;
  onRegenerar?: () => Promise<ResultadoPersistir>;
  onAlternarModo?: () => void;
};

function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
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
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mas, setMas] = useState<Record<string, boolean>>({});
  const [visor, setVisor] = useState<{ trabajoId: string; momento: MomentoMedia; index: number } | null>(null);

  useEffect(() => {
    setBorrador(inicial);
    setOverrides({});
  }, [inicial]);

  const resumen = useMemo(() => resumenPantalla(fuente, borrador), [fuente, borrador]);
  const indice = Math.max(
    0,
    fuente.findIndex((p) => p.codigo === recintoCodigo),
  );
  const abierto = Boolean(recintoCodigo);
  const actual = fuente[indice] ?? null;

  function textoDe(trabajoId: string, tipo: string, guardado: string, nota: string): string {
    const key = `${trabajoId}:${tipo}`;
    if (key in overrides) return overrides[key] ?? "";
    return textoQuePaso(guardado, nota);
  }

  function borradorVisible(): BorradorInforme {
    return {
      ...borrador,
      subproyectos: borrador.subproyectos.map((s) => {
        const nota =
          fuente
            .find((p) => p.trabajoId === s.trabajoId)
            ?.subproyectos.find((sub) => sub.tipo === s.tipo)?.notaAnotada ?? "";
        return {
          ...s,
          descripcionSeguro: textoDe(s.trabajoId, s.tipo, s.descripcionSeguro, nota),
        };
      }),
    };
  }

  async function guardar(opciones?: { activarLink?: boolean }) {
    if (!onGuardar) return null;
    setOcupado(true);
    setError(null);
    try {
      const resultado = await onGuardar(borradorVisible(), opciones);
      if (!resultado.ok) {
        setError(resultado.error ?? "No se pudo guardar.");
        return null;
      }
      setMensaje(opciones?.activarLink ? "Link listo." : "Cambios guardados.");
      return resultado;
    } finally {
      setOcupado(false);
    }
  }

  async function copiar() {
    const resultado = await guardar({ activarLink: true });
    const path = resultado?.linkPath ?? linkPath;
    if (!path || typeof window === "undefined") return;
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 2000);
  }

  function cambiarTexto(trabajoId: string, tipo: string, valor: string) {
    setOverrides((prev) => ({ ...prev, [`${trabajoId}:${tipo}`]: valor }));
    setBorrador((prev) => ({
      ...prev,
      recintos: prev.recintos.map((r) =>
        r.trabajoId === trabajoId ? { ...r, descripcionValidada: false } : r,
      ),
    }));
  }

  function marcarMomento(trabajoId: string, momento: MomentoMedia, incluido: boolean) {
    const ids = new Set(
      (fuente.find((p) => p.trabajoId === trabajoId)?.media ?? [])
        .filter((m) => m.momento === momento)
        .map((m) => m.id),
    );
    setBorrador((prev) => ({
      ...prev,
      media: prev.media.map((m) => (ids.has(m.trabajoMediaId) ? { ...m, incluido } : m)),
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

  const n = fuente.length;
  const anterior = n > 0 ? fuente[(indice - 1 + n) % n] : null;
  const siguiente = n > 0 ? fuente[(indice + 1) % n] : null;

  return (
    <div className="min-h-full bg-[#F5F5F2] text-[#1A1D21]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 px-4 py-4 pb-12 min-[760px]:gap-6 min-[760px]:px-6 min-[760px]:py-7 min-[760px]:pb-16">
        <div className={abierto ? "max-[759px]:hidden" : undefined}>
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] text-[#5B6169]">
              {dashboardHref ? (
                <Link href={dashboardHref} className="hover:underline">
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
                      disabled={ocupado || !onGuardar}
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
                tokenActivo={tokenActivo}
                ocupado={ocupado}
                onExpira={(fecha) =>
                  setBorrador((prev) => ({ ...prev, tokenExpira: fecha }))
                }
                onGuardarExpira={() => void guardar()}
                onDesactivar={() => onDesactivar?.()}
                onRegenerar={() => onRegenerar?.()}
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
              {fuente.map((proyecto, i) => {
                const ok = borrador.recintos.find((r) => r.trabajoId === proyecto.trabajoId)
                  ?.descripcionValidada;
                const seleccionado = i === indice && !narrow;
                return (
                  <button
                    key={proyecto.trabajoId}
                    type="button"
                    onClick={() => onElegirRecinto(proyecto.codigo)}
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
                onClick={onVolverLista}
                className="mb-3 inline-flex h-11 items-center gap-1.5 rounded-[10px] border border-[#D5D7D3] bg-white pr-3.5 pl-2 text-[15px] font-bold min-[760px]:hidden"
              >
                <ChevronLeft className="size-5" aria-hidden />
                Todos los recintos
              </button>
              <Detalle
                proyecto={actual}
                posicion={indice + 1}
                total={n}
                borrador={borrador}
                urls={urls}
                editando={editando}
                narrow={narrow}
                mas={mas}
                textoDe={textoDe}
                onTexto={cambiarTexto}
                onRestaurar={(trabajoId, tipo, nota) =>
                  setOverrides((prev) => ({ ...prev, [`${trabajoId}:${tipo}`]: nota }))
                }
                onValidar={() =>
                  setBorrador((prev) => ({
                    ...prev,
                    recintos: prev.recintos.map((r) =>
                      r.trabajoId === actual.trabajoId
                        ? { ...r, descripcionValidada: true }
                        : r,
                    ),
                  }))
                }
                onAlternar={alternarMedia}
                onMarcar={(momento, incluido) => marcarMomento(actual.trabajoId, momento, incluido)}
                onMas={(clave) => setMas((prev) => ({ ...prev, [clave]: !prev[clave] }))}
                onAbrir={(momento, index) =>
                  setVisor({ trabajoId: actual.trabajoId, momento, index })
                }
                anterior={anterior}
                siguiente={siguiente}
                onElegir={onElegirRecinto}
              />
            </section>
          ) : (
            <p className="text-sm text-[#5B6169]">No hay recintos con daños activos en este evento.</p>
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
  onGuardarExpira,
  onDesactivar,
  onRegenerar,
}: {
  borrador: BorradorInforme;
  tokenActivo: boolean;
  ocupado: boolean;
  onExpira: (fecha: string | null) => void;
  onGuardarExpira: () => void;
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
        <button type="button" className="h-11 rounded-[10px] border border-[#D5D7D3] bg-white px-3 text-sm font-semibold" onClick={onGuardarExpira} disabled={ocupado}>
          Guardar vencimiento
        </button>
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
  textoDe: (trabajoId: string, tipo: string, guardado: string, nota: string) => string;
  onTexto: (trabajoId: string, tipo: string, valor: string) => void;
  onRestaurar: (trabajoId: string, tipo: string, nota: string) => void;
  onValidar: () => void;
  onAlternar: (id: string) => void;
  onMarcar: (momento: MomentoMedia, incluido: boolean) => void;
  onMas: (clave: string) => void;
  onAbrir: (momento: MomentoMedia, index: number) => void;
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
              Cada texto viene de lo anotado en la ficha {proyecto.codigo}. Cámbialo si quieres y luego valida el recinto.
            </p>
          ) : null}
        </div>
        {proyecto.subproyectos.map((sub) => {
          const guardado =
            borrador.subproyectos.find((s) => s.trabajoId === proyecto.trabajoId && s.tipo === sub.tipo)
              ?.descripcionSeguro ?? "";
          const texto = props.textoDe(proyecto.trabajoId, sub.tipo, guardado, sub.notaAnotada);
          const id = `desc-${proyecto.trabajoId}-${sub.tipo}`;
          return (
            <div key={sub.tipo} className="flex flex-col gap-1.5 rounded-[10px] border border-[#E3E4E1] bg-[#FAFAF8] p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor={id} className="text-[15px] font-extrabold">
                  {TIPO_PROBLEMA_LABEL[sub.tipo]}
                </label>
                {editando && texto !== sub.notaAnotada ? (
                  <button
                    type="button"
                    onClick={() => props.onRestaurar(proyecto.trabajoId, sub.tipo, sub.notaAnotada)}
                    className="h-11 rounded-lg border border-[#D5D7D3] bg-white px-3 text-[13px] font-semibold text-[#3A3F46]"
                  >
                    Volver a lo anotado
                  </button>
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
        abierto={Boolean(props.mas[`${proyecto.trabajoId}:antes`])}
        onMas={() => props.onMas(`${proyecto.trabajoId}:antes`)}
        onAlternar={props.onAlternar}
        onMarcar={(incluido) => props.onMarcar("antes", incluido)}
        onAbrir={(index) => props.onAbrir("antes", index)}
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
        abierto={Boolean(props.mas[`${proyecto.trabajoId}:despues`])}
        onMas={() => props.onMas(`${proyecto.trabajoId}:despues`)}
        onAlternar={props.onAlternar}
        onMarcar={(incluido) => props.onMarcar("despues", incluido)}
        onAbrir={(index) => props.onAbrir("despues", index)}
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
  abierto,
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
  abierto: boolean;
  onMas: () => void;
  onAlternar: (id: string) => void;
  onMarcar: (incluido: boolean) => void;
  onAbrir: (index: number) => void;
}) {
  const antes = momento === "antes";
  const cuenta = contarMomento(editando ? todos : items, momento);
  const partes = [
    cuenta.fotos ? plural(cuenta.fotos, "foto", "fotos") : "",
    cuenta.videos ? plural(cuenta.videos, "video", "videos") : "",
  ].filter(Boolean);
  const limite = narrow ? 6 : 8;
  const mostrados = abierto ? items : items.slice(0, limite);
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm" style={{ color: antes ? "#3A2A10" : "#1A3A2A" }}>
            Toca una foto o video para mostrarlo u ocultarlo al liquidador.{" "}
            <strong>
              {seleccionadas} de {todos.length} seleccionadas.
            </strong>
          </p>
          <span className="flex gap-2">
            <button type="button" onClick={() => onMarcar(true)} className="h-11 rounded-[10px] border bg-white px-3.5 text-[13px] font-bold" style={{ borderColor: antes ? "#E2CFA6" : "#A9D5BF", color: antes ? "#6B4200" : "#0B5E3E" }}>
              Marcar todas
            </button>
            <button type="button" onClick={() => onMarcar(false)} className="h-11 rounded-[10px] border bg-white px-3.5 text-[13px] font-bold" style={{ borderColor: antes ? "#E2CFA6" : "#A9D5BF", color: antes ? "#6B4200" : "#0B5E3E" }}>
              Desmarcar todas
            </button>
          </span>
        </div>
      ) : null}
      {items.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-[10px] border-2 border-dashed px-4 py-6 text-center"
          style={{ borderColor: antes ? "#E2CFA6" : "#A9D5BF" }}
        >
          <p className="text-[15px]" style={{ color: antes ? "#6B5A3E" : "#3E5A4C" }}>
            {antes
              ? "Todavía no hay fotos ni videos de antes en la ficha de este recinto."
              : "Todavía no hay fotos ni videos de después en la ficha de este recinto."}
          </p>
          {editando ? (
            <p className="text-[13px]" style={{ color: antes ? "#6B5A3E" : "#3E5A4C" }}>
              Cuando se suban en la ficha {proyecto.codigo} aparecerán aquí para que elijas cuáles mostrar.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 min-[760px]:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          {mostrados.map((media, index) => (
            <Miniatura
              key={media.id}
              media={media}
              url={urls[media.thumbnailKey ?? ""] || urls[media.key]}
              seleccionada={mediaSeleccionada(borrador, media.id)}
              editando={editando}
              onAlternar={() => onAlternar(media.id)}
              onAbrir={() => onAbrir(index)}
            />
          ))}
        </div>
      )}
      {items.length > limite ? (
        <button
          type="button"
          onClick={onMas}
          className="h-11 w-full rounded-[10px] border bg-white text-sm font-bold min-[760px]:w-auto min-[760px]:self-start min-[760px]:px-4"
          style={{ borderColor: antes ? "#E2CFA6" : "#A9D5BF", color: antes ? "#6B4200" : "#0B5E3E" }}
        >
          {abierto ? "Ver menos" : `Ver los ${items.length} archivos`}
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
        editando
          ? {
              outline: seleccionada ? "3px solid #1F4FD1" : undefined,
              outlineOffset: "-3px",
              opacity: seleccionada ? 1 : 0.45,
            }
          : undefined
      }
    >
      {editando ? (
        <label className="absolute inset-0 cursor-pointer">
          <input
            type="checkbox"
            checked={seleccionada}
            onChange={onAlternar}
            aria-label={`Mostrar ${etiqueta} al liquidador`}
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
          {!seleccionada ? (
            <span className="absolute bottom-1.5 left-1.5 rounded bg-white px-1.5 py-0.5 text-[11px] font-bold text-[#5B6169]">
              Oculta
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
