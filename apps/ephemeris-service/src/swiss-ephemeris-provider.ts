import type { HouseSystem as AstralisHouseSystem, HousesResult, PlanetId, RawPlanetPosition } from "@astralis/astro-domain";
import type { EphemerisProvider } from "@astralis/astro-engine";
import { CalculationFlag, calculateHouses, calculatePosition, HouseSystem, Planet } from "@swisseph/node";

const planets: Record<PlanetId, Planet> = {
  sun: Planet.Sun, moon: Planet.Moon, mercury: Planet.Mercury, venus: Planet.Venus, mars: Planet.Mars,
  jupiter: Planet.Jupiter, saturn: Planet.Saturn, uranus: Planet.Uranus, neptune: Planet.Neptune, pluto: Planet.Pluto
};

const houseSystems: Record<AstralisHouseSystem, HouseSystem> = {
  placidus: HouseSystem.Placidus, koch: HouseSystem.Koch, regiomontanus: HouseSystem.Regiomontanus,
  campanus: HouseSystem.Campanus, equal: HouseSystem.Equal, "whole-sign": HouseSystem.WholeSign,
  porphyry: HouseSystem.Porphyrius, topocentric: HouseSystem.PolichPage
};

const flags = CalculationFlag.SwissEphemeris | CalculationFlag.Speed;

/** Adaptador síncrono de Swiss Ephemeris para cálculos geocéntricos tropicales. */
export class SwissEphemerisProvider implements EphemerisProvider {
  calculatePlanet(planet: PlanetId, julianDayUT: number): RawPlanetPosition {
    assertJulianDay(julianDayUT);
    const result = calculatePosition(julianDayUT, planets[planet], flags);
    return { planet, longitude: normalizeDegrees(result.longitude), latitude: result.latitude, distance: result.distance, speedLongitude: result.longitudeSpeed, retrograde: result.longitudeSpeed < 0 };
  }

  calculateHouses(julianDayUT: number, latitude: number, longitude: number, system: AstralisHouseSystem): HousesResult {
    assertJulianDay(julianDayUT);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new RangeError("La latitud debe estar entre -90 y 90 grados");
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError("La longitud debe estar entre -180 y 180 grados");
    const result = calculateHouses(julianDayUT, latitude, longitude, houseSystems[system]);
    const cusps = result.cusps.length === 13 ? result.cusps.slice(1) : result.cusps;
    if (cusps.length !== 12) throw new Error("Swiss Ephemeris no devolvió doce cúspides");
    return { cusps: cusps.map(normalizeDegrees), ascendant: normalizeDegrees(result.ascendant), midheaven: normalizeDegrees(result.mc) };
  }
}

function assertJulianDay(value: number): void {
  if (!Number.isFinite(value)) throw new TypeError("El día juliano debe ser un número finito");
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}
