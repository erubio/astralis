import type { PlanetId } from "@astralis/astro-domain";

export type AspectName = "conjunction" | "sextile" | "square" | "trine" | "opposition";
export type Aspect = { between: [PlanetId, PlanetId]; name: AspectName; orb: number };

const definitions: Record<AspectName, { angle: number; orb: number }> = {
  conjunction: { angle: 0, orb: 8 }, sextile: { angle: 60, orb: 5 }, square: { angle: 90, orb: 6 }, trine: { angle: 120, orb: 6 }, opposition: { angle: 180, orb: 8 }
};

export function findAspect(first: PlanetId, firstLongitude: number, second: PlanetId, secondLongitude: number): Aspect | undefined {
  const separation = Math.abs((((firstLongitude - secondLongitude + 180) % 360 + 360) % 360) - 180);
  for (const [name, definition] of Object.entries(definitions) as [AspectName, (typeof definitions)[AspectName]][]) {
    const orb = Math.abs(separation - definition.angle);
    if (orb <= definition.orb) return { between: [first, second], name, orb };
  }
}
