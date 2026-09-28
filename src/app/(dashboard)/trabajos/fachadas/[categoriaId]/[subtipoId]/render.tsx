import { FachadasSubtipoVista } from "@/components/fachadas/FachadasSubtipoVista";
import {
  cargarCatalogosFachadas,
  cargarFachadasSubtipo,
} from "@/lib/fachadas/cargar";
import { logErrorFachadas } from "@/lib/fachadas/log";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function renderFachadasSubtipo({
  supabase,
  categoriaId,
  subtipoId,
  titulo,
  subtitulo,
  puedeEditar,
}: {
  supabase: SupabaseClient;
  categoriaId: string;
  subtipoId: string;
  titulo: string;
  subtitulo: string;
  puedeEditar: boolean;
}) {
  try {
    const catalogos = await cargarCatalogosFachadas(supabase);
    const loaded = await cargarFachadasSubtipo(supabase, catalogos.recintos);
    return (
      <main>
        <FachadasSubtipoVista
          categoriaId={categoriaId}
          subtipoId={subtipoId}
          titulo={titulo}
          subtitulo={subtitulo}
          fachadas={loaded.fachadas}
          intervenciones={loaded.intervenciones}
          portadas={loaded.portadas}
          recintos={catalogos.recintos}
          proveedores={catalogos.proveedores}
          puedeEditar={puedeEditar}
          tablasAusentes={loaded.tablasAusentes}
          error={loaded.error}
        />
      </main>
    );
  } catch (err) {
    logErrorFachadas("renderFachadasSubtipo", err);
    const message =
      err instanceof Error ? err.message : "No se pudieron cargar las fachadas.";
    return (
      <main>
        <FachadasSubtipoVista
          categoriaId={categoriaId}
          subtipoId={subtipoId}
          titulo={titulo}
          subtitulo={subtitulo}
          fachadas={[]}
          intervenciones={[]}
          portadas={[]}
          recintos={[]}
          proveedores={[]}
          puedeEditar={puedeEditar}
          tablasAusentes={false}
          error={message}
        />
      </main>
    );
  }
}
