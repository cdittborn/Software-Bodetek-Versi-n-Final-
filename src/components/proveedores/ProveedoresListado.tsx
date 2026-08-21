"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormularioProveedor } from "@/components/proveedores/FormularioProveedor";
import type { Proveedor } from "@/lib/proveedores";

type ProveedoresListadoProps = {
  proveedores: Proveedor[];
  puedeEditar: boolean;
};

export function ProveedoresListado({
  proveedores,
  puedeEditar,
}: ProveedoresListadoProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este proveedor?")) return;
    setBusyId(id);
    setError(null);
    const supabase = createClient();
    const { error: delError } = await supabase
      .from("proveedores")
      .delete()
      .eq("id", id);
    setBusyId(null);
    if (delError) {
      setError(delError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catálogo para Filtración-Proyecto, cotizaciones y otras secciones.
          </p>
        </div>
        {puedeEditar ? (
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Nuevo proveedor
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {proveedores.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay proveedores todavía
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead>Presente en Antofagasta</TableHead>
                {puedeEditar ? <TableHead className="text-right">Acción</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {proveedores.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre_empresa}</TableCell>
                  <TableCell>{p.nombre_contacto?.trim() || "—"}</TableCell>
                  <TableCell>{p.celular?.trim() || "—"}</TableCell>
                  <TableCell>{p.presente_antofagasta ? "Sí" : "No"}</TableCell>
                  {puedeEditar ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(p);
                            setOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={busyId === p.id}
                          onClick={() => void eliminar(p.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <FormularioProveedor
        open={open}
        onOpenChange={setOpen}
        proveedor={editing}
        onSuccess={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}
