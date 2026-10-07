export const MENSAJE_INFORME_PUBLICO =
  "No se pudo abrir el informe. Pide a Bodetek que te envíe el link de nuevo.";

export function InformePublicoNoDisponible() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-6 py-16">
      <h1 className="text-xl font-semibold text-zinc-900">No se pudo abrir el informe</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-700">{MENSAJE_INFORME_PUBLICO}</p>
    </main>
  );
}
