"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { mediaPortada } from "@/lib/fachadas/ficha";
import { formatFechaCl } from "@/lib/trabajos";
import { labelEstadoIntervencion } from "@/lib/fachadas/estado";
import { subirFotoIntervencion } from "@/lib/fachadas/upload";
import { cn } from "@/lib/utils";
import type { ArchivoFachada, IntervencionDetalle, MediaFachada } from "@/lib/fachadas/tipos";

export function ComparadorAntesDespues({
  fachadaId,
  fotoInicial,
  intervenciones,
  seleccionId,
  onSelect,
  puedeEditar,
  onNuevaFoto,
}: {
  fachadaId: string;
  fotoInicial: ArchivoFachada;
  intervenciones: IntervencionDetalle[];
  seleccionId: string | null;
  onSelect: (id: string) => void;
  puedeEditar: boolean;
  onNuevaFoto: (media: MediaFachada) => void;
}) {
  const [pct, setPct] = useState(50);
  const [tipoSubida, setTipoSubida] = useState<"antes" | "despues">("despues");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;
    const sync = () => setAncho(el.clientWidth);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const seleccion =
    intervenciones.find((i) => i.id === seleccionId) ?? intervenciones[0] ?? null;
  const antes = seleccion ? mediaPortada(seleccion.media, "antes") : null;
  const despues = seleccion ? mediaPortada(seleccion.media, "despues") : null;
  const urlAntes = antes?.publicUrl ?? fotoInicial.url;
  const urlDespues = despues?.publicUrl ?? null;
  const thumbs = seleccion
    ? seleccion.media.filter((m) => m.tipoArchivo === "foto" && m.publicUrl)
    : [];

  function setFromClientX(clientX: number) {
    const el = dragRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPct(Math.min(100, Math.max(0, next)));
  }

  async function onFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !seleccion) return;
    setBusy(true);
    setError(null);
    try {
      const media = await subirFotoIntervencion({
        file,
        fachadaId,
        intervencionId: seleccion.id,
        tipo: tipoSubida,
      });
      onNuevaFoto(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Antes / después</h2>
        {puedeEditar && seleccion ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 min-h-10 rounded-lg border bg-background px-2 text-sm"
              value={tipoSubida}
              onChange={(e) =>
                setTipoSubida(e.target.value === "antes" ? "antes" : "despues")
              }
              aria-label="Tipo de foto"
            >
              <option value="antes">Antes</option>
              <option value="despues">Después</option>
            </select>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              className="h-10 min-h-10 px-3"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? "Subiendo…" : "+ Subir fotos"}
            </Button>
          </div>
        ) : null}
      </div>

      {intervenciones.length > 0 ? (
        <div role="tablist" className="flex flex-wrap gap-2">
          {intervenciones.map((i) => {
            const on = i.id === seleccion?.id;
            return (
              <button
                key={i.id}
                type="button"
                role="tab"
                aria-selected={on}
                className={cn(
                  "min-h-10 rounded-lg border px-3 text-sm font-medium",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted",
                )}
                onClick={() => onSelect(i.id)}
              >
                {formatFechaCl(i.fechaInicio)} · {labelEstadoIntervencion(i.estado)}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Cuando haya una intervención, acá se comparan las fotos de antes y
          después.
        </p>
      )}

      <div
        ref={dragRef}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 0) return;
          setFromClientX(e.clientX);
        }}
      >
        {urlDespues ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urlDespues}
            alt="Después"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Sin foto de después
          </div>
        )}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white"
          style={{ width: `${pct}%` }}
        >
          {urlAntes ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlAntes}
              alt="Antes"
              className="absolute left-0 top-0 h-full max-w-none object-cover"
              style={{ width: ancho || "100%" }}
              draggable={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
              Sin foto de antes
            </div>
          )}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white"
          style={{ left: `${pct}%` }}
        />
      </div>

      <label className="block space-y-1">
        <span className="text-xs text-muted-foreground">
          Divisor del comparador ({Math.round(pct)}% antes)
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          aria-label="Divisor antes y después"
          className="h-10 min-h-10 w-full"
          onChange={(e) => setPct(Number(e.target.value))}
        />
      </label>

      {thumbs.length > 0 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {thumbs.map((m) => (
            <li key={m.id} className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.thumbnailUrl ?? m.publicUrl ?? ""}
                alt={m.tipo}
                className="h-16 w-16 rounded-md object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
