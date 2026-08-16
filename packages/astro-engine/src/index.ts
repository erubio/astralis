import type { BirthData, HouseSystem, HousesResult, NatalChart, NormalizedTime, PlanetId, RawPlanetPosition, ZodiacPosition, ZodiacSign } from "@astralis/astro-domain";

const signs: ZodiacSign[] = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
const planets: PlanetId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
const calculatedPoints: PlanetId[] = ["north-node", "chiron"];

export interface EphemerisProvider {
  calculatePlanet(planet: PlanetId, julianDayUT: number): RawPlanetPosition;
  calculateHouses(julianDayUT: number, latitude: number, longitude: number, system: HouseSystem): HousesResult;
}

function offsetAt(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instant));
  const values = Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, Number(value)]));
  return Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute, values.second) - instant;
}

export function normalizeBirthTime(birthData: BirthData): NormalizedTime {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthData.date);
  const time = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(birthData.time);
  if (!match || !time) throw new Error("Fecha u hora de nacimiento no válida");
  const localAsUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(time[1]), Number(time[2]), Number(time[3] ?? 0));
  let instant = localAsUtc - offsetAt(localAsUtc, birthData.timeZone);
  instant = localAsUtc - offsetAt(instant, birthData.timeZone);
  return { localDateTime: `${birthData.date}T${birthData.time}`, utcDateTime: new Date(instant).toISOString(), julianDayUT: instant / 86_400_000 + 2_440_587.5, timeZone: birthData.timeZone };
}

export function toZodiacPosition(position: RawPlanetPosition): ZodiacPosition {
  const longitude = ((position.longitude % 360) + 360) % 360;
  const inSign = longitude % 30;
  const degree = Math.floor(inSign);
  const minute = Math.floor((inSign - degree) * 60);
  return { ...position, longitude, sign: signs[Math.floor(longitude / 30)], degree, minute, second: Math.round((((inSign - degree) * 60) - minute) * 60) };
}

export function calculateNatalChart(birthData: BirthData, provider: EphemerisProvider, system: HouseSystem = "placidus"): NatalChart {
  const time = normalizeBirthTime(birthData);
  const houses = provider.calculateHouses(time.julianDayUT, birthData.latitude, birthData.longitude, system);
  const calculatedPlanets = planets.map((planet) => toZodiacPosition(provider.calculatePlanet(planet, time.julianDayUT)));
  const sun = calculatedPlanets.find(({ planet }) => planet === "sun")!;
  const moon = calculatedPlanets.find(({ planet }) => planet === "moon")!;
  const fortuneLongitude = (houses.ascendant + moon.longitude - sun.longitude + 360) % 360;
  return {
    birthData,
    time,
    planets: calculatedPlanets,
    points: [...calculatedPoints.map((point) => toZodiacPosition(provider.calculatePlanet(point, time.julianDayUT))), toZodiacPosition({ planet: "part-of-fortune", longitude: fortuneLongitude, latitude: 0, distance: 0, speedLongitude: 0, retrograde: false })],
    houses
  };
}

export class DemoEphemerisProvider implements EphemerisProvider {
  calculatePlanet(planet: PlanetId, julianDayUT: number): RawPlanetPosition {
    const seed = (planets.indexOf(planet) + calculatedPoints.indexOf(planet) + 1) * 31.7 + julianDayUT * (planet === "moon" ? 13.2 : 0.8);
    return { planet, longitude: seed % 360, latitude: 0, distance: 1, speedLongitude: 1, retrograde: false };
  }
  calculateHouses(_julianDayUT: number, _latitude: number, longitude: number, _system: HouseSystem): HousesResult {
    const ascendant = ((longitude % 360) + 360) % 360;
    return { ascendant, midheaven: (ascendant + 270) % 360, cusps: Array.from({ length: 12 }, (_, index) => (ascendant + index * 30) % 360) };
  }
}
