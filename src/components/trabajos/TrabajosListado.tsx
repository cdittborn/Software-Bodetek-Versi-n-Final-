"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { FormularioTrabajo } from "@/components/shared/FormularioTrabajo";
import {
  ESTADOS_TRABAJO_TODOS,
  ESTADO_TRABAJO_LABEL,
  type CategoriaOption,
  type EstadoTrabajoTodos,
  type PerfilOption,
  type RecintoOption,
  type SubtipoOption,
  type TrabajoListado,
} from "@/lib/trabajos";

type TrabajosListadoProps = {
  trabajos: TrabajoListado[];
  categorias: CategoriaOption[];
  subtipos: SubtipoOption[];
  recintos: RecintoOption[];
  perfiles: PerfilOption[];
  puedeEditar: boolean;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

function estadoLabel(estado: string) {
  if (estado in ESTADO_TRABAJO_LABEL) {
    return ESTADO_TRABAJO_LABEL[estado as EstadoTrabajoTodos];
  }
  return estado;
}

export function TrabajosListado({
  trabajos,
  categorias,
  subtipos,
  recintos,
  perfiles,
  puedeEditar,
}: TrabajosListadoProps) {
  const router = useRouter();
  const [categoriaId, setCategoriaId] = useState<string>("all");
  const [estado, setEstado] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrabajo, setEditingTrabajo] = useState<TrabajoListado | null>(
    null,
  );

  const filtrados = useMemo(() => {
    return trabajos.filter((t) => {
      const matchCategoria =
        categoriaId === "all" || t.categoria_id === categoriaId;
      const matchEstado = estado === "all" || t.estado === estado;
      return matchCategoria && matchEstado;
    });
  }, [trabajos, categoriaId, estado]);

  function openCreate() {
    setEditingTrabajo(null);
    setDialogOpen(true);
  }

  function openEdit(trabajo: TrabajoListado) {
    setEditingTrabajo(trabajo);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select
              value={categoriaId}
              onValueChange={(v) => setCategoriaId(v ?? "all")}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={(v) => setEstado(v ?? "all")}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ESTADOS_TRABAJO_TODOS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {ESTADO_TRABAJO_LABEL[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {puedeEditar ? (
          <Button type="button" onClick={openCreate}>
            Nuevo trabajo
          </Button>
        ) : null}
      </div>

      {trabajos.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay trabajos registrados todavía
        </p>
      ) : filtrados.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No hay trabajos que coincidan con los filtros
        </p>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Subtipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Término</TableHead>
                {puedeEditar ? <TableHead className="w-24" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.titulo}</TableCell>
                  <TableCell>{t.categoria_nombre ?? "—"}</TableCell>
                  <TableCell>{t.subtipo_nombre ?? "—"}</TableCell>
                  <TableCell>{estadoLabel(t.estado)}</TableCell>
                  <TableCell>{t.responsable_nombre ?? "—"}</TableCell>
                  <TableCell>{formatDate(t.fecha_inicio)}</TableCell>
                  <TableCell>{formatDate(t.fecha_termino)}</TableCell>
                  {puedeEditar ? (
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(t)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <FormularioTrabajo
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        trabajo={editingTrabajo}
        categorias={categorias}
        subtipos={subtipos}
        recintos={recintos}
        perfiles={perfiles}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
