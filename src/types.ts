export type WatchCategory =
  | "Diver"
  | "Chronograph"
  | "Dress"
  | "Pilot"
  | "Integrated"
  | "GMT / Travel"
  | "GMT/Travel"
  | "Grand Complication"
  | "Field"
  | "Everyday"
  | "Skeleton"
  | "Sport"
  | "Vintage Swiss"
  | "Occasion"
  | "Racing"
  | "Microbrand"
  | "Minimalist"
  | "Minimalist / Bauhaus"
  | "Moonphase"
  | "Worldtimer"
  | "Tank / Rectangular";

export type CaseShape =
  | "round"
  | "cushion"
  | "square"
  | "tonneau"
  | "octagonal"
  | "tank"
  | "nautilus"
  | "reverso"
  | "rectangular"
  | "angular_facet"
  | "trapezoid"
  | "bullhead";

export type PusherStyle =
  | "none"
  | "standard_pump"
  | "oversized_pump"
  | "screw_down"
  | "rectangular_paddle"
  | "bullhead_top"
  | "monopower"
  | "richard_mille_tactical";

export type CrownStyle =
  | "standard_fluted"
  | "oversized_onion"
  | "richard_mille_flange"
  | "cabochon"
  | "panerai_bridge"
  | "bullhead_top"
  | "left_hand";

export type BezelScrewsType =
  | "none"
  | "octagonal_hex"
  | "richard_mille_spline"
  | "hublot_h_screws"
  | "diver_screws";

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
  | "ceramic_teal"
  | "steel_brushed"
  | "steel_polished"
  | "yellow_gold"
  | "rose_gold"
  | "titanium"
  | "bronze"
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
  | "cartier_tank_brancards"
  | "internal_rotating"
  | "world_time";

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
  | "aventurine"
  | "wave"
  | "skeleton"
  | "open_heart"
  | "waffle";

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
  | "sandwich_cutouts"
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
  | "skeleton"
  | "arrow"
  | "syringe"
  | "leaf";

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
  | "integrated_steel"
  | "steel_oyster"
  | "steel_jubilee"
  | "steel_integrated"
  | "steel_mesh_shark"
  | "steel_beads_of_rice"
  | "milanese_mesh"
  | "resin_black"
  | "canvas_olive"
  | "fabric_canvas"
  | "nato_bond"
  | "leather_racing_perforated"
  | "leather_perforated_rally"
  | "leather_waterproof"
  | "waterproof_leather"
  | "quick_release_fkm_rubber"
  | "silicone_ribbed"
  | "rubber_accordion_dive"
  | "silicone_pro_dive"
  | "tropic_rubber"
  | "titanium_oyster"
  | "leather_distressed";

export interface SubdialConfig {
  position: "2" | "3" | "4" | "5" | "6" | "9" | "10" | "12" | "sub_seconds" | "chronograph_tri";
  label: string;
  type: "seconds" | "chrono_min" | "chrono_hour" | "power_reserve" | "gmt" | "moonphase" | "day_night" | "dual_time";
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
  dayDateWindow?: boolean;
  bigDateWindow?: boolean;
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
  pusherStyle?: PusherStyle;
  pusherColor?: string;
  crownStyle?: CrownStyle;
  crownRingColor?: string;
  bezelScrews?: BezelScrewsType;
  rehautScale?: "none" | "tachymeter" | "minutes_60" | "split_color" | "racing";
  rehautColor?: string;
  rehautTextColor?: string;
  skeletonDetails?: "none" | "richard_mille_tourbillon" | "industrial_x_bridge" | "classic_squelette" | "open_balance";
}

export interface WatchMovement {
  type: string;
  caliber: string;
  powerReserve: string;
  frequencyVph?: number;
  jewels?: number;
  accuracy?: string;
  features: string[];
}

export interface WatchFacts {
  tagline: string;
  storyBlurb?: string;
  keyHighlights: string[];
  historicalSignificance?: string;
  movementEngineering?: string;
  collectorLore?: string;
  funFacts?: string[];
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
  | "watchbase"
  | "everywatch";

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
  // Emotional Connection & Collector Storytelling
  sentimentalOccasion?: string;
  emotionalBondRating?: number; // 1-5
  daysWornCount?: number;
  lastWornDate?: string;
  acquisitionStory?: string;
  personalityArchetype?: string;
  accuracyDeviation?: string;
  scannedPhotoUrl?: string;
  visionAnalysisNotes?: string;
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
