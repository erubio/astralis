import type { NatalChart, PlanetId } from "@astralis/astro-domain";
import { findAspect } from "@astralis/astro-rules";

const planetSymbols: Record<PlanetId, string> = { sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂", jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇" };
const zodiacSymbols = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const aspectColors = { conjunction: "#9078b5", sextile: "#5da8aa", square: "#d46d75", trine: "#65a877", opposition: "#d46d75" } as const;

type Point = { x: number; y: number };

export function renderNatalChartSvg(chart: NatalChart, size = 620): string {
  const center = size / 2;
  const outer = size * 0.45;
  const zodiacRing = size * 0.36;
  const houseRing = size * 0.24;
  const aspectRing = size * 0.16;
  const ascendant = chart.houses.ascendant;
  const point = (longitude: number, radius: number): Point => {
    const angle = (180 + ascendant - longitude) * Math.PI / 180;
    return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
  };
  const radial = (longitude: number, start: number, end: number) => {
    const from = point(longitude, start); const to = point(longitude, end);
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"/>`;
  };
  const zodiacLines = Array.from({ length: 12 }, (_, index) => radial(index * 30, zodiacRing, outer)).join("");
  const zodiacLabels = zodiacSymbols.map((symbol, index) => text(point(index * 30 + 15, (outer + zodiacRing) / 2), symbol, "zodiac", `Signo ${index + 1}`)).join("");
  const houseLines = chart.houses.cusps.map((cusp) => radial(cusp, aspectRing, zodiacRing)).join("");
  const houseLabels = chart.houses.cusps.map((cusp, index) => {
    const next = chart.houses.cusps[(index + 1) % 12];
    const span = (next - cusp + 360) % 360;
    return text(point(cusp + span / 2, (aspectRing + houseRing) / 2), String(index + 1), "house", `Casa ${index + 1}`);
  }).join("");
  const placements = distributePlanets(chart.planets, zodiacRing, point);
  const aspects = placements.flatMap((first, index) => placements.slice(index + 1).flatMap((second) => {
    const aspect = findAspect(first.planet, first.longitude, second.planet, second.longitude);
    const from = point(first.longitude, aspectRing);
    const to = point(second.longitude, aspectRing);
    return aspect ? [`<line class="aspect" stroke="${aspectColors[aspect.name]}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"/>`] : [];
  })).join("");
  const planets = placements.map((planet) => `<g data-planet="${planet.planet}" data-lane="${planet.lane}">${text(planet.point, planetSymbols[planet.planet], "planet", `${planet.planet} ${planet.degree} grados`)}${text(planet.degreePoint, `${planet.degree}°`, "degree", "")}</g>`).join("");
  const asc = point(chart.houses.ascendant, outer + size * 0.025);
  const mc = point(chart.houses.midheaven, outer + size * 0.025);
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Carta natal, ascendente ${formatDegrees(chart.houses.ascendant)}"><style>.ring{fill:none;stroke:#6a5e79;stroke-width:1.2}.divider{stroke:#a59ab5;stroke-width:.8}.aspect{fill:none;stroke-width:1.2;opacity:.78}.planet{fill:#f4c872;font:27px Georgia;text-anchor:middle;dominant-baseline:middle}.zodiac{fill:#c5b5d8;font:24px Georgia;text-anchor:middle;dominant-baseline:middle}.house{fill:#d9d0e1;font:15px system-ui;text-anchor:middle;dominant-baseline:middle}.degree{fill:#b5a6c4;font:10px system-ui;text-anchor:middle;dominant-baseline:middle}.angle{fill:#f4c872;font:700 11px system-ui;text-anchor:middle;dominant-baseline:middle}</style><circle class="ring" cx="${center}" cy="${center}" r="${outer}"/><circle class="ring" cx="${center}" cy="${center}" r="${zodiacRing}"/><circle class="ring" cx="${center}" cy="${center}" r="${houseRing}"/><circle class="ring" cx="${center}" cy="${center}" r="${aspectRing}"/><g class="divider">${zodiacLines}${houseLines}${radial(chart.houses.ascendant, houseRing, outer)}${radial(chart.houses.midheaven, houseRing, outer)}</g>${aspects}${zodiacLabels}${houseLabels}${planets}${text(asc, `ASC ${formatDegrees(chart.houses.ascendant)}`, "angle", "Ascendente")}${text(mc, `MC ${formatDegrees(chart.houses.midheaven)}`, "angle", "Medio Cielo")}<circle cx="${center}" cy="${center}" r="3" fill="#f4c872"/></svg>`;
}

function distributePlanets(chartPlanets: NatalChart["planets"], zodiacRing: number, point: (longitude: number, radius: number) => Point) {
  const sorted = [...chartPlanets].sort((first, second) => first.longitude - second.longitude);
  const breakAfter = sorted.reduce((widest, planet, index) => {
    const next = sorted[(index + 1) % sorted.length];
    const gap = (next.longitude - planet.longitude + 360) % 360;
    return gap > widest.gap ? { index, gap } : widest;
  }, { index: 0, gap: -1 });
  const ordered = [...sorted.slice(breakAfter.index + 1), ...sorted.slice(0, breakAfter.index + 1)];
  let lane = 0;
  return ordered.map((planet, index) => {
    const previous = ordered[index - 1];
    lane = !previous || angularDistance(planet.longitude, previous.longitude) >= 10 ? 0 : lane + 1;
    const visualLane = Math.min(lane, 3);
    return {
      ...planet,
      lane,
      point: point(planet.longitude, zodiacRing * (0.72 + visualLane * 0.07)),
      degreePoint: point(planet.longitude, zodiacRing * (0.78 + visualLane * 0.055))
    };
  });
}

function text(point: Point, value: string, className: string, label: string): string {
  return `<text x="${point.x}" y="${point.y}" class="${className}"${label ? ` aria-label="${label}"` : ""}>${value}</text>`;
}

function angularDistance(first: number, second: number): number {
  return Math.abs((((first - second + 180) % 360 + 360) % 360) - 180);
}

function formatDegrees(longitude: number): string {
  const degree = Math.floor(longitude % 30);
  const minute = Math.round((longitude % 1) * 60);
  return `${degree}°${String(minute).padStart(2, "0")}′`;
}
