import type { NatalChart, PlanetId, ZodiacPosition, ZodiacSign } from "@astralis/astro-domain";

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

export type InterpretationSubject = "sun" | "moon" | "ascendant";
export type InterpretationFactor = {
  id: string;
  subject: InterpretationSubject;
  sign: ZodiacSign;
  degree: number;
  minute: number;
  house?: number;
};
export type InterpretationSection = {
  id: InterpretationSubject;
  title: string;
  factorIds: string[];
  text: string;
};
export type InterpretationReport = { factors: InterpretationFactor[]; sections: InterpretationSection[] };

const signs: ZodiacSign[] = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
const signLabels: Record<ZodiacSign, string> = { aries: "Aries", taurus: "Tauro", gemini: "Géminis", cancer: "Cáncer", leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Escorpio", sagittarius: "Sagitario", capricorn: "Capricornio", aquarius: "Acuario", pisces: "Piscis" };
const signThemes: Record<ZodiacSign, string> = {
  aries: "iniciativa, franqueza y voluntad de abrir camino", taurus: "constancia, sentido práctico y búsqueda de estabilidad", gemini: "curiosidad, intercambio de ideas y capacidad de adaptación",
  cancer: "sensibilidad, cuidado y necesidad de pertenencia", leo: "creatividad, presencia y deseo de expresar el corazón", virgo: "discernimiento, servicio y atención a lo que puede mejorarse",
  libra: "búsqueda de equilibrio, cooperación y sensibilidad estética", scorpio: "intensidad, profundidad y disposición a transformarse", sagittarius: "amplitud de miras, sentido y deseo de explorar",
  capricorn: "responsabilidad, perseverancia y construcción a largo plazo", aquarius: "independencia, visión colectiva y apertura a lo diferente", pisces: "imaginación, empatía y conexión con lo sutil"
};

export function extractCoreInterpretationFactors(chart: NatalChart): InterpretationFactor[] {
  const sun = findPlacement(chart, "sun");
  const moon = findPlacement(chart, "moon");
  return [
    placementFactor(sun, chart.houses.cusps),
    placementFactor(moon, chart.houses.cusps),
    ascendantFactor(chart.houses.ascendant)
  ];
}

export function composeCoreInterpretation(chart: NatalChart): InterpretationReport {
  const factors = extractCoreInterpretationFactors(chart);
  return { factors, sections: factors.map(sectionForFactor) };
}

function findPlacement(chart: NatalChart, planet: "sun" | "moon"): ZodiacPosition {
  const placement = chart.planets.find((candidate) => candidate.planet === planet);
  if (!placement) throw new Error(`La carta no contiene la posición de ${planet}`);
  return placement;
}

function placementFactor(placement: ZodiacPosition, cusps: number[]): InterpretationFactor {
  return { id: `${placement.planet}:${placement.sign}:house-${houseForLongitude(placement.longitude, cusps)}`, subject: placement.planet as "sun" | "moon", sign: placement.sign, degree: placement.degree, minute: placement.minute, house: houseForLongitude(placement.longitude, cusps) };
}

function ascendantFactor(longitude: number): InterpretationFactor {
  const normalized = normalize(longitude);
  const sign = signs[Math.floor(normalized / 30)];
  return { id: `ascendant:${sign}`, subject: "ascendant", sign, degree: Math.floor(normalized % 30), minute: Math.round((normalized % 1) * 60) };
}

function houseForLongitude(longitude: number, cusps: number[]): number {
  const normalizedLongitude = normalize(longitude);
  for (let index = 0; index < cusps.length; index += 1) {
    const start = normalize(cusps[index]);
    const end = normalize(cusps[(index + 1) % cusps.length]);
    const span = normalize(end - start);
    if (normalize(normalizedLongitude - start) < span) return index + 1;
  }
  return 12;
}

function sectionForFactor(factor: InterpretationFactor): InterpretationSection {
  const sign = signLabels[factor.sign];
  const theme = signThemes[factor.sign];
  const position = `${factor.degree}° ${String(factor.minute).padStart(2, "0")}′ de ${sign}`;
  if (factor.subject === "sun") return { id: "sun", title: "Sol · identidad y propósito", factorIds: [factor.id], text: `Tu Sol está en ${position}, en casa ${factor.house}. Señala una forma de afirmar la identidad a través de ${theme}; esta expresión se vuelve especialmente relevante en los asuntos de la casa ${factor.house}.` };
  if (factor.subject === "moon") return { id: "moon", title: "Luna · mundo emocional", factorIds: [factor.id], text: `Tu Luna está en ${position}, en casa ${factor.house}. Describe necesidades emocionales ligadas a ${theme}; la casa ${factor.house} muestra un ámbito donde esa necesidad busca experiencia y cuidado.` };
  return { id: "ascendant", title: "Ascendente · primera expresión", factorIds: [factor.id], text: `Tu Ascendente está en ${position}. Es la cualidad con la que tiendes a iniciar, presentarte y relacionarte con lo inmediato: ${theme}.` };
}

function normalize(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}
