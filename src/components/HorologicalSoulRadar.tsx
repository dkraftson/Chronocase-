import React, { useState } from "react";
import { Watch } from "../types";
import {
  Heart,
  Calendar,
  Sparkles,
  Award,
  Flame,
  Shield,
  Compass,
  Zap,
  Activity,
  Plus,
  BookOpen,
  Check,
  Star,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";

interface HorologicalSoulRadarProps {
  watch: Watch;
  onUpdateWatch: (updated: Watch) => void;
}

// Compute 6 dynamic horological soul dimensions based on watch specs and category:
// 1. Mechanical Soul (frequency, power reserve, jewels, complications)
// 2. Heritage & Legacy (historical depth, brand legacy, provenance)
// 3. Tool Resilience (water resistance, case finish, sapphire, bezel)
// 4. Wrist Drama & Aura (case finish, dial pattern, skeletonization, size)
// 5. Daily Versatility (strap comfort, category, diameter)
// 6. Collector Sentiment (user bond rating, wear time, custom story)
export const HorologicalSoulRadar: React.FC<HorologicalSoulRadarProps> = ({
  watch,
  onUpdateWatch,
}) => {
  const [emotionalRating, setEmotionalRating] = useState<number>(
    watch.emotionalBondRating || 5
  );
  const [sentimentalOccasion, setSentimentalOccasion] = useState<string>(
    watch.sentimentalOccasion || "Milestone Milestone"
  );
  const [acquisitionStory, setAcquisitionStory] = useState<string>(
    watch.acquisitionStory || ""
  );
  const [daysWorn, setDaysWorn] = useState<number>(watch.daysWornCount || 14);
  const [isSaved, setIsSaved] = useState(false);

  // Compute Personality Archetype
  const archetype = React.useMemo(() => {
    if (watch.personalityArchetype) return watch.personalityArchetype;

    const cat = watch.category;
    const isSkeleton =
      watch.renderingConfig.dialPattern === "skeleton" ||
      watch.renderingConfig.dialPattern === "open_heart" ||
      watch.renderingConfig.hasOpenHeartOrTourbillon;

    if (isSkeleton) return "The Haute Horlogerie Squelette";
    if (cat === "Diver") return "The Stoic Ocean Depths Commander";
    if (cat === "Chronograph" || cat === "Racing") return "The High-Beat Speedster";
    if (cat === "Dress" || cat === "Tank / Rectangular") return "The Timeless Cosmopolitan Diplomat";
    if (cat === "Pilot") return "The Stratospheric Navigator";
    if (cat === "Grand Complication" || cat === "Moonphase") return "The Astronomical Grand Maestro";
    if (cat === "Integrated") return "The Avant-Garde Sculptor";
    if (cat === "Field") return "The Indomitable Expedition Pioneer";
    if (cat === "Minimalist" || cat === "Minimalist / Bauhaus") return "The Bauhaus Purist";
    return "The Mechanical Stalwart";
  }, [watch]);

  // Dynamic Soul Scores (0 - 100)
  const scores = React.useMemo(() => {
    // 1. Mechanical Soul
    const freq = watch.movement.frequencyVph || 28800;
    const hasComplications = (watch.renderingConfig.subdials?.length || 0) > 0;
    const mechBase = freq >= 36000 ? 98 : freq >= 28800 ? 90 : 80;
    const mechanicalScore = Math.min(100, mechBase + (hasComplications ? 8 : 0));

    // 2. Heritage & Legacy
    const isHistoric = !!watch.facts.historicalSignificance;
    const heritageScore = isHistoric ? 96 : 86;

    // 3. Tool Resilience
    const wr = parseInt(watch.waterResistance || "100", 10) || 100;
    const toolScore = wr >= 300 ? 98 : wr >= 200 ? 92 : wr >= 100 ? 84 : 70;

    // 4. Wrist Drama & Aura
    const isGold = watch.renderingConfig.caseFinish.includes("gold");
    const isSkeleton = watch.renderingConfig.dialPattern === "skeleton";
    const dramaScore = isSkeleton ? 98 : isGold ? 94 : 85;

    // 5. Daily Versatility
    const diam = watch.caseDiameter;
    const versScore = diam >= 38 && diam <= 41 ? 95 : 82;

    // 6. Sentimental Bond
    const sentimentalScore = emotionalRating * 20;

    return [
      { label: "Mechanical Heart", val: mechanicalScore, icon: Zap },
      { label: "Heritage & Soul", val: heritageScore, icon: BookOpen },
      { label: "Tool Resilience", val: toolScore, icon: Shield },
      { label: "Wrist Drama", val: dramaScore, icon: Sparkles },
      { label: "Daily Versatility", val: versScore, icon: Compass },
      { label: "Emotional Bond", val: sentimentalScore, icon: Heart },
    ];
  }, [watch, emotionalRating]);

  // Generate SVG Hexagon Polygon coordinates
  const radius = 100;
  const center = 130;
  const polygonPoints = scores
    .map((s, i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      const r = (s.val / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const handleSaveSentiment = () => {
    onUpdateWatch({
      ...watch,
      emotionalBondRating: emotionalRating,
      sentimentalOccasion,
      acquisitionStory,
      daysWornCount: daysWorn,
      personalityArchetype: archetype,
    });
    horologyAudio.playCrownClick();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleQuickAddDay = () => {
    const nextDays = daysWorn + 1;
    setDaysWorn(nextDays);
    onUpdateWatch({
      ...watch,
      daysWornCount: nextDays,
      lastWornDate: new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });
    horologyAudio.playMechanicalTick("tick", 1.2);
  };

  return (
    <div id="horological-soul-radar" className="space-y-6 text-neutral-200">
      {/* 1. Personality Archetype Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-amber-950/30 border border-amber-500/40 shadow-xl flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
            <Sparkles size={13} className="text-amber-400" />
            <span>Horological Personality Archetype</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-neutral-100">{archetype}</h3>
          <p className="text-xs text-neutral-300 italic">
            "{watch.facts.tagline || watch.facts.storyBlurb || 'A timepiece of unmistakable character, presence, and mechanical ingenuity.'}"
          </p>
        </div>

        <div className="hidden sm:flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-950/80 border border-amber-500/30 shrink-0">
          <Flame size={24} className="text-amber-400 animate-pulse" />
          <span className="text-[10px] uppercase font-bold text-amber-300 font-mono mt-1">
            Soul Index: 94/100
          </span>
        </div>
      </div>

      {/* 2. Visual Soul Radar & Attribute Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: SVG Hexagonal Radar Chart */}
        <div className="lg:col-span-6 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-lg flex flex-col items-center justify-center">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono mb-2">
            6-Dimensional Horological Radar
          </span>

          <svg viewBox="0 0 260 260" className="w-full max-w-[240px] h-auto overflow-visible">
            {/* Concentric Hexagon Grid Lines */}
            {gridLevels.map((lvl, idx) => {
              const pts = Array.from({ length: 6 })
                .map((_, i) => {
                  const angle = (i * 60 - 90) * (Math.PI / 180);
                  const r = lvl * radius;
                  return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                })
                .join(" ");
              return (
                <polygon
                  key={idx}
                  points={pts}
                  fill={idx === 3 ? "#09090b" : "none"}
                  stroke="#27272a"
                  strokeWidth="0.8"
                />
              );
            })}

            {/* Radial Spokes */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60 - 90) * (Math.PI / 180);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={center + radius * Math.cos(angle)}
                  y2={center + radius * Math.sin(angle)}
                  stroke="#3f3f46"
                  strokeWidth="0.8"
                  strokeDasharray="2,2"
                />
              );
            })}

            {/* Filled Polygon Web */}
            <polygon
              points={polygonPoints}
              fill="rgba(245, 158, 11, 0.25)"
              stroke="#f59e0b"
              strokeWidth="2"
              className="transition-all duration-700"
            />

            {/* Vertices Points */}
            {scores.map((s, i) => {
              const angle = (i * 60 - 90) * (Math.PI / 180);
              const r = (s.val / 100) * radius;
              const x = center + r * Math.cos(angle);
              const y = center + r * Math.sin(angle);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
                </g>
              );
            })}
          </svg>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-mono mt-3 w-full">
            {scores.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1">
                  <s.icon size={11} className="text-amber-400" />
                  <span>{s.label}</span>
                </span>
                <span className="font-bold text-amber-400">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sentimental Provenance & Wear Diary */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <Heart size={13} className="text-rose-400" />
                <span>Emotional Bond & Sentiment</span>
              </span>
              {/* Star / Heart Rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setEmotionalRating(num);
                      horologyAudio.playCrownClick();
                    }}
                    className={`p-0.5 transition-transform hover:scale-125 ${
                      num <= emotionalRating ? "text-rose-500" : "text-neutral-700"
                    }`}
                  >
                    <Heart size={16} fill={num <= emotionalRating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            {/* Milestone Occasion */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                Sentimental Milestone / Occasion:
              </label>
              <select
                value={sentimentalOccasion}
                onChange={(e) => setSentimentalOccasion(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="Milestone Milestone">Milestone Milestone / Personal Triumph</option>
                <option value="College Graduation">College / University Graduation</option>
                <option value="Wedding / Union">Wedding Day / Marriage Gift</option>
                <option value="Father Heirloom">Father / Ancestral Family Heirloom</option>
                <option value="First Mechanical Watch">First Mechanical Horological Acquisition</option>
                <option value="Grail Quest Fulfilled">Lifelong Grail Watch Quest</option>
                <option value="Career Promotion">Major Career Promotion / Business Launch</option>
                <option value="Special Birthday">Decade Milestone Birthday (30th, 40th, 50th)</option>
              </select>
            </div>

            {/* Personal Acquisition Story */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                The Story Behind Why This Watch Matters To You:
              </label>
              <textarea
                rows={2}
                value={acquisitionStory}
                onChange={(e) => setAcquisitionStory(e.target.value)}
                placeholder="e.g. Bought after closing my first venture fund. The sweeping second hand reminds me to stay patient and steady."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Wear Tracker & Quick +1 Day Action */}
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                <span className="block text-lg font-bold font-mono text-amber-400 leading-tight">
                  {daysWorn}
                </span>
                <span className="text-[9px] text-neutral-400 uppercase tracking-wider font-mono">
                  Days Worn
                </span>
              </div>

              <div>
                <span className="text-[11px] text-neutral-300 block font-medium">
                  {watch.lastWornDate ? `Last worn: ${watch.lastWornDate}` : "Active Rotation"}
                </span>
                <span className="text-[10px] text-neutral-400">
                  Builds provenance and wrist companionship
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleQuickAddDay}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-all hover:scale-105"
                title="Log +1 Day on Wrist"
              >
                <Plus size={13} className="text-amber-400" />
                <span>Wore Today</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSentiment}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  isSaved
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-500 hover:bg-amber-400 text-neutral-950"
                }`}
              >
                {isSaved ? <Check size={13} /> : <Heart size={13} />}
                <span>{isSaved ? "Saved" : "Save Soul"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
