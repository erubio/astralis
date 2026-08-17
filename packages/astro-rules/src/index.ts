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

export type InterpretationSubject = "sun" | "moon" | "mercury" | "venus" | "mars" | "ascendant";
export type PlacementInterpretationFactor = {
  id: string;
  kind: "placement";
  subject: InterpretationSubject;
  sign: ZodiacSign;
  degree: number;
  minute: number;
  house?: number;
};
export type AspectInterpretationFactor = {
  id: string;
  kind: "aspect";
  name: "conjunction" | "sextile" | "square" | "trine" | "opposition";
  between: [PlanetId, PlanetId];
  orb: number;
};
export type InterpretationFactor = PlacementInterpretationFactor | AspectInterpretationFactor;
export type InterpretationSection = {
  id: InterpretationSubject | "aspects";
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
const personalPlanets = new Set<PlanetId>(["sun", "moon", "mercury", "venus", "mars"]);
const keyAspectNames = new Set<AspectInterpretationFactor["name"]>(["conjunction", "sextile", "square", "trine", "opposition"]);
const planetLabels: Record<PlanetId, string> = { sun: "Sol", moon: "Luna", mercury: "Mercurio", venus: "Venus", mars: "Marte", jupiter: "Júpiter", saturn: "Saturno", uranus: "Urano", neptune: "Neptuno", pluto: "Plutón", "north-node": "Nodo Norte", chiron: "Quirón", "part-of-fortune": "Parte de la Fortuna" };
const aspectLabels: Record<AspectInterpretationFactor["name"], string> = { conjunction: "conjunción", sextile: "sextil", square: "cuadratura", trine: "trígono", opposition: "oposición" };
const aspectThemes: Record<AspectInterpretationFactor["name"], string> = { conjunction: "fusiona ambas funciones y pide integrarlas conscientemente", sextile: "abre una colaboración fluida que puede desarrollarse con iniciativa", square: "plantea una tensión creativa que invita a ajustar la forma de actuar", trine: "facilita un intercambio natural que conviene poner en práctica", opposition: "muestra una polaridad que busca diálogo, equilibrio y perspectiva" };

export function extractCoreInterpretationFactors(chart: NatalChart): PlacementInterpretationFactor[] {
  const planets = (["sun", "moon", "mercury", "venus", "mars"] as const).flatMap((planet) => {
    const placement = findPlacement(chart, planet);
    return placement ? [placementFactor(placement, chart.houses.cusps)] : [];
  });
  return [
    ...planets,
    ascendantFactor(chart.houses.ascendant)
  ];
}

export function composeCoreInterpretation(chart: NatalChart): InterpretationReport {
  const placementFactors = extractCoreInterpretationFactors(chart);
  const aspectFactors = extractKeyAspectFactors(chart);
  return { factors: [...placementFactors, ...aspectFactors], sections: [...placementFactors.map(sectionForFactor), ...(aspectFactors.length ? [sectionForAspects(aspectFactors)] : [])] };
}

export function extractKeyAspectFactors(chart: NatalChart, limit = 5): AspectInterpretationFactor[] {
  const placements = chart.planets.filter((placement) => personalPlanets.has(placement.planet));
  const factors: AspectInterpretationFactor[] = [];
  for (let index = 0; index < placements.length; index += 1) {
    for (const second of placements.slice(index + 1)) {
      const first = placements[index];
      const aspect = findAspect(first.planet, first.longitude, second.planet, second.longitude);
      if (aspect && keyAspectNames.has(aspect.name as AspectInterpretationFactor["name"])) factors.push({ id: `aspect:${first.planet}:${second.planet}:${aspect.name}`, kind: "aspect", name: aspect.name as AspectInterpretationFactor["name"], between: aspect.between, orb: aspect.orb });
    }
  }
  return factors.sort((first, second) => Number(second.between.some(isLuminary)) - Number(first.between.some(isLuminary)) || first.orb - second.orb).slice(0, limit);
}

function findPlacement(chart: NatalChart, planet: "sun" | "moon" | "mercury" | "venus" | "mars"): ZodiacPosition | undefined {
  return chart.planets.find((candidate) => candidate.planet === planet);
}

function placementFactor(placement: ZodiacPosition, cusps: number[]): PlacementInterpretationFactor {
  const house = houseForLongitude(placement.longitude, cusps);
  return { id: `${placement.planet}:${placement.sign}:house-${house}`, kind: "placement", subject: placement.planet as Exclude<InterpretationSubject, "ascendant">, sign: placement.sign, degree: placement.degree, minute: placement.minute, house };
}

function ascendantFactor(longitude: number): PlacementInterpretationFactor {
  const normalized = normalize(longitude);
  const sign = signs[Math.floor(normalized / 30)];
  return { id: `ascendant:${sign}`, kind: "placement", subject: "ascendant", sign, degree: Math.floor(normalized % 30), minute: Math.round((normalized % 1) * 60) };
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

function sectionForFactor(factor: PlacementInterpretationFactor): InterpretationSection {
  const sign = signLabels[factor.sign];
  const theme = signThemes[factor.sign];
  const position = `${factor.degree}° ${String(factor.minute).padStart(2, "0")}′ de ${sign}`;
  if (factor.subject === "sun") return { id: "sun", title: "Sol · identidad y propósito", factorIds: [factor.id], text: `Tu Sol está en ${position}, en casa ${factor.house}. Señala una forma de afirmar la identidad a través de ${theme}; esta expresión se vuelve especialmente relevante en los asuntos de la casa ${factor.house}.` };
  if (factor.subject === "moon") return { id: "moon", title: "Luna · mundo emocional", factorIds: [factor.id], text: `Tu Luna está en ${position}, en casa ${factor.house}. Describe necesidades emocionales ligadas a ${theme}; la casa ${factor.house} muestra un ámbito donde esa necesidad busca experiencia y cuidado.` };
  if (factor.subject === "mercury") return { id: "mercury", title: "Mercurio · mente y comunicación", factorIds: [factor.id], text: `Tu Mercurio está en ${position}, en casa ${factor.house}. Describe una manera de pensar, aprender y comunicar que se apoya en ${theme}; la casa ${factor.house} señala un campo donde esa voz adquiere especial protagonismo.` };
  if (factor.subject === "venus") return { id: "venus", title: "Venus · vínculos y valores", factorIds: [factor.id], text: `Tu Venus está en ${position}, en casa ${factor.house}. Habla de tu forma de vincularte, disfrutar y elegir lo valioso a través de ${theme}; la casa ${factor.house} sitúa experiencias donde esos valores buscan expresarse.` };
  if (factor.subject === "mars") return { id: "mars", title: "Marte · deseo y acción", factorIds: [factor.id], text: `Tu Marte está en ${position}, en casa ${factor.house}. Muestra cómo afirmas el deseo y pones energía en movimiento mediante ${theme}; la casa ${factor.house} indica un territorio especialmente activo para esa iniciativa.` };
  return { id: "ascendant", title: "Ascendente · primera expresión", factorIds: [factor.id], text: `Tu Ascendente está en ${position}. Es la cualidad con la que tiendes a iniciar, presentarte y relacionarte con lo inmediato: ${theme}.` };
}

function sectionForAspects(factors: AspectInterpretationFactor[]): InterpretationSection {
  const text = factors.map((factor) => {
    const [first, second] = factor.between.map((planet) => planetLabels[planet]);
    return `${first} en ${aspectLabels[factor.name]} con ${second} (orbe ${factor.orb.toFixed(1)}°) ${aspectThemes[factor.name]}.`;
  }).join(" ");
  return { id: "aspects", title: "Aspectos clave", factorIds: factors.map((factor) => factor.id), text };
}

function isLuminary(planet: PlanetId): boolean {
  return planet === "sun" || planet === "moon";
}

function normalize(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}
