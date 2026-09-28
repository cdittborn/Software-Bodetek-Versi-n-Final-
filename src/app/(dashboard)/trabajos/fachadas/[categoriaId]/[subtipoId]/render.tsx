import { FachadasSubtipoVista } from "@/components/fachadas/FachadasSubtipoVista";
import type { CatalogosFachadas, FachadaListadoItem, PortadaIntervencion } from "@/lib/fachadas/tipos";
import type { IntervencionIndicadores } from "@/lib/fachadas/indicadores";

export function renderFachadasSubtipo({
  categoriaId,
  subtipoId,
  titulo,
  subtitulo,
  puedeEditar,
  catalogos,
  loaded,
}: {
  categoriaId: string;
  subtipoId: string;
  titulo: string;
  subtitulo: string;
  puedeEditar: boolean;
  catalogos: CatalogosFachadas;
  loaded: {
    fachadas: FachadaListadoItem[];
    intervenciones: IntervencionIndicadores[];
    portadas: PortadaIntervencion[];
    error: string | null;
    tablasAusentes: boolean;
  };
}) {
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
}
