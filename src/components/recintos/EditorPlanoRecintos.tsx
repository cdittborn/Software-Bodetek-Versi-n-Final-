"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { PlanoMapa } from "@/components/recintos/PlanoMapa";
import {
  etiquetaCodigoRecinto,
  toPct,
  type EtiquetaPlano,
  type PlanoActivo,
  type RecintoListado,
} from "@/lib/recintos";

type EditorPlanoRecintosProps = {
  plano: PlanoActivo | null;
  etiquetasIniciales: EtiquetaPlano[];
  recintos: RecintoListado[];
};

export function EditorPlanoRecintos({
  plano: planoInicial,
  etiquetasIniciales,
  recintos,
}: EditorPlanoRecintosProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [plano, setPlano] = useState(planoInicial);
  const [etiquetas, setEtiquetas] = useState(etiquetasIniciales);
  const [recintoNuevo, setRecintoNuevo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlano(planoInicial);
    setEtiquetas(etiquetasIniciales);
    // Solo al cambiar el plano (primera subida o reemplazo de imagen).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planoInicial?.id, planoInicial?.imagenUrl]);

  const posicionados = useMemo(
    () => new Set(etiquetas.map((e) => e.recintoId)),
    [etiquetas],
  );
  const disponibles = recintos.filter((r) => !posicionados.has(r.id));

  async function persistPosicion(
    posicionId: string,
    xPct: number,
    yPct: number,
  ) {
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("recinto_posiciones_plano")
      .update({
        x_pct: xPct,
        y_pct: yPct,
        updated_at: new Date().toISOString(),
      })
      .eq("id", posicionId);
    if (updateError) throw new Error(updateError.message);
  }

  function onPosicionChange(
    recintoId: string,
    xPct: number,
    yPct: number,
    persist: boolean,
  ) {
    setEtiquetas((prev) => {
      const next = prev.map((e) =>
        e.recintoId === recintoId ? { ...e, x_pct: xPct, y_pct: yPct } : e,
      );
      if (persist) {
        const actual = next.find((e) => e.recintoId === recintoId);
        if (actual) {
          void persistPosicion(actual.posicionId, xPct, yPct).catch(
            (err: unknown) => {
              setError(err instanceof Error ? err.message : "No se pudo guardar");
            },
          );
        }
      }
      return next;
    });
  }

  async function onXInput(recintoId: string, raw: string) {
    const xPct = toPct(raw);
    const actual = etiquetas.find((e) => e.recintoId === recintoId);
    if (!actual) return;
    setEtiquetas((prev) =>
      prev.map((e) => (e.recintoId === recintoId ? { ...e, x_pct: xPct } : e)),
    );
    try {
      await persistPosicion(actual.posicionId, xPct, actual.y_pct);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  async function onYInput(recintoId: string, raw: string) {
    const yPct = toPct(raw);
    const actual = etiquetas.find((e) => e.recintoId === recintoId);
    if (!actual) return;
    setEtiquetas((prev) =>
      prev.map((e) => (e.recintoId === recintoId ? { ...e, y_pct: yPct } : e)),
    );
    try {
      await persistPosicion(actual.posicionId, actual.x_pct, yPct);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  async function agregarRecinto() {
    if (!plano || !recintoNuevo) return;
    const recinto = recintos.find((r) => r.id === recintoNuevo);
    if (!recinto) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("recinto_posiciones_plano")
      .insert({
        plano_id: plano.id,
        recinto_id: recinto.id,
        x_pct: 50,
        y_pct: 50,
      })
      .select("id")
      .single();
    setBusy(false);
    if (insertError || !data) {
      setError(insertError?.message ?? "No se pudo agregar");
      return;
    }
    setEtiquetas((prev) => [
      ...prev,
      {
        posicionId: data.id,
        recintoId: recinto.id,
        codigo: recinto.codigo,
        sitio: recinto.sitio,
        galpon: recinto.galpon,
        arrendatario_actual: recinto.arrendatario_actual,
        x_pct: 50,
        y_pct: 50,
      },
    ]);
    setRecintoNuevo("");
  }

  async function quitarEtiqueta(posicionId: string) {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("recinto_posiciones_plano")
      .delete()
      .eq("id", posicionId);
    setBusy(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEtiquetas((prev) => prev.filter((e) => e.posicionId !== posicionId));
  }

  async function onArchivo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreArchivo: file.name || "plano.jpg",
          tipoArchivo: file.type || "image/jpeg",
          carpeta: "planos",
        }),
      });
      const presign = (await presignRes.json()) as {
        url?: string;
        key?: string;
        error?: string;
      };
      if (!presignRes.ok || !presign.url || !presign.key) {
        throw new Error(presign.error ?? "No se pudo firmar la subida");
      }
      const put = await fetch(presign.url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!put.ok) {
        throw new Error(
          `R2 rechazó el archivo (${put.status}). Revisa CORS del bucket si es un PUT desde el navegador.`,
        );
      }

      const supabase = createClient();
      if (plano) {
        const { error: updateError } = await supabase
          .from("planos")
          .update({
            imagen_key: presign.key,
            updated_at: new Date().toISOString(),
          })
          .eq("id", plano.id);
        if (updateError) throw new Error(updateError.message);
        router.refresh();
        return;
      }

      const { data, error: insertError } = await supabase
        .from("planos")
        .insert({
          nombre: "Plano general",
          imagen_key: presign.key,
          activo: true,
        })
        .select("id")
        .single();
      if (insertError || !data) {
        throw new Error(insertError?.message ?? "No se pudo crear el plano");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => void onArchivo(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {plano ? "Cambiar imagen" : "Subir plano"}
        </Button>
        {plano && disponibles.length > 0 ? (
          <>
            <div className="space-y-1.5">
              <Label>Agregar recinto</Label>
              <Select
                value={recintoNuevo || null}
                onValueChange={(v) => setRecintoNuevo(v ?? "")}
              >
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Elegir recinto" />
                </SelectTrigger>
                <SelectContent>
                  {disponibles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {etiquetaCodigoRecinto(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              disabled={busy || !recintoNuevo}
              onClick={() => void agregarRecinto()}
            >
              Agregar etiqueta
            </Button>
          </>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!plano ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          Sube una imagen del plano (PNG, JPG o WebP). El PDF hay que
          convertirlo a imagen antes.
        </p>
      ) : (
        <>
          <PlanoMapa
            imagenUrl={plano.imagenUrl}
            etiquetas={etiquetas}
            editable
            onPosicionChange={onPosicionChange}
          />
          {etiquetas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Agrega recintos y arrastra las etiquetas sobre el plano, o edita
              X/Y abajo (porcentaje 0–100).
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {etiquetas.map((e) => (
                <div
                  key={e.posicionId}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {e.arrendatario_actual || "Sin arrendatario"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {etiquetaCodigoRecinto(e)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={busy}
                      onClick={() => void quitarEtiqueta(e.posicionId)}
                    >
                      Quitar
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`x-${e.posicionId}`}>X %</Label>
                      <Input
                        id={`x-${e.posicionId}`}
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={e.x_pct}
                        onChange={(ev) =>
                          setEtiquetas((prev) =>
                            prev.map((item) =>
                              item.posicionId === e.posicionId
                                ? { ...item, x_pct: toPct(ev.target.value) }
                                : item,
                            ),
                          )
                        }
                        onBlur={(ev) => void onXInput(e.recintoId, ev.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`y-${e.posicionId}`}>Y %</Label>
                      <Input
                        id={`y-${e.posicionId}`}
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={e.y_pct}
                        onChange={(ev) =>
                          setEtiquetas((prev) =>
                            prev.map((item) =>
                              item.posicionId === e.posicionId
                                ? { ...item, y_pct: toPct(ev.target.value) }
                                : item,
                            ),
                          )
                        }
                        onBlur={(ev) => void onYInput(e.recintoId, ev.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
