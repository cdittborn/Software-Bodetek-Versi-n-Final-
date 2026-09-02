import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cargarDatosEventoFiltracion } from "@/lib/filtracion/cargarDatosEventoFiltracion";
import { cargarTotalMaterialesEvento } from "@/lib/filtracion/cargarTotalMaterialesEvento";
import { EventoDashboardAvance } from "@/components/emergencias/evento-dashboard/EventoDashboardAvance";

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string; eventoId: string }>;
};

export default async function EventoDashboardPage({ params }: PageProps) {
  const { categoriaId, subtipoId, eventoId } = await params;
  const supabase = await createClient();
  const datos = await cargarDatosEventoFiltracion(supabase, {
    categoriaId,
    subtipoId,
    eventoId,
  });

  if (!datos) notFound();

  const materiales = await cargarTotalMaterialesEvento(
    supabase,
    datos.emergencias.map((e) => e.id),
  );

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
      <EventoDashboardAvance
        emergencias={datos.emergencias}
        recintos={datos.recintos}
        proveedores={datos.proveedores}
        categoriaId={datos.categoriaId}
        subtipoId={datos.subtipoId}
        eventoId={datos.eventoId}
        eventoNombre={datos.eventoNombre}
        puedeEditar={datos.puedeEditar}
        materiales={materiales}
      />
    </main>
  );
}
