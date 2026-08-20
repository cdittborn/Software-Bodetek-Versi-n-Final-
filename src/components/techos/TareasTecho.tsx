"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ESTADO_ACCION_LABEL,
  ESTADOS_ACCION,
  formatFechaCl,
  type EstadoAccion,
  type TrabajoAccion,
} from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type TareasTechoProps = {
  trabajoId: string;
  tareas: TrabajoAccion[];
  puedeEditar: boolean;
};

export function TareasTecho({ trabajoId, tareas, puedeEditar }: TareasTechoProps) {
  const router = useRouter();
  const [descripcion, setDescripcion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    const texto = descripcion.trim();
    if (!texto) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("trabajo_acciones").insert({
      trabajo_id: trabajoId,
      descripcion: texto,
      estado: "pendiente",
    });
    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDescripcion("");
    router.refresh();
  }

  async function cambiarEstado(id: string, estado: EstadoAccion) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("trabajo_acciones")
      .update({ estado })
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  async function eliminar(id: string) {
    const supabase = createClient();
    const { error: delError } = await supabase
      .from("trabajo_acciones")
      .delete()
      .eq("id", id);
    if (delError) {
      setError(delError.message);
      return;
    }
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-base font-medium">Tareas del plan de acción</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Seguimiento de cada tarea: pendiente, en proceso o terminada.
      </p>

      {error ? (
        <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {puedeEditar ? (
        <form onSubmit={(e) => void agregar(e)} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tarea-desc">Nueva tarea</Label>
            <Input
              id="tarea-desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Cambiar canaleta norte"
            />
          </div>
          <Button type="submit" size="sm" disabled={busy || !descripcion.trim()}>
            {busy ? "Guardando…" : "Agregar tarea"}
          </Button>
        </form>
      ) : null}

      {tareas.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Sin tareas todavía</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {tareas.map((tarea) => (
            <li
              key={tarea.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-sm",
                    tarea.estado === "terminada" &&
                      "text-muted-foreground line-through",
                  )}
                >
                  {tarea.descripcion}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Creada: {formatFechaCl(tarea.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {puedeEditar ? (
                  <Select
                    value={tarea.estado}
                    onValueChange={(v) => {
                      if (!v) return;
                      void cambiarEstado(tarea.id, v as EstadoAccion);
                    }}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_ACCION.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {ESTADO_ACCION_LABEL[estado]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs">{ESTADO_ACCION_LABEL[tarea.estado]}</span>
                )}
                {puedeEditar ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void eliminar(tarea.id)}
                  >
                    Quitar
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
