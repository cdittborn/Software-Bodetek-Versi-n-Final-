"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  BASE_PLANO,
  ESPACIOS_PLANO,
  FACHADAS_PLANO,
  UNIDADES_PLANO,
  VIEWBOX_PLANO,
  type FormaPlano,
  type RotuloPlano,
} from "@/components/fachadas/plano/geometria";
import { HojaFachada, type HojaFachadaDatos } from "@/components/fachadas/plano/HojaFachada";
import {
  anclajeTooltip,
  estadoVisible,
  estiloEstado,
  fachadaMasCercana,
  puntoMedioPolilinea,
  TOOLTIP_FONDO,
  TOOLTIP_TEXTO,
  type EstadoPlano,
} from "@/lib/fachadas/plano";
import "../fachadas.css";

export type VariantePlano = "completo" | "movil" | "mini";
export type ModoPlano = "hoy" | "antes" | "vacio";

export type FichaPlano = {
  superficieM2: number | null;
  ultimaIntervencion: string | null;
};

type Vista = { x: number; y: number; w: number; h: number };

const VISTA_INICIAL: Vista = {
  x: 0,
  y: 0,
  w: VIEWBOX_PLANO.width,
  h: VIEWBOX_PLANO.height,
};
const ANCHO_MINIMO = 180;

function limitarVista(vista: Vista): Vista {
  if (vista.w >= VIEWBOX_PLANO.width - 0.01) return VISTA_INICIAL;
  const x = Math.min(Math.max(0, vista.x), VIEWBOX_PLANO.width - vista.w);
  const y = Math.min(Math.max(0, vista.y), VIEWBOX_PLANO.height - vista.h);
  return { ...vista, x, y };
}

function zoomHacia(vista: Vista, factor: number, cx: number, cy: number): Vista {
  const w = Math.min(VIEWBOX_PLANO.width, Math.max(ANCHO_MINIMO, vista.w * factor));
  const h = (w * VIEWBOX_PLANO.height) / VIEWBOX_PLANO.width;
  const relX = (cx - vista.x) / vista.w;
  const relY = (cy - vista.y) / vista.h;
  return limitarVista({ x: cx - relX * w, y: cy - relY * h, w, h });
}

function desplazar(
  vista: Vista,
  dx: number,
  dy: number,
  rect: { width: number; height: number },
): Vista {
  if (rect.width <= 0 || rect.height <= 0) return vista;
  return limitarVista({
    ...vista,
    x: vista.x - (dx / rect.width) * vista.w,
    y: vista.y - (dy / rect.height) * vista.h,
  });
}

function clienteAVista(
  clientX: number,
  clientY: number,
  vista: Vista,
  rect: { left: number; top: number; width: number; height: number },
): [number, number] {
  return [
    vista.x + ((clientX - rect.left) / rect.width) * vista.w,
    vista.y + ((clientY - rect.top) / rect.height) * vista.h,
  ];
}

function puntosAttr(puntos: readonly (readonly [number, number])[]): string {
  return puntos.map((punto) => `${punto[0]},${punto[1]}`).join(" ");
}

function Rotulo({ rotulo }: { rotulo: RotuloPlano }) {
  return (
    <text
      x={rotulo.x}
      y={rotulo.y}
      fill={rotulo.fill}
      fontSize={rotulo.size}
      textAnchor={rotulo.textAnchor}
      transform={
        rotulo.rotacion == null ? undefined : `rotate(${rotulo.rotacion} ${rotulo.x} ${rotulo.y})`
      }
      pointerEvents="none"
    >
      {rotulo.texto}
    </text>
  );
}

function Forma({ forma }: { forma: FormaPlano }) {
  const points = puntosAttr(forma.puntos);
  return (
    <g>
      {forma.puntos.length >= 3 ? (
        <polygon
          points={points}
          fill={forma.fill}
          stroke={forma.stroke ?? "none"}
          strokeWidth={forma.strokeWidth ?? undefined}
          strokeDasharray={forma.dash ?? undefined}
          strokeLinejoin="round"
        />
      ) : null}
      {forma.puntos.length === 2 ? (
        <polyline
          points={points}
          fill="none"
          stroke={forma.stroke ?? "none"}
          strokeWidth={forma.strokeWidth ?? undefined}
          strokeDasharray={forma.dash ?? undefined}
        />
      ) : null}
      {forma.rotulos.map((rotulo) => (
        <Rotulo key={`${rotulo.texto}-${rotulo.x}-${rotulo.y}`} rotulo={rotulo} />
      ))}
    </g>
  );
}

function distanciaPunteros(punteros: Map<number, { x: number; y: number }>): number {
  const [a, b] = [...punteros.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function centroPunteros(punteros: Map<number, { x: number; y: number }>): { x: number; y: number } {
  const [a, b] = [...punteros.values()];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function PlanoFachadas({
  modo,
  estados,
  filtro = null,
  resaltar = null,
  variante,
  ampliado = false,
  onPick,
  fichas,
  onAbrirFicha,
}: {
  modo: ModoPlano;
  estados: Record<string, EstadoPlano>;
  filtro?: EstadoPlano | null;
  resaltar?: string | null;
  variante: VariantePlano;
  ampliado?: boolean;
  onPick?: (svgId: string) => void;
  fichas?: Record<string, FichaPlano>;
  onAbrirFicha?: (svgId: string) => void;
}) {
  const raizRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const vistaRef = useRef<Vista>(VISTA_INICIAL);
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const gesto = useRef({
    movio: false,
    pellizco: false,
    distancia: 0,
    inicioX: 0,
    inicioY: 0,
  });
  const abrirLuego = useRef(0);
  useEffect(() => () => window.clearTimeout(abrirLuego.current), []);
  const [vista, setVista] = useState<Vista>(VISTA_INICIAL);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hojaId, setHojaId] = useState<string | null>(null);
  vistaRef.current = vista;
  const zoomActivo = vista.w < VIEWBOX_PLANO.width - 0.5;
  const interactivo = variante !== "mini";

  function aplicarVista(siguiente: Vista) {
    vistaRef.current = siguiente;
    setVista(siguiente);
  }

  function abrir(id: string) {
    onPick?.(id);
    if (variante === "mini") return;
    // El pointerup que abre la hoja también llega al fondo si el diálogo
    // se monta en el mismo gesto. Se abre al terminar ese evento.
    window.clearTimeout(abrirLuego.current);
    abrirLuego.current = window.setTimeout(() => setHojaId(id), 0);
  }

  function cerrarHoja() {
    const id = hojaId;
    setHojaId(null);
    if (!id) return;
    window.setTimeout(() => {
      raizRef.current
        ?.querySelector<SVGElement>(`[data-fachada-hit="${CSS.escape(id)}"]`)
        ?.focus({ preventScroll: true });
    }, 0);
  }

  function onPointerDown(evento: PointerEvent<SVGSVGElement>) {
    if (!interactivo) return;
    punteros.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    if (punteros.current.size >= 2) {
      gesto.current.pellizco = true;
      gesto.current.movio = true;
      gesto.current.distancia = distanciaPunteros(punteros.current);
      evento.currentTarget.style.touchAction = "none";
      return;
    }
    gesto.current.movio = false;
    gesto.current.pellizco = false;
    gesto.current.inicioX = evento.clientX;
    gesto.current.inicioY = evento.clientY;
    if (zoomActivo) evento.currentTarget.setPointerCapture(evento.pointerId);
  }

  function onPointerMove(evento: PointerEvent<SVGSVGElement>) {
    if (!punteros.current.has(evento.pointerId)) return;
    const previo = punteros.current.get(evento.pointerId)!;
    punteros.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    const rect = evento.currentTarget.getBoundingClientRect();
    if (punteros.current.size >= 2) {
      const dist = distanciaPunteros(punteros.current);
      const ratio = gesto.current.distancia > 0 ? dist / gesto.current.distancia : 1;
      gesto.current.distancia = dist;
      gesto.current.movio = true;
      const centro = centroPunteros(punteros.current);
      const [cx, cy] = clienteAVista(centro.x, centro.y, vistaRef.current, rect);
      aplicarVista(zoomHacia(vistaRef.current, 1 / ratio, cx, cy));
      return;
    }
    if (
      Math.hypot(evento.clientX - gesto.current.inicioX, evento.clientY - gesto.current.inicioY) > 8
    ) {
      gesto.current.movio = true;
    }
    if (!gesto.current.movio || vistaRef.current.w >= VIEWBOX_PLANO.width - 0.5) return;
    aplicarVista(
      desplazar(vistaRef.current, evento.clientX - previo.x, evento.clientY - previo.y, rect),
    );
  }

  function onPointerUp(evento: PointerEvent<SVGSVGElement>) {
    if (!punteros.current.has(evento.pointerId)) return;
    punteros.current.delete(evento.pointerId);
    if (punteros.current.size > 0) {
      gesto.current.movio = true;
      return;
    }
    const fueToque = !gesto.current.movio && !gesto.current.pellizco;
    gesto.current.pellizco = false;
    if (!zoomActivo && svgRef.current) svgRef.current.style.touchAction = "";
    const tactil = evento.pointerType === "touch" || variante === "movil";
    const rect = evento.currentTarget?.getBoundingClientRect();
    const punto =
      rect && rect.width > 0
        ? clienteAVista(evento.clientX, evento.clientY, vistaRef.current, rect)
        : null;
    const id =
      punto && rect ? fachadaMasCercana(punto, FACHADAS_PLANO, rect.width / vistaRef.current.w) : null;
    if (!fueToque || !interactivo || !tactil || !id) return;
    abrir(id);
  }

  function onPointerCancel(evento: PointerEvent<SVGSVGElement>) {
    punteros.current.delete(evento.pointerId);
    gesto.current.movio = true;
  }

  const ancla = hoverId
    ? anclajeTooltip(
        puntoMedioPolilinea(FACHADAS_PLANO.find((item) => item.id === hoverId)!.puntos),
        vista,
      )
    : null;
  const hover = hoverId ? FACHADAS_PLANO.find((item) => item.id === hoverId) : null;
  const hojaGeometria = hojaId ? FACHADAS_PLANO.find((item) => item.id === hojaId) : null;
  const hoja: HojaFachadaDatos | null = hojaGeometria
    ? {
        id: hojaGeometria.id,
        nombre: hojaGeometria.nombre,
        ubicacion: hojaGeometria.ubicacion,
        hacia: hojaGeometria.hacia,
        estado: estadoVisible(modo, estados, hojaGeometria.id),
        superficieM2: fichas?.[hojaGeometria.id]?.superficieM2 ?? null,
        ultimaIntervencion: fichas?.[hojaGeometria.id]?.ultimaIntervencion ?? null,
      }
    : null;
  const trasladoX =
    ancla?.horizontal === "hacia-izquierda" ? "-100%" : ancla?.horizontal === "centro" ? "-50%" : "0";
  const trasladoY = ancla?.vertical === "abajo" ? "8px" : "calc(-100% - 8px)";

  return (
    <div ref={raizRef} className="fachadas-scope relative w-full min-w-0 max-w-full" data-modo={modo}>
      <div
        data-plano-scroll
        className="w-full min-w-0 max-w-full"
        style={{ overflowX: ampliado && variante === "movil" ? "auto" : "clip" }}
      >
        <svg
          ref={svgRef}
          data-plano="v2"
          role="img"
          aria-label="Plano de fachadas"
          viewBox={`${vista.x} ${vista.y} ${vista.w} ${vista.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-auto overflow-visible"
          overflow="visible"
          style={{
            width: ampliado && variante === "movil" ? "230%" : "100%",
            touchAction: zoomActivo ? "none" : "pan-y",
            fontFamily: "Manrope, sans-serif",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {BASE_PLANO.map((forma, indice) => (
            <Forma key={forma.id ?? `base-${indice}`} forma={forma} />
          ))}
          {ESPACIOS_PLANO.map((forma) => (
            <Forma key={forma.id ?? "espacio"} forma={forma} />
          ))}
          {UNIDADES_PLANO.map((unidad) => (
            <Forma key={unidad.id} forma={unidad.forma} />
          ))}
          {FACHADAS_PLANO.map((fachada) => {
            const estado = estadoVisible(modo, estados, fachada.id);
            const estilo = estiloEstado(estado);
            const opacidad =
              filtro && estado !== filtro ? 0.14 : resaltar && resaltar !== fachada.id ? (variante === "mini" ? 0.16 : 0.4) : 1;
            const grosor =
              variante === "completo" ? (hoverId === fachada.id ? 10 : 5.5) : resaltar === fachada.id ? 8 : 4;
            return (
              <polyline
                key={fachada.id}
                data-fachada-visible={fachada.id}
                points={puntosAttr(fachada.puntos)}
                fill="none"
                stroke={estilo.color}
                strokeWidth={grosor}
                strokeDasharray={estilo.dash ?? undefined}
                strokeLinecap={estilo.linecap}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                opacity={opacidad}
                pointerEvents="none"
              />
            );
          })}
          <rect
            x={vista.x}
            y={vista.y}
            width={vista.w}
            height={vista.h}
            fill="transparent"
            pointerEvents={interactivo ? "all" : "none"}
          />
          {FACHADAS_PLANO.map((fachada) => {
            const estado = estadoVisible(modo, estados, fachada.id);
            return (
              <polyline
                key={`${fachada.id}-hit`}
                data-fachada-hit={fachada.id}
                data-nombre={fachada.nombre}
                data-tactil-exento="seleccion por cercania de hasta 22 px"
                points={puntosAttr(fachada.puntos)}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pointerEvents={interactivo ? "stroke" : "none"}
                role={interactivo ? "button" : undefined}
                tabIndex={interactivo ? 0 : undefined}
                aria-label={interactivo ? `${fachada.nombre}. ${estiloEstado(estado).etiqueta}` : undefined}
                onPointerEnter={(evento) => {
                  if (variante !== "completo" || evento.pointerType !== "mouse") return;
                  setHoverId(fachada.id);
                }}
                onPointerLeave={() => {
                  setHoverId((actual) => (actual === fachada.id ? null : actual));
                }}
                onClick={(evento) => {
                  if (!interactivo) return;
                  if (evento.detail === 0) {
                    abrir(fachada.id);
                    return;
                  }
                  if (variante === "completo") onPick?.(fachada.id);
                }}
                onKeyDown={(evento) => {
                  if (!interactivo) return;
                  if (evento.key !== "Enter" && evento.key !== " ") return;
                  evento.preventDefault();
                  abrir(fachada.id);
                }}
              />
            );
          })}
        </svg>
      </div>
      {ancla && hover && variante === "completo" ? (
        <div
          data-tooltip
          className="pointer-events-none absolute z-10 max-w-[14rem] rounded px-2 py-1 text-xs"
          style={{
            left: `${ancla.xPct}%`,
            top: `${ancla.yPct}%`,
            transform: `translate(${trasladoX}, ${trasladoY})`,
            background: TOOLTIP_FONDO,
            color: TOOLTIP_TEXTO,
          }}
        >
          {`${hover.nombre}. ${estiloEstado(estadoVisible(modo, estados, hover.id)).etiqueta}`}
        </div>
      ) : null}
      {variante === "completo" ? (
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
          <button
            type="button"
            aria-label="Acercar"
            className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white text-lg"
            style={{ width: 44, height: 44 }}
            onClick={() =>
              aplicarVista(zoomHacia(vista, 0.8, vista.x + vista.w / 2, vista.y + vista.h / 2))
            }
          >
            +
          </button>
          <button
            type="button"
            aria-label="Alejar"
            className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white text-lg"
            style={{ width: 44, height: 44 }}
            onClick={() =>
              aplicarVista(zoomHacia(vista, 1.25, vista.x + vista.w / 2, vista.y + vista.h / 2))
            }
          >
            −
          </button>
          <button
            type="button"
            aria-label="Encuadre"
            className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white text-xs"
            style={{ width: 44, height: 44 }}
            onClick={() => aplicarVista(VISTA_INICIAL)}
          >
            1:1
          </button>
        </div>
      ) : null}
      <HojaFachada fachada={hoja} onCerrar={cerrarHoja} onAbrirFicha={onAbrirFicha} />
    </div>
  );
}
