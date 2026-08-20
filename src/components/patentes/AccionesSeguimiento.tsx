"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatFechaCl, type TrabajoAccion } from "@/lib/trabajos";
import { cn } from "@/lib/utils";

type AccionesSeguimientoProps = {
  trabajoId: string;
  acciones: TrabajoAccion[];
  puedeEditar: boolean;
  conFecha: boolean;
};

export function AccionesSeguimiento({
  trabajoId,
  acciones,
  puedeEditar,
  conFecha,
}: AccionesSeguimientoProps) {
  const router = useRouter();
  const [descripcion, setDescripcion] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
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
      fecha_entrega: fechaEntrega || null,
    });
    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDescripcion("");
    setFechaEntrega("");
    router.refresh();
  }

  async function toggleHecha(accion: TrabajoAccion) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("trabajo_acciones")
      .update({ hecha: !accion.hecha })
      .eq("id", accion.id);
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
      <h2 className="text-base font-medium">Acciones de seguimiento</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {conFecha
          ? "Anota cada acción, su fecha de entrega y márcala cuando esté hecha."
          : "Anota las siguientes acciones para dar seguimiento."}
      </p>

      {error ? (
        <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {puedeEditar ? (
        <form onSubmit={(e) => void agregar(e)} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="accion-desc">Nueva acción</Label>
            <Input
              id="accion-desc"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Presentar plano en DOM"
            />
          </div>
          {conFecha ? (
            <div className="space-y-1.5">
              <Label htmlFor="accion-fecha">Fecha de entrega</Label>
              <Input
                id="accion-fecha"
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
              />
            </div>
          ) : null}
          <Button type="submit" size="sm" disabled={busy || !descripcion.trim()}>
            {busy ? "Guardando…" : "Agregar acción"}
          </Button>
        </form>
      ) : null}

      {acciones.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Sin acciones todavía</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {acciones.map((accion) => (
            <li
              key={accion.id}
              className="flex items-start justify-between gap-3 py-3"
            >
              <label className="flex min-w-0 flex-1 items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={accion.hecha}
                  disabled={!puedeEditar}
                  onChange={() => void toggleHecha(accion)}
                />
                <span>
                  <span
                    className={cn(
                      "block text-sm",
                      accion.hecha && "text-muted-foreground line-through",
                    )}
                  >
                    {accion.descripcion}
                  </span>
                  {accion.fecha_entrega ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Entrega: {formatFechaCl(accion.fecha_entrega)}
                    </span>
                  ) : null}
                </span>
              </label>
              {puedeEditar ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void eliminar(accion.id)}
                >
                  Quitar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
