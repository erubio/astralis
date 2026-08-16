import type { NatalChart } from "@astralis/astro-domain";

const symbols: Record<string, string> = { sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂", jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇" };

export function renderNatalChartSvg(chart: NatalChart, size = 620): string {
  const center = size / 2;
  const outer = size * 0.45;
  const zodiac = size * 0.36;
  const house = size * 0.22;
  const point = (longitude: number, radius: number) => {
    const angle = (longitude - 90) * Math.PI / 180;
    return [center + Math.cos(angle) * radius, center + Math.sin(angle) * radius];
  };
  const radial = (longitude: number, start: number, end: number) => {
    const [x1, y1] = point(longitude, start); const [x2, y2] = point(longitude, end);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  };
  const zodiacLines = Array.from({ length: 12 }, (_, index) => radial(index * 30, zodiac, outer)).join("");
  const houseLines = chart.houses.cusps.map((cusp) => radial(cusp, house, zodiac)).join("");
  const planets = chart.planets.map((planet) => {
    const [x, y] = point(planet.longitude, zodiac * 0.8);
    return `<text x="${x}" y="${y}" class="planet" aria-label="${planet.planet} ${planet.degree} grados">${symbols[planet.planet]}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Carta natal"><style>.ring{fill:none;stroke:#6a5e79;stroke-width:1.2}.divider{stroke:#a59ab5;stroke-width:.8}.planet{fill:#f4c872;font:28px Georgia;text-anchor:middle;dominant-baseline:middle}</style><circle class="ring" cx="${center}" cy="${center}" r="${outer}"/><circle class="ring" cx="${center}" cy="${center}" r="${zodiac}"/><circle class="ring" cx="${center}" cy="${center}" r="${house}"/><g class="divider">${zodiacLines}${houseLines}</g>${planets}<circle cx="${center}" cy="${center}" r="3" fill="#f4c872"/></svg>`;
}
