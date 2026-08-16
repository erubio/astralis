import assert from "node:assert/strict";
import test from "node:test";
import { renderNatalChartSvg } from "./index.js";

test("ancla la carta al Ascendente e incluye ángulos y casas", () => {
  const svg = renderNatalChartSvg({ birthData: { date: "1981-09-21", time: "04:00", timeZone: "Europe/Madrid", latitude: 41.55, longitude: 2.1 }, time: { localDateTime: "", utcDateTime: "", julianDayUT: 0, timeZone: "Europe/Madrid" }, houses: { ascendant: 134.6563, midheaven: 34.2208, cusps: Array.from({ length: 12 }, (_, index) => (134.6563 + index * 30) % 360) }, planets: [{ planet: "sun", longitude: 177.99, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "virgo", degree: 27, minute: 59, second: 0 }, { planet: "moon", longitude: 91.35, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "cancer", degree: 1, minute: 21, second: 0 }], points: [] });
  assert.match(svg, /ASC 14° ♌ 39′/);
  assert.match(svg, /MC 4° ♉ 13′/);
  assert.match(svg, /DSC 14° ♒ 39′/);
  assert.match(svg, /IC 4° ♏ 13′/);
  assert.match(svg, /class="outer-(?:cusp|angle)"[^>]*transform="rotate\(/);
  assert.match(svg, /Cúspide 1 14°39′/);
  assert.match(svg, />27°<\/text>/);
  assert.match(svg, />59′<\/text>/);
  assert.match(svg, /data-aspect="square"/);
  assert.match(svg, />□<\/text>/);
  assert.match(svg, /Casa 12/);
  assert.equal((svg.match(/<circle class="ring"/g) ?? []).length, 4);
  assert.doesNotMatch(svg, /position-track/);
});

test("agrupa cada posición en zonas invisibles de símbolo, grado, signo, minuto y retrogradación", () => {
  const base = { birthData: { date: "", time: "", timeZone: "", latitude: 0, longitude: 0 }, time: { localDateTime: "", utcDateTime: "", julianDayUT: 0, timeZone: "" }, houses: { ascendant: 0, midheaven: 0, cusps: Array.from({ length: 12 }, (_, index) => index * 30) }, points: [] };
  const position = (planet: "sun" | "mercury" | "jupiter", longitude: number) => ({ planet, longitude, latitude: 0, distance: 1, speedLongitude: 1, retrograde: planet === "mercury", sign: "aries" as const, degree: Math.floor(longitude), minute: 0, second: 0 });
  const svg = renderNatalChartSvg({ ...base, planets: [position("sun", 10), position("mercury", 12), position("jupiter", 14)] });
  assert.match(svg, /data-planet="mercury">[\s\S]*?☿[\s\S]*?>12°<\/text>[\s\S]*?♈[\s\S]*?>00′<\/text>[\s\S]*?℞/);
});

test("muestra solo los aspectos menores seleccionados", () => {
  const base = { birthData: { date: "", time: "", timeZone: "", latitude: 0, longitude: 0 }, time: { localDateTime: "", utcDateTime: "", julianDayUT: 0, timeZone: "" }, houses: { ascendant: 0, midheaven: 0, cusps: Array.from({ length: 12 }, (_, index) => index * 30) }, points: [] };
  const planets = [{ planet: "sun" as const, longitude: 0, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "aries" as const, degree: 0, minute: 0, second: 0 }, { planet: "moon" as const, longitude: 30, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "taurus" as const, degree: 0, minute: 0, second: 0 }];
  assert.match(renderNatalChartSvg({ ...base, planets }), /data-aspect="semi-sextile"/);
  assert.doesNotMatch(renderNatalChartSvg({ ...base, planets }, 620, { minorAspects: [] }), /data-aspect="semi-sextile"/);
  const svg = renderNatalChartSvg({ ...base, planets }, 620, { minorAspects: ["semi-sextile"] });
  assert.match(svg, /data-aspect="semi-sextile"/);
  assert.match(svg, /data-aspect="semi-sextile"[^>]*stroke-width="2\.50"/);
});
