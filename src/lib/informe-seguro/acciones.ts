"use server";

import { z } from "zod";
import { getPerfil } from "@/lib/supabase/sesion";
import { createClient } from "@/lib/supabase/server";
import { TIPOS_PROBLEMA } from "@/lib/filtracion/problemas";
import {
  activarLinkInforme,
  cambiarToken,
  guardarInformeEnBase,
  type ResultadoPersistir,
} from "@/lib/informe-seguro/persistir";

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();

const borradorSchema = z.object({
  encabezado: z.object({
    nombre: z.string().max(200),
    nombreEvento: z.string().max(200),
    fechaEvento: fecha,
    direccionCentro: z.string().max(300),
    numeroSiniestro: z.string().max(80).nullable(),
    numeroPoliza: z.string().max(80).nullable(),
    contactoBodetek: z.string().max(200),
    fechaEmision: fecha,
  }),
  tokenExpira: fecha,
  recintos: z.array(z.object({
    trabajoId: z.string().uuid(),
    incluido: z.boolean(),
    descripcionSeguro: z.string().max(8000),
    descripcionValidada: z.boolean(),
  })).max(300),
  subproyectos: z.array(z.object({
    trabajoId: z.string().uuid(),
    tipo: z.enum(TIPOS_PROBLEMA),
    incluido: z.boolean(),
    descripcionSeguro: z.string().max(8000),
  })).max(1200),
  media: z.array(z.object({
    trabajoMediaId: z.string().uuid(),
    incluido: z.boolean(),
    orden: z.number().int().min(0).max(10000),
    esPortada: z.boolean(),
  })).max(4000),
});

const guardarSchema = z.object({
  eventoId: z.string().uuid(),
  categoriaId: z.string().uuid(),
  subtipoId: z.string().uuid(),
  borrador: borradorSchema,
  publicar: z.boolean(),
  confirmarFaltantes: z.boolean(),
  activarLink: z.boolean().optional(),
});

async function editor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." as const };
  const perfil = await getPerfil(user.id);
  if (perfil?.rol !== "admin" && perfil?.rol !== "pablo") {
    return { error: "Solo admin y pablo pueden editar el informe." as const };
  }
  return { supabase, userId: user.id };
}

export async function guardarInforme(input: unknown): Promise<ResultadoPersistir> {
  const sesion = await editor();
  if ("error" in sesion) return { ok: false, error: sesion.error };
  const parsed = guardarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Los datos del informe no son válidos." };
  return guardarInformeEnBase({
    supabase: sesion.supabase,
    userId: sesion.userId,
    ...parsed.data,
  });
}

export async function activarLinkDelInforme(eventoId: string): Promise<ResultadoPersistir> {
  const sesion = await editor();
  if ("error" in sesion) return { ok: false, error: sesion.error };
  if (!z.string().uuid().safeParse(eventoId).success) {
    return { ok: false, error: "Evento no válido." };
  }
  return activarLinkInforme({ supabase: sesion.supabase, eventoId });
}

export async function desactivarTokenInforme(eventoId: string): Promise<ResultadoPersistir> {
  const sesion = await editor();
  if ("error" in sesion) return { ok: false, error: sesion.error };
  if (!z.string().uuid().safeParse(eventoId).success) {
    return { ok: false, error: "Evento no válido." };
  }
  return cambiarToken({ supabase: sesion.supabase, eventoId, modo: "desactivar" });
}

export async function regenerarTokenInforme(eventoId: string): Promise<ResultadoPersistir> {
  const sesion = await editor();
  if ("error" in sesion) return { ok: false, error: sesion.error };
  if (!z.string().uuid().safeParse(eventoId).success) {
    return { ok: false, error: "Evento no válido." };
  }
  return cambiarToken({ supabase: sesion.supabase, eventoId, modo: "regenerar" });
}
