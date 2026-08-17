import assert from "node:assert/strict";
import test from "node:test";
import { composeCoreInterpretation, extractCoreInterpretationFactors, findAspect } from "./index.js";

test("distingue una conjunción de una oposición", () => {
  assert.equal(findAspect("sun", 10, "moon", 10)?.name, "conjunction");
  assert.equal(findAspect("sun", 10, "moon", 190)?.name, "opposition");
});

test("reconoce los aspectos menores habituales con orbes conservadores", () => {
  assert.equal(findAspect("sun", 0, "moon", 30)?.name, "semi-sextile");
  assert.equal(findAspect("sun", 0, "moon", 45)?.name, "semi-square");
  assert.equal(findAspect("sun", 0, "moon", 72)?.name, "quintile");
  assert.equal(findAspect("sun", 0, "moon", 135)?.name, "sesquisquare");
  assert.equal(findAspect("sun", 0, "moon", 144)?.name, "biquintile");
  assert.equal(findAspect("sun", 0, "moon", 150)?.name, "quincunx");
  assert.equal(findAspect("sun", 0, "moon", 33), undefined);
});

test("extrae y compone una interpretación trazable de Sol, Luna y Ascendente", () => {
  const chart = {
    birthData: { date: "1981-09-21", time: "04:00", timeZone: "Europe/Madrid", latitude: 41.55, longitude: 2.1 },
    time: { localDateTime: "", utcDateTime: "", julianDayUT: 0, timeZone: "Europe/Madrid" },
    houses: { ascendant: 75.5, midheaven: 0, cusps: Array.from({ length: 12 }, (_, index) => index * 30) },
    planets: [
      { planet: "sun" as const, longitude: 145.25, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "leo" as const, degree: 25, minute: 15, second: 0 },
      { planet: "moon" as const, longitude: 222.5, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "scorpio" as const, degree: 12, minute: 30, second: 0 }
    ],
    points: []
  };
  const factors = extractCoreInterpretationFactors(chart);
  assert.deepEqual(factors.map((factor) => factor.id), ["sun:leo:house-5", "moon:scorpio:house-8", "ascendant:gemini"]);
  const report = composeCoreInterpretation(chart);
  assert.equal(report.sections.length, 3);
  assert.equal(report.sections[0].factorIds[0], "sun:leo:house-5");
  assert.match(report.sections[1].text, /Luna está en 12° 30′ de Escorpio, en casa 8/);
  assert.match(report.sections[2].text, /Ascendente está en 15° 30′ de Géminis/);
});
