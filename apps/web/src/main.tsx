import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { BirthData, HouseSystem, NatalChart, PlanetId, ZodiacSign } from "@astralis/astro-domain";
import { minorAspectNames, renderNatalChartSvg, type MinorAspectName } from "@astralis/astro-renderer";
import "./styles.css";

type LocationMatch = { id: number; name: string; label: string; latitude: number; longitude: number; timeZone: string };
const initial: BirthData = { date: "1990-08-16", time: "12:00:00", timeZone: "Europe/Madrid", latitude: 40.4168, longitude: -3.7038, locationName: "Madrid" };
const houseSystems: { value: HouseSystem; label: string }[] = [{ value: "placidus", label: "Placidus" }, { value: "koch", label: "Koch" }, { value: "regiomontanus", label: "Regiomontanus" }, { value: "campanus", label: "Campanus" }, { value: "equal", label: "Casas iguales" }, { value: "whole-sign", label: "Signo entero" }, { value: "porphyry", label: "Porfirio" }, { value: "topocentric", label: "Topocéntrico" }];
const planetLabels: Record<PlanetId, string> = { sun: "Sol", moon: "Luna", mercury: "Mercurio", venus: "Venus", mars: "Marte", jupiter: "Júpiter", saturn: "Saturno", uranus: "Urano", neptune: "Neptuno", pluto: "Plutón", "north-node": "Nodo Norte", chiron: "Quirón", "part-of-fortune": "Parte de la Fortuna" };
const signLabels: Record<ZodiacSign, string> = { aries: "Aries", taurus: "Tauro", gemini: "Géminis", cancer: "Cáncer", leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Escorpio", sagittarius: "Sagitario", capricorn: "Capricornio", aquarius: "Acuario", pisces: "Piscis" };
const minorAspectLabels: Record<MinorAspectName, string> = { "semi-sextile": "Semisextil", "semi-square": "Semicuadratura", quintile: "Quintil", sesquisquare: "Sesquicuadratura", biquintile: "Biquintil", quincunx: "Quincuncio" };

function calculationKey(birthData: BirthData, houseSystem: HouseSystem): string {
  return JSON.stringify({ ...birthData, houseSystem });
}

function App() {
  const [birthData, setBirthData] = useState(initial);
  const [locationQuery, setLocationQuery] = useState(initial.locationName ?? "");
  const [locationSearchEnabled, setLocationSearchEnabled] = useState(false);
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [minorAspects, setMinorAspects] = useState<Set<MinorAspectName>>(() => new Set(minorAspectNames));
  const [chart, setChart] = useState<NatalChart>();
  const [calculatedKey, setCalculatedKey] = useState<string>();
  const [error, setError] = useState<string>();
  const [locationError, setLocationError] = useState<string>();
  const [matches, setMatches] = useState<LocationMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const currentCalculationKey = calculationKey(birthData, houseSystem);
  const isCurrentChart = Boolean(chart && calculatedKey === currentCalculationKey);
  const wheel = useMemo(() => chart ? renderNatalChartSvg(chart, 620, { minorAspects: [...minorAspects] }) : undefined, [chart, minorAspects]);

  async function calculate(data: BirthData = birthData): Promise<void> {
    const requestKey = calculationKey(data, houseSystem);
    if (requestKey === calculatedKey) return;
    setIsLoading(true); setError(undefined);
    try {
      const response = await fetch("/v1/natal-charts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ birthData: data, houseSystem }) });
      const result = await response.json() as NatalChart | { error: string };
      if (!response.ok || "error" in result) throw new Error("error" in result ? result.error : "No se pudo calcular la carta");
      setChart(result);
      setCalculatedKey(requestKey);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo conectar con la API"); }
    finally { setIsLoading(false); }
  }

  function selectLocation(location: LocationMatch): void {
    const nextBirthData = { ...birthData, locationName: location.label, latitude: location.latitude, longitude: location.longitude, timeZone: location.timeZone };
    setBirthData(nextBirthData); setLocationQuery(location.label); setLocationSearchEnabled(false);
    setMatches([]); setLocationError(undefined); void calculate(nextBirthData);
  }

  function toggleMinorAspect(aspect: MinorAspectName): void {
    setMinorAspects((current) => {
      const next = new Set(current);
      if (next.has(aspect)) next.delete(aspect); else next.add(aspect);
      return next;
    });
  }

  useEffect(() => { void calculate(); }, []);

  useEffect(() => {
    if (!locationSearchEnabled) return;
    const query = locationQuery.trim();
    if (query.length < 3) { setMatches([]); setLocationError(undefined); return; }
    let controller: AbortController | undefined;
    const timeout = window.setTimeout(async () => {
      controller = new AbortController(); setIsSearching(true); setLocationError(undefined);
      try {
        const response = await fetch(`/v1/locations?query=${encodeURIComponent(query)}`, { signal: controller.signal });
        const result = await response.json() as { results?: LocationMatch[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "No se pudieron buscar ubicaciones");
        setMatches(result.results ?? []);
        if (!result.results?.length) setLocationError("No se encontraron ubicaciones");
      } catch (reason) {
        if (!controller.signal.aborted) setLocationError(reason instanceof Error ? reason.message : "No se pudo buscar la ubicación");
      } finally { if (!controller.signal.aborted) setIsSearching(false); }
    }, 500);
    return () => { window.clearTimeout(timeout); controller?.abort(); };
  }, [locationQuery, locationSearchEnabled]);

  return <main>
    <section className="intro"><p className="eyebrow">ASTRALIS · CARTA NATAL</p><h1>Tu mapa del cielo.</h1><p>Crea tu carta astral.</p></section>
    <section className="workspace">
      <aside><form onSubmit={(event) => { event.preventDefault(); void calculate(); }}>
        <h2>Datos de nacimiento</h2>
        <label>Fecha<input type="date" value={birthData.date} onChange={(event) => setBirthData({ ...birthData, date: event.target.value })}/></label>
        <label>Hora local<input type="time" step="1" value={birthData.time} onChange={(event) => setBirthData({ ...birthData, time: event.target.value })}/></label>
        <div className="city-field"><label>Ciudad<input value={locationQuery} onChange={(event) => { setLocationQuery(event.target.value); setLocationSearchEnabled(true); setMatches([]); }}/></label>{isSearching && <span className="searching">Buscando…</span>}{matches.length > 0 && <ul className="locations">{matches.map((location) => <li key={location.id}><button type="button" onClick={() => selectLocation(location)}>{location.label}<small>{location.timeZone}</small></button></li>)}</ul>}</div>
        {locationError && <p className="error">{locationError}</p>}
        <p className="coordinates">{birthData.latitude.toFixed(4)}, {birthData.longitude.toFixed(4)} · {birthData.timeZone}</p>
        <label>Sistema de casas<select value={houseSystem} onChange={(event) => setHouseSystem(event.target.value as HouseSystem)}>{houseSystems.map((system) => <option key={system.value} value={system.value}>{system.label}</option>)}</select></label>
        <fieldset className="aspect-options"><legend>Aspectos menores</legend>{minorAspectNames.map((aspect) => <label className="aspect-option" key={aspect}><input type="checkbox" checked={minorAspects.has(aspect)} onChange={() => toggleMinorAspect(aspect)}/>{minorAspectLabels[aspect]}</label>)}</fieldset>
        <button disabled={isLoading || isCurrentChart}>{isLoading ? "Calculando…" : isCurrentChart ? "Carta actualizada" : "Calcular carta"}</button>
      </form></aside>
      <section className="chart">{wheel ? <><div dangerouslySetInnerHTML={{ __html: wheel }}/><button className="zoom-button" type="button" onClick={() => setIsZoomed(true)}>Ampliar carta</button></> : <p className="chart-status">{error ?? "Calculando carta…"}</p>}{error && chart && <p className="error">{error}</p>}</section>
      <aside><h2>Posiciones</h2>{chart ? [...chart.planets, ...chart.points].map((planet) => <p key={planet.planet}><span>{planetLabels[planet.planet]}</span> {planet.degree}° {String(planet.minute).padStart(2, "0")}′ {signLabels[planet.sign]}{planet.retrograde ? " ℞" : ""}</p>) : <p>Esperando cálculo.</p>}</aside>
    </section>
    {isZoomed && wheel && <div className="chart-zoom" role="dialog" aria-modal="true" aria-label="Carta ampliada"><button className="zoom-close" type="button" onClick={() => setIsZoomed(false)}>Cerrar</button><div className="chart-zoom-canvas" dangerouslySetInnerHTML={{ __html: wheel }}/></div>}
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);
