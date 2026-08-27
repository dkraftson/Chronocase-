import { WatchCategory, WatchMovement } from "../types";

export interface StyleMeta {
  category: WatchCategory;
  label: string;
  emoji: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentGlow: string;
  archetype: string;
  keyTraits: string[];
  description: string;
}

export const STYLE_METADATA: Record<WatchCategory, StyleMeta> = {
  Dress: {
    category: "Dress",
    label: "Dress Watch",
    emoji: "👔",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/40",
    accentGlow: "shadow-amber-500/20",
    archetype: "Formal Elegance & Pure Simplicity",
    keyTraits: ["Slim Profile (<10mm)", "Precious Metals / Polished Steel", "Guilloché or Minimalist Dial", "Leather or Fine Mesh Strap"],
    description: "Designed to slide effortlessly beneath a tailored shirt cuff. Characterized by clean indices, understated dials, refined proportions, and exquisite hand finishing.",
  },
  Diver: {
    category: "Diver",
    label: "Diver / Maritime",
    emoji: "🌊",
    badgeBg: "bg-cyan-500/15",
    badgeText: "text-cyan-300",
    badgeBorder: "border-cyan-500/40",
    accentGlow: "shadow-cyan-500/20",
    archetype: "Aquatic Tool & ISO 6425 Standard",
    keyTraits: ["Unidirectional 60-Min Bezel", "≥200m Water Resistance", "Heavy Super-LumiNova Application", "Screw-Down Crown & Caseback"],
    description: "Engineered to withstand deep ocean pressures and extreme environments. Features high-contrast luminescence and a rotating elapsed-time timing bezel.",
  },
  Chronograph: {
    category: "Chronograph",
    label: "Chronograph / Motorsport",
    emoji: "🏎️",
    badgeBg: "bg-rose-500/15",
    badgeText: "text-rose-300",
    badgeBorder: "border-rose-500/40",
    accentGlow: "shadow-rose-500/20",
    archetype: "High-Precision Elapsed Timer",
    keyTraits: ["Dual/Triple Sub-Dials", "Tachymeter Scale", "Column-Wheel / Cam Actuation", "Twin Pushers at 2 & 4"],
    description: "The ultimate stopwatch wrist instrument. Designed for calculating speed, distance, and precision elapsed intervals across racing circuits, aviation, and space exploration.",
  },
  Integrated: {
    category: "Integrated",
    label: "Integrated Sports Watch",
    emoji: "⚙️",
    badgeBg: "bg-slate-500/20",
    badgeText: "text-slate-200",
    badgeBorder: "border-slate-400/40",
    accentGlow: "shadow-slate-400/20",
    archetype: "Gérald Genta Geometric Architecture",
    keyTraits: ["Seamless Case-to-Bracelet Flow", "Geometric / Octagonal Bezel", "Intricate Tapisserie Dial Finishing", "Luxury Steel Finishing"],
    description: "Pioneered in the 1970s by Gérald Genta, blending rugged steel durability with haute horlogerie finishing, angular architectural bezels, and seamless taper bracelets.",
  },
  "GMT / Travel": {
    category: "GMT / Travel",
    label: "GMT / Worldtimer",
    emoji: "✈️",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-300",
    badgeBorder: "border-blue-500/40",
    accentGlow: "shadow-blue-500/20",
    archetype: "Dual-Timezone Aviator & Global Instrument",
    keyTraits: ["24-Hour Bidirectional Bezel", "Independent 4th GMT Hand", "Split-Color Day/Night Bezel", "Local-Hour Jumping Setting"],
    description: "Born for transcontinental jet pilots and international travelers to track home and local time simultaneously across timezones.",
  },
  "Grand Complication": {
    category: "Grand Complication",
    label: "Grand Complication",
    emoji: "🌌",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-300",
    badgeBorder: "border-purple-500/40",
    accentGlow: "shadow-purple-500/20",
    archetype: "Summit of Astronomical & Micromechanical Art",
    keyTraits: ["Perpetual Calendar / Moonphase", "Tourbillon / Minute Repeater", "Decentralized Dial Architecture", "Hand-Finished Caliber Decoration"],
    description: "The zenith of the watchmaker's art. Incorporates multiple complex astronomical, acoustic, or mechanical complications with hundreds of hand-decorated components.",
  },
  Field: {
    category: "Field",
    label: "Field & Tactical",
    emoji: "🧭",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/40",
    accentGlow: "shadow-emerald-500/20",
    archetype: "Military Utility & High Legibility",
    keyTraits: ["24-Hour Inner Military Scale", "Matte Anti-Reflective Case", "Durable NATO / Canvas Strap", "Shock-Resistant Movement"],
    description: "Rooted in military heritage, prioritizing instantaneous readability in the field, rugged scratch-resistant finishes, and no-glare matte dials.",
  },
  Pilot: {
    category: "Pilot",
    label: "Pilot / Aviation",
    emoji: "🛩️",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-200",
    badgeBorder: "border-amber-500/30",
    accentGlow: "shadow-amber-500/20",
    archetype: "High-Altitude Flight Instrument",
    keyTraits: ["Oversized Onion Crown", "Flieger Type A/B Dial", "Soft-Iron Anti-Magnetic Cage", "High-Contrast Sword Hands"],
    description: "Designed for aviators needing instantaneous legibility in cockpits, gloved operation via enlarged crowns, and magnetic field resistance.",
  },
  Everyday: {
    category: "Everyday",
    label: "Everyday / GADA",
    emoji: "⌚",
    badgeBg: "bg-neutral-800/80",
    badgeText: "text-neutral-200",
    badgeBorder: "border-neutral-700/60",
    accentGlow: "shadow-neutral-500/10",
    archetype: "Go-Anywhere-Do-Anything Versatility",
    keyTraits: ["100m Water Resistance", "Balanced 38-41mm Case", "Versatile Bracelet or Strap", "Clean Three-Hand with Date"],
    description: "A balanced timepiece equally comfortable in boardrooms, casual weekend outings, or active sports without skipping a beat.",
  },
};

export interface MovementMeta {
  type: WatchMovement["type"];
  label: string;
  iconSymbol: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  mechanics: string;
  vphExplanation: string;
  powerReserveNote: string;
  keyBenefits: string[];
}

export const MOVEMENT_METADATA: Record<WatchMovement["type"], MovementMeta> = {
  Automatic: {
    type: "Automatic",
    label: "Automatic (Self-Winding)",
    iconSymbol: "⚡",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/40",
    mechanics: "Uses a weighted oscillating rotor that rotates freely with natural wrist movement to continuously wind the mainspring barrel.",
    vphExplanation: "Typically oscillates at 28,800 vph (4 Hz), yielding 8 micro-ticks per second for a smooth sweeping second hand.",
    powerReserveNote: "Stays fully wound on the wrist; automatically stores 40–80 hours of kinetic energy when idle.",
    keyBenefits: ["Never needs battery replacement", "Continuous self-winding on wrist", "Smooth mechanical sweep"],
  },
  "Manual Wind": {
    type: "Manual Wind",
    label: "Manual Wind (Hand-Wound)",
    iconSymbol: "🖐️",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/40",
    mechanics: "Powered entirely by manually winding the crown to tension the mainspring barrel. Unobstructed view of bridges and balance wheel through caseback.",
    vphExplanation: "Traditional classic cadence (typically 18,000–21,600 vph), offering a distinct rhythmic horological tick.",
    powerReserveNote: "Offers 48–8 days of power depending on mainspring barrel architecture.",
    keyBenefits: ["Direct tactile ritual with timepiece", "Ultra-thin case profile (no rotor thickness)", "Unobstructed exhibition caseback view"],
  },
  "Co-Axial": {
    type: "Co-Axial",
    label: "Co-Axial Master Chronometer",
    iconSymbol: "🌀",
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-300",
    badgeBorder: "border-sky-500/40",
    mechanics: "Invented by master watchmaker George Daniels, utilizing radial friction rather than sliding friction on escapement pallets to reduce wear.",
    vphExplanation: "Oscillates at 25,200 vph (3.5 Hz), optimized for stability and long-term chronometric precision.",
    powerReserveNote: "Features dual silicon barrels and extreme anti-magnetism (>15,000 Gauss).",
    keyBenefits: ["Radically reduced friction and oil breakdown", "Extended service intervals (8–10 years)", "Resistant to powerful magnetic fields"],
  },
  "Spring Drive": {
    type: "Spring Drive",
    label: "Spring Drive (Continuous Glide)",
    iconSymbol: "🌊",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-300",
    badgeBorder: "border-blue-500/40",
    mechanics: "Mechanical mainspring barrel drives a glide wheel governed by an electromagnetic brake and quartz crystal tri-synchro regulator.",
    vphExplanation: "Zero ticks. The second hand moves in a completely unbroken, silent, fluid continuous glide.",
    powerReserveNote: "Stores 72–120 hours of power reserve with ±1 sec/day chronometric accuracy.",
    keyBenefits: ["True continuous glide motion", "Quartz-level precision with mechanical soul", "Silent, poetic engineering"],
  },
  Tourbillon: {
    type: "Tourbillon",
    label: "Tourbillon Escapement",
    iconSymbol: "💎",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-300",
    badgeBorder: "border-purple-500/40",
    mechanics: "Invented by Abraham-Louis Breguet in 1801; houses the balance wheel and escapement inside a continuously rotating cage (1 revolution per minute) to counteract gravity.",
    vphExplanation: "Micro-engineered cage composed of over 70 ultra-lightweight components weighing less than half a gram.",
    powerReserveNote: "Pinnacle of haute horlogerie mechanical complexity.",
    keyBenefits: ["Gravitational error cancellation", "Hypnotic visual mechanical animation", "Exceptional prestige and artisan craftsmanship"],
  },
  Quartz: {
    type: "Quartz",
    label: "Precision Quartz Oscillator",
    iconSymbol: "🔋",
    badgeBg: "bg-slate-500/15",
    badgeText: "text-slate-300",
    badgeBorder: "border-slate-500/40",
    mechanics: "Battery-powered electronic circuit vibrating a synthetic quartz tuning fork at 32,768 Hz to drive an electric stepping motor.",
    vphExplanation: "Steps exactly once per second (1 Hz) for instantaneous second counting.",
    powerReserveNote: "Battery lifespan typically 2–5 years.",
    keyBenefits: ["Extreme accuracy (±15 sec/month)", "Shock resistance and grab-and-go reliability", "Low maintenance"],
  },
};
