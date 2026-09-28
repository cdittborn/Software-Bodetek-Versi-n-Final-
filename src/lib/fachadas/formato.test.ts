import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatDecimalCl,
  formatMetrosCl,
  formatMontoNetoInput,
  formatSuperficieEnteraCl,
  parseDecimalCl,
  parseMontoNetoCl,
} from "./formato";

describe("formato chileno Fachadas", () => {
  it("parsea m² y días con coma decimal", () => {
    assert.equal(parseDecimalCl("111,6"), 111.6);
    assert.equal(parseDecimalCl("3,5"), 3.5);
    assert.equal(parseDecimalCl("1.111,6"), 1111.6);
    assert.equal(parseDecimalCl(""), null);
  });

  it("formatea con coma decimal", () => {
    assert.equal(formatDecimalCl(111.6), "111,6");
    assert.equal(formatDecimalCl(3.5, 1), "3,5");
  });

  it("metros siempre con 2 decimales; superficies totales sin decimales", () => {
    assert.equal(formatMetrosCl(6.2), "6,20");
    assert.equal(formatMetrosCl(18), "18,00");
    assert.equal(formatSuperficieEnteraCl(2860), "2.860");
    assert.equal(formatSuperficieEnteraCl(5940.4), "5.940");
  });

  it("parsea valor neto con puntos de miles", () => {
    assert.equal(parseMontoNetoCl("1.420.000"), 1_420_000);
    assert.equal(parseMontoNetoCl(""), 0);
    assert.equal(parseMontoNetoCl("18,4"), 18);
  });

  it("formatea el input de neto", () => {
    assert.equal(formatMontoNetoInput(1_420_000), "1.420.000");
    assert.equal(formatMontoNetoInput(0), "");
  });
});
