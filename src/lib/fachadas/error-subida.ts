export type PasoSubida = "firmar" | "r2" | "guardar";

export class FalloSubida extends Error {
  readonly paso: PasoSubida;
  readonly status: number | null;

  constructor(message: string, paso: PasoSubida, status: number | null) {
    super(message);
    this.name = "FalloSubida";
    this.paso = paso;
    this.status = status;
  }
}

export function mensajeFalloSubida(
  paso: PasoSubida,
  status: number | null,
  opts?: { rls?: boolean },
): string {
  if (paso === "firmar") {
    return `Error al pedir la URL firmada (${status ?? "sin código"})`;
  }
  if (paso === "r2") {
    if (status == null || status === 0) return "Error al subir a R2 (red/CORS)";
    return `Error al subir a R2 (${status})`;
  }
  if (opts?.rls) return "Error al guardar (RLS)";
  return `Error al guardar (${status ?? "sin código"})`;
}

export function esErrorRls(error: { message?: string; code?: string | null } | null): boolean {
  if (!error) return false;
  if (error.code === "42501") return true;
  return /row-level security/i.test(error.message ?? "");
}

function recortar(texto: string): string {
  return texto.replace(/\s+/g, " ").trim().slice(0, 240);
}

/** Muestra el paso en la UI y deja el detalle en la consola y en el log del servidor. */
export function reportarFalloSubida(
  paso: PasoSubida,
  status: number | null,
  detalle: string,
  opts?: { rls?: boolean },
): FalloSubida {
  const mensaje = mensajeFalloSubida(paso, status, opts);
  const payload = {
    paso,
    status,
    rls: Boolean(opts?.rls),
    mensaje,
    detalle: recortar(detalle),
  };
  console.error("[fachadas subida]", payload);
  if (typeof fetch === "function") {
    void fetch("/api/fachadas/log-subida", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  }
  return new FalloSubida(mensaje, paso, status);
}
