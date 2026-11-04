"use client";

import { useState, useTransition, type DragEvent } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { tinteDeColor } from "@/lib/menu";
import { guardarMenu } from "@/lib/categorias/acciones";
import {
  agregarCategoria,
  agregarSubtipo,
  cambiarColor,
  construirPayload,
  crearEstado,
  eliminarCategoria,
  eliminarSubtipo,
  erroresEditor,
  hayCambios,
  motivoNoEliminarCategoria,
  motivoNoEliminarSubtipo,
  moverCategoria,
  moverSubtipo,
  renombrarCategoria,
  renombrarSubtipo,
  type CategoriaMenu,
  type EstadoEditor,
} from "@/lib/categorias/editorMenu";
import { cn } from "@/lib/utils";

type Props = {
  categorias: CategoriaMenu[];
  onSalir: () => void;
};

/** Fila con confirmación abierta: pregunta o motivo por el que no se puede. */
type Confirmacion = { key: string; texto: string; puede: boolean } | null;

type Arrastre = { catKey: string | null; desde: number } | null;

const BOTON_ICONO =
  "flex size-[26px] shrink-0 items-center justify-center rounded-md text-ink-faint hover:bg-[#E9ECF3] hover:text-ink disabled:opacity-35 disabled:hover:bg-transparent max-[759px]:size-11";

const INPUT =
  "h-7 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-[13px] text-ink outline-none hover:border-line focus:border-primary focus:bg-white max-[759px]:h-11 max-[759px]:text-base";

function FilaConfirmacion({
  texto,
  puede,
  onEliminar,
  onCerrar,
}: {
  texto: string;
  puede: boolean;
  onEliminar: () => void;
  onCerrar: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-1 mb-1.5 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-2 text-[12.5px] text-[#3A3F4E]"
    >
      <span className="min-w-0 flex-1">{texto}</span>
      {puede ? (
        <button
          type="button"
          onClick={onEliminar}
          className="min-h-7 rounded-md bg-[#C23B4A] px-2.5 text-[12px] font-semibold text-white max-[759px]:min-h-11"
        >
          Eliminar
        </button>
      ) : null}
      <button
        type="button"
        onClick={onCerrar}
        className="min-h-7 rounded-md border border-line bg-white px-2.5 text-[12px] font-semibold text-[#3A3F4E] max-[759px]:min-h-11"
      >
        {puede ? "No" : "Entendido"}
      </button>
    </div>
  );
}

function Asa({ onDragStart, etiqueta }: { onDragStart: (e: DragEvent) => void; etiqueta: string }) {
  return (
    <span
      draggable
      onDragStart={onDragStart}
      title={`Arrastrar ${etiqueta}`}
      aria-hidden
      className="flex shrink-0 cursor-grab items-center text-[#B5BAC6] max-[759px]:hidden"
    >
      <GripVertical className="size-3.5" />
    </span>
  );
}

export function EditorCategorias({ categorias, onSalir }: Props) {
  const [inicial] = useState(() => crearEstado(categorias));
  const [estado, setEstado] = useState<EstadoEditor>(inicial);
  const [confirmacion, setConfirmacion] = useState<Confirmacion>(null);
  const [arrastre, setArrastre] = useState<Arrastre>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, startGuardar] = useTransition();

  function cambiar(next: EstadoEditor) {
    setEstado(next);
    setConfirmacion(null);
    setError(null);
  }

  function listo() {
    const errores = erroresEditor(estado);
    if (errores.length > 0) {
      setError(errores[0]!);
      return;
    }
    if (!hayCambios(inicial, estado)) {
      onSalir();
      return;
    }
    startGuardar(async () => {
      const r = await guardarMenu(construirPayload(estado));
      if (r.ok) onSalir();
      else setError(r.error);
    });
  }

  function soltar(catKey: string | null, hasta: number) {
    if (!arrastre || arrastre.catKey !== catKey) return;
    cambiar(
      catKey == null
        ? moverCategoria(estado, arrastre.desde, hasta)
        : moverSubtipo(estado, catKey, arrastre.desde, hasta),
    );
    setArrastre(null);
  }

  function zonaSoltar(catKey: string | null, indice: number) {
    return {
      onDragOver: (e: DragEvent) => {
        if (arrastre?.catKey === catKey) e.preventDefault();
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        soltar(catKey, indice);
      },
    };
  }

  function iniciarArrastre(catKey: string | null, desde: number) {
    return (e: DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(desde));
      setArrastre({ catKey, desde });
    };
  }

  const total = estado.categorias.length;

  return (
    <div className="flex flex-col">
      <div className="mx-2 mt-2.5 mb-1 flex items-center justify-between gap-2 border-t border-line px-2.5 pt-3 pb-0.5">
        <span className="text-[10.5px] font-bold tracking-[1.3px] text-ink-faint uppercase">
          Categorías
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSalir}
            disabled={guardando}
            className="min-h-7 rounded-[7px] px-2 text-[12.5px] font-semibold text-ink-mute hover:text-ink disabled:opacity-60 max-[759px]:min-h-11"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={listo}
            disabled={guardando}
            className="min-h-7 rounded-[7px] bg-primary px-3 text-[12.5px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60 max-[759px]:min-h-11"
          >
            {guardando ? "Guardando…" : "Listo"}
          </button>
        </div>
      </div>
      <p className="mx-[18px] mb-2 text-[12px] leading-[1.45] text-ink-faint">
        Escribe sobre un nombre para cambiarlo. Toca el cuadrito de color para cambiar el color
        de la categoría. Los cambios se guardan al tocar Listo.
      </p>
      {error ? (
        <div
          role="alert"
          className="mx-2 mb-2 rounded-lg border border-[#F1C8CD] bg-white px-3 py-2 text-[12.5px] text-[#B42318]"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-0.5 px-2">
        {estado.categorias.map((cat, ci) => {
          const tinte = tinteDeColor(cat.color);
          return (
            <div key={cat.key} {...zonaSoltar(null, ci)}>
              <div className="flex items-center gap-1 py-1 pr-0.5 pl-1">
                <Asa onDragStart={iniciarArrastre(null, ci)} etiqueta={cat.nombre} />
                <button
                  type="button"
                  onClick={() => cambiar(cambiarColor(estado, cat.key))}
                  aria-label={`Cambiar color de ${cat.nombre}`}
                  className="flex size-[22px] shrink-0 items-center justify-center max-[759px]:size-11"
                >
                  <span className="size-[11px] rounded-[3px]" style={{ background: cat.color }} />
                </button>
                <input
                  value={cat.nombre}
                  onChange={(e) => cambiar(renombrarCategoria(estado, cat.key, e.target.value))}
                  aria-label="Nombre de la categoría"
                  maxLength={80}
                  className={cn(INPUT, "font-semibold")}
                />
                <button
                  type="button"
                  className={BOTON_ICONO}
                  onClick={() => cambiar(moverCategoria(estado, ci, ci - 1))}
                  disabled={ci === 0}
                  aria-label={`Subir ${cat.nombre}`}
                >
                  <ChevronUp className="size-3" strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  className={BOTON_ICONO}
                  onClick={() => cambiar(moverCategoria(estado, ci, ci + 1))}
                  disabled={ci === total - 1}
                  aria-label={`Bajar ${cat.nombre}`}
                >
                  <ChevronDown className="size-3" strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  className={cn(BOTON_ICONO, "hover:text-[#C23B4A]")}
                  aria-label={`Eliminar ${cat.nombre}`}
                  onClick={() => {
                    const motivo = motivoNoEliminarCategoria(cat);
                    const n = cat.subtipos.length;
                    setConfirmacion({
                      key: cat.key,
                      puede: motivo == null,
                      texto:
                        motivo ??
                        (n === 0
                          ? "¿Eliminar la categoría?"
                          : n === 1
                            ? "¿Eliminar la categoría y su subcategoría?"
                            : `¿Eliminar la categoría y sus ${n} subcategorías?`),
                    });
                  }}
                >
                  <Trash2 className="size-[13px]" strokeWidth={2} />
                </button>
              </div>
              {confirmacion?.key === cat.key ? (
                <FilaConfirmacion
                  texto={confirmacion.texto}
                  puede={confirmacion.puede}
                  onEliminar={() => cambiar(eliminarCategoria(estado, cat.key))}
                  onCerrar={() => setConfirmacion(null)}
                />
              ) : null}

              <div
                className="mb-1.5 ml-3.5 border-l-[1.5px] pl-2"
                style={{ borderLeftColor: tinte }}
              >
                {cat.subtipos.map((sub, si) => (
                  <div key={sub.key} {...zonaSoltar(cat.key, si)}>
                    <div className="flex items-center gap-1 py-px">
                      <Asa onDragStart={iniciarArrastre(cat.key, si)} etiqueta={sub.nombre} />
                      <span
                        aria-hidden
                        className="mx-1 size-[5px] shrink-0 rounded-full"
                        style={{ background: cat.color }}
                      />
                      <input
                        value={sub.nombre}
                        onChange={(e) =>
                          cambiar(renombrarSubtipo(estado, cat.key, sub.key, e.target.value))
                        }
                        aria-label="Nombre de la subcategoría"
                        maxLength={80}
                        className={INPUT}
                      />
                      <button
                        type="button"
                        className={BOTON_ICONO}
                        onClick={() => cambiar(moverSubtipo(estado, cat.key, si, si - 1))}
                        disabled={si === 0}
                        aria-label={`Subir ${sub.nombre}`}
                      >
                        <ChevronUp className="size-[11px]" strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        className={BOTON_ICONO}
                        onClick={() => cambiar(moverSubtipo(estado, cat.key, si, si + 1))}
                        disabled={si === cat.subtipos.length - 1}
                        aria-label={`Bajar ${sub.nombre}`}
                      >
                        <ChevronDown className="size-[11px]" strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        className={cn(BOTON_ICONO, "hover:text-[#C23B4A]")}
                        aria-label={`Eliminar ${sub.nombre}`}
                        onClick={() => {
                          const motivo = motivoNoEliminarSubtipo(sub);
                          setConfirmacion({
                            key: sub.key,
                            puede: motivo == null,
                            texto: motivo ?? "¿Eliminar esta subcategoría?",
                          });
                        }}
                      >
                        <Trash2 className="size-3" strokeWidth={2} />
                      </button>
                    </div>
                    {confirmacion?.key === sub.key ? (
                      <FilaConfirmacion
                        texto={confirmacion.texto}
                        puede={confirmacion.puede}
                        onEliminar={() => cambiar(eliminarSubtipo(estado, cat.key, sub.key))}
                        onCerrar={() => setConfirmacion(null)}
                      />
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => cambiar(agregarSubtipo(estado, cat.key))}
                  className="mt-0.5 flex min-h-7 w-full items-center gap-1.5 rounded-[7px] px-2 text-[12.5px] text-ink-mute hover:bg-[#EEF1F7] hover:text-ink max-[759px]:min-h-11"
                >
                  <Plus className="size-3" strokeWidth={2.4} aria-hidden />
                  Agregar subcategoría
                </button>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => cambiar(agregarCategoria(estado))}
          className="mt-2 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-[7px] border border-dashed border-[#D3D7E0] text-[12.5px] text-ink-mute hover:bg-[#EEF1F7] hover:text-ink max-[759px]:min-h-11"
        >
          <Plus className="size-3" strokeWidth={2.4} aria-hidden />
          Nueva categoría
        </button>
      </div>
    </div>
  );
}
