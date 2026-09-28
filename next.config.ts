import type { NextConfig } from "next";

/** Subtipo Imagen → Fachadas en prod jzmlhgvmetljbpjguvoz. */
const FACHADAS_SUBTIPO_ID = "58af02ea-84d4-4ec1-b537-3f7bad8f33cf";

const nextConfig: NextConfig = {
  async rewrites() {
    // beforeFiles: la lista de Fachadas no comparte módulo con Lluvias.
    return {
      beforeFiles: [
        {
          source: `/trabajos/c/:categoriaId/s/${FACHADAS_SUBTIPO_ID}`,
          destination: `/trabajos/fachadas/:categoriaId/${FACHADAS_SUBTIPO_ID}`,
        },
      ],
    };
  },
};

export default nextConfig;
