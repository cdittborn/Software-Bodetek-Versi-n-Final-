type DeleteMediaResponse = {
  ok?: boolean;
  error?: string;
};

export async function eliminarTrabajoMedia(mediaId: string): Promise<void> {
  const res = await fetch("/api/storage/delete-media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mediaId }),
  });

  const data = (await res.json()) as DeleteMediaResponse;
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? "No se pudo eliminar el archivo");
  }
}
