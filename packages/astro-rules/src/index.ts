import type { PlanetId } from "@astralis/astro-domain";

export type AspectName = "conjunction" | "semi-sextile" | "semi-square" | "sextile" | "quintile" | "square" | "trine" | "sesquisquare" | "biquintile" | "quincunx" | "opposition";
export type Aspect = { between: [PlanetId, PlanetId]; name: AspectName; orb: number };

const definitions: Record<AspectName, { angle: number; orb: number }> = {
  conjunction: { angle: 0, orb: 8 }, "semi-sextile": { angle: 30, orb: 2 }, "semi-square": { angle: 45, orb: 2 },
  sextile: { angle: 60, orb: 5 }, quintile: { angle: 72, orb: 2 }, square: { angle: 90, orb: 6 },
  trine: { angle: 120, orb: 6 }, sesquisquare: { angle: 135, orb: 2 }, biquintile: { angle: 144, orb: 2 },
  quincunx: { angle: 150, orb: 3 }, opposition: { angle: 180, orb: 8 }
};

export function findAspect(first: PlanetId, firstLongitude: number, second: PlanetId, secondLongitude: number): Aspect | undefined {
  const separation = Math.abs((((firstLongitude - secondLongitude + 180) % 360 + 360) % 360) - 180);
  for (const [name, definition] of Object.entries(definitions) as [AspectName, (typeof definitions)[AspectName]][]) {
    const orb = Math.abs(separation - definition.angle);
    if (orb <= definition.orb) return { between: [first, second], name, orb };
  }
}
