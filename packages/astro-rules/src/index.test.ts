import assert from "node:assert/strict";
import test from "node:test";
import { composeCoreInterpretation, extractChartBalanceFactors, extractCoreInterpretationFactors, extractKeyAspectFactors, findAspect } from "./index.js";

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

test("extrae y compone una interpretación trazable de planetas personales y Ascendente", () => {
  const chart = {
    birthData: { date: "1981-09-21", time: "04:00", timeZone: "Europe/Madrid", latitude: 41.55, longitude: 2.1 },
    time: { localDateTime: "", utcDateTime: "", julianDayUT: 0, timeZone: "Europe/Madrid" },
    houses: { ascendant: 75.5, midheaven: 0, cusps: Array.from({ length: 12 }, (_, index) => index * 30) },
    planets: [
      { planet: "sun" as const, longitude: 145.25, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "leo" as const, degree: 25, minute: 15, second: 0 },
      { planet: "moon" as const, longitude: 222.5, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "scorpio" as const, degree: 12, minute: 30, second: 0 },
      { planet: "mercury" as const, longitude: 11.5, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "aries" as const, degree: 11, minute: 30, second: 0 },
      { planet: "venus" as const, longitude: 62.75, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "gemini" as const, degree: 2, minute: 45, second: 0 },
      { planet: "mars" as const, longitude: 307.25, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "aquarius" as const, degree: 7, minute: 15, second: 0 }
    ],
    points: []
  };
  const factors = extractCoreInterpretationFactors(chart);
  assert.deepEqual(factors.map((factor) => factor.id), ["sun:leo:house-5", "moon:scorpio:house-8", "mercury:aries:house-1", "venus:gemini:house-3", "mars:aquarius:house-11", "ascendant:gemini"]);
  assert.deepEqual(extractKeyAspectFactors(chart).map((factor) => factor.id), ["aspect:moon:mars:square", "aspect:mercury:mars:sextile", "aspect:venus:mars:trine"]);
  assert.deepEqual(extractChartBalanceFactors(chart).map((factor) => factor.id), ["elements:fire-air", "modalities:fixed", "houses:none"]);
  const report = composeCoreInterpretation(chart);
  assert.equal(report.sections.length, 8);
  assert.equal(report.sections[0].factorIds[0], "sun:leo:house-5");
  assert.match(report.sections[1].text, /Luna está en 12° 30′ de Escorpio, en casa 8/);
  assert.match(report.sections[2].text, /Mercurio está en 11° 30′ de Aries, en casa 1/);
  assert.match(report.sections[3].text, /Venus está en 2° 45′ de Géminis, en casa 3/);
  assert.match(report.sections[4].text, /Marte está en 7° 15′ de Acuario, en casa 11/);
  assert.match(report.sections[5].text, /Ascendente está en 15° 30′ de Géminis/);
  assert.equal(report.sections[6].id, "aspects");
  assert.match(report.sections[6].text, /Luna en cuadratura con Marte/);
  assert.equal(report.sections[7].id, "synthesis");
  assert.match(report.sections[7].text, /predominan fuego y aire/);
});

test("incluye planetas sociales, transpersonales y puntos interpretativos", () => {
  const chart = {
    birthData: { date: "", time: "", timeZone: "", latitude: 0, longitude: 0 },
    time: { localDateTime: "", utcDateTime: "", julianDayUT: 0, timeZone: "" },
    houses: { ascendant: 0, midheaven: 0, cusps: Array.from({ length: 12 }, (_, index) => index * 30) },
    planets: [
      { planet: "jupiter" as const, longitude: 249, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "sagittarius" as const, degree: 9, minute: 0, second: 0 },
      { planet: "saturn" as const, longitude: 270, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "capricorn" as const, degree: 0, minute: 0, second: 0 },
      { planet: "uranus" as const, longitude: 301, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "aquarius" as const, degree: 1, minute: 0, second: 0 },
      { planet: "neptune" as const, longitude: 332, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "pisces" as const, degree: 2, minute: 0, second: 0 },
      { planet: "pluto" as const, longitude: 15, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "aries" as const, degree: 15, minute: 0, second: 0 }
    ],
    points: [
      { planet: "north-node" as const, longitude: 45, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "taurus" as const, degree: 15, minute: 0, second: 0 },
      { planet: "chiron" as const, longitude: 75, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "gemini" as const, degree: 15, minute: 0, second: 0 },
      { planet: "part-of-fortune" as const, longitude: 105, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "cancer" as const, degree: 15, minute: 0, second: 0 }
    ]
  };
  const report = composeCoreInterpretation(chart);
  assert.deepEqual(report.sections.map((section) => section.id), ["jupiter", "saturn", "uranus", "neptune", "pluto", "north-node", "chiron", "part-of-fortune", "ascendant", "synthesis"]);
  assert.match(report.sections[0].text, /Júpiter está en 9° 00′ de Sagitario, en casa 9/);
  assert.match(report.sections[5].text, /Nodo Norte está en 15° 00′ de Tauro, en casa 2/);
  assert.match(report.sections[7].text, /Parte de la Fortuna está en 15° 00′ de Cáncer, en casa 4/);
  assert.match(report.sections[9].text, /predominan fuego/);
});

test("destaca una casa cuando concentra varias posiciones", () => {
  const chart = {
    birthData: { date: "", time: "", timeZone: "", latitude: 0, longitude: 0 },
    time: { localDateTime: "", utcDateTime: "", julianDayUT: 0, timeZone: "" },
    houses: { ascendant: 0, midheaven: 0, cusps: Array.from({ length: 12 }, (_, index) => index * 30) },
    planets: [
      { planet: "sun" as const, longitude: 10, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "aries" as const, degree: 10, minute: 0, second: 0 },
      { planet: "moon" as const, longitude: 20, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "aries" as const, degree: 20, minute: 0, second: 0 }
    ],
    points: []
  };
  assert.equal(extractChartBalanceFactors(chart)[2].id, "houses:1");
  assert.match(composeCoreInterpretation(chart).sections.at(-1)?.text ?? "", /concentración en casa 1/);
});
