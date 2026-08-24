import { thumbnailPublicUrl } from "@/lib/media/urls";
import { construirUrlPublica } from "@/lib/r2/utils";
import type {
  TrabajoMediaItem,
  TrabajoMediaTipo,
  TrabajoMediaTipoArchivo,
} from "@/lib/trabajos";

type Relacion<T> = T | T[] | null;

function one<T>(value: Relacion<T>): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type TrabajoMediaRow = {
  id: string;
  tipo: string | null;
  tipo_archivo: string;
  url: string;
  thumbnail_key?: string | null;
  nombre_archivo: string | null;
  created_at: string;
  proveedor_id?: string | null;
  proveedores?: Relacion<{ id: string; nombre_empresa: string }>;
};

export function mapTrabajoMediaRows(rows: TrabajoMediaRow[]): TrabajoMediaItem[] {
  return rows
    .filter((m) => m.tipo)
    .map((m) => {
      const prov = one(m.proveedores ?? null);
      const thumbKey = m.thumbnail_key ?? null;
      return {
        id: m.id,
        tipo: m.tipo as TrabajoMediaTipo,
        tipo_archivo: m.tipo_archivo as TrabajoMediaTipoArchivo,
        url: m.url,
        publicUrl: construirUrlPublica(m.url),
        thumbnail_key: thumbKey,
        thumbnailPublicUrl: thumbnailPublicUrl(thumbKey),
        nombre_archivo: m.nombre_archivo,
        created_at: m.created_at,
        proveedor_id: m.proveedor_id ?? null,
        proveedor_nombre: prov?.nombre_empresa ?? null,
      };
    });
}
