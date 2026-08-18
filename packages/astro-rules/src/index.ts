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

export type InterpretationSubject = PlanetId | "ascendant";
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
export type BalanceInterpretationFactor = {
  id: string;
  kind: "balance";
  category: "elements" | "modalities" | "houses";
  dominant: string[];
  counts: Record<string, number>;
};
export type InterpretationFactor = PlacementInterpretationFactor | AspectInterpretationFactor | BalanceInterpretationFactor;
export type InterpretationSection = {
  id: InterpretationSubject | "aspects" | "synthesis";
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
const interpretedPlanets: PlanetId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "north-node", "chiron", "part-of-fortune"];
const personalPlanets = new Set<PlanetId>(["sun", "moon", "mercury", "venus", "mars"]);
const keyAspectNames = new Set<AspectInterpretationFactor["name"]>(["conjunction", "sextile", "square", "trine", "opposition"]);
const planetLabels: Record<PlanetId, string> = { sun: "Sol", moon: "Luna", mercury: "Mercurio", venus: "Venus", mars: "Marte", jupiter: "Júpiter", saturn: "Saturno", uranus: "Urano", neptune: "Neptuno", pluto: "Plutón", "north-node": "Nodo Norte", chiron: "Quirón", "part-of-fortune": "Parte de la Fortuna" };
const aspectLabels: Record<AspectInterpretationFactor["name"], string> = { conjunction: "conjunción", sextile: "sextil", square: "cuadratura", trine: "trígono", opposition: "oposición" };
const aspectThemes: Record<AspectInterpretationFactor["name"], string> = { conjunction: "fusiona ambas funciones y pide integrarlas conscientemente", sextile: "abre una colaboración fluida que puede desarrollarse con iniciativa", square: "plantea una tensión creativa que invita a ajustar la forma de actuar", trine: "facilita un intercambio natural que conviene poner en práctica", opposition: "muestra una polaridad que busca diálogo, equilibrio y perspectiva" };
const elementBySign: Record<ZodiacSign, "fire" | "earth" | "air" | "water"> = { aries: "fire", taurus: "earth", gemini: "air", cancer: "water", leo: "fire", virgo: "earth", libra: "air", scorpio: "water", sagittarius: "fire", capricorn: "earth", aquarius: "air", pisces: "water" };
const modalityBySign: Record<ZodiacSign, "cardinal" | "fixed" | "mutable"> = { aries: "cardinal", taurus: "fixed", gemini: "mutable", cancer: "cardinal", leo: "fixed", virgo: "mutable", libra: "cardinal", scorpio: "fixed", sagittarius: "mutable", capricorn: "cardinal", aquarius: "fixed", pisces: "mutable" };
const elementLabels: Record<string, string> = { fire: "fuego", earth: "tierra", air: "aire", water: "agua" };
const modalityLabels: Record<string, string> = { cardinal: "cardinal", fixed: "fija", mutable: "mutable" };
const elementThemes: Record<string, string> = { fire: "iniciativa y expresión", earth: "realismo y concreción", air: "intercambio de ideas y perspectiva", water: "sensibilidad y mundo emocional" };
const modalityThemes: Record<string, string> = { cardinal: "empuje para iniciar", fixed: "capacidad de sostener y profundizar", mutable: "adaptación y aprendizaje continuo" };
const houseThemes: Record<number, string> = { 1: "identidad y presencia", 2: "recursos, valores y sostén", 3: "aprendizaje cercano y comunicación", 4: "raíces, intimidad y hogar", 5: "creatividad, disfrute y expresión", 6: "hábitos, trabajo cotidiano y cuidado", 7: "vínculos y cooperación", 8: "intimidad, cambios y recursos compartidos", 9: "sentido, estudios y horizontes", 10: "vocación, dirección y visibilidad", 11: "amistades, redes y proyectos", 12: "vida interior, retiro y procesos inconscientes" };

export function extractCoreInterpretationFactors(chart: NatalChart): PlacementInterpretationFactor[] {
  const planets = interpretedPlanets.flatMap((planet) => {
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
  const balanceFactors = extractChartBalanceFactors(chart);
  return { factors: [...placementFactors, ...aspectFactors, ...balanceFactors], sections: [...placementFactors.map(sectionForFactor), ...(aspectFactors.length ? [sectionForAspects(aspectFactors)] : []), sectionForBalance(balanceFactors)] };
}

export function extractChartBalanceFactors(chart: NatalChart): BalanceInterpretationFactor[] {
  const elements = { fire: 0, earth: 0, air: 0, water: 0 } as Record<string, number>;
  const modalities = { cardinal: 0, fixed: 0, mutable: 0 } as Record<string, number>;
  const houses = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [String(index + 1), 0])) as Record<string, number>;
  for (const placement of chart.planets) {
    elements[elementBySign[placement.sign]] += 1;
    modalities[modalityBySign[placement.sign]] += 1;
  }
  for (const placement of [...chart.planets, ...chart.points]) houses[String(houseForLongitude(placement.longitude, chart.houses.cusps))] += 1;
  return [balanceFactor("elements", elements), balanceFactor("modalities", modalities), houseBalanceFactor(houses)];
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

function findPlacement(chart: NatalChart, planet: PlanetId): ZodiacPosition | undefined {
  return [...chart.planets, ...chart.points].find((candidate) => candidate.planet === planet);
}

function placementFactor(placement: ZodiacPosition, cusps: number[]): PlacementInterpretationFactor {
  const house = houseForLongitude(placement.longitude, cusps);
  return { id: `${placement.planet}:${placement.sign}:house-${house}`, kind: "placement", subject: placement.planet, sign: placement.sign, degree: placement.degree, minute: placement.minute, house };
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
  if (factor.subject === "jupiter") return { id: "jupiter", title: "Júpiter · expansión y confianza", factorIds: [factor.id], text: `Tu Júpiter está en ${position}, en casa ${factor.house}. Describe una vía de crecimiento, confianza y ampliación de horizontes ligada a ${theme}; la casa ${factor.house} señala dónde puede abrirse esa perspectiva.` };
  if (factor.subject === "saturn") return { id: "saturn", title: "Saturno · límites y madurez", factorIds: [factor.id], text: `Tu Saturno está en ${position}, en casa ${factor.house}. Muestra una zona de responsabilidad, aprendizaje paciente y consolidación a través de ${theme}; la casa ${factor.house} invita a construir con constancia.` };
  if (factor.subject === "uranus") return { id: "uranus", title: "Urano · cambio y autenticidad", factorIds: [factor.id], text: `Tu Urano está en ${position}, en casa ${factor.house}. Señala una necesidad de renovar, diferenciarte y abrir posibilidades mediante ${theme}; la casa ${factor.house} es un espacio sensible a los cambios y a la libertad.` };
  if (factor.subject === "neptune") return { id: "neptune", title: "Neptuno · imaginación y sensibilidad", factorIds: [factor.id], text: `Tu Neptuno está en ${position}, en casa ${factor.house}. Describe una sensibilidad imaginativa y permeable vinculada a ${theme}; la casa ${factor.house} puede vivirse con inspiración, idealismo y necesidad de claridad.` };
  if (factor.subject === "pluto") return { id: "pluto", title: "Plutón · profundidad y transformación", factorIds: [factor.id], text: `Tu Plutón está en ${position}, en casa ${factor.house}. Muestra procesos de intensidad, renovación y poder personal relacionados con ${theme}; la casa ${factor.house} concentra experiencias transformadoras.` };
  if (factor.subject === "north-node") return { id: "north-node", title: "Nodo Norte · dirección de crecimiento", factorIds: [factor.id], text: `Tu Nodo Norte está en ${position}, en casa ${factor.house}. Propone una dirección de aprendizaje que se desarrolla a través de ${theme}; la casa ${factor.house} marca un ámbito donde esa evolución puede tomar forma.` };
  if (factor.subject === "chiron") return { id: "chiron", title: "Quirón · herida y aprendizaje", factorIds: [factor.id], text: `Tu Quirón está en ${position}, en casa ${factor.house}. Señala una sensibilidad que puede convertirse en comprensión y recurso mediante ${theme}; la casa ${factor.house} indica dónde ese aprendizaje se vuelve significativo.` };
  if (factor.subject === "part-of-fortune") return { id: "part-of-fortune", title: "Parte de la Fortuna · fluidez y realización", factorIds: [factor.id], text: `Tu Parte de la Fortuna está en ${position}, en casa ${factor.house}. Sugiere una vía de fluidez y realización cuando conectas con ${theme}; la casa ${factor.house} ofrece un escenario propicio para desarrollarla.` };
  return { id: "ascendant", title: "Ascendente · primera expresión", factorIds: [factor.id], text: `Tu Ascendente está en ${position}. Es la cualidad con la que tiendes a iniciar, presentarte y relacionarte con lo inmediato: ${theme}.` };
}

function sectionForAspects(factors: AspectInterpretationFactor[]): InterpretationSection {
  const text = factors.map((factor) => {
    const [first, second] = factor.between.map((planet) => planetLabels[planet]);
    return `${first} en ${aspectLabels[factor.name]} con ${second} (orbe ${factor.orb.toFixed(1)}°) ${aspectThemes[factor.name]}.`;
  }).join(" ");
  return { id: "aspects", title: "Aspectos clave", factorIds: factors.map((factor) => factor.id), text };
}

function balanceFactor(category: BalanceInterpretationFactor["category"], counts: Record<string, number>): BalanceInterpretationFactor {
  const highest = Math.max(...Object.values(counts));
  const dominant = Object.keys(counts).filter((key) => counts[key] === highest);
  return { id: `${category}:${dominant.join("-")}`, kind: "balance", category, dominant, counts };
}

function houseBalanceFactor(counts: Record<string, number>): BalanceInterpretationFactor {
  const highest = Math.max(...Object.values(counts));
  const dominant = highest < 2 ? [] : Object.keys(counts).filter((key) => counts[key] === highest);
  return { id: `houses:${dominant.join("-") || "none"}`, kind: "balance", category: "houses", dominant, counts };
}

function sectionForBalance(factors: BalanceInterpretationFactor[]): InterpretationSection {
  const elements = factors.find((factor) => factor.category === "elements");
  const modalities = factors.find((factor) => factor.category === "modalities");
  const houses = factors.find((factor) => factor.category === "houses");
  if (!elements || !modalities || !houses) throw new Error("Falta un balance interpretativo");
  const elementNames = elements.dominant.map((element) => elementLabels[element]).join(" y ");
  const modalityNames = modalities.dominant.map((modality) => modalityLabels[modality]).join(" y ");
  const elementTheme = elements.dominant.map((element) => elementThemes[element]).join(" y ");
  const modalityTheme = modalities.dominant.map((modality) => modalityThemes[modality]).join(" y ");
  const houseText = houses.dominant.length ? ` La concentración en ${houses.dominant.map((house) => `casa ${house}`).join(" y ")} pone énfasis en ${houses.dominant.map((house) => houseThemes[Number(house)]).join(" y ")}.` : " La distribución por casas no concentra suficientes posiciones como para destacar un único ámbito.";
  return { id: "synthesis", title: "Síntesis · elementos, modalidades y casas", factorIds: factors.map((factor) => factor.id), text: `En el conjunto de tus planetas predominan ${elementNames}, asociados a ${elementTheme}. La modalidad ${modalityNames} destaca por su ${modalityTheme}.${houseText} Esta síntesis describe un tono general que dialoga con el resto de posiciones.` };
}

function isLuminary(planet: PlanetId): boolean {
  return planet === "sun" || planet === "moon";
}

function normalize(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}
