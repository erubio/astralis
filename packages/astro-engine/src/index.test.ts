import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBirthTime, toZodiacPosition } from "./index.js";

test("normaliza la hora local con una zona IANA", () => {
  const result = normalizeBirthTime({ date: "2024-01-15", time: "12:00:00", timeZone: "Europe/Madrid", latitude: 0, longitude: 0 });
  assert.equal(result.utcDateTime, "2024-01-15T11:00:00.000Z");
});

test("convierte una longitud a signo sin redondear antes", () => {
  const result = toZodiacPosition({ planet: "mars", longitude: 127.421837, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false });
  assert.equal(result.sign, "leo");
  assert.equal(result.degree, 7);
  assert.equal(result.minute, 25);
});
