"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatFechaCl,
  formatMontoClp,
  parseMonto,
  type TrabajoPago,
  type TrabajoPresupuestoItem,
} from "@/lib/trabajos";

type PresupuestoYPagosProps = {
  trabajoId: string;
  items: TrabajoPresupuestoItem[];
  pagos: TrabajoPago[];
  puedeEditar: boolean;
};

export function PresupuestoYPagos({
  trabajoId,
  items,
  pagos,
  puedeEditar,
}: PresupuestoYPagosProps) {
  const router = useRouter();
  const [concepto, setConcepto] = useState("");
  const [montoItem, setMontoItem] = useState("");
  const [hito, setHito] = useState("");
  const [montoPago, setMontoPago] = useState("");
  const [fechaPago, setFechaPago] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPresupuesto = items.reduce((acc, item) => acc + item.monto, 0);
  const totalPagado = pagos.reduce((acc, pago) => acc + (pago.monto ?? 0), 0);

  async function agregarItem(e: React.FormEvent) {
    e.preventDefault();
    const texto = concepto.trim();
    const monto = parseMonto(montoItem.replace(",", "."));
    if (!texto || monto <= 0) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("trabajo_presupuesto_items")
      .insert({ trabajo_id: trabajoId, concepto: texto, monto });
    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setConcepto("");
    setMontoItem("");
    router.refresh();
  }

  async function agregarPago(e: React.FormEvent) {
    e.preventDefault();
    const texto = hito.trim();
    if (!texto) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("trabajo_pagos").insert({
      trabajo_id: trabajoId,
      hito: texto,
      monto: montoPago ? parseMonto(montoPago.replace(",", ".")) : null,
      fecha_pago: fechaPago || null,
    });
    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setHito("");
    setMontoPago("");
    setFechaPago("");
    router.refresh();
  }

  async function eliminarItem(id: string) {
    const supabase = createClient();
    const { error: delError } = await supabase
      .from("trabajo_presupuesto_items")
      .delete()
      .eq("id", id);
    if (delError) {
      setError(delError.message);
      return;
    }
    router.refresh();
  }

  async function eliminarPago(id: string) {
    const supabase = createClient();
    const { error: delError } = await supabase
      .from("trabajo_pagos")
      .delete()
      .eq("id", id);
    if (delError) {
      setError(delError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-medium">Presupuesto</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Desglosa el presupuesto por concepto.
        </p>

        {error ? (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {puedeEditar ? (
          <form onSubmit={(e) => void agregarItem(e)} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="concepto">Concepto</Label>
              <Input
                id="concepto"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej. Honorarios recepción"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monto-item">Monto (CLP)</Label>
              <Input
                id="monto-item"
                inputMode="decimal"
                value={montoItem}
                onChange={(e) => setMontoItem(e.target.value)}
                placeholder="1500000"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={busy || !concepto.trim() || !montoItem}
            >
              {busy ? "Guardando…" : "Agregar línea"}
            </Button>
          </form>
        ) : null}

        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Concepto</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              {puedeEditar ? <TableHead className="w-16" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={puedeEditar ? 3 : 2}
                  className="text-muted-foreground"
                >
                  Sin líneas todavía
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-normal">{item.concepto}</TableCell>
                  <TableCell className="text-right">
                    {formatMontoClp(item.monto)}
                  </TableCell>
                  {puedeEditar ? (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void eliminarItem(item.id)}
                      >
                        Quitar
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="text-right">
                {formatMontoClp(totalPresupuesto)}
              </TableCell>
              {puedeEditar ? <TableCell /> : null}
            </TableRow>
          </TableFooter>
        </Table>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-medium">Pagos por hito</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Anota la fecha y el monto de cada pago asociado a un hito.
        </p>
        <p className="mt-2 text-sm">
          Pagado: <strong>{formatMontoClp(totalPagado)}</strong>
        </p>

        {puedeEditar ? (
          <form onSubmit={(e) => void agregarPago(e)} className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="hito">Hito</Label>
              <Input
                id="hito"
                value={hito}
                onChange={(e) => setHito(e.target.value)}
                placeholder="Ej. Anticipo / Entrega de planos"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="monto-pago">Monto (CLP)</Label>
                <Input
                  id="monto-pago"
                  inputMode="decimal"
                  value={montoPago}
                  onChange={(e) => setMontoPago(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fecha-pago">Fecha de pago</Label>
                <Input
                  id="fecha-pago"
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={busy || !hito.trim()}>
              {busy ? "Guardando…" : "Registrar pago"}
            </Button>
          </form>
        ) : null}

        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Hito</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              {puedeEditar ? <TableHead className="w-16" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={puedeEditar ? 4 : 3}
                  className="text-muted-foreground"
                >
                  Sin pagos todavía
                </TableCell>
              </TableRow>
            ) : (
              pagos.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell className="whitespace-normal">{pago.hito}</TableCell>
                  <TableCell>{formatFechaCl(pago.fecha_pago)}</TableCell>
                  <TableCell className="text-right">
                    {pago.monto == null ? "—" : formatMontoClp(pago.monto)}
                  </TableCell>
                  {puedeEditar ? (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void eliminarPago(pago.id)}
                      >
                        Quitar
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
