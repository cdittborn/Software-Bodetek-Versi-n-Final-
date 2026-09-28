import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatDiaMes,
  formatDiaMesCorto,
  formatMesCortoCl,
  formatMillonesClp,
  formatRangoDiaMes,
} from "./ui";

describe("formatos visuales Fachadas", () => {
  it("fechas cortas en es-CL sin punto en el mes", () => {
    assert.equal(formatMesCortoCl("2026-09-12"), "Sep 2026");
    assert.equal(formatDiaMesCorto("2026-09-01"), "01 sep 2026");
    assert.equal(formatDiaMes("2026-08-18"), "18 ago");
    assert.equal(formatRangoDiaMes("2026-09-01", "2026-09-12"), "01 – 12 sep 2026");
    assert.equal(formatRangoDiaMes("2025-03-10", "2025-03-14"), "10 – 14 mar 2025");
  });

  it("millones CLP con una decimal", () => {
    assert.equal(formatMillonesClp(18_400_000), "$18,4 M");
    assert.equal(formatMillonesClp(180_000), "$180.000");
  });
});
