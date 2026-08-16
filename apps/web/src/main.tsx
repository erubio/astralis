import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { BirthData } from "@astralis/astro-domain";
import { calculateNatalChart, DemoEphemerisProvider } from "@astralis/astro-engine";
import { renderNatalChartSvg } from "@astralis/astro-renderer";
import "./styles.css";

const initial: BirthData = { date: "1990-08-16", time: "12:00:00", timeZone: "Europe/Madrid", latitude: 40.4168, longitude: -3.7038, locationName: "Madrid" };

function App() {
  const [birthData, setBirthData] = useState(initial);
  const chart = useMemo(() => calculateNatalChart(birthData, new DemoEphemerisProvider()), [birthData]);
  const wheel = useMemo(() => renderNatalChartSvg(chart), [chart]);
  return <main><section className="intro"><p className="eyebrow">ASTRALIS · CARTA NATAL</p><h1>Tu mapa del cielo.</h1><p>Una base web para explorar posiciones, casas y aspectos con precisión configurable.</p></section><section className="workspace"><aside><h2>Datos de nacimiento</h2><label>Fecha<input type="date" value={birthData.date} onChange={(event) => setBirthData({ ...birthData, date: event.target.value })}/></label><label>Hora local<input type="time" step="1" value={birthData.time} onChange={(event) => setBirthData({ ...birthData, time: event.target.value })}/></label><label>Zona horaria<input value={birthData.timeZone} onChange={(event) => setBirthData({ ...birthData, timeZone: event.target.value })}/></label><label>Ciudad<input value={birthData.locationName} onChange={(event) => setBirthData({ ...birthData, locationName: event.target.value })}/></label></aside><section className="chart"><div dangerouslySetInnerHTML={{ __html: wheel }}/></section><aside><h2>Posiciones</h2>{chart.planets.map((planet) => <p key={planet.planet}><span>{planet.planet}</span> {planet.degree}° {planet.minute}' {planet.sign}</p>)}</aside></section></main>;
}

createRoot(document.getElementById("root")!).render(<App />);
