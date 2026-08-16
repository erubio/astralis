import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { BirthData, HouseSystem, NatalChart } from "@astralis/astro-domain";
import { renderNatalChartSvg } from "@astralis/astro-renderer";
import "./styles.css";

type LocationMatch = { id: number; name: string; label: string; latitude: number; longitude: number; timeZone: string };
const initial: BirthData = { date: "1990-08-16", time: "12:00:00", timeZone: "Europe/Madrid", latitude: 40.4168, longitude: -3.7038, locationName: "Madrid" };
const houseSystems: { value: HouseSystem; label: string }[] = [{ value: "placidus", label: "Placidus" }, { value: "koch", label: "Koch" }, { value: "regiomontanus", label: "Regiomontanus" }, { value: "campanus", label: "Campanus" }, { value: "equal", label: "Casas iguales" }, { value: "whole-sign", label: "Signo entero" }, { value: "porphyry", label: "Porfirio" }, { value: "topocentric", label: "Topocéntrico" }];

function App() {
  const [birthData, setBirthData] = useState(initial);
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [chart, setChart] = useState<NatalChart>();
  const [error, setError] = useState<string>();
  const [locationError, setLocationError] = useState<string>();
  const [matches, setMatches] = useState<LocationMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wheel = useMemo(() => chart ? renderNatalChartSvg(chart) : undefined, [chart]);

  async function calculate(): Promise<void> {
    setIsLoading(true); setError(undefined);
    try {
      const response = await fetch("/v1/natal-charts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ birthData, houseSystem }) });
      const result = await response.json() as NatalChart | { error: string };
      if (!response.ok || "error" in result) throw new Error("error" in result ? result.error : "No se pudo calcular la carta");
      setChart(result);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo conectar con la API"); }
    finally { setIsLoading(false); }
  }

  async function searchLocations(): Promise<void> {
    const query = birthData.locationName?.trim() ?? "";
    if (query.length < 2) { setLocationError("Escribe al menos dos caracteres para buscar una ciudad"); return; }
    setIsSearching(true); setLocationError(undefined);
    try {
      const response = await fetch(`/v1/locations?query=${encodeURIComponent(query)}`);
      const result = await response.json() as { results?: LocationMatch[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "No se pudieron buscar ubicaciones");
      setMatches(result.results ?? []);
      if (!result.results?.length) setLocationError("No se encontraron ubicaciones");
    } catch (reason) { setLocationError(reason instanceof Error ? reason.message : "No se pudo buscar la ubicación"); }
    finally { setIsSearching(false); }
  }

  function selectLocation(location: LocationMatch): void {
    setBirthData({ ...birthData, locationName: location.label, latitude: location.latitude, longitude: location.longitude, timeZone: location.timeZone });
    setMatches([]); setLocationError(undefined);
  }

  useEffect(() => { void calculate(); }, []);

  return <main><section className="intro"><p className="eyebrow">ASTRALIS · CARTA NATAL</p><h1>Tu mapa del cielo.</h1><p>Posiciones y casas calculadas en servidor con Swiss Ephemeris.</p></section><section className="workspace"><aside><form onSubmit={(event) => { event.preventDefault(); void calculate(); }}><h2>Datos de nacimiento</h2><label>Fecha<input type="date" value={birthData.date} onChange={(event) => setBirthData({ ...birthData, date: event.target.value })}/></label><label>Hora local<input type="time" step="1" value={birthData.time} onChange={(event) => setBirthData({ ...birthData, time: event.target.value })}/></label><label>Ciudad<input value={birthData.locationName} onChange={(event) => { setBirthData({ ...birthData, locationName: event.target.value }); setMatches([]); }}/></label><button type="button" className="secondary" onClick={() => void searchLocations()} disabled={isSearching}>{isSearching ? "Buscando…" : "Buscar ciudad"}</button>{locationError && <p className="error">{locationError}</p>}{matches.length > 0 && <ul className="locations">{matches.map((location) => <li key={location.id}><button type="button" onClick={() => selectLocation(location)}>{location.label}<small>{location.timeZone}</small></button></li>)}</ul>}<p className="coordinates">{birthData.latitude.toFixed(4)}, {birthData.longitude.toFixed(4)} · {birthData.timeZone}</p><label>Sistema de casas<select value={houseSystem} onChange={(event) => setHouseSystem(event.target.value as HouseSystem)}>{houseSystems.map((system) => <option key={system.value} value={system.value}>{system.label}</option>)}</select></label><button disabled={isLoading}>{isLoading ? "Calculando…" : "Calcular carta"}</button></form></aside><section className="chart">{wheel ? <div dangerouslySetInnerHTML={{ __html: wheel }}/> : <p className="chart-status">{error ?? "Calculando carta…"}</p>}{error && chart && <p className="error">{error}</p>}</section><aside><h2>Posiciones</h2>{chart ? chart.planets.map((planet) => <p key={planet.planet}><span>{planet.planet}</span> {planet.degree}° {planet.minute}' {planet.sign}</p>) : <p>Esperando cálculo.</p>}</aside></section></main>;
}

createRoot(document.getElementById("root")!).render(<App />);
