import { Watch, WatchRenderingConfig, WatchMovement, WatchFacts, WatchCategory } from "../types";

export const DEFAULT_RENDERING_CONFIG: WatchRenderingConfig = {
  caseShape: "round",
  caseFinish: "steel",
  caseBezelType: "smooth",
  bezelColor: "#1e293b",
  dialColor: "#09090b",
  dialPattern: "sunburst",
  markerType: "applied_batons",
  markerColor: "#e2e8f0",
  handsType: "dauphine",
  handsColor: "#ffffff",
  secondsHandColor: "#ef4444",
  lumeColor: "green",
  strapType: "leather_alligator",
  strapColor: "#0f172a",
  dateWindow: false,
  cyclops: false,
  hasOpenHeartOrTourbillon: false,
  subdials: [],
  bezelScrews: "none",
  crownStyle: "standard_fluted",
  pusherStyle: "none",
  skeletonDetails: "none",
  rehautScale: "none",
};

export const DEFAULT_MOVEMENT: WatchMovement = {
  type: "Automatic",
  caliber: "Manufacture Caliber",
  powerReserve: "48 Hours",
  frequencyVph: 28800,
  jewels: 25,
  features: ["Swiss Lever Escapement", "Shock Absorber", "Automatic Rotor Winding"],
};

export const DEFAULT_FACTS: WatchFacts = {
  tagline: "Fine Horological Craftsmanship",
  storyBlurb: "An iconic mechanical timepiece balancing timeless aesthetic harmony with precision Swiss engineering.",
  keyHighlights: ["Hand-finished case", "Sapphire crystal with anti-reflective coating", "Precision mechanical movement"],
  historicalSignificance: "Celebrated benchmark in horology reflecting decades of manufacture heritage.",
  movementEngineering: "Reliable mechanical movement beating at 28,800 vph with high shock resistance.",
  collectorLore: "Prized by enthusiasts for classic proportions and unmistakable wrist presence.",
  funFacts: ["Undergoes stringent multi-position regulation before leaving the workshop."],
  celebritiesAndIcons: [],
};

/**
 * Sanitizes any raw or partially-formed watch object from AI generation,
 * photo scanning, search synthesis, or manual addition to guarantee 100% type safety
 * and prevent any undefined property access crashes.
 */
export function sanitizeWatch(input: any): Watch {
  if (!input || typeof input !== "object") {
    return {
      id: `watch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: "Bespoke Timepiece",
      brand: "Independent",
      reference: "REF-001",
      category: "Everyday" as WatchCategory,
      collectionId: "default",
      yearIntroduced: "2024",
      caseDiameter: 40,
      caseThickness: 11,
      lugToLug: 47,
      lugWidth: 20,
      waterResistance: "50m / 165ft",
      movement: { ...DEFAULT_MOVEMENT },
      renderingConfig: { ...DEFAULT_RENDERING_CONFIG },
      facts: { ...DEFAULT_FACTS },
      dateAdded: new Date().toISOString(),
    };
  }

  // Safe Rendering Config
  const rawConfig = input.renderingConfig || {};
  const renderingConfig: WatchRenderingConfig = {
    ...DEFAULT_RENDERING_CONFIG,
    ...rawConfig,
    caseShape: rawConfig.caseShape || DEFAULT_RENDERING_CONFIG.caseShape,
    caseFinish: rawConfig.caseFinish || DEFAULT_RENDERING_CONFIG.caseFinish,
    caseBezelType: rawConfig.caseBezelType || DEFAULT_RENDERING_CONFIG.caseBezelType,
    dialColor: rawConfig.dialColor || DEFAULT_RENDERING_CONFIG.dialColor,
    dialPattern: rawConfig.dialPattern || DEFAULT_RENDERING_CONFIG.dialPattern,
    markerType: rawConfig.markerType || DEFAULT_RENDERING_CONFIG.markerType,
    markerColor: rawConfig.markerColor || (rawConfig.caseFinish?.includes?.("gold") ? "#f59e0b" : "#e2e8f0"),
    handsType: rawConfig.handsType || DEFAULT_RENDERING_CONFIG.handsType,
    handsColor: rawConfig.handsColor || (rawConfig.caseFinish?.includes?.("gold") ? "#fbbf24" : "#ffffff"),
    secondsHandColor: rawConfig.secondsHandColor || DEFAULT_RENDERING_CONFIG.secondsHandColor,
    lumeColor: rawConfig.lumeColor || DEFAULT_RENDERING_CONFIG.lumeColor,
    strapType: rawConfig.strapType || DEFAULT_RENDERING_CONFIG.strapType,
    strapColor: rawConfig.strapColor || DEFAULT_RENDERING_CONFIG.strapColor,
    subdials: Array.isArray(rawConfig.subdials) ? rawConfig.subdials : [],
    museumDotColor: rawConfig.museumDotColor || (rawConfig.caseFinish?.includes?.("gold") ? "#eab308" : "#cbd5e1"),
  };

  // Safe Movement
  const rawMovement = input.movement || {};
  const movement: WatchMovement = {
    type: rawMovement.type || DEFAULT_MOVEMENT.type,
    caliber: rawMovement.caliber || DEFAULT_MOVEMENT.caliber,
    powerReserve: rawMovement.powerReserve || DEFAULT_MOVEMENT.powerReserve,
    frequencyVph: typeof rawMovement.frequencyVph === "number" && !isNaN(rawMovement.frequencyVph) ? rawMovement.frequencyVph : 28800,
    jewels: typeof rawMovement.jewels === "number" && !isNaN(rawMovement.jewels) ? rawMovement.jewels : 25,
    accuracy: rawMovement.accuracy || "-4/+6 sec/day",
    features: Array.isArray(rawMovement.features) && rawMovement.features.length > 0 ? rawMovement.features : [...DEFAULT_MOVEMENT.features],
  };

  // Safe Facts
  const rawFacts = input.facts || {};
  const facts: WatchFacts = {
    tagline: rawFacts.tagline || DEFAULT_FACTS.tagline,
    storyBlurb: rawFacts.storyBlurb || rawFacts.tagline || DEFAULT_FACTS.storyBlurb,
    keyHighlights: Array.isArray(rawFacts.keyHighlights) && rawFacts.keyHighlights.length > 0 ? rawFacts.keyHighlights : [...DEFAULT_FACTS.keyHighlights],
    historicalSignificance: rawFacts.historicalSignificance || DEFAULT_FACTS.historicalSignificance,
    movementEngineering: rawFacts.movementEngineering || DEFAULT_FACTS.movementEngineering,
    collectorLore: rawFacts.collectorLore || DEFAULT_FACTS.collectorLore,
    funFacts: Array.isArray(rawFacts.funFacts) && rawFacts.funFacts.length > 0 ? rawFacts.funFacts : [...(DEFAULT_FACTS.funFacts || [])],
    celebritiesAndIcons: Array.isArray(rawFacts.celebritiesAndIcons) ? rawFacts.celebritiesAndIcons : [],
    sourceCitation: rawFacts.sourceCitation || "Horological Reference Archive",
  };

  return {
    ...input,
    id: input.id ? String(input.id) : `watch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: input.name ? String(input.name).trim() : "Bespoke Timepiece",
    brand: input.brand ? String(input.brand).trim() : "Fine Watchmaking Maison",
    reference: input.reference ? String(input.reference).trim() : "REF-001",
    category: input.category || "Everyday",
    collectionId: input.collectionId || "default",
    yearIntroduced: input.yearIntroduced || "2024",
    caseDiameter: typeof input.caseDiameter === "number" && !isNaN(input.caseDiameter) ? input.caseDiameter : 40,
    caseThickness: typeof input.caseThickness === "number" && !isNaN(input.caseThickness) ? input.caseThickness : 11,
    lugToLug: typeof input.lugToLug === "number" && !isNaN(input.lugToLug) ? input.lugToLug : 47,
    lugWidth: typeof input.lugWidth === "number" && !isNaN(input.lugWidth) ? input.lugWidth : 20,
    waterResistance: input.waterResistance || "50m / 165ft",
    msrp: input.msrp || "$1,200 USD",
    marketPrice: input.marketPrice || "$950 - $1,400 USD",
    movement,
    renderingConfig,
    facts,
    dateAdded: input.dateAdded || new Date().toISOString(),
  };
}
