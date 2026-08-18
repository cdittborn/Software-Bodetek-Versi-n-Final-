"use client";

import { useRef } from "react";
import type { EtiquetaPlano } from "@/lib/recintos";
import { cn } from "@/lib/utils";

type PlanoMapaProps = {
  imagenUrl: string;
  etiquetas: EtiquetaPlano[];
  editable?: boolean;
  onPosicionChange?: (
    recintoId: string,
    xPct: number,
    yPct: number,
    persist: boolean,
  ) => void;
};

function clampPct(n: number) {
  return Math.min(100, Math.max(0, Math.round(n * 1000) / 1000));
}

export function PlanoMapa({
  imagenUrl,
  etiquetas,
  editable = false,
  onPosicionChange,
}: PlanoMapaProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  function clientToPct(clientX: number, clientY: number) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: 50, y: 50 };
    }
    return {
      x: clampPct(((clientX - rect.left) / rect.width) * 100),
      y: clampPct(((clientY - rect.top) / rect.height) * 100),
    };
  }

  function startDrag(
    event: React.PointerEvent<HTMLButtonElement>,
    recintoId: string,
  ) {
    if (!editable || !onPosicionChange) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const move = (ev: PointerEvent) => {
      const { x, y } = clientToPct(ev.clientX, ev.clientY);
      onPosicionChange(recintoId, x, y, false);
    };
    const up = (ev: PointerEvent) => {
      const { x, y } = clientToPct(ev.clientX, ev.clientY);
      onPosicionChange(recintoId, x, y, true);
      target.releasePointerCapture(ev.pointerId);
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", up);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
  }

  return (
    <div
      ref={frameRef}
      className="relative w-full overflow-hidden rounded-lg border bg-muted"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- URL R2 dinámica; el anclaje % usa el box del img */}
      <img
        src={imagenUrl}
        alt="Plano del complejo"
        className="block h-auto w-full select-none"
        draggable={false}
      />
      {etiquetas.map((e) => {
        const texto = e.arrendatario_actual?.trim() || e.codigo;
        const inner = (
          <span className="flex max-w-40 flex-col items-center leading-tight">
            <span className="truncate font-medium">{texto}</span>
            {editable ? (
              <span className="truncate text-[10px] text-muted-foreground">
                {e.codigo}
              </span>
            ) : null}
          </span>
        );

        const className = cn(
          "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-background/90 px-1.5 py-0.5 text-center text-xs shadow-sm",
          editable && "cursor-grab touch-none select-none active:cursor-grabbing",
        );

        if (!editable) {
          return (
            <div
              key={e.recintoId}
              className={className}
              style={{ left: `${e.x_pct}%`, top: `${e.y_pct}%` }}
            >
              {inner}
            </div>
          );
        }

        return (
          <button
            key={e.recintoId}
            type="button"
            className={className}
            style={{ left: `${e.x_pct}%`, top: `${e.y_pct}%` }}
            onPointerDown={(ev) => startDrag(ev, e.recintoId)}
            aria-label={`Mover etiqueta ${e.codigo}`}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
