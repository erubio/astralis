import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { BirthData, HouseSystem } from "@astralis/astro-domain";
import { calculateNatalChart } from "@astralis/astro-engine";
import { SwissEphemerisProvider } from "@astralis/ephemeris-service";
import { composeCoreInterpretation } from "@astralis/astro-rules";
import { OpenMeteoGeocodingProvider, type GeocodingProvider } from "./geocoding.js";

const provider = new SwissEphemerisProvider();
const houseSystems = new Set<HouseSystem>(["placidus", "koch", "regiomontanus", "campanus", "equal", "whole-sign", "porphyry", "topocentric"]);

type NatalChartRequest = { birthData: BirthData; houseSystem?: HouseSystem };
type ApiDependencies = { geocodingProvider?: GeocodingProvider };

export function createApiServer({ geocodingProvider = new OpenMeteoGeocodingProvider() }: ApiDependencies = {}) {
  return createServer(async (request, response) => {
    setCorsHeaders(response);
    if (request.method === "OPTIONS") return response.writeHead(204).end();
    const url = new URL(request.url ?? "/", "http://localhost");
    if (request.method === "GET" && url.pathname === "/v1/locations") {
      const query = url.searchParams.get("query")?.trim() ?? "";
      if (query.length < 2) return sendJson(response, 400, { error: "La búsqueda debe tener al menos dos caracteres" });
      try { return sendJson(response, 200, { results: await geocodingProvider.search(query) }); }
      catch { return sendJson(response, 502, { error: "No se pudieron buscar ubicaciones" }); }
    }
    if (request.method !== "POST" || !["/v1/natal-charts", "/v1/natal-interpretations"].includes(url.pathname)) return sendJson(response, 404, { error: "Ruta no encontrada" });

    try {
      const payload = await readJson(request);
      const { birthData, houseSystem = "placidus" } = parseNatalChartRequest(payload);
      const chart = calculateNatalChart(birthData, provider, houseSystem);
      return sendJson(response, 200, url.pathname === "/v1/natal-interpretations" ? composeCoreInterpretation(chart) : chart);
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
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response: ServerResponse, status: number, body: unknown): ServerResponse {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  return response.end(JSON.stringify(body));
}
