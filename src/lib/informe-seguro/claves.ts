import type { SnapshotInformeSeguro } from "@/lib/informe-seguro/snapshot";

const CLAVE_SEGURA = /^[a-zA-Z0-9/_.\-]+$/;

export function claveFirmaSegura(key: string): boolean {
  return (
    key.length > 0 &&
    key.length <= 500 &&
    !key.includes("..") &&
    !key.includes("://") &&
    CLAVE_SEGURA.test(key)
  );
}

export function clavesDeSnapshot(snapshot: SnapshotInformeSeguro): string[] {
  const claves: string[] = [];
  for (const recinto of snapshot.recintos) {
    for (const media of [...recinto.media, ...recinto.subproyectos.flatMap((s) => s.media)]) {
      if (claveFirmaSegura(media.key)) claves.push(media.key);
      if (media.thumbnailKey && claveFirmaSegura(media.thumbnailKey)) {
        claves.push(media.thumbnailKey);
      }
    }
  }
  for (const cotizacion of snapshot.cotizaciones) {
    if (cotizacion.pdfKey && claveFirmaSegura(cotizacion.pdfKey)) {
      claves.push(cotizacion.pdfKey);
    }
  }
  return [...new Set(claves)];
}
