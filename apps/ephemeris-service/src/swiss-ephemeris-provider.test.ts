import assert from "node:assert/strict";
import test from "node:test";
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
