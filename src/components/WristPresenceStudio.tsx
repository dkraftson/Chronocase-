import React, { useState, useMemo } from "react";
import { Watch, StrapType } from "../types";
import { WatchRenderer } from "./WatchRenderer";
import {
  Sparkles,
  Sliders,
  Shield,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  Shirt,
  Info,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";

interface WristPresenceStudioProps {
  watch: Watch;
  customStrap?: StrapType;
  onClose?: () => void;
}

type SkinToneId = "fair" | "warm_sand" | "bronze" | "olive" | "espresso";
type SleeveTypeId = "dress_shirt" | "navy_suit" | "leather_jacket" | "knit_sweater" | "scuba_suit" | "bare";

interface SkinToneConfig {
  id: SkinToneId;
  label: string;
  baseColor: string;
  shadowColor: string;
  highlightColor: string;
}

interface SleeveConfig {
  id: SleeveTypeId;
  label: string;
  category: "formal" | "casual" | "rugged" | "sport" | "none";
  color: string;
  cuffColor: string;
  texturePattern?: string;
}

const SKIN_TONES: SkinToneConfig[] = [
  {
    id: "fair",
    label: "Porcelain / Fair",
    baseColor: "#fed7aa",
    shadowColor: "#fba074",
    highlightColor: "#fff7ed",
  },
  {
    id: "warm_sand",
    label: "Warm Sand / Beige",
    baseColor: "#e0b088",
    shadowColor: "#b87c52",
    highlightColor: "#faebd7",
  },
  {
    id: "bronze",
    label: "Sunlit Bronze",
    baseColor: "#c28859",
    shadowColor: "#8e5730",
    highlightColor: "#e6b790",
  },
  {
    id: "olive",
    label: "Mediterranean Olive",
    baseColor: "#9c6d48",
    shadowColor: "#6c4528",
    highlightColor: "#c6966f",
  },
  {
    id: "espresso",
    label: "Deep Espresso",
    baseColor: "#4f311c",
    shadowColor: "#2e1a0d",
    highlightColor: "#754b2d",
  },
];

const SLEEVE_OPTIONS: SleeveConfig[] = [
  {
    id: "dress_shirt",
    label: "Crisp White Dress Shirt",
    category: "formal",
    color: "#f8fafc",
    cuffColor: "#e2e8f0",
  },
  {
    id: "navy_suit",
    label: "Bespoke Navy Wool Suit",
    category: "formal",
    color: "#0f172a",
    cuffColor: "#1e293b",
  },
  {
    id: "leather_jacket",
    label: "Vintage Aviator Leather",
    category: "rugged",
    color: "#38220f",
    cuffColor: "#231408",
  },
  {
    id: "knit_sweater",
    label: "Charcoal Cashmere Knit",
    category: "casual",
    color: "#27272a",
    cuffColor: "#3f3f46",
  },
  {
    id: "scuba_suit",
    label: "Neoprene Dive Wetsuit",
    category: "sport",
    color: "#09090b",
    cuffColor: "#ea580c",
  },
  {
    id: "bare",
    label: "Bare Forearm",
    category: "none",
    color: "transparent",
    cuffColor: "transparent",
  },
];

export const WristPresenceStudio: React.FC<WristPresenceStudioProps> = ({
  watch,
  customStrap,
  onClose,
}) => {
  // Wrist Circumference in Inches (e.g. 6.0" to 8.25")
  const [wristSizeInches, setWristSizeInches] = useState<number>(7.0);
  const [selectedSkinTone, setSelectedSkinTone] = useState<SkinToneId>("warm_sand");
  const [selectedSleeve, setSelectedSleeve] = useState<SleeveTypeId>("dress_shirt");
  const [cuffPulledBack, setCuffPulledBack] = useState<boolean>(false);

  const skin = useMemo(
    () => SKIN_TONES.find((s) => s.id === selectedSkinTone) || SKIN_TONES[1],
    [selectedSkinTone]
  );

  const sleeve = useMemo(
    () => SLEEVE_OPTIONS.find((s) => s.id === selectedSleeve) || SLEEVE_OPTIONS[0],
    [selectedSleeve]
  );

  // Horological Ergonomics & Overhang Physics Calculations:
  // - Human wrist flat top width is roughly 0.31 * wrist circumference in mm (1 inch = 25.4mm)
  // - e.g. 7.0" wrist = 177.8mm circumference -> flat top span ≈ 55.1mm
  const wristCircumferenceMm = wristSizeInches * 25.4;
  const flatWristTopSpanMm = wristCircumferenceMm * 0.31;
  const watchDiameter = watch.caseDiameter || 40;
  // Estimate lug-to-lug if not explicitly provided (typically ~1.20 - 1.25x diameter)
  const lugToLugMm = watch.lugToLug || Math.round(watchDiameter * 1.21);
  const thicknessMm = watch.caseThickness || 12.0;

  // Lug Coverage Ratio: L2L / Flat Wrist Span
  const lugCoverageRatio = lugToLugMm / flatWristTopSpanMm;
  const coveragePercent = Math.round(lugCoverageRatio * 100);

  // Ergonomic Assessment
  const ergoVerdict = useMemo(() => {
    if (lugCoverageRatio <= 0.72) {
      return {
        level: "understated",
        title: "Vintage / Classic Compact Presence",
        desc: `Ample flat wrist surface margin (${(flatWristTopSpanMm - lugToLugMm).toFixed(1)}mm clearance). Slides effortlessly under any tailored shirt cuff.`,
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        icon: CheckCircle2,
      };
    } else if (lugCoverageRatio <= 0.90) {
      return {
        level: "ideal",
        title: "Golden Ratio Horological Fit",
        desc: `The quintessential contemporary stance. Lugs curve gracefully within your wrist contours with zero overhang.`,
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        icon: Sparkles,
      };
    } else if (lugCoverageRatio <= 1.0) {
      return {
        level: "bold",
        title: "Bold Commanding Presence",
        desc: `Fills the entire flat span of your wrist. Dramatic wrist presence with modern tool-watch authority.`,
        badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500/40",
        icon: Info,
      };
    } else {
      return {
        level: "overhang",
        title: "Pronounced Lug Overhang",
        desc: `Lug-to-lug (${lugToLugMm}mm) extends beyond the flat top of a ${wristSizeInches}" wrist (${flatWristTopSpanMm.toFixed(1)}mm). May float slightly on the edges.`,
        badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        icon: AlertTriangle,
      };
    }
  }, [lugCoverageRatio, flatWristTopSpanMm, lugToLugMm, wristSizeInches]);

  // Visual scaling factor:
  // Base 7" wrist = 1.0. Larger wrist makes the watch appear proportionally more compact, smaller wrist makes watch appear larger!
  const visualWristWidthPx = 180 * (wristSizeInches / 7.0);

  return (
    <div
      id="wrist-presence-studio"
      className="flex flex-col xl:flex-row gap-6 w-full p-2 sm:p-4 text-neutral-200"
    >
      {/* LEFT COLUMN: Real-Time Interactive On-Wrist Canvas */}
      <div className="w-full xl:w-7/12 flex flex-col items-center justify-between p-6 rounded-3xl bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-black border border-neutral-800 shadow-2xl relative overflow-hidden">
        {/* Top Floating Info Tag */}
        <div className="w-full flex items-center justify-between mb-4 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
              On-Wrist Simulator
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
              {wristSizeInches.toFixed(2)}" ({wristCircumferenceMm.toFixed(0)}mm) Wrist
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setCuffPulledBack((prev) => !prev);
              horologyAudio.playCrownClick();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-amber-300 border border-amber-500/30 transition-all"
          >
            <Shirt size={13} />
            <span>{cuffPulledBack ? "Cuff: Over Watch" : "Cuff: Peeking"}</span>
          </button>
        </div>

        {/* Realistic SVG Wrist Canvas */}
        <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[440px] flex items-center justify-center overflow-hidden rounded-2xl bg-neutral-950/60 border border-neutral-800/60 shadow-inner">
          {/* Ambient Lighting Beam */}
          <div className="absolute inset-0 bg-radial-at-center from-amber-500/5 via-transparent to-transparent pointer-events-none" />

          {/* SVG Anatomical Forearm & Wrist Model */}
          <svg
            className="w-full h-full max-h-[420px]"
            viewBox="0 0 400 480"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Skin Tone Realistic Volumetric Cylindrical Gradient */}
              <linearGradient id="wrist-skin-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={skin.shadowColor} />
                <stop offset="25%" stopColor={skin.baseColor} />
                <stop offset="55%" stopColor={skin.highlightColor} stopOpacity="0.95" />
                <stop offset="80%" stopColor={skin.baseColor} />
                <stop offset="100%" stopColor={skin.shadowColor} />
              </linearGradient>

              {/* Forearm Muscle Subsurface Shadow */}
              <radialGradient id="wrist-depth-shadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* Fabric Weave Pattern for Suit / Knit */}
              <pattern id="sleeve-fabric-pat" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill={sleeve.color} />
                <line x1="0" y1="0" x2="6" y2="6" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
                <line x1="6" y1="0" x2="0" y2="6" stroke="#ffffff" strokeWidth="0.3" opacity="0.1" />
              </pattern>
            </defs>

            {/* 1. Forearm Body (Anatomical taper from forearm down to wrist) */}
            <path
              d={`M ${200 - visualWristWidthPx * 0.65} 0
                  C ${200 - visualWristWidthPx * 0.60} 140, ${200 - visualWristWidthPx * 0.52} 240, ${200 - visualWristWidthPx * 0.50} 320
                  C ${200 - visualWristWidthPx * 0.48} 380, ${200 - visualWristWidthPx * 0.54} 440, ${200 - visualWristWidthPx * 0.56} 480
                  L ${200 + visualWristWidthPx * 0.56} 480
                  C ${200 + visualWristWidthPx * 0.54} 440, ${200 + visualWristWidthPx * 0.48} 380, ${200 + visualWristWidthPx * 0.50} 320
                  C ${200 + visualWristWidthPx * 0.52} 240, ${200 + visualWristWidthPx * 0.60} 140, ${200 + visualWristWidthPx * 0.65} 0 Z`}
              fill="url(#wrist-skin-grad)"
            />

            {/* Ulnar Head Wrist Bone Contour Highlight (right edge) */}
            <path
              d={`M ${200 + visualWristWidthPx * 0.49} 220
                  Q ${200 + visualWristWidthPx * 0.53} 240, ${200 + visualWristWidthPx * 0.49} 260`}
              stroke={skin.highlightColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.6"
            />

            {/* 2. Top Apparel Sleeve / Cuff */}
            {selectedSleeve !== "bare" && (
              <g id="apparel-sleeve">
                {/* Main Sleeve Tube */}
                <path
                  d={`M ${200 - visualWristWidthPx * 0.75} 0
                      L ${200 + visualWristWidthPx * 0.75} 0
                      L ${200 + visualWristWidthPx * 0.62} ${cuffPulledBack ? 90 : 160}
                      Q 200 ${cuffPulledBack ? 100 : 175} ${200 - visualWristWidthPx * 0.62} ${cuffPulledBack ? 90 : 160} Z`}
                  fill={selectedSleeve === "navy_suit" || selectedSleeve === "knit_sweater" ? "url(#sleeve-fabric-pat)" : sleeve.color}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />

                {/* Sleeve Fold Crease & Shadow */}
                <path
                  d={`M ${200 - visualWristWidthPx * 0.60} ${cuffPulledBack ? 75 : 145}
                      Q 200 ${cuffPulledBack ? 88 : 160} ${200 + visualWristWidthPx * 0.60} ${cuffPulledBack ? 75 : 145}`}
                  fill="none"
                  stroke="#000000"
                  strokeWidth="3"
                  opacity="0.4"
                />

                {/* Stitched Hem / Cuff Band */}
                <path
                  d={`M ${200 - visualWristWidthPx * 0.62} ${cuffPulledBack ? 90 : 160}
                      Q 200 ${cuffPulledBack ? 100 : 175} ${200 + visualWristWidthPx * 0.62} ${cuffPulledBack ? 90 : 160}
                      L ${200 + visualWristWidthPx * 0.61} ${cuffPulledBack ? 96 : 168}
                      Q 200 ${cuffPulledBack ? 106 : 183} ${200 - visualWristWidthPx * 0.61} ${cuffPulledBack ? 96 : 168} Z`}
                  fill={sleeve.cuffColor}
                  stroke="#000000"
                  strokeWidth="0.8"
                />

                {/* Shirt Cufflink / Horn Button (if suit) */}
                {selectedSleeve === "navy_suit" && (
                  <circle
                    cx={200 + visualWristWidthPx * 0.50}
                    cy={cuffPulledBack ? 78 : 148}
                    r="4"
                    fill="#ca8a04"
                    stroke="#1c1917"
                    strokeWidth="1"
                  />
                )}
              </g>
            )}

            {/* 3. Watch Case Shadow Projected on Flesh */}
            <ellipse
              cx="200"
              cy="255"
              rx={visualWristWidthPx * 0.42}
              ry="45"
              fill="url(#wrist-depth-shadow)"
            />
          </svg>

          {/* Centered Live Watch Component Sitting On Wrist */}
          <div
            className="absolute z-20 flex items-center justify-center pointer-events-none transition-transform duration-300"
            style={{
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -48%) scale(${Math.max(0.72, Math.min(1.15, (40 / watchDiameter) * (7.0 / wristSizeInches) * 0.95))})`,
            }}
          >
            <WatchRenderer
              watch={watch}
              size="large"
              customStrap={customStrap || watch.renderingConfig.strapType}
              interactiveTilt={false}
            />
          </div>
        </div>

        {/* Bottom Quick Switcher */}
        <div className="w-full flex items-center justify-between text-xs text-neutral-400 mt-4 pt-3 border-t border-neutral-800/80">
          <div className="flex items-center gap-1.5">
            <Compass size={13} className="text-amber-400" />
            <span>Ergonomic Lug-to-Lug: <strong className="text-neutral-100 font-mono">{lugToLugMm}mm</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-amber-400" />
            <span>Case Thickness: <strong className="text-neutral-100 font-mono">{thicknessMm}mm</strong></span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Wrist Ergonomics Controls & Fit Diagnostics */}
      <div className="w-full xl:w-5/12 flex flex-col justify-between space-y-6">
        {/* 1. Wrist Circumference Slider */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <Sliders size={13} />
              <span>Your Wrist Circumference</span>
            </span>
            <span className="text-sm font-bold font-mono text-neutral-100 bg-neutral-800 px-3 py-1 rounded-xl border border-neutral-700">
              {wristSizeInches.toFixed(2)}" / {wristCircumferenceMm.toFixed(0)} mm
            </span>
          </div>

          <input
            type="range"
            min="5.75"
            max="8.25"
            step="0.125"
            value={wristSizeInches}
            onChange={(e) => setWristSizeInches(parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
            <span>5.75" (14.6cm)</span>
            <span>6.5" (16.5cm)</span>
            <span>7.0" (17.8cm)</span>
            <span>7.5" (19.0cm)</span>
            <span>8.25" (21.0cm)</span>
          </div>
        </div>

        {/* 2. Skin Tone & Complexion Selector */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-lg space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono block">
            Skin Tone & Undertone:
          </span>
          <div className="grid grid-cols-5 gap-2">
            {SKIN_TONES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedSkinTone(st.id);
                  horologyAudio.playCrownClick();
                }}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                  selectedSkinTone === st.id
                    ? "bg-neutral-800 border-amber-400 ring-2 ring-amber-400/30 scale-105"
                    : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 opacity-80 hover:opacity-100"
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full border border-black/40 shadow-sm"
                  style={{ backgroundColor: st.baseColor }}
                />
                <span className="text-[9px] font-medium text-neutral-300 text-center leading-tight truncate w-full">
                  {st.label.split("/")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Apparel & Sleeve Context */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-lg space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 font-mono block">
            Occasion & Sleeve Context:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {SLEEVE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelectedSleeve(opt.id);
                  horologyAudio.playCrownClick();
                }}
                className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                  selectedSleeve === opt.id
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                }`}
              >
                <div className="text-[11px] truncate">{opt.label}</div>
                <div className="text-[9px] text-neutral-400 uppercase tracking-wider mt-0.5">
                  {opt.category}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Golden Ratio Ergonomics Verdict Card */}
        <div className={`p-5 rounded-2xl border shadow-xl ${ergoVerdict.badgeClass}`}>
          <div className="flex items-center gap-2 mb-2">
            <ergoVerdict.icon size={18} className="shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest font-mono block">
                Lug-to-Lug Ergonomics Ratio ({coveragePercent}%)
              </span>
              <h4 className="text-sm font-bold text-neutral-100">{ergoVerdict.title}</h4>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-neutral-200 mt-1">
            {ergoVerdict.desc}
          </p>

          <div className="mt-3 pt-3 border-t border-neutral-700/50 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-neutral-400 block text-[10px]">Flat Wrist Top:</span>
              <span className="text-neutral-200 font-bold">{flatWristTopSpanMm.toFixed(1)} mm</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px]">Watch Lug-to-Lug:</span>
              <span className="text-neutral-200 font-bold">{lugToLugMm} mm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
