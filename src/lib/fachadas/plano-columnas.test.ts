import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { mapArchivoEstado, mapFachadaDetalle, mapFachadaListado } from "./mapear";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("columnas del plano v2", () => {
  it("pasa svg_id, ubicación y largo cuando la fila los trae", () => {
    const item = mapFachadaListado(
      {
        id: "f1",
        nombre: "Local 1 · Fachada 1",
        recinto_id: null,
        superficie_m2: null,
        foto_key: null,
        svg_id: "s1-local-1-f1",
        ubicacion: "interior",
        tipo_espacio: "unidad",
        unidad_label: "Local 1",
        orden: 1,
        largo_plano_m: 17.7,
        evaluada_en: null,
        intervenciones: [],
      },
      [],
    );
    assert.equal(item.svgId, "s1-local-1-f1");
    assert.equal(item.ubicacion, "interior");
    assert.equal(item.tipoEspacio, "unidad");
    assert.equal(item.unidadLabel, "Local 1");
    assert.equal(item.orden, 1);
    assert.equal(item.largoPlanoM, 17.7);
    assert.equal(item.evaluadaEn, null);
    assert.equal(item.superficieM2, null);
  });

  it("deja las columnas nuevas en null si el select es el anterior", () => {
    const item = mapFachadaDetalle(
      {
        id: "f1",
        nombre: "Local 1",
        recinto_id: null,
        alto_m: null,
        ancho_m: 9,
        superficie_m2: null,
        notas: null,
        foto_key: null,
        foto_nombre: null,
        plano_key: null,
        plano_nombre: null,
      },
      [],
      [],
    );
    assert.equal(item.svgId, null);
    assert.equal(item.ubicacion, null);
    assert.equal(item.largoPlanoM, null);
    assert.equal(item.altoM, null);
    assert.equal(item.anchoM, 9);
  });

  it("sin columna momento lee la galería como antes", () => {
    const archivo = mapArchivoEstado({
      id: "a1",
      tipo_archivo: "foto",
      object_key: "fachadas/a/general/foto.jpg",
      nombre_archivo: "foto.jpg",
      thumbnail_key: null,
      es_portada: true,
      orden: 0,
      fecha: null,
    });
    assert.equal(archivo.momento, "antes");
    assert.equal(archivo.duracionSeg, null);
  });

  it("el seed generado coincide con fachadas-v2.json", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/generar-seed-fachadas-v2.mjs", "--check"],
      { encoding: "utf8", cwd: root },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /69 fachadas, 71 vínculos/);
  });
});
