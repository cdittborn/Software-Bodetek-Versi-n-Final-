"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function FachadasError({
  error,
  reset,
  retry,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
  unstable_retry?: () => void;
}) {
  useEffect(() => {
    console.error("[fachadas] error de segmento", error);
  }, [error]);

  const reintentar =
    retry ?? unstable_retry ?? reset ?? (() => window.location.reload());

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
        <p className="font-medium">No se pudo cargar Fachadas.</p>
        <p className="mt-1">
          El resto del menú sigue disponible. Si el problema continúa, revisá el
          log del servidor con el código de error.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-red-800">
            ERROR {error.digest}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => reintentar()}
        >
          Reintentar
        </Button>
      </div>
    </main>
  );
}
