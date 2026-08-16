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
