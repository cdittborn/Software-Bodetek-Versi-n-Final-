"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import {
  BotonesCapturaGaleria,
  ListaColaSubida,
  MiniaturaMedia,
  ZonaSoltarArchivos,
  useColaSubida,
} from "@/components/fachadas/ZonaFotos";
import { validarArchivoFachada } from "@/lib/fachadas/cola-subida";
import {
  materializarArchivoLocal,
  subirArchivoEstadoFachada,
} from "@/lib/fachadas/upload";
import {
  borrarArchivoEstado,
  marcarPortadaArchivoEstado,
} from "@/lib/fachadas/guardar";
import type { ArchivoEstadoFachada } from "@/lib/fachadas/tipos";

export function GaleriaEstadoFachada({
  fachadaId,
  iniciales,
  puedeEditar,
  puedeBorrar,
  modoDemo = false,
}: {
  fachadaId: string;
  iniciales: ArchivoEstadoFachada[];
  puedeEditar: boolean;
  puedeBorrar: boolean;
  modoDemo?: boolean;
}) {
  const [archivos, setArchivos] = useState(iniciales);
  const [aviso, setAviso] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<ArchivoEstadoFachada | null>(null);
  const [confirmar, setConfirmar] = useState<ArchivoEstadoFachada | null>(null);
  const hayPortada = useRef(iniciales.some((a) => a.tipoArchivo === "foto" && a.esPortada));

  const cola = useColaSubida(async (file, onProgress) => {
    const reclama = file.type.startsWith("image/") && !hayPortada.current;
    if (reclama) hayPortada.current = true;
    const item = modoDemo
      ? await materializarArchivoLocal(file, onProgress)
      : await subirArchivoEstadoFachada({
          file,
          fachadaId,
          esPortada: reclama,
          onProgress,
        });
    const esPortada = item.tipoArchivo === "foto" && (item.esPortada || reclama);
    setArchivos((lista) => [
      ...lista.map((a) => (esPortada ? { ...a, esPortada: false } : a)),
      { ...item, esPortada, orden: lista.length },
    ]);
  });

  function recibir(files: File[]) {
    const avisos: string[] = [];
    const ok: File[] = [];
    for (const file of files) {
      const v = validarArchivoFachada(file);
      if (!v.ok) avisos.push(v.mensaje);
      else ok.push(file);
    }
    setAviso(avisos.length ? avisos.join(" ") : null);
    if (!ok.length) return;
    const rechazos = cola.encolar(ok);
    if (rechazos.length) setAviso(rechazos.join(" "));
  }

  async function elegirPortada(item: ArchivoEstadoFachada) {
    if (item.tipoArchivo !== "foto") return;
    if (!modoDemo) await marcarPortadaArchivoEstado({ id: item.id, fachadaId });
    hayPortada.current = true;
    setArchivos((lista) => lista.map((a) => ({ ...a, esPortada: a.id === item.id })));
    setAbierto((actual) => (actual ? { ...actual, esPortada: actual.id === item.id } : actual));
  }

  async function eliminar(item: ArchivoEstadoFachada) {
    if (!modoDemo) await borrarArchivoEstado(item.id);
    setArchivos((lista) => {
      const queda = lista.filter((a) => a.id !== item.id);
      if (item.esPortada) {
        const siguiente = queda.find((a) => a.tipoArchivo === "foto");
        hayPortada.current = Boolean(siguiente);
        return queda.map((a) => ({ ...a, esPortada: siguiente ? a.id === siguiente.id : false }));
      }
      return queda;
    });
    setConfirmar(null);
    setAbierto(null);
  }

  return (
    <section className="fd-card fd-ficha-galeria p-4">
      <h2 className="text-sm font-semibold">Fotos de la fachada</h2>
      <p className="fd-hint mb-3">Estado actual. La ★ es la miniatura del listado.</p>
      <ZonaSoltarArchivos onFiles={puedeEditar ? recibir : () => undefined} zona="estado-fachada">
        {puedeEditar ? (
          <div className="space-y-2">
            <BotonesCapturaGaleria onFiles={recibir} />
            <p className="fd-hint">En el computador también puedes arrastrar varios archivos aquí.</p>
          </div>
        ) : null}
        <ul className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-6">
          {archivos.map((item) => (
            <li key={item.id} data-archivo data-nombre={item.nombreArchivo ?? ""}>
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setAbierto(item)}
              >
                <MiniaturaMedia
                  tipoArchivo={item.tipoArchivo}
                  src={item.thumbnailUrl || (item.tipoArchivo === "foto" ? item.publicUrl : null)}
                  videoUrl={item.publicUrl}
                  duracionSeg={item.duracionSeg}
                  alt={item.nombreArchivo ?? ""}
                  className="h-20 w-full rounded-md"
                  ampliar={false}
                />
              </button>
              {item.tipoArchivo === "foto" && item.esPortada ? (
                <p className="fd-thumb-cap">★ Portada</p>
              ) : null}
            </li>
          ))}
        </ul>
        <ListaColaSubida items={cola.items} onReintentar={cola.reintentar} />
        {aviso ? <p className="mt-2 text-sm text-destructive">{aviso}</p> : null}
      </ZonaSoltarArchivos>

      {abierto ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
          <button
            type="button"
            className="absolute top-3 right-3 rounded-full bg-white/90 p-2"
            aria-label="Cerrar"
            onClick={() => setAbierto(null)}
          >
            <X className="size-5" />
          </button>
          <div className="max-h-[85vh] w-full max-w-3xl">
            {abierto.tipoArchivo === "video" && abierto.publicUrl ? (
              <video
                src={abierto.publicUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[75vh] w-full bg-black"
              />
            ) : abierto.publicUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={abierto.publicUrl}
                alt={abierto.nombreArchivo ?? ""}
                className="max-h-[75vh] w-full object-contain"
              />
            ) : null}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {puedeEditar && abierto.tipoArchivo === "foto" && !abierto.esPortada ? (
                <button
                  type="button"
                  className="h-12 rounded-xl bg-white px-4 text-sm font-semibold"
                  onClick={() => void elegirPortada(abierto)}
                >
                  ★ Portada
                </button>
              ) : null}
              {puedeBorrar ? (
                <button
                  type="button"
                  className="h-12 rounded-xl bg-[#e30613] px-4 text-sm font-semibold text-white"
                  onClick={() => setConfirmar(abierto)}
                >
                  Eliminar
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {confirmar ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4">
            <p className="text-sm font-semibold">¿Eliminar este archivo?</p>
            <p className="fd-hint mt-1">{confirmar.nombreArchivo}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="h-12 flex-1 rounded-xl border"
                onClick={() => setConfirmar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="h-12 flex-1 rounded-xl bg-[#e30613] font-semibold text-white"
                onClick={() => void eliminar(confirmar)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
