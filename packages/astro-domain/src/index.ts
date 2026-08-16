export type PlanetId = "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto";

export type ZodiacSign = "aries" | "taurus" | "gemini" | "cancer" | "leo" | "virgo" | "libra" | "scorpio" | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export type HouseSystem = "placidus" | "koch" | "regiomontanus" | "campanus" | "equal" | "whole-sign" | "porphyry" | "topocentric";

export type BirthData = {
  date: string;
  time: string;
  timeZone: string;
  latitude: number;
  longitude: number;
  locationName?: string;
};

export type NormalizedTime = {
  localDateTime: string;
  utcDateTime: string;
  julianDayUT: number;
  timeZone: string;
};

export type RawPlanetPosition = {
  planet: PlanetId;
  longitude: number;
  latitude: number;
  distance: number;
  speedLongitude: number;
  retrograde: boolean;
};

export type ZodiacPosition = RawPlanetPosition & {
  sign: ZodiacSign;
  degree: number;
  minute: number;
  second: number;
};

export type HousesResult = {
  cusps: number[];
  ascendant: number;
  midheaven: number;
};

export type NatalChart = {
  birthData: BirthData;
  time: NormalizedTime;
  planets: ZodiacPosition[];
  houses: HousesResult;
};
