"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormularioEvento } from "@/components/emergencias/FormularioEvento";
import { eventoHref, type EventoListado } from "@/lib/trabajos";

type EventosListadoProps = {
  eventos: EventoListado[];
  categoriaId: string;
  subtipoId: string;
  puedeEditar: boolean;
};

function formatDate(value: string) {
  const d = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(d);
}

export function EventosListado({
  eventos,
  categoriaId,
  subtipoId,
  puedeEditar,
}: EventosListadoProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Lluvias y temporales
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eventos — cada uno agrupa filtración-proyectos por bodega
          </p>
        </div>
        {puedeEditar ? (
          <Button type="button" onClick={() => setOpen(true)}>
            Nuevo evento
          </Button>
        ) : null}
      </div>

      {eventos.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay eventos todavía. Creá uno (por ejemplo “Lluvias agosto 2026”)
          para cargar las bodegas afectadas.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {eventos.map((evento) => (
            <Link
              key={evento.id}
              href={eventoHref(categoriaId, subtipoId, evento.id)}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <p className="font-medium">{evento.nombre}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(evento.fecha)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {(evento.proyectos_count ?? 0) === 1
                  ? "1 filtración-proyecto"
                  : `${evento.proyectos_count ?? 0} filtración-proyectos`}
              </p>
            </Link>
          ))}
        </div>
      )}

      <FormularioEvento
        open={open}
        onOpenChange={setOpen}
        subtipoId={subtipoId}
        onSuccess={(id) => {
          router.push(eventoHref(categoriaId, subtipoId, id));
        }}
      />
    </div>
  );
}
