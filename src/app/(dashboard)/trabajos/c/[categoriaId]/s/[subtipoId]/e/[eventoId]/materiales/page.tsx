import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cargarDatosEventoFiltracion } from "@/lib/filtracion/cargarDatosEventoFiltracion";
import { cargarComprasEvento } from "@/lib/filtracion/cargarComprasEvento";
import { enriquecerProyectos } from "@/lib/filtracion/completitud";
import { ordenarProyectos } from "@/lib/filtracion/filtrosEvento";
import { EventoMaterialesVista } from "@/components/emergencias/evento-materiales/EventoMaterialesVista";

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string; eventoId: string }>;
};

export default async function EventoMaterialesPage({ params }: PageProps) {
  const { categoriaId, subtipoId, eventoId } = await params;
  const supabase = await createClient();
  const datos = await cargarDatosEventoFiltracion(supabase, {
    categoriaId,
    subtipoId,
    eventoId,
  });

  if (!datos) notFound();

  const proyectos = ordenarProyectos(enriquecerProyectos(datos.emergencias));
  const materiales = await cargarComprasEvento(
    supabase,
    datos.eventoId,
    proyectos,
  );

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
      <EventoMaterialesVista
        categoriaId={datos.categoriaId}
        subtipoId={datos.subtipoId}
        eventoId={datos.eventoId}
        eventoNombre={datos.eventoNombre}
        compras={materiales.compras}
        proyectos={materiales.proyectos}
        puedeEditar={datos.puedeEditar}
        tablasPendientes={materiales.tablasPendientes}
      />
    </main>
  );
}
