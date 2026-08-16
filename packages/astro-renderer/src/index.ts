import type { NatalChart, PlanetId } from "@astralis/astro-domain";
import { findAspect, type AspectName } from "@astralis/astro-rules";

const planetSymbols: Record<PlanetId, string> = { sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂", jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇", "north-node": "☊", chiron: "⚷", "part-of-fortune": "⊗" };
const zodiacSymbols = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const aspectColors = { conjunction: "#9078b5", "semi-sextile": "#5da8aa", "semi-square": "#d08b72", sextile: "#5da8aa", quintile: "#c39a53", square: "#d46d75", trine: "#65a877", sesquisquare: "#d08b72", biquintile: "#c39a53", quincunx: "#7f91bb", opposition: "#d46d75" } as const;
const aspectSymbols: Record<keyof typeof aspectColors, string> = { conjunction: "☌", "semi-sextile": "⚺", "semi-square": "∠", sextile: "✶", quintile: "Q", square: "□", trine: "△", sesquisquare: "⚼", biquintile: "bQ", quincunx: "⚻", opposition: "☍" };
const aspectLabels: Record<keyof typeof aspectColors, string> = { conjunction: "Conjunción", "semi-sextile": "Semisextil", "semi-square": "Semicuadratura", sextile: "Sextil", quintile: "Quintil", square: "Cuadratura", trine: "Trígono", sesquisquare: "Sesquicuadratura", biquintile: "Biquintil", quincunx: "Quincuncio", opposition: "Oposición" };
const positionFields = 5;
const majorAspectNames = new Set<keyof typeof aspectColors>(["conjunction", "sextile", "square", "trine", "opposition"]);

type Point = { x: number; y: number };
export const minorAspectNames = ["semi-sextile", "semi-square", "quintile", "sesquisquare", "biquintile", "quincunx"] as const satisfies readonly AspectName[];
export type MinorAspectName = (typeof minorAspectNames)[number];
export type RendererOptions = { minorAspects?: readonly MinorAspectName[] };

export function renderNatalChartSvg(chart: NatalChart, size = 620, options: RendererOptions = {}): string {
  const center = size / 2;
  const outer = size * 0.47;
  const zodiacRing = size * 0.41;
  const houseRing = size * 0.21;
  const aspectRing = size * 0.13;
  const viewBoxPadding = size * 0.04;
  const ascendant = chart.houses.ascendant;
  const point = (longitude: number, radius: number): Point => {
    const angle = (180 + ascendant - longitude) * Math.PI / 180;
    return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
  };
  const tangentRotation = (longitude: number) => {
    let rotation = (270 + ascendant - longitude) % 360;
    if (rotation < 0) rotation += 360;
    return rotation > 90 && rotation < 270 ? rotation - 180 : rotation;
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
  const cuspLabels = chart.houses.cusps.map((cusp, index) => text(point(cusp, houseRing - size * 0.012), formatDegrees(cusp), "cusp", `Cúspide ${index + 1} ${formatDegrees(cusp)}`)).join("");
  const angles = [{ name: "ASC", longitude: chart.houses.ascendant }, { name: "MC", longitude: chart.houses.midheaven }, { name: "DSC", longitude: chart.houses.ascendant + 180 }, { name: "IC", longitude: chart.houses.midheaven + 180 }];
  const outerCuspLabels = chart.houses.cusps.map((cusp, index) => {
    const angle = angles.find(({ longitude }) => angularDistance(cusp, longitude) < 0.1);
    const value = `${angle ? `${angle.name} ` : ""}${formatOuterCusp(cusp)}`;
    return rotatedText(point(cusp, outer + size * (angle ? 0.035 : 0.014)), value, angle ? "outer-angle" : "outer-cusp", `Cúspide ${index + 1} ${value}`, tangentRotation(cusp));
  }).join("");
  const outerAngleLabels = angles.filter(({ longitude }) => !chart.houses.cusps.some((cusp) => angularDistance(cusp, longitude) < 0.1)).map(({ name, longitude }) => rotatedText(point(longitude, outer + size * 0.035), `${name} ${formatOuterCusp(longitude)}`, "outer-angle", name, tangentRotation(longitude))).join("");
  const placements = [...chart.planets, ...chart.points];
  const aspects = placements.flatMap((first, index) => placements.slice(index + 1).flatMap((second) => {
    const aspect = findAspect(first.planet, first.longitude, second.planet, second.longitude);
    const from = point(first.longitude, aspectRing);
    const to = point(second.longitude, aspectRing);
    const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    return aspect && shouldRenderAspect(aspect.name, options.minorAspects ?? minorAspectNames) ? [`<line class="aspect" data-aspect="${aspect.name}" stroke="${aspectColors[aspect.name]}" stroke-width="${aspectStrokeWidth(aspect.orb)}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"/>${aspectText(midpoint, aspect.name, aspect.orb)}`] : [];
  })).join("");
  const positionRadius = (field: number) => houseRing + (zodiacRing - houseRing) * (field + 0.5) / positionFields;
  const planets = placements.map((planet) => `<g data-planet="${planet.planet}">${text(point(planet.longitude, positionRadius(4)), planetSymbols[planet.planet], "planet", `${planet.planet} ${formatPosition(planet)}`)}${text(point(planet.longitude, positionRadius(3)), `${planet.degree}°`, "position-degree", `${planet.degree} grados`)}${text(point(planet.longitude, positionRadius(2)), zodiacSymbols[Math.floor(planet.longitude / 30)], "position-sign", planet.sign)}${text(point(planet.longitude, positionRadius(1)), `${String(planet.minute).padStart(2, "0")}′`, "position-minute", `${planet.minute} minutos`)}${planet.retrograde ? text(point(planet.longitude, positionRadius(0)), "℞", "retrograde", "Retrógrado") : ""}</g>`).join("");
  return `<svg viewBox="${-viewBoxPadding} ${-viewBoxPadding} ${size + viewBoxPadding * 2} ${size + viewBoxPadding * 2}" role="img" aria-label="Carta natal, ascendente ${formatDegrees(chart.houses.ascendant)}"><style>.ring{fill:none;stroke:#6a5e79;stroke-width:1.2}.divider{stroke:#a59ab5;stroke-width:.8}.aspect{fill:none;stroke-width:1.2;opacity:.78}.aspect-symbol{font:17px Georgia;text-anchor:middle;dominant-baseline:middle}.planet{fill:#f4c872;font:29px Georgia;text-anchor:middle;dominant-baseline:middle}.position-degree,.position-minute{fill:#b5a6c4;font:12px system-ui;text-anchor:middle;dominant-baseline:middle}.position-sign{fill:#c5b5d8;font:22px Georgia;text-anchor:middle;dominant-baseline:middle}.retrograde{fill:#f4c872;font:16px Georgia;text-anchor:middle;dominant-baseline:middle}.zodiac{fill:#c5b5d8;font:27px Georgia;text-anchor:middle;dominant-baseline:middle}.house{fill:#d9d0e1;font:16px system-ui;text-anchor:middle;dominant-baseline:middle}.cusp{fill:#b5a6c4;font:10px system-ui;text-anchor:middle;dominant-baseline:middle}.outer-cusp{fill:#f4c872;font:700 11px system-ui;text-anchor:middle;dominant-baseline:middle}.outer-angle{fill:#f4c872;font:700 12px system-ui;text-anchor:middle;dominant-baseline:middle}</style><circle class="ring" cx="${center}" cy="${center}" r="${outer}"/><circle class="ring" cx="${center}" cy="${center}" r="${zodiacRing}"/><circle class="ring" cx="${center}" cy="${center}" r="${houseRing}"/><circle class="ring" cx="${center}" cy="${center}" r="${aspectRing}"/><g class="divider">${zodiacLines}${houseLines}${radial(chart.houses.ascendant, houseRing, outer)}${radial(chart.houses.midheaven, houseRing, outer)}</g>${aspects}${zodiacLabels}${houseLabels}${cuspLabels}${planets}${outerCuspLabels}${outerAngleLabels}<circle cx="${center}" cy="${center}" r="3" fill="#f4c872"/></svg>`;
}

function text(point: Point, value: string, className: string, label: string): string {
  return `<text x="${point.x}" y="${point.y}" class="${className}"${label ? ` aria-label="${label}"` : ""}>${value}</text>`;
}

function rotatedText(point: Point, value: string, className: string, label: string, rotation: number): string {
  return `<text x="${point.x}" y="${point.y}" class="${className}"${label ? ` aria-label="${label}"` : ""} transform="rotate(${rotation} ${point.x} ${point.y})">${value}</text>`;
}

function aspectText(point: Point, name: keyof typeof aspectColors, orb: number): string {
  return `<text class="aspect-symbol" fill="${aspectColors[name]}" x="${point.x}" y="${point.y}" data-aspect="${name}" aria-label="${aspectLabels[name]}, orbe ${orb.toFixed(1)} grados">${aspectSymbols[name]}</text>`;
}

function aspectStrokeWidth(orb: number): string {
  return Math.max(0.75, 2.5 - orb * 0.25).toFixed(2);
}

function shouldRenderAspect(name: keyof typeof aspectColors, minorAspects: readonly MinorAspectName[]): boolean {
  return majorAspectNames.has(name) || (minorAspects as readonly string[]).includes(name);
}

function formatDegrees(longitude: number): string {
  const degree = Math.floor(longitude % 30);
  const minute = Math.round((longitude % 1) * 60);
  return `${degree}°${String(minute).padStart(2, "0")}′`;
}

function formatOuterCusp(longitude: number): string {
  const normalized = ((longitude % 360) + 360) % 360;
  const degree = Math.floor(normalized % 30);
  const minute = Math.round((normalized % 1) * 60);
  return `${degree}° ${zodiacSymbols[Math.floor(normalized / 30)]} ${String(minute).padStart(2, "0")}′`;
}

function angularDistance(first: number, second: number): number {
  return Math.abs((((first - second + 180) % 360 + 360) % 360) - 180);
}

function formatPosition(position: { degree: number; minute: number; retrograde: boolean }): string {
  return `${position.degree}°${String(position.minute).padStart(2, "0")}′${position.retrograde ? " ℞" : ""}`;
}
