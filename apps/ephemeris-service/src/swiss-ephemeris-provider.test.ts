import assert from "node:assert/strict";
import test from "node:test";
import { calculateNatalChart } from "@astralis/astro-engine";
import { SwissEphemerisProvider } from "./swiss-ephemeris-provider.js";

const provider = new SwissEphemerisProvider();

test("calcula una posición geocéntrica tropical con velocidad", () => {
  const sun = provider.calculatePlanet("sun", 2_451_545);
  assert.ok(sun.longitude >= 0 && sun.longitude < 360);
  assert.ok(sun.distance > 0);
  assert.ok(Number.isFinite(sun.speedLongitude));
  assert.ok(Math.abs(sun.longitude - 280.37) < 0.5);
});

test("calcula doce cúspides y los ángulos para Placidus", () => {
  const houses = provider.calculateHouses(2_451_545, 40.4168, -3.7038, "placidus");
  assert.equal(houses.cusps.length, 12);
  assert.ok(houses.ascendant >= 0 && houses.ascendant < 360);
  assert.ok(houses.midheaven >= 0 && houses.midheaven < 360);
});

test("incluye Nodo Norte, Quirón y Parte de la Fortuna en la carta natal", () => {
  const chart = calculateNatalChart({ date: "1981-09-21", time: "04:00", timeZone: "Europe/Madrid", latitude: 41.5433, longitude: 2.1094 }, provider, "placidus");
  const northNode = chart.points.find(({ planet }) => planet === "north-node");
  const chiron = chart.points.find(({ planet }) => planet === "chiron");
  const fortune = chart.points.find(({ planet }) => planet === "part-of-fortune");

  assert.ok(northNode);
  assert.ok(chiron);
  assert.ok(fortune);
  assert.equal(fortune.sign, "taurus");
  assert.equal(fortune.degree, 18);
});
