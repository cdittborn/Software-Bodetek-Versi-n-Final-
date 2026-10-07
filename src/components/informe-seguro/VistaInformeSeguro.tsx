import type {
  MediaSnapshot,
  SnapshotInformeSeguro,
} from "@/lib/informe-seguro/snapshot";
import { formatHorasCl } from "@/lib/informe-seguro/formato";
import { BotonImprimirInforme } from "@/components/informe-seguro/BotonImprimirInforme";

type VistaInformeSeguroProps = {
  snapshot: SnapshotInformeSeguro;
  urls: Record<string, string>;
};

function fechaCl(value: string | null): string | null {
  if (!value) return null;
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}-${m}-${y}`;
}

function ordenar(media: MediaSnapshot[]): MediaSnapshot[] {
  return [...media].sort(
    (a, b) => Number(b.esPortada) - Number(a.esPortada) || a.orden - b.orden,
  );
}

function Figura({
  media,
  urls,
}: {
  media: MediaSnapshot;
  urls: Record<string, string>;
}) {
  const src = urls[media.key];
  const poster = media.thumbnailKey ? urls[media.thumbnailKey] : undefined;
  const visible = poster || src;
  if (!visible) return null;
  const alt = media.nombre?.trim() || "Fotografía del informe";
  const videoReal = media.tipoArchivo === "video" && src && !src.startsWith("data:");

  return (
    <figure className="relative break-inside-avoid">
      {videoReal ? (
        <video
          controls
          playsInline
          preload="metadata"
          poster={poster}
          src={src}
          className="aspect-video w-full rounded-lg bg-black object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={visible}
          alt={alt}
          className="aspect-[4/3] w-full rounded-lg object-cover"
        />
      )}
      {media.tipoArchivo === "video" && !videoReal ? (
        <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
          ▶ Video
        </span>
      ) : null}
      {media.esPortada ? (
        <figcaption className="mt-1 text-xs text-zinc-500">Portada</figcaption>
      ) : null}
    </figure>
  );
}

function Galeria({
  media,
  urls,
}: {
  media: MediaSnapshot[];
  urls: Record<string, string>;
}) {
  const items = ordenar(media);
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((m) => (
        <Figura key={m.trabajoMediaId} media={m} urls={urls} />
      ))}
    </div>
  );
}

export function VistaInformeSeguro({ snapshot, urls }: VistaInformeSeguroProps) {
  const { encabezado, resumen, recintos } = snapshot;
  const fechaEvento = fechaCl(encabezado.fechaEvento);
  const fechaEmision = fechaCl(encabezado.fechaEmision);
  const datos = [
    ["Recintos afectados", String(resumen.recintos)],
    ["Subproyectos", String(resumen.subproyectos)],
    ["Maestros Bodetek", String(resumen.maestros)],
    ["Proveedor externo", String(resumen.proveedor)],
    ["Horas de maestros", formatHorasCl(resumen.horasMaestros)],
  ] as const;

  return (
    <article className="informe-hoja mx-auto w-full max-w-3xl px-4 py-8 text-zinc-900 sm:py-12">
      <style>{`
        @media print {
          .informe-no-imprimir { display: none !important; }
          .informe-hoja { max-width: none; padding: 0; }
          a { color: inherit; text-decoration: none; }
        }
      `}</style>
      <header className="border-b border-zinc-200 pb-6">
        <p className="text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase">
          Bodetek
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {encabezado.nombre || "Informe para seguro"}
        </h1>
        <p className="mt-2 text-base text-zinc-700">
          {encabezado.nombreEvento}
          {fechaEvento ? ` · ${fechaEvento}` : ""}
        </p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {encabezado.direccionCentro ? (
            <div>
              <dt className="text-zinc-500">Dirección del centro</dt>
              <dd>{encabezado.direccionCentro}</dd>
            </div>
          ) : null}
          {encabezado.numeroSiniestro ? (
            <div>
              <dt className="text-zinc-500">N° de siniestro</dt>
              <dd>{encabezado.numeroSiniestro}</dd>
            </div>
          ) : null}
          {encabezado.numeroPoliza ? (
            <div>
              <dt className="text-zinc-500">N° de póliza</dt>
              <dd>{encabezado.numeroPoliza}</dd>
            </div>
          ) : null}
          {encabezado.contactoBodetek ? (
            <div>
              <dt className="text-zinc-500">Contacto Bodetek</dt>
              <dd>{encabezado.contactoBodetek}</dd>
            </div>
          ) : null}
          {fechaEmision ? (
            <div>
              <dt className="text-zinc-500">Fecha de emisión</dt>
              <dd>{fechaEmision}</dd>
            </div>
          ) : null}
        </dl>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="rounded-lg border border-zinc-200 px-3 py-2">
            <p className="text-xs text-zinc-500">{etiqueta}</p>
            <p className="text-xl font-semibold tabular-nums">{valor}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 flex flex-col gap-10">
        {recintos.map((recinto) => (
          <section key={recinto.trabajoId} className="break-inside-avoid">
            <h2 className="text-xl font-semibold">{recinto.recintoEtiqueta}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {recinto.codigo} · {recinto.titulo}
            </p>
            {recinto.descripcionSeguro ? (
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">
                {recinto.descripcionSeguro}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-zinc-700">
              Horas de maestros en el recinto:{" "}
              <span className="font-semibold tabular-nums">
                {formatHorasCl(recinto.horasMaestros)}
              </span>
            </p>
            <div className="mt-3">
              <Galeria media={recinto.media} urls={urls} />
            </div>

            <div className="mt-5 flex flex-col gap-6">
              {recinto.subproyectos.map((sub) => (
                <div key={sub.tipo} className="border-t border-zinc-100 pt-4">
                  <h3 className="text-base font-semibold">{sub.tipoLabel}</h3>
                  <p className="mt-1 text-sm text-zinc-700">
                    {sub.ejecutorLabel}
                    {sub.proveedorNombre ? ` · ${sub.proveedorNombre}` : ""}
                    {sub.horasMaestros != null
                      ? ` · ${formatHorasCl(sub.horasMaestros)} h`
                      : ""}
                  </p>
                  {sub.descripcionSeguro ? (
                    <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">
                      {sub.descripcionSeguro}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <Galeria media={sub.media} urls={urls} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="informe-no-imprimir mt-10">
        <BotonImprimirInforme />
        <p className="mt-2 text-xs text-zinc-500">
          Las fotos y los videos de esta página usan enlaces que duran 15 minutos.
          Ábrelos de nuevo si al imprimir no aparecen.
        </p>
      </div>
    </article>
  );
}
