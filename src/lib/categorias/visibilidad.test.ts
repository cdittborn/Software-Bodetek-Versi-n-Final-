import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { faltaTablaNueva } from "./columnas";
import {
  alternarGrupo,
  alternarHoja,
  categoriaPermitida,
  contarMarcadas,
  estadoGrupo,
  filtrarMenuPorVista,
  hojasDe,
  iniciales,
  itemsDesdeClaves,
  resumenVisibilidad,
  subtipoPermitido,
  VISTA_TODO,
  type Vista,
} from "./visibilidad";

const arbol = [
  { id: "tec", nombre: "Techumbres", subtipos: [{ id: "lluvias" }, { id: "rev" }] },
  { id: "ima", nombre: "Imagen", subtipos: [{ id: "fach" }] },
  { id: "pro", nombre: "Protocolos", subtipos: [] as { id: string }[] },
];

describe("visibilidad en la pantalla", () => {
  it("con todo marcado, el resumen dice ve todo", () => {
    const todas = hojasDe(arbol);
    assert.deepEqual(todas, ["tec:lluvias", "tec:rev", "ima:fach", "pro:"]);
    assert.equal(resumenVisibilidad(contarMarcadas(todas, todas), todas.length, false), "ve todo");
    assert.equal(resumenVisibilidad(0, todas.length, true), "ve todo");
  });

  it("desmarcar una subcategoría deja el resto igual y marca la categoría a medias", () => {
    const todas = hojasDe(arbol);
    const deAsistente = alternarHoja(todas, "tec:rev");
    const dePablo = todas.slice();
    assert.equal(contarMarcadas(deAsistente, todas), 3);
    assert.equal(resumenVisibilidad(3, 4, false), "ve 3 de 4");
    assert.equal(estadoGrupo(["tec:lluvias", "tec:rev"], deAsistente), "mid");
    assert.equal(estadoGrupo(["ima:fach"], deAsistente), "on");
    assert.deepEqual(dePablo, todas);
  });

  it("la casilla de la categoría prende o apaga todas sus subcategorías", () => {
    const grupo = ["tec:lluvias", "tec:rev"];
    const aMedias = alternarGrupo(grupo, grupo);
    assert.deepEqual(aMedias, []);
    assert.deepEqual(alternarGrupo(aMedias, grupo).sort(), grupo.sort());
  });

  it("una categoría sin subcategorías tiene su propia casilla", () => {
    const solo = alternarHoja(["pro:"], "pro:");
    assert.deepEqual(solo, []);
    assert.deepEqual(itemsDesdeClaves(["pro:", "tec:lluvias"]), [
      { categoria_id: "pro", subtipo_id: null },
      { categoria_id: "tec", subtipo_id: "lluvias" },
    ]);
  });

  it("el menú esconde solo lo desmarcado", () => {
    const vista: Vista = { todo: false, pares: new Set(["tec:lluvias", "pro:"]) };
    const menu = filtrarMenuPorVista(arbol, vista);
    assert.deepEqual(
      menu.map((c) => ({ id: c.id, subs: c.subtipos.map((s) => s.id) })),
      [
        { id: "tec", subs: ["lluvias"] },
        { id: "pro", subs: [] },
      ],
    );
    assert.deepEqual(filtrarMenuPorVista(arbol, VISTA_TODO), arbol);
    assert.equal(subtipoPermitido(vista, "tec", "rev"), false);
    assert.equal(subtipoPermitido(VISTA_TODO, "tec", "rev"), true);
    assert.equal(categoriaPermitida(vista, "ima", ["fach"]), false);
  });

  it("arma iniciales y reconoce que la tabla todavía no existe", () => {
    assert.equal(iniciales("Cristóbal Dittborn"), "CD");
    assert.equal(iniciales("Pablo"), "P");
    assert.equal(iniciales("  "), "?");
    assert.equal(faltaTablaNueva({ code: "42P01", message: 'relation "usuario_visibilidad" does not exist' }), true);
    assert.equal(faltaTablaNueva({ code: "PGRST205", message: "Could not find the table 'public.usuario_visibilidad' in the schema cache" }), true);
    assert.equal(faltaTablaNueva({ code: "42703", message: "column visibilidad_personalizada does not exist" }), true);
    assert.equal(faltaTablaNueva({ code: "42501", message: "permission denied" }), false);
  });
});
