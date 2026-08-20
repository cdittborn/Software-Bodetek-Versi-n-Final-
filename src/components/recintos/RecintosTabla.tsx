"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecintoListado } from "@/lib/recintos";

type RecintosTablaProps = {
  recintos: RecintoListado[];
};

function formatM2(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function RecintosTabla({ recintos }: RecintosTablaProps) {
  const [sitio, setSitio] = useState("all");
  const [tipo, setTipo] = useState("all");
  const [contrato, setContrato] = useState("all");

  const sitios = useMemo(() => {
    return Array.from(
      new Set(recintos.map((r) => r.sitio).filter((s) => s.trim() !== "")),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [recintos]);

  const tipos = useMemo(() => {
    return Array.from(
      new Set(
        recintos
          .map((r) => r.tipo)
          .filter((t): t is string => Boolean(t && t.trim())),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [recintos]);

  const filtrados = useMemo(() => {
    return recintos.filter((r) => {
      const matchSitio = sitio === "all" || r.sitio === sitio;
      const matchTipo = tipo === "all" || r.tipo === tipo;
      const matchContrato =
        contrato === "all" ||
        (contrato === "sin" && r.tiene_contrato === false) ||
        (contrato === "con" && r.tiene_contrato === true);
      return matchSitio && matchTipo && matchContrato;
    });
  }, [recintos, sitio, tipo, contrato]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1.5">
          <Label>Sitio</Label>
          <Select value={sitio} onValueChange={(v) => setSitio(v ?? "all")}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {sitios.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v ?? "all")}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {tipos.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Contrato</Label>
          <Select value={contrato} onValueChange={(v) => setContrato(v ?? "all")}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sin">Sin contrato cargado</SelectItem>
              <SelectItem value="con">Con contrato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {recintos.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay recintos cargados todavía. Cuando tengas el CSV, lo importamos.
        </p>
      ) : filtrados.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay recintos que coincidan con los filtros
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Sitio</TableHead>
                <TableHead>Galpón</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Arrendatario actual</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead className="text-right">Superficie total (m²)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/recintos/${r.id}`} className="hover:underline">
                      {r.codigo}
                    </Link>
                  </TableCell>
                  <TableCell>{r.sitio || "—"}</TableCell>
                  <TableCell>{r.galpon || "—"}</TableCell>
                  <TableCell>{r.tipo || "—"}</TableCell>
                  <TableCell>{r.arrendatario_actual || "—"}</TableCell>
                  <TableCell>
                    {r.tiene_contrato ? "Cargado" : "Sin contrato"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatM2(r.superficie_m2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
