import assert from "node:assert/strict";
import test from "node:test";
import { renderNatalChartSvg } from "./index.js";

test("ancla la carta al Ascendente e incluye ángulos y casas", () => {
  const svg = renderNatalChartSvg({ birthData: { date: "1981-09-21", time: "04:00", timeZone: "Europe/Madrid", latitude: 41.55, longitude: 2.1 }, time: { localDateTime: "", utcDateTime: "", julianDayUT: 0, timeZone: "Europe/Madrid" }, houses: { ascendant: 134.6563, midheaven: 34.2208, cusps: Array.from({ length: 12 }, (_, index) => (134.6563 + index * 30) % 360) }, planets: [{ planet: "sun", longitude: 177.99, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "virgo", degree: 27, minute: 59, second: 0 }, { planet: "moon", longitude: 91.35, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "cancer", degree: 1, minute: 21, second: 0 }], points: [] });
  assert.match(svg, /ASC 14°39′/);
  assert.match(svg, /MC 4°13′/);
  assert.match(svg, /Casa 12/);
  assert.equal((svg.match(/<circle class="ring"/g) ?? []).length, 4);
});

test("separa en carriles radiales los planetas que están muy próximos", () => {
  const base = { birthData: { date: "", time: "", timeZone: "", latitude: 0, longitude: 0 }, time: { localDateTime: "", utcDateTime: "", julianDayUT: 0, timeZone: "" }, houses: { ascendant: 0, midheaven: 0, cusps: Array.from({ length: 12 }, (_, index) => index * 30) }, points: [] };
  const position = (planet: "sun" | "mercury" | "jupiter", longitude: number) => ({ planet, longitude, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false, sign: "aries" as const, degree: Math.floor(longitude), minute: 0, second: 0 });
  const svg = renderNatalChartSvg({ ...base, planets: [position("sun", 10), position("mercury", 12), position("jupiter", 14)] });
  assert.match(svg, /data-planet="sun" data-lane="0"/);
  assert.match(svg, /data-planet="mercury" data-lane="1"/);
  assert.match(svg, /data-planet="jupiter" data-lane="2"/);
});
