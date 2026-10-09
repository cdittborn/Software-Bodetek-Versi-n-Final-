import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  ESPACIOS_PLANO,
  FACHADAS_PLANO,
  VIEWBOX_PLANO,
} from "../../components/fachadas/plano/geometria";
import {
  anclajeTooltip,
  contraste,
  distanciaPuntoSegmento,
  estadoVisible,
  estiloEstado,
  fachadaMasCercana,
  puntoMedioPolilinea,
  TOOLTIP_FONDO,
  TOOLTIP_TEXTO,
  VIEWBOX_ALTO,
  VIEWBOX_ANCHO,
} from "./plano";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function fachada(id: string) {
  const encontrada = FACHADAS_PLANO.find((item) => item.id === id);
  if (!encontrada) throw new Error(`falta ${id}`);
  return encontrada;
}

describe("geometría del plano v2", () => {
  it("sale del SVG y no se edita a mano", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/generar-geometria-plano.mjs", "--check"],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });

  it("dibuja 69 fachadas, sin Bodega 7 u 8, y el taller es una polyline cerrada", () => {
    assert.equal(FACHADAS_PLANO.length, 69);
    assert.equal(VIEWBOX_PLANO.width, VIEWBOX_ANCHO);
    assert.equal(VIEWBOX_PLANO.height, VIEWBOX_ALTO);
    assert.equal(
      FACHADAS_PLANO.some((item) => /bodega-7|bodega-8/.test(item.id)),
      false,
    );
    const taller = fachada("s1-taller-maestros-f1");
    assert.equal(taller.cerrada, true);
    assert.ok(taller.puntos.length >= 12);
    const espacio = ESPACIOS_PLANO.find((item) => item.id === "esp-taller-maestros");
    assert.ok(espacio && espacio.puntos.length >= 12);
    const componente = readFileSync(
      path.join(root, "src/components/fachadas/plano/PlanoFachadas.tsx"),
      "utf8",
    );
    assert.doesNotMatch(componente, /<circle\b/);
    assert.doesNotMatch(componente, /dangerouslySetInnerHTML/);
  });
});

describe("punto medio y cercanía", () => {
  it("el punto medio de s2-bodega-s1-f1 cae sobre el tramo, no en el promedio de vértices", () => {
    const puntos = fachada("s2-bodega-s1-f1").puntos;
    const medio = puntoMedioPolilinea(puntos);
    const sobreTramo = distanciaPuntoSegmento(medio, puntos[1], puntos[2]);
    assert.ok(sobreTramo < 0.01);
    const promedio: [number, number] = [
      puntos.reduce((suma, punto) => suma + punto[0], 0) / puntos.length,
      puntos.reduce((suma, punto) => suma + punto[1], 0) / puntos.length,
    ];
    assert.ok(Math.hypot(medio[0] - promedio[0], medio[1] - promedio[1]) > 5);
  });

  it("una fachada corta gana a la vecina si el toque está a menos de 22 px", () => {
    const corta = fachada("s2-local-1-2-f1");
    const medio = puntoMedioPolilinea(corta.puntos);
    const escala = 360 / VIEWBOX_ANCHO;
    const punto: [number, number] = [medio[0], medio[1] - 2 / escala];
    assert.equal(fachadaMasCercana(punto, FACHADAS_PLANO, escala), "s2-local-1-2-f1");
    const haciaVecina: [number, number] = [medio[0], medio[1] + 8 / escala];
    assert.equal(fachadaMasCercana(haciaVecina, FACHADAS_PLANO, escala), "s2-local-1-2-f3");
    assert.equal(fachadaMasCercana(punto, FACHADAS_PLANO, 0), null);
    assert.equal(fachadaMasCercana([0, 0], FACHADAS_PLANO, 1), null);
  });
});

describe("tooltip y estados", () => {
  it("el contraste del tooltip negro cumple AA", () => {
    assert.ok(contraste(TOOLTIP_TEXTO, TOOLTIP_FONDO) >= 4.5);
  });

  it("en el 30 % superior el tooltip va abajo y se corre cerca del borde", () => {
    const alta = fachada("s1-bodega-1a-f1");
    const ancla = anclajeTooltip(puntoMedioPolilinea(alta.puntos));
    assert.equal(ancla.vertical, "abajo");
    assert.equal(ancla.horizontal, "hacia-derecha");
    const baja = anclajeTooltip(puntoMedioPolilinea(fachada("s2-local-1-2-f1").puntos));
    assert.equal(baja.vertical, "arriba");
    assert.equal(baja.horizontal, "centro");
  });

  it("usa la paleta del plano y el modo vacío deja todo sin evaluar", () => {
    assert.equal(estiloEstado("requiere_trabajo").color, "#EF4444");
    assert.equal(estiloEstado("programada").dash, "16 9");
    assert.equal(estiloEstado("programada").dashLeyenda, "8 5");
    assert.equal(estiloEstado("en_ejecucion").dash, "0.1 11");
    assert.equal(estiloEstado("en_ejecucion").linecap, "round");
    assert.equal(estiloEstado("al_dia").badgeBg, "#E8F5EC");
    assert.equal(estiloEstado("sin_evaluar").dashLeyenda, "3 4");
    assert.equal(estadoVisible("hoy", { a: "al_dia" }, "a"), "al_dia");
    assert.equal(estadoVisible("hoy", {}, "a"), "sin_evaluar");
    assert.equal(estadoVisible("vacio", { a: "al_dia" }, "a"), "sin_evaluar");
  });
});
