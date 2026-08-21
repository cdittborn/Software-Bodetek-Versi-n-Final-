import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { construirUrlPublica } from "@/lib/r2/utils";
import { DetalleEmergencia } from "@/components/emergencias/DetalleEmergencia";
import { DetallePatenteCliente } from "@/components/patentes/DetallePatenteCliente";
import { DetalleRecepcionObras } from "@/components/patentes/DetalleRecepcionObras";
import { DetalleTecho } from "@/components/techos/DetalleTecho";
import { DetalleTareaPrivada } from "@/components/tareas-privadas/DetalleTareaPrivada";
import {
  isCategoriaOtrosTrabajosCD,
  isSubtipoClientesPatentes,
  isSubtipoRecepcionObras,
  isSubtipoRevisionesMantenciones,
  parseMonto,
  type EmergenciaListado,
  type EstadoAccion,
  type ProyectoPatenteListado,
  type RecintoOption,
  type TareaPrivadaListado,
  type TechoListado,
  type TrabajoAccion,
  type TrabajoMediaItem,
  type TrabajoMediaTipo,
  type TrabajoMediaTipoArchivo,
  type TrabajoPago,
  type TrabajoPresupuestoItem,
} from "@/lib/trabajos";

import type { ProveedorOption } from "@/lib/proveedores";

type Relacion<T> = T | T[] | null;

function one<T>(value: Relacion<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string; trabajoId: string }>;
};

function mapMedia(
  rows: {
    id: string;
    tipo: string | null;
    tipo_archivo: string;
    url: string;
    nombre_archivo: string | null;
    created_at: string;
    proveedor_id?: string | null;
    proveedores?: Relacion<{ id: string; nombre_empresa: string }>;
  }[],
): TrabajoMediaItem[] {
  return rows
    .filter((m) => m.tipo)
    .map((m) => {
      const prov = one(m.proveedores ?? null);
      return {
        id: m.id,
        tipo: m.tipo as TrabajoMediaTipo,
        tipo_archivo: m.tipo_archivo as TrabajoMediaTipoArchivo,
        url: m.url,
        publicUrl: construirUrlPublica(m.url),
        nombre_archivo: m.nombre_archivo,
        created_at: m.created_at,
        proveedor_id: m.proveedor_id ?? null,
        proveedor_nombre: prov?.nombre_empresa ?? null,
      };
    });
}

export default async function DetalleTrabajoPage({ params }: PageProps) {
  const { categoriaId, subtipoId, trabajoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: row }, { data: subtipo }, { data: categoria }] =
    await Promise.all([
      supabase
        .from("trabajos")
        .select(
          `
        id,
        titulo,
        descripcion,
        plan_accion,
        materiales,
        estado,
        gravedad,
        ejecutado_por,
        proveedor_id,
        proveedor_texto_legado,
        valor_reparacion,
        evento_id,
        created_at,
        fecha_inicio,
        fecha_termino,
        periodicidad_dias,
        fecha_ultima_revision,
        proxima_mantencion,
        fecha_entrega_estimada,
        recinto_id,
        categoria_id,
        subtipo_id,
        recintos ( id, codigo, nombre, arrendatario_actual ),
        proveedores ( id, nombre_empresa )
      `,
        )
        .eq("id", trabajoId)
        .maybeSingle(),
      supabase
        .from("trabajo_subtipos")
        .select("id, nombre")
        .eq("id", subtipoId)
        .maybeSingle(),
      supabase
        .from("trabajo_categorias")
        .select("id, nombre")
        .eq("id", categoriaId)
        .maybeSingle(),
    ]);

  if (
    !row ||
    !subtipo ||
    !categoria ||
    row.categoria_id !== categoriaId ||
    row.subtipo_id !== subtipoId
  ) {
    notFound();
  }

  const recinto = one(
    row.recintos as Relacion<{
      id: string;
      codigo: string;
      nombre: string;
      arrendatario_actual: string | null;
    }>,
  );

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  const { data: permiso } = await supabase
    .from("modulo_permisos")
    .select("puede_editar")
    .eq("rol", perfil?.rol ?? "")
    .eq("modulo", "trabajos")
    .maybeSingle();

  const puedeEditar = permiso?.puede_editar === true;

  const [{ data: recintosRaw }, { data: mediaRaw }, { data: proveedoresRaw }] =
    await Promise.all([
      supabase
        .from("recintos")
        .select("id, codigo, nombre, arrendatario_actual")
        .order("codigo"),
      supabase
        .from("trabajo_media")
        .select(
          "id, tipo, tipo_archivo, url, nombre_archivo, created_at, proveedor_id, proveedores ( id, nombre_empresa )",
        )
        .eq("trabajo_id", trabajoId)
        .order("created_at", { ascending: true }),
      supabase
        .from("proveedores")
        .select("id, nombre_empresa")
        .order("nombre_empresa", { ascending: true }),
    ]);

  const recintos = (recintosRaw ?? []) as RecintoOption[];
  const media = mapMedia(mediaRaw ?? []);
  const proveedores: ProveedorOption[] = (proveedoresRaw ?? []).map((p) => ({
    id: p.id,
    nombre_empresa: p.nombre_empresa,
  }));

  if (isCategoriaOtrosTrabajosCD(categoria.nombre)) {
    const tarea: TareaPrivadaListado = {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      created_at: row.created_at,
      categoria_id: row.categoria_id,
      subtipo_id: row.subtipo_id ?? subtipoId,
    };

    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <DetalleTareaPrivada
          tarea={tarea}
          adjuntos={media.filter((m) => m.tipo === "adjunto")}
          puedeEditar={puedeEditar}
        />
      </main>
    );
  }

  if (isSubtipoRevisionesMantenciones(subtipo.nombre)) {
    const { data: tareasRaw } = await supabase
      .from("trabajo_acciones")
      .select("id, descripcion, fecha_entrega, hecha, estado, created_at")
      .eq("trabajo_id", trabajoId)
      .order("created_at", { ascending: true });

    const techo: TechoListado = {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      materiales: row.materiales,
      plan_accion: row.plan_accion,
      estado: row.estado,
      created_at: row.created_at,
      periodicidad_dias: row.periodicidad_dias,
      fecha_ultima_revision: row.fecha_ultima_revision,
      proxima_mantencion: row.proxima_mantencion,
      categoria_id: row.categoria_id,
      subtipo_id: row.subtipo_id,
    };

    const tareas: TrabajoAccion[] = (tareasRaw ?? []).map((t) => ({
      id: t.id,
      descripcion: t.descripcion,
      fecha_entrega: t.fecha_entrega,
      hecha: t.hecha,
      estado: (t.estado as EstadoAccion) ?? (t.hecha ? "terminada" : "pendiente"),
      created_at: t.created_at,
    }));

    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <DetalleTecho
          techo={techo}
          evidencia={media.filter((m) => m.tipo === "adjunto")}
          cotizacion={media.filter((m) => m.tipo === "cotizacion")}
          tareas={tareas}
          puedeEditar={puedeEditar}
        />
      </main>
    );
  }

  if (isSubtipoClientesPatentes(subtipo.nombre) || isSubtipoRecepcionObras(subtipo.nombre)) {
    const proyecto: ProyectoPatenteListado = {
      id: row.id,
      titulo: row.titulo,
      descripcion: row.descripcion,
      estado: row.estado,
      created_at: row.created_at,
      fecha_termino: row.fecha_termino,
      recinto_id: row.recinto_id,
      recinto_codigo: recinto?.codigo ?? null,
      recinto_nombre: recinto?.nombre ?? null,
      categoria_id: row.categoria_id,
      subtipo_id: row.subtipo_id,
    };

    const { data: accionesRaw } = await supabase
      .from("trabajo_acciones")
      .select("id, descripcion, fecha_entrega, hecha, estado, created_at")
      .eq("trabajo_id", trabajoId)
      .order("created_at", { ascending: true });

    const acciones: TrabajoAccion[] = (accionesRaw ?? []).map((t) => ({
      id: t.id,
      descripcion: t.descripcion,
      fecha_entrega: t.fecha_entrega,
      hecha: t.hecha,
      estado: (t.estado as EstadoAccion) ?? (t.hecha ? "terminada" : "pendiente"),
      created_at: t.created_at,
    }));

    if (isSubtipoRecepcionObras(subtipo.nombre)) {
      const [{ data: presupuestoRaw }, { data: pagosRaw }] = await Promise.all([
        supabase
          .from("trabajo_presupuesto_items")
          .select("id, concepto, monto, created_at")
          .eq("trabajo_id", trabajoId)
          .order("created_at", { ascending: true }),
        supabase
          .from("trabajo_pagos")
          .select("id, hito, monto, fecha_pago, created_at")
          .eq("trabajo_id", trabajoId)
          .order("created_at", { ascending: true }),
      ]);

      const presupuesto: TrabajoPresupuestoItem[] = (presupuestoRaw ?? []).map(
        (item) => ({
          id: item.id,
          concepto: item.concepto,
          monto: parseMonto(item.monto as string | number),
          created_at: item.created_at,
        }),
      );

      const pagos: TrabajoPago[] = (pagosRaw ?? []).map((pago) => ({
        id: pago.id,
        hito: pago.hito,
        monto:
          pago.monto == null ? null : parseMonto(pago.monto as string | number),
        fecha_pago: pago.fecha_pago,
        created_at: pago.created_at,
      }));

      return (
        <main className="mx-auto w-full max-w-5xl px-4 py-10">
          <DetalleRecepcionObras
            proyecto={proyecto}
            recintos={recintos}
            acciones={acciones}
            presupuesto={presupuesto}
            pagos={pagos}
            puedeEditar={puedeEditar}
          />
        </main>
      );
    }

    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <DetallePatenteCliente
          proyecto={proyecto}
          recintos={recintos}
          adjuntos={media.filter((m) => m.tipo === "adjunto")}
          provisoria={media.filter((m) => m.tipo === "patente_provisoria")}
          acciones={acciones}
          puedeEditar={puedeEditar}
        />
      </main>
    );
  }

  const proveedorRel = one(
    row.proveedores as Relacion<{ id: string; nombre_empresa: string }>,
  );

  const emergencia: EmergenciaListado = {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    plan_accion: row.plan_accion,
    estado: row.estado,
    gravedad: row.gravedad,
    ejecutado_por: row.ejecutado_por,
    proveedor_id: row.proveedor_id ?? null,
    proveedor_nombre: proveedorRel?.nombre_empresa ?? null,
    proveedor_texto_legado: row.proveedor_texto_legado ?? null,
    valor_reparacion:
      row.valor_reparacion == null
        ? null
        : parseMonto(row.valor_reparacion as string | number),
    created_at: row.created_at,
    fecha_inicio: row.fecha_inicio,
    fecha_entrega_estimada: row.fecha_entrega_estimada ?? null,
    recinto_id: row.recinto_id,
    recinto_codigo: recinto?.codigo ?? null,
    recinto_nombre: recinto?.nombre ?? null,
    recinto_arrendatario: recinto?.arrendatario_actual ?? null,
    categoria_id: row.categoria_id,
    subtipo_id: row.subtipo_id,
    evento_id: row.evento_id,
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <DetalleEmergencia
        emergencia={emergencia}
        recintos={recintos}
        proveedores={proveedores}
        mediaAntes={media.filter((m) => m.tipo === "antes")}
        mediaDespues={media.filter((m) => m.tipo === "despues")}
        planosFiltraciones={media.filter((m) => m.tipo === "plano_filtraciones")}
        cotizaciones={media.filter((m) => m.tipo === "cotizacion")}
        puedeEditar={puedeEditar}
      />
    </main>
  );
}
