import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  agregarCategoria,
  agregarSubtipo,
  cambiarColor,
  construirPayload,
  crearEstado,
  eliminarCategoria,
  eliminarSubtipo,
  erroresEditor,
  hayCambios,
  motivoNoEliminarCategoria,
  motivoNoEliminarSubtipo,
  mover,
  moverCategoria,
  moverSubtipo,
  renombrarCategoria,
  renombrarSubtipo,
  type CategoriaMenu,
} from "./editorMenu";

const base: CategoriaMenu[] = [
  {
    id: "tec",
    nombre: "Techumbres y canales",
    color: "#5E87D6",
    protegida: true,
    trabajos: 0,
    subtipos: [
      { id: "llu", nombre: "Lluvias y temporales", protegida: true, trabajos: 29 },
      { id: "rev", nombre: "Revisiones y mantenciones periódicas", protegida: true, trabajos: 0 },
    ],
  },
  {
    id: "ima",
    nombre: "Imagen",
    color: "#9682CF",
    protegida: false,
    trabajos: 0,
    subtipos: [
      { id: "let", nombre: "Letreros de locales", protegida: false, trabajos: 0 },
      { id: "por", nombre: "Pórtico de entrada", protegida: false, trabajos: 2 },
    ],
  },
  { id: "seg", nombre: "Seguridad", color: null, protegida: false, trabajos: 0, subtipos: [] },
];

describe("editor del menú", () => {
  it("sin cambios, el payload repite el menú tal cual y no borra nada", () => {
    const e = crearEstado(base);
    assert.equal(hayCambios(e, e), false);
    const p = construirPayload(e);
    assert.deepEqual(p.categorias.map((c) => c.id), ["tec", "ima", "seg"]);
    assert.deepEqual(p.categorias[0]!.subtipos.map((s) => s.id), ["llu", "rev"]);
    assert.deepEqual(p.eliminar_categorias, []);
    assert.deepEqual(p.eliminar_subtipos, []);
  });

  it("una categoría sin color guardado toma el de su posición", () => {
    assert.equal(crearEstado(base).categorias[2]!.color, "#4E9E92");
  });

  it("renombrar conserva el id (misma fila en la base) y limpia espacios al guardar", () => {
    const inicial = crearEstado(base);
    let e = renombrarSubtipo(inicial, "tec", "llu", "  Lluvias  ");
    e = renombrarCategoria(e, "ima", "Imagen y letreros");
    const p = construirPayload(e);
    assert.deepEqual(p.categorias[0]!.subtipos[0], { id: "llu", nombre: "Lluvias" });
    assert.deepEqual(p.categorias[1]!.nombre, "Imagen y letreros");
    assert.equal(hayCambios(inicial, e), true);
  });

  it("ordenar con flechas o arrastre cambia solo la posición", () => {
    let e = moverCategoria(crearEstado(base), 2, 0);
    e = moverSubtipo(e, "ima", 1, 0);
    const p = construirPayload(e);
    assert.deepEqual(p.categorias.map((c) => c.id), ["seg", "tec", "ima"]);
    assert.deepEqual(p.categorias[2]!.subtipos.map((s) => s.id), ["por", "let"]);
  });

  it("mover fuera de rango no cambia nada", () => {
    const lista = [1, 2, 3];
    assert.equal(mover(lista, 0, -1), lista);
    assert.equal(mover(lista, 2, 3), lista);
    assert.deepEqual(mover(lista, 0, 2), [2, 3, 1]);
  });

  it("el cuadrito de color recorre la paleta y vuelve al inicio", () => {
    let e = crearEstado(base);
    for (let i = 0; i < 7; i++) e = cambiarColor(e, "tec");
    assert.equal(e.categorias[0]!.color, "#5E87D6");
    assert.equal(cambiarColor(crearEstado(base), "tec").categorias[0]!.color, "#9682CF");
  });

  it("agregar categoría y subcategoría manda id null", () => {
    let e = agregarCategoria(crearEstado(base));
    const nueva = e.categorias[3]!;
    e = agregarSubtipo(e, nueva.key);
    e = agregarSubtipo(e, "ima");
    const p = construirPayload(e);
    assert.deepEqual(p.categorias[3], {
      id: null,
      nombre: "Nueva categoría",
      color: "#C9973F",
      subtipos: [{ id: null, nombre: "Nueva subcategoría" }],
    });
    assert.deepEqual(p.categorias[1]!.subtipos.at(-1), { id: null, nombre: "Nueva subcategoría" });
  });

  it("no deja eliminar lo protegido ni lo que tiene trabajos", () => {
    const e = crearEstado(base);
    assert.match(motivoNoEliminarCategoria(e.categorias[0]!)!, /no se puede eliminar/);
    assert.match(motivoNoEliminarSubtipo(e.categorias[0]!.subtipos[0]!)!, /no se puede eliminar/);
    assert.equal(motivoNoEliminarCategoria(e.categorias[1]!), "Tiene 2 trabajos; muévelos antes de eliminar.");
    assert.equal(motivoNoEliminarSubtipo(e.categorias[1]!.subtipos[1]!), "Tiene 2 trabajos; muévelos antes de eliminar.");
    assert.equal(eliminarCategoria(e, "tec"), e);
    assert.equal(eliminarCategoria(e, "ima"), e);
    assert.equal(eliminarSubtipo(e, "ima", "por"), e);
  });

  it("un trabajo usa singular", () => {
    const e = crearEstado([{ ...base[2]!, trabajos: 1 }]);
    assert.equal(motivoNoEliminarCategoria(e.categorias[0]!), "Tiene 1 trabajo; muévelo antes de eliminar.");
  });

  it("eliminar marca el id para Listo; una fila nueva se descarta sin mandar nada", () => {
    let e = eliminarSubtipo(crearEstado(base), "ima", "let");
    e = eliminarCategoria(e, "seg");
    e = agregarCategoria(e);
    e = eliminarCategoria(e, e.categorias.at(-1)!.key);
    const p = construirPayload(e);
    assert.deepEqual(p.eliminar_subtipos, ["let"]);
    assert.deepEqual(p.eliminar_categorias, ["seg"]);
    assert.deepEqual(p.categorias.map((c) => c.id), ["tec", "ima"]);
    assert.deepEqual(p.categorias[1]!.subtipos.map((s) => s.id), ["por"]);
  });

  it("no guarda nombres vacíos ni de más de 80 caracteres", () => {
    let e = renombrarCategoria(crearEstado(base), "seg", "   ");
    e = renombrarSubtipo(e, "ima", "let", "x".repeat(81));
    const errores = erroresEditor(e);
    assert.equal(errores.length, 2);
    assert.match(errores[0]!, /máximo 80/);
    assert.match(errores[1]!, /categoría sin nombre/);
    assert.deepEqual(erroresEditor(crearEstado(base)), []);
  });
});
