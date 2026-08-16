import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { BirthData, HouseSystem } from "@astralis/astro-domain";
import { calculateNatalChart } from "@astralis/astro-engine";
import { SwissEphemerisProvider } from "@astralis/ephemeris-service";

const provider = new SwissEphemerisProvider();
const houseSystems = new Set<HouseSystem>(["placidus", "koch", "regiomontanus", "campanus", "equal", "whole-sign", "porphyry", "topocentric"]);

type NatalChartRequest = { birthData: BirthData; houseSystem?: HouseSystem };

export function createApiServer() {
  return createServer(async (request, response) => {
    setCorsHeaders(response);
    if (request.method === "OPTIONS") return response.writeHead(204).end();
    if (request.method !== "POST" || request.url !== "/v1/natal-charts") return sendJson(response, 404, { error: "Ruta no encontrada" });

    try {
      const payload = await readJson(request);
      const { birthData, houseSystem = "placidus" } = parseNatalChartRequest(payload);
      return sendJson(response, 200, calculateNatalChart(birthData, provider, houseSystem));
    } catch (error) {
      return sendJson(response, 400, { error: error instanceof Error ? error.message : "Solicitud no válida" });
    }
  });
}

function parseNatalChartRequest(value: unknown): NatalChartRequest {
  if (!isRecord(value) || !isRecord(value.birthData)) throw new TypeError("Se requiere el objeto birthData");
  const { date, time, timeZone, latitude, longitude, locationName } = value.birthData;
  if (typeof date !== "string" || typeof time !== "string" || typeof timeZone !== "string") throw new TypeError("date, time y timeZone deben ser texto");
  if (typeof latitude !== "number" || typeof longitude !== "number") throw new TypeError("latitude y longitude deben ser números");
  if (locationName !== undefined && typeof locationName !== "string") throw new TypeError("locationName debe ser texto");
  if (value.houseSystem !== undefined && (!houseSystems.has(value.houseSystem as HouseSystem))) throw new TypeError("Sistema de casas no admitido");
  return { birthData: { date, time, timeZone, latitude, longitude, locationName }, houseSystem: value.houseSystem as HouseSystem | undefined };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new RangeError("El cuerpo supera 1 MB");
  }
  try { return JSON.parse(body); } catch { throw new SyntaxError("El cuerpo debe ser JSON válido"); }
}

function setCorsHeaders(response: ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response: ServerResponse, status: number, body: unknown): ServerResponse {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  return response.end(JSON.stringify(body));
}
