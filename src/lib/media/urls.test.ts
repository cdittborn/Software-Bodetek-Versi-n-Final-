import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { urlGrillaMedia } from "./urls";
import type { TrabajoMediaItem } from "@/lib/trabajos";

function item(partial: Partial<TrabajoMediaItem>): TrabajoMediaItem {
  return {
    id: "m1",
    tipo: "antes",
    tipo_archivo: "foto",
    url: "trabajos/x/full.jpg",
    publicUrl: "https://cdn.example/trabajos/x/full.jpg",
    thumbnail_key: null,
    thumbnailPublicUrl: null,
    nombre_archivo: "full.jpg",
    created_at: "2026-09-28",
    proveedor_id: null,
    proveedor_nombre: null,
    problema_tipo: null,
    ...partial,
  };
}

describe("urlGrillaMedia", () => {
  it("usa solo la miniatura en listados", () => {
    assert.equal(
      urlGrillaMedia(
        item({
          thumbnail_key: "trabajos/x/full-thumb.jpg",
          thumbnailPublicUrl: "https://cdn.example/trabajos/x/full-thumb.jpg",
        }),
      ),
      "https://cdn.example/trabajos/x/full-thumb.jpg",
    );
  });

  it("no cae al original si no hay miniatura", () => {
    assert.equal(urlGrillaMedia(item({})), null);
  });
});
