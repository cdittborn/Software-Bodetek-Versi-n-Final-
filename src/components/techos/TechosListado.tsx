"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormularioTecho } from "@/components/techos/FormularioTecho";
import {
  formatFechaCl,
  trabajoHref,
  type TechoListado,
} from "@/lib/trabajos";

type TechosListadoProps = {
  techos: TechoListado[];
  categoriaId: string;
  subtipoId: string;
  puedeEditar: boolean;
};

export function TechosListado({
  techos,
  categoriaId,
  subtipoId,
  puedeEditar,
}: TechosListadoProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Revisiones y mantenciones periódicas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Techos sujetos a revisión periódica
          </p>
        </div>
        {puedeEditar ? (
          <Button type="button" onClick={() => setOpen(true)}>
            Nuevo techo
          </Button>
        ) : null}
      </div>

      {techos.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay techos todavía
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {techos.map((techo) => (
            <Link
              key={techo.id}
              href={trabajoHref(categoriaId, subtipoId, techo.id)}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
            >
              <p className="font-medium">{techo.titulo}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {techo.descripcion || techo.materiales || "Sin estado cargado"}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Última: {formatFechaCl(techo.fecha_ultima_revision)} · Próxima:{" "}
                {formatFechaCl(techo.proxima_mantencion)}
              </p>
            </Link>
          ))}
        </div>
      )}

      <FormularioTecho
        open={open}
        onOpenChange={setOpen}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        onSuccess={(id) => {
          if (id) router.push(trabajoHref(categoriaId, subtipoId, id));
          else router.refresh();
        }}
      />
    </div>
  );
}
