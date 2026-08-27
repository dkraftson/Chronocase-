export type WatchCategory =
  | "Diver"
  | "Chronograph"
  | "Dress"
  | "Pilot"
  | "Integrated"
  | "GMT / Travel"
  | "Grand Complication"
  | "Field"
  | "Everyday";

export type CaseShape = "round" | "cushion" | "square" | "tonneau" | "octagonal" | "tank" | "nautilus" | "reverso";

export type CaseFinish =
  | "steel"
  | "yellow_gold"
  | "rose_gold"
  | "white_gold"
  | "platinum"
  | "titanium"
  | "bronze"
  | "black_ceramic"
  | "two_tone";

export type BezelMaterial =
  | "ceramic_black"
  | "ceramic_blue"
  | "ceramic_green"
  | "ceramic_pepsi"
  | "ceramic_batman"
  | "steel_brushed"
  | "steel_polished"
  | "yellow_gold"
  | "rose_gold"
  | "titanium"
  | "carbon"
  | "fluted_gold"
  | "fluted_steel";

export type BezelType =
  | "smooth"
  | "fluted"
  | "diver_60"
  | "tachymeter"
  | "gmt_24"
  | "diamond"
  | "octagonal_screws"
  | "stepped"
  | "slide_rule"
  | "nautilus_porthole"
  | "reverso_gadroons"
  | "cartier_tank_brancards";

export type DialPattern =
  | "sunburst"
  | "matte"
  | "tapisserie"
  | "snowflake"
  | "guilloche"
  | "enamel"
  | "gradient"
  | "carbon"
  | "museum_minimalist"
  | "nautilus_grooves"
  | "step_dial"
  | "pie_pan"
  | "meteorite"
  | "aventurine";

export type MarkerType =
  | "applied_batons"
  | "applied_dots"
  | "roman_numerals"
  | "arabic_numerals"
  | "diver_mixed"
  | "breguet_numerals"
  | "minimal_indices"
  | "museum_dot"
  | "panerai_sandwich"
  | "california"
  | "explorer_369"
  | "railroad_roman"
  | "none";

export type HandsType =
  | "mercedes"
  | "dauphine"
  | "sword"
  | "baton"
  | "breguet"
  | "cathedral"
  | "alpha"
  | "skeleton";

export type LumeColor = "green" | "ice_blue" | "vintage_tritium" | "none";

export type StrapType =
  | "leather_black"
  | "rubber_black"
  | "rubber_blue"
  | "rubber_orange"
  | "leather_alligator"
  | "leather_suede"
  | "leather_brown"
  | "oyster_bracelet"
  | "jubilee_bracelet"
  | "president_bracelet"
  | "rubber_oysterflex"
  | "nato_fabric"
  | "integrated_steel";

export interface SubdialConfig {
  position: "3" | "6" | "9" | "12" | "sub_seconds" | "chronograph_tri";
  label: string;
  type: "seconds" | "chrono_min" | "chrono_hour" | "power_reserve" | "gmt" | "moonphase";
}

export interface WatchRenderingConfig {
  caseShape: CaseShape;
  caseFinish: CaseFinish;
  caseBezelType: BezelType;
  bezelMaterial?: BezelMaterial;
  bezelColor?: string;
  bezelAccentColor?: string;
  dialColor: string;
  dialPattern: DialPattern;
  dialPatternColor?: string;
  markerType: MarkerType;
  markerColor: string;
  handsType: HandsType;
  handsColor: string;
  secondsHandColor: string;
  lumeColor: LumeColor;
  dateWindow?: boolean;
  cyclops?: boolean;
  dayDate?: boolean;
  hasOpenHeartOrTourbillon?: boolean;
  subdials?: SubdialConfig[];
  strapType: StrapType;
  strapColor: string;
  accentColor?: string;
  // Distinctive horological details
  museumDotColor?: string;
  hideDialText?: boolean;
  crownCabochon?: boolean;
  paneraiBridge?: boolean;
}

export interface WatchMovement {
  type: "Automatic" | "Manual Wind" | "Quartz" | "Spring Drive" | "Co-Axial" | "Tourbillon";
  caliber: string;
  powerReserve: string;
  frequencyVph: number;
  jewels?: number;
  features: string[];
}

export interface WatchFacts {
  tagline: string;
  storyBlurb?: string;
  keyHighlights: string[];
  historicalSignificance: string;
  movementEngineering: string;
  collectorLore: string;
  funFacts: string[];
  celebritiesAndIcons?: string[];
  sourceCitation?: string;
}

export interface WatchCollection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  themeColor?: string;
  caseSettings?: Partial<CaseSettings>;
  createdAt: string;
}

export type HorologySource =
  | "the_watch_revised"
  | "chrono24"
  | "mayors"
  | "primer_magazine"
  | "teddy_baldassarre"
  | "ebay_vault"
  | "hodinkee"
  | "wristcheck"
  | "watchbase";

export interface Watch {
  id: string;
  name: string;
  brand: string;
  reference: string;
  collectionId?: string;
  yearIntroduced?: string | number;
  category: WatchCategory;
  msrp?: string;
  marketPrice?: string;
  caseDiameter: number;
  caseThickness?: number;
  lugToLug?: number;
  lugWidth?: number;
  waterResistance?: string;
  movement: WatchMovement;
  renderingConfig: WatchRenderingConfig;
  facts: WatchFacts;
  collectorNotes?: string;
  customEngraving?: string;
  userFavorite?: boolean;
  provenanceSource?: HorologySource;
  sourceBadgeLabel?: string;
  dateAdded: string;
}

export type CaseMaterial = "walnut" | "piano_black" | "forest_leather" | "carbon_fiber" | "mahogany";
export type CushionColor = "ivory" | "midnight" | "burgundy" | "hunter_green" | "charcoal";
export type VaultLighting = "warm_gallery" | "daylight_5000k" | "midnight_vault" | "lume_laboratory";

export interface CaseSettings {
  material: CaseMaterial;
  cushionColor: CushionColor;
  lighting: VaultLighting;
  soundEnabled: boolean;
  columns: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "watchmaker";
  text: string;
  timestamp: string;
}
