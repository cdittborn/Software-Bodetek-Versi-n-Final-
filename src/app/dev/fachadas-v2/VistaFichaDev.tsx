export function VistaFichaDev({ id }: { id: string }) {
  return (
    <main data-vista="destino" className="min-h-screen bg-white p-4">
      <h1 className="text-lg font-semibold">Ficha</h1>
      <p className="mt-2 text-sm">{id || "Sin fachada"}</p>
    </main>
  );
}
