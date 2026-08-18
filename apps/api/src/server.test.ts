import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";
import { createApiServer } from "./server.js";

test("POST /v1/natal-charts devuelve una carta calculada por Swiss Ephemeris", async (context) => {
  const server = createApiServer().listen(0);
  await once(server, "listening");
  context.after(() => server.close());
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No se pudo obtener el puerto de prueba");

  const response = await fetch(`http://127.0.0.1:${address.port}/v1/natal-charts`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ birthData: { date: "1990-08-16", time: "12:00:00", timeZone: "Europe/Madrid", latitude: 40.4168, longitude: -3.7038, locationName: "Madrid" } })
  });
  const chart = await response.json() as { planets: unknown[]; houses: { cusps: unknown[] } };
  assert.equal(response.status, 200);
  assert.equal(chart.planets.length, 10);
  assert.equal(chart.houses.cusps.length, 12);
});

test("rechaza solicitudes sin datos de nacimiento", async (context) => {
  const server = createApiServer().listen(0);
  await once(server, "listening");
  context.after(() => server.close());
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No se pudo obtener el puerto de prueba");
  const response = await fetch(`http://127.0.0.1:${address.port}/v1/natal-charts`, { method: "POST", body: "{}" });
  assert.equal(response.status, 400);
});

test("POST /v1/natal-interpretations devuelve secciones trazables de planetas personales y Ascendente", async (context) => {
  const server = createApiServer().listen(0);
  await once(server, "listening");
  context.after(() => server.close());
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No se pudo obtener el puerto de prueba");
  const response = await fetch(`http://127.0.0.1:${address.port}/v1/natal-interpretations`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ birthData: { date: "1990-08-16", time: "12:00:00", timeZone: "Europe/Madrid", latitude: 40.4168, longitude: -3.7038, locationName: "Madrid" } })
  });
  const report = await response.json() as { factors: Array<{ id: string }>; sections: Array<{ id: string; factorIds: string[] }> };
  assert.equal(response.status, 200);
  assert.deepEqual(report.sections.map((section) => section.id), ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "north-node", "chiron", "part-of-fortune", "ascendant", "aspects", "synthesis"]);
  assert.equal(report.sections[0].factorIds[0], report.factors[0].id);
});

test("GET /v1/locations entrega lugares con coordenadas y zona horaria", async (context) => {
  const server = createApiServer({ geocodingProvider: { search: async () => [{ id: 1, name: "Madrid", label: "Madrid, Comunidad de Madrid, España", latitude: 40.4168, longitude: -3.7038, timeZone: "Europe/Madrid" }] } }).listen(0);
  await once(server, "listening");
  context.after(() => server.close());
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No se pudo obtener el puerto de prueba");
  const response = await fetch(`http://127.0.0.1:${address.port}/v1/locations?query=Madrid`);
  const body = await response.json() as { results: Array<{ timeZone: string }> };
  assert.equal(response.status, 200);
  assert.equal(body.results[0].timeZone, "Europe/Madrid");
});
