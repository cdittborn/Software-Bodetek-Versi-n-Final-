import { notFound, redirect } from "next/navigation";
import { EditorInformeAcciones } from "@/components/informe-seguro/EditorInformeAcciones";
import { hoyIsoChile } from "@/lib/informe-seguro/fechas";
import {
  fuenteDesdeProyectos,
  fuenteSinNotas,
} from "@/lib/informe-seguro/fuente";
import { informeSeguroPublicoHref } from "@/lib/informe-seguro/rutas";
import { leerInforme } from "@/lib/informe-seguro/persistir";
import {
  combinarBorrador,
  type EncabezadoInforme,
} from "@/lib/informe-seguro/snapshot";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/supabase/sesion";
import { cargarDatosEventoFiltracion } from "@/lib/filtracion/cargarDatosEventoFiltracion";
import { enriquecerProyectos } from "@/lib/filtracion/completitud";
import { eventoDashboardHref } from "@/lib/trabajos";

type PageProps = {
  params: Promise<{ categoriaId: string; subtipoId: string; eventoId: string }>;
};

export const dynamic = "force-dynamic";

function previewsDe(
  emergencias: Awaited<ReturnType<typeof cargarDatosEventoFiltracion>>,
): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const emergencia of emergencias?.emergencias ?? []) {
    for (const media of [...emergencia.media.antes, ...emergencia.media.despues]) {
      if (media.url && media.publicUrl) urls[media.url] = media.publicUrl;
      if (media.thumbnail_key && media.thumbnailPublicUrl) {
        urls[media.thumbnail_key] = media.thumbnailPublicUrl;
      }
    }
  }
  return urls;
}

export default async function InformeSeguroPage({ params }: PageProps) {
  const { categoriaId, subtipoId, eventoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const perfil = await getPerfil(user.id);
  const destino = eventoDashboardHref(categoriaId, subtipoId, eventoId);
  if (perfil?.rol !== "admin" && perfil?.rol !== "pablo") redirect(destino);

  const datos = await cargarDatosEventoFiltracion(supabase, {
    categoriaId,
    subtipoId,
    eventoId,
  });
  if (!datos) notFound();

  const { data: evento } = await supabase
    .from("eventos")
    .select("fecha")
    .eq("id", eventoId)
    .maybeSingle();

  const leido = await leerInforme(supabase, eventoId);
  const fuente = fuenteSinNotas(
    fuenteDesdeProyectos(
      enriquecerProyectos(datos.emergencias),
      datos.proveedores,
    ),
  );
  const encabezado: EncabezadoInforme = {
    nombre: `Informe para seguro — ${datos.eventoNombre}`,
    nombreEvento: datos.eventoNombre,
    fechaEvento: (evento?.fecha as string | null) ?? null,
    direccionCentro: "",
    numeroSiniestro: null,
    numeroPoliza: null,
    contactoBodetek: "",
    fechaEmision: hoyIsoChile(),
  };

  if (leido.pendiente) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">Informe para seguro</h1>
        <p className="mt-3 text-sm text-zinc-700">
          La tabla del informe todavía no está en la base. El editor queda
          disponible cuando se aplique la migración. El resto de Lluvias no cambia.
        </p>
      </main>
    );
  }

  const inicial = combinarBorrador(
    fuente,
    leido.informe?.borrador ?? null,
    encabezado,
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <EditorInformeAcciones
        fuente={fuente}
        inicial={inicial}
        previews={previewsDe(datos)}
        versiones={leido.informe?.versiones ?? []}
        tokenActivo={leido.informe?.tokenActivo ?? false}
        linkPath={
          leido.informe?.tokenActivo
            ? informeSeguroPublicoHref(leido.informe.token)
            : null
        }
        tieneInforme={Boolean(leido.informe)}
        categoriaId={categoriaId}
        subtipoId={subtipoId}
        eventoId={eventoId}
      />
    </main>
  );
}
