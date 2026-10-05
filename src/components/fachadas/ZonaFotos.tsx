"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import { Camera, ImageIcon, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PARALELO_SUBIDA,
  mensajeSubida,
  validarArchivoFachada,
  formatDuracionVideo,
  type EstadoItemCola,
} from "@/lib/fachadas/cola-subida";
import { cn } from "@/lib/utils";

export type ItemColaUi = {
  id: string;
  nombre: string;
  estado: EstadoItemCola;
  progreso: number;
  error: string | null;
};

type Job = ItemColaUi & { file: File };

export function useColaSubida(
  subir: (file: File, onProgress: (fraccion: number) => void) => Promise<void>,
) {
  const [items, setItems] = useState<ItemColaUi[]>([]);
  const archivos = useRef(new Map<string, File>());
  const pendientes = useRef<Job[]>([]);
  const activos = useRef(0);
  const subirRef = useRef(subir);
  subirRef.current = subir;

  function patch(id: string, parcial: Partial<ItemColaUi>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...parcial } : it)));
  }

  function bombear() {
    while (activos.current < PARALELO_SUBIDA && pendientes.current.length > 0) {
      const job = pendientes.current.shift();
      if (!job) break;
      const file = archivos.current.get(job.id);
      if (!file) continue;
      activos.current += 1;
      patch(job.id, { estado: "subiendo", progreso: 0, error: null });
      subirRef.current(file, (fraccion) => {
        patch(job.id, { progreso: Math.max(0, Math.min(1, fraccion)) });
      })
        .then(() => {
          patch(job.id, { estado: "listo", progreso: 1, error: null });
        })
        .catch((err: unknown) => {
          patch(job.id, {
            estado: "error",
            error: err instanceof Error ? err.message : "Error al subir",
          });
        })
        .finally(() => {
          activos.current -= 1;
          bombear();
        });
    }
  }

  function encolar(files: File[]): string[] {
    const avisos: string[] = [];
    const nuevos: ItemColaUi[] = [];
    for (const file of files) {
      const v = validarArchivoFachada(file);
      if (!v.ok) {
        avisos.push(v.mensaje);
        continue;
      }
      const id = crypto.randomUUID();
      archivos.current.set(id, file);
      const job: Job = {
        id,
        file,
        nombre: file.name || "archivo",
        estado: "en_cola",
        progreso: 0,
        error: null,
      };
      nuevos.push(job);
      pendientes.current.push(job);
    }
    if (nuevos.length) setItems((prev) => [...prev, ...nuevos]);
    queueMicrotask(bombear);
    return avisos;
  }

  function reintentar(id: string) {
    const file = archivos.current.get(id);
    if (!file) return;
    const job: Job = {
      id,
      file,
      nombre: file.name || "archivo",
      estado: "en_cola",
      progreso: 0,
      error: null,
    };
    patch(id, { estado: "en_cola", progreso: 0, error: null });
    pendientes.current.push(job);
    queueMicrotask(bombear);
  }

  return { items, encolar, reintentar };
}

export function ZonaSoltarArchivos({
  onFiles,
  children,
  className,
  zona,
}: {
  onFiles: (files: File[]) => void;
  children: ReactNode;
  className?: string;
  zona?: string;
}) {
  const [sobre, setSobre] = useState(false);
  return (
    <div
      data-zona={zona}
      className={cn(className, sobre && "ring-2 ring-[#e30613]/40")}
      onDragEnter={(e) => {
        e.preventDefault();
        setSobre(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setSobre(true);
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSobre(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(files);
      }}
    >
      {children}
    </div>
  );
}

export function BotonesCapturaGaleria({
  disabled,
  onFiles,
  etiquetaCamara = "Tomar foto/video",
  etiquetaGaleria = "Elegir de galería / archivos",
  galeriaRef: galeriaRefProp,
}: {
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  etiquetaCamara?: string;
  etiquetaGaleria?: string;
  galeriaRef?: RefObject<HTMLInputElement | null>;
}) {
  const camaraRef = useRef<HTMLInputElement>(null);
  const galeriaInterna = useRef<HTMLInputElement>(null);
  const galeriaRef = galeriaRefProp ?? galeriaInterna;

  function tomar(lista: FileList | null, input: HTMLInputElement | null) {
    const files = lista ? Array.from(lista) : [];
    if (input) input.value = "";
    if (files.length) onFiles(files);
  }

  return (
    <div className="flex flex-row gap-2">
      <input
        ref={camaraRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        data-origen="camara"
        className="hidden"
        onChange={(e) => tomar(e.target.files, e.currentTarget)}
      />
      <input
        ref={galeriaRef}
        type="file"
        accept="image/*,video/*"
        multiple
        data-origen="galeria"
        className="hidden"
        onChange={(e) => tomar(e.target.files, e.currentTarget)}
      />
      <Button
        type="button"
        className="h-auto min-h-12 flex-1 whitespace-normal rounded-xl bg-black px-2 py-2 text-center text-sm leading-tight text-white hover:bg-black/90"
        disabled={disabled}
        onClick={() => camaraRef.current?.click()}
      >
        <Camera className="size-4" />
        {etiquetaCamara}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-12 flex-1 whitespace-normal rounded-xl px-2 py-2 text-center text-sm leading-tight"
        disabled={disabled}
        onClick={() => galeriaRef.current?.click()}
      >
        <ImageIcon className="size-4" />
        {etiquetaGaleria}
      </Button>
    </div>
  );
}

export function ListaColaSubida({
  items,
  onReintentar,
}: {
  items: ItemColaUi[];
  onReintentar: (id: string) => void;
}) {
  const visibles = items.filter((it) => it.estado !== "listo");
  const mensaje = mensajeSubida(items);
  if (!mensaje && visibles.length === 0) return null;
  return (
    <div className="space-y-2">
      {mensaje ? <p className="text-sm font-medium">{mensaje}</p> : null}
      <ul className="space-y-2">
        {visibles.map((it) => (
          <li key={it.id} className="rounded-lg border border-[#e6e3de] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm">{it.nombre}</p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {it.estado === "en_cola"
                  ? "En cola"
                  : it.estado === "subiendo"
                    ? `${Math.round(it.progreso * 100)}%`
                    : "Error"}
              </span>
            </div>
            <div className="fd-progress mt-1.5">
              <span
                style={{
                  width: `${it.estado === "en_cola" ? 0 : Math.round(it.progreso * 100)}%`,
                }}
              />
            </div>
            {it.estado === "error" ? (
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-xs text-destructive">{it.error ?? "No se pudo subir"}</p>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#e30613]"
                  onClick={() => onReintentar(it.id)}
                >
                  Reintentar
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MiniaturaMedia({
  tipoArchivo,
  src,
  videoUrl,
  duracionSeg,
  alt,
  className,
  alTocar,
  ampliar = true,
}: {
  tipoArchivo: "foto" | "video";
  src: string | null;
  videoUrl?: string | null;
  duracionSeg?: number | null;
  alt: string;
  className?: string;
  alTocar?: () => void;
  ampliar?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [leidos, setLeidos] = useState<number | null>(null);
  const segundos = duracionSeg ?? leidos;
  const videoRef = useRef<HTMLVideoElement>(null);

  if (tipoArchivo === "video" && abierto && videoUrl) {
    return (
      <video
        src={videoUrl}
        className={cn("bg-black object-contain", className)}
        controls
        autoPlay
        playsInline
      />
    );
  }

  const cuerpo = (
    <>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className={cn("object-cover", className)} />
      ) : (
        <span className={cn("block bg-[#eceae7]", className)} />
      )}
      {tipoArchivo === "video" ? (
        <>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-8 items-center justify-center rounded-full bg-black/70 text-white">
              <Play className="size-4 fill-white" />
            </span>
          </span>
          {segundos != null ? (
            <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] font-semibold text-white">
              {formatDuracionVideo(segundos)}
            </span>
          ) : null}
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              preload="metadata"
              muted
              playsInline
              className="pointer-events-none absolute h-px w-px opacity-0"
              onLoadedMetadata={(e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d)) setLeidos(d);
              }}
            />
          ) : null}
        </>
      ) : null}
    </>
  );

  if (!ampliar) {
    return <span className="relative block w-full">{cuerpo}</span>;
  }

  if (tipoArchivo === "video") {
    return (
      <button
        type="button"
        className="relative block w-full"
        onClick={() => {
          alTocar?.();
          if (videoUrl) setAbierto(true);
        }}
      >
        {cuerpo}
      </button>
    );
  }

  return <span className="relative block w-full">{cuerpo}</span>;
}
