import type { NextConfig } from "next";

/** Subtipo Imagen → Fachadas en prod jzmlhgvmetljbpjguvoz. */
const FACHADAS_SUBTIPO_ID = "58af02ea-84d4-4ec1-b537-3f7bad8f33cf";

const FACHADAS_DEST = `/trabajos/fachadas/:categoriaId/${FACHADAS_SUBTIPO_ID}`;
const FACHADAS_SRC = `/trabajos/c/:categoriaId/s/${FACHADAS_SUBTIPO_ID}`;

const nextConfig: NextConfig = {
  async rewrites() {
    // beforeFiles: Fachadas no comparte segmento App Router con Lluvias.
    // Primero las rutas más largas (ficha / intervención).
    return {
      beforeFiles: [
        {
          source: "/trabajos/fachadas/demo",
          destination: "/demo/fachadas",
        },
        {
          source: "/trabajos/fachadas/demo/:path*",
          destination: "/demo/fachadas/:path*",
        },
        {
          source: `${FACHADAS_SRC}/reporte`,
          destination: `${FACHADAS_DEST}/reporte`,
        },
        {
          source: `${FACHADAS_SRC}/f/:fachadaId/i/:intervencionId`,
          destination: `${FACHADAS_DEST}/f/:fachadaId/i/:intervencionId`,
        },
        {
          source: `${FACHADAS_SRC}/f/:fachadaId`,
          destination: `${FACHADAS_DEST}/f/:fachadaId`,
        },
        {
          source: FACHADAS_SRC,
          destination: FACHADAS_DEST,
        },
      ],
    };
  },
};

export default nextConfig;
