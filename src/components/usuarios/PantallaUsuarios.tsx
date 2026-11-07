"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Check, Minus } from "lucide-react";
import { guardarVisibilidad } from "@/lib/categorias/accionesVisibilidad";
import type { CategoriaPantalla, PersonaPantalla } from "@/lib/categorias/cargarUsuarios";
import {
  alternarGrupo,
  alternarHoja,
  contarMarcadas,
  estadoGrupo,
  hojasDe,
  itemsDesdeClaves,
  resumenVisibilidad,
  type EstadoCasilla,
} from "@/lib/categorias/visibilidad";
import { etiquetaRol } from "@/lib/menu";
import { cn } from "@/lib/utils";

type Props = {
  personas: PersonaPantalla[];
  categorias: CategoriaPantalla[];
  puedeGuardar: boolean;
  crearUsuario: ReactNode;
};

function Casilla({ estado }: { estado: EstadoCasilla }) {
  return (
    <span
      className={cn(
        "flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
        estado === "off" ? "border-[#C3C9D2] bg-white" : "border-ink bg-ink",
      )}
    >
      {estado === "on" ? <Check className="size-[11px] text-white" strokeWidth={3.6} aria-hidden /> : null}
      {estado === "mid" ? <Minus className="size-[11px] text-white" strokeWidth={3.6} aria-hidden /> : null}
    </span>
  );
}

export function PantallaUsuarios({ personas, categorias, puedeGuardar, crearUsuario }: Props) {
  const todas = hojasDe(categorias);
  const inicial = () => {
    const m: Record<string, string[]> = {};
    for (const p of personas) m[p.id] = p.veTodo ? todas.slice() : p.marcas.slice();
    return m;
  };
  const [sel, setSel] = useState(personas.find((p) => !p.esAdmin)?.id ?? personas[0]?.id ?? "");
  const [borrador, setBorrador] = useState<Record<string, string[]>>(inicial);
  const [guardado, setGuardado] = useState<Record<string, string[]>>(inicial);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, iniciar] = useTransition();

  const persona = personas.find((p) => p.id === sel) ?? personas[0];
  const claves = persona ? (borrador[persona.id] ?? []) : [];
  const marcadas = contarMarcadas(claves, todas);

  function poner(id: string, siguientes: string[]) {
    setBorrador((prev) => ({ ...prev, [id]: siguientes }));
    setMensaje(null);
    setError(null);
  }

  function guardar() {
    if (!persona || persona.esAdmin) return;
    const limpias = (borrador[persona.id] ?? []).filter((k) => todas.includes(k));
    const todo = todas.every((k) => limpias.includes(k));
    iniciar(async () => {
      const r = await guardarVisibilidad({
        usuarioId: persona.id,
        todo,
        items: todo ? [] : itemsDesdeClaves(limpias),
      });
      if (!r.ok) {
        setError(r.error);
        setMensaje(null);
        return;
      }
      setGuardado((prev) => ({ ...prev, [persona.id]: todo ? todas.slice() : limpias }));
      setMensaje("Listo. Ya quedó guardado.");
      setError(null);
    });
  }

  return (
    <main className="min-w-0 flex-1">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E8EBF2] px-4 py-4 min-[760px]:px-8 min-[760px]:pt-[22px] min-[760px]:pb-[18px]">
        <div>
          <div className="text-[10.5px] font-bold tracking-[1.3px] text-ink-faint uppercase">Usuarios</div>
          <h1 className="mt-1 text-[22px] leading-tight font-semibold">Usuarios</h1>
          <p className="mt-0.5 text-[13px] text-[#5f6474]">Elige qué categorías de Trabajos ve cada persona.</p>
        </div>
        {crearUsuario}
      </header>

      <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-start gap-5 px-4 py-6 min-[760px]:px-8 min-[760px]:py-7">
        <aside className="w-full overflow-hidden rounded-[10px] border border-[#E8EBF2] bg-white min-[760px]:max-w-[320px] min-[760px]:flex-1">
          <div className="flex items-baseline gap-2.5 px-[18px] pt-3.5 pb-1">
            <h2 className="text-sm font-semibold">Personas</h2>
            <span className="text-[12.5px] text-ink-faint">{personas.length}</span>
          </div>
          {personas.map((p) => {
            const n = contarMarcadas(borrador[p.id] ?? [], todas);
            const activo = p.id === persona?.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSel(p.id);
                  setMensaje(null);
                  setError(null);
                }}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 border-t border-[#F0F2F6] px-[18px] py-3 text-left",
                  activo ? "bg-[#F2F4FA] shadow-[inset_2px_0_0_#4363E0]" : "bg-white hover:bg-[#FAFBFD]",
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EEF0F5] text-[12.5px] font-semibold text-[#5f6474]">
                  {p.iniciales}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold">{p.nombre}</span>
                  <span className="block text-xs text-ink-faint">
                    {etiquetaRol(p.rol)} · {resumenVisibilidad(n, todas.length, p.esAdmin)}
                  </span>
                </span>
              </button>
            );
          })}
        </aside>

        {persona ? (
          <div className="flex w-full min-w-0 flex-col gap-4 min-[760px]:flex-[999]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-[12.5px] text-ink-faint">{etiquetaRol(persona.rol)}</div>
                <h2 className="text-lg font-semibold">{persona.nombre}</h2>
              </div>
              {persona.esAdmin ? null : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center rounded-lg border border-[#DDE1EA] bg-white px-3.5 text-[13px] font-medium"
                    onClick={() => {
                      poner(persona.id, (guardado[persona.id] ?? []).slice());
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={guardar}
                    className="inline-flex min-h-11 items-center rounded-lg bg-[#4363E0] px-3.5 text-[13px] font-semibold text-white disabled:opacity-60"
                  >
                    {guardando ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              )}
            </div>

            {persona.esAdmin ? (
              <section className="rounded-[10px] border border-[#E8EBF2] px-[18px] py-4 text-[13.5px] text-[#3A3F4E]">
                Los administradores ven todas las categorías siempre.
              </section>
            ) : (
              <section className="overflow-hidden rounded-[10px] border border-[#E8EBF2] bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EBF2] px-[18px] py-3.5">
                  <div className="flex items-baseline gap-2.5">
                    <h3 className="text-sm font-semibold">Categorías que puede ver</h3>
                    <span className="text-[12.5px] text-ink-faint">
                      {marcadas} de {todas.length}
                    </span>
                  </div>
                  <div className="flex gap-3.5 text-[12.5px]">
                    <button
                      type="button"
                      className="min-h-11 px-1 font-medium text-[#2B4FCF]"
                      onClick={() => poner(persona.id, todas.slice())}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      className="min-h-11 px-1 font-medium text-[#2B4FCF]"
                      onClick={() => poner(persona.id, [])}
                    >
                      Ninguna
                    </button>
                  </div>
                </div>
                <div className="py-1.5">
                  {categorias.map((c) => {
                    const grupo = c.subtipos.length
                      ? c.subtipos.map((s) => `${c.id}:${s.id}`)
                      : [`${c.id}:`];
                    const estado = estadoGrupo(grupo, claves);
                    return (
                      <div key={c.id} className="border-t border-[#F0F2F6]">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={estado === "on" ? "true" : estado === "mid" ? "mixed" : "false"}
                          onClick={() => poner(persona.id, alternarGrupo(claves, grupo))}
                          className="flex min-h-11 w-full items-center gap-2.5 px-[18px] py-2 text-left text-[13.5px] hover:bg-[#FAFBFD]"
                        >
                          <Casilla estado={estado} />
                          <span className="size-[9px] shrink-0 rounded-[3px]" style={{ background: c.color }} />
                          <span className="font-semibold">{c.nombre}</span>
                        </button>
                        {c.subtipos.length > 0 ? (
                          <div className="mb-1.5 ml-[46px] border-l-[1.5px] pl-3" style={{ borderColor: c.tinte }}>
                            {c.subtipos.map((s) => {
                              const hoja = `${c.id}:${s.id}`;
                              const on = claves.includes(hoja);
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  role="checkbox"
                                  aria-checked={on}
                                  onClick={() => poner(persona.id, alternarHoja(claves, hoja))}
                                  className="flex min-h-11 w-full items-center gap-2.5 py-1.5 pr-[18px] pl-1.5 text-left text-[13.5px] hover:bg-[#FAFBFD]"
                                >
                                  <Casilla estado={on ? "on" : "off"} />
                                  <span className="size-[5px] shrink-0 rounded-full" style={{ background: c.color }} />
                                  <span className={on ? "text-ink" : "text-[#8A8FA0]"}>{s.nombre}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {persona.esAdmin ? null : (
              <p className="text-[12.5px] text-ink-faint">
                Lo que no esté marcado no aparece en su menú ni puede abrirlo con un link.
                Una subcategoría nueva queda oculta para quien ya tiene la vista recortada, hasta que un administrador la marque aquí.
              </p>
            )}
            {puedeGuardar ? null : (
              <p className="text-[12.5px] text-[#8A5A12]">
                Esta función todavía no está en la base. Puedes revisar la pantalla; Guardar no cambia nada.
              </p>
            )}
            {mensaje ? <p className="text-[13px] text-[#1F7A4D]">{mensaje}</p> : null}
            {error ? <p className="text-[13px] text-[#A33B3B]">{error}</p> : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
