import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatDecimalCl,
  formatMontoNetoInput,
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
