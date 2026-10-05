import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  VIDEO_MAX_BYTES,
  correrConTope,
  escalaMaxLado,
  formatDuracionVideo,
  mensajeSubida,
  validarArchivoFachada,
} from "./cola-subida";

describe("validar archivos de Fachadas", () => {
  it("acepta foto y video dentro del límite", () => {
    assert.deepEqual(
      validarArchivoFachada({ name: "a.jpg", type: "image/jpeg", size: 10 }),
      { ok: true, tipo: "foto" },
    );
    assert.deepEqual(
      validarArchivoFachada({
        name: "a.mp4",
        type: "video/mp4",
        size: VIDEO_MAX_BYTES,
      }),
      { ok: true, tipo: "video" },
    );
  });

  it("rechaza un video de más de 200 MB con un mensaje claro", () => {
    const r = validarArchivoFachada({
      name: "largo.mp4",
      type: "video/mp4",
      size: VIDEO_MAX_BYTES + 1,
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.mensaje, /200 MB/);
      assert.match(r.mensaje, /largo\.mp4/);
    }
  });

  it("rechaza documentos", () => {
    const r = validarArchivoFachada({
      name: "cot.pdf",
      type: "application/pdf",
      size: 100,
    });
    assert.equal(r.ok, false);
  });
});

describe("mensaje y escala", () => {
  it("arma «Subiendo X de N archivos»", () => {
    assert.equal(
      mensajeSubida([
        { estado: "listo" },
        { estado: "subiendo" },
        { estado: "en_cola" },
        { estado: "en_cola" },
        { estado: "error" },
      ]),
      "Subiendo 2 de 5 archivos",
    );
    assert.equal(
      mensajeSubida([{ estado: "listo" }, { estado: "error" }]),
      null,
    );
  });

  it("no agranda fotos que ya caben y baja el lado mayor a 2560", () => {
    assert.equal(escalaMaxLado(2000, 1000), 1);
    assert.equal(escalaMaxLado(5120, 2560), 0.5);
    assert.equal(escalaMaxLado(1000, 4000), 2560 / 4000);
  });

  it("formatea la duración del video", () => {
    assert.equal(formatDuracionVideo(65), "1:05");
    assert.equal(formatDuracionVideo(0), "0:00");
  });
});

describe("cola con tope de 3", () => {
  it("no corre más de 3 tareas a la vez y no aborta a las demás si una falla", async () => {
    let activos = 0;
    let max = 0;
    const hechas: number[] = [];
    const tareas = [0, 1, 2, 3, 4].map((n) => async () => {
      activos += 1;
      max = Math.max(max, activos);
      await new Promise((r) => setTimeout(r, 20));
      activos -= 1;
      if (n === 1) throw new Error("falló el 1");
      hechas.push(n);
      return n;
    });
    await assert.rejects(() => correrConTope(tareas, 3), /falló el 1/);
    assert.ok(max <= 3);
    assert.ok(max >= 2);
    assert.ok(hechas.includes(0));
    assert.equal(hechas.includes(1), false);
  });
});
