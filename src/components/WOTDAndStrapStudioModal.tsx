import React, { useState, useMemo } from "react";
import { Watch, StrapType } from "../types";
import { WatchRenderer } from "./WatchRenderer";
import {
  X,
  Compass,
  Sparkles,
  Sun,
  CloudRain,
  Snowflake,
  Waves,
  Briefcase,
  Shirt,
  Plane,
  Utensils,
  Award,
  Check,
  RotateCw,
  Sliders,
  Layers,
  Heart,
  Zap,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";

interface WOTDAndStrapStudioModalProps {
  watches: Watch[];
  onClose: () => void;
  onSelectWatch?: (watch: Watch) => void;
  onSelectWatchForInspection?: (watch: Watch) => void;
  onUpdateWatch: (updated: Watch) => void;
}

type WeatherCondition = "sunny" | "rainy" | "snow" | "tropical";
type OccasionType = "boardroom" | "casual" | "formal" | "dive_sports" | "travel" | "dinner";

const STRAP_FAMILIES: {
  id: StrapType;
  label: string;
  category: "leather" | "steel" | "rubber" | "fabric" | "exotic";
  desc: string;
}[] = [
  {
    id: "leather_distressed",
    label: "Vintage Horween Calfskin",
    category: "leather",
    desc: "Aged pull-up patina with hand-stitched minimal side stitches.",
  },
  {
    id: "leather_alligator",
    label: "Semi-Matte Louisiana Alligator",
    category: "exotic",
    desc: "Large square scales with bespoke feathered edges for black-tie elegance.",
  },
  {
    id: "leather_suede",
    label: "Tuscan Camel Suede",
    category: "leather",
    desc: "Soft velvety suede with casual warmth and effortless versatility.",
  },
  {
    id: "steel_oyster",
    label: "Three-Link Brushed Oyster",
    category: "steel",
    desc: "The quintessential tool-watch architecture with brushed flat links.",
  },
  {
    id: "steel_jubilee",
    label: "Five-Link D-Shape Jubilee",
    category: "steel",
    desc: "Polished center facets capturing light with extraordinary wrist drape.",
  },
  {
    id: "milanese_mesh",
    label: "Milanese Shark Mesh",
    category: "steel",
    desc: "Dense woven steel mesh honoring 1960s skin-diver heritage.",
  },
  {
    id: "nato_bond",
    label: "Original Bond NATO (Black/Olive/Crimson)",
    category: "fabric",
    desc: "Military ballistic nylon with dual-pass springbar security.",
  },
  {
    id: "tropic_rubber",
    label: "Waffle Tropic FKM Diver Rubber",
    category: "rubber",
    desc: "Perforated cross-hatch vulcanized rubber impervious to saltwater and UV.",
  },
  {
    id: "rubber_orange",
    label: "High-Visibility Safety Orange FKM",
    category: "rubber",
    desc: "Vibrant sport silicone for oceanic exploration and high legibility.",
  },
  {
    id: "fabric_canvas",
    label: "Tactical Cordura Canvas",
    category: "fabric",
    desc: "Hydrophobic water-resistant sailcloth canvas with contrast stitching.",
  },
  {
    id: "titanium_oyster",
    label: "Grade 5 Satin Titanium",
    category: "steel",
    desc: "Featherweight hypoallergenic alloy with warm gunmetal hue.",
  },
  {
    id: "nato_fabric",
    label: "Braided NATO Fabric Weave",
    category: "fabric",
    desc: "Micro-adjustable breathable weave ideal for summer heat.",
  },
];

export const WOTDAndStrapStudioModal: React.FC<WOTDAndStrapStudioModalProps> = ({
  watches = [],
  onClose,
  onSelectWatch,
  onSelectWatchForInspection,
  onUpdateWatch,
}) => {
  const [activeTab, setActiveTab] = useState<"wotd" | "strap_studio">("wotd");

  // WOTD State
  const [selectedWeather, setSelectedWeather] = useState<WeatherCondition>("sunny");
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionType>("casual");

  // Strap Monster State
  const [targetWatchId, setTargetWatchId] = useState<string>(watches[0]?.id || "");
  const [selectedStrap, setSelectedStrap] = useState<StrapType>(
    watches[0]?.renderingConfig?.strapType || "steel_oyster"
  );
  const [isSavedToast, setIsSavedToast] = useState(false);

  const activeTargetWatch = useMemo(
    () => watches.find((w) => w.id === targetWatchId) || watches[0] || null,
    [watches, targetWatchId]
  );

  const handleInspect = (w: Watch) => {
    if (onSelectWatch) {
      onSelectWatch(w);
    } else if (onSelectWatchForInspection) {
      onSelectWatchForInspection(w);
    }
    onClose();
  };

  // WOTD Recommendation Algorithm
  const recommendations = useMemo(() => {
    if (!watches || watches.length === 0) return [];

    return watches
      .map((w) => {
        let score = 50;
        const reasons: string[] = [];

        const wr = parseInt(w.waterResistance || "50", 10) || 50;
        const cat = w.category || "Dress";
        const strap = (w.renderingConfig?.strapType || "").toLowerCase();

        // Occasion weights
        if (selectedOccasion === "formal" || selectedOccasion === "dinner") {
          if (cat === "Dress" || cat === "Tank / Rectangular" || cat === "Minimalist") {
            score += 40;
            reasons.push("Understated profile slips effortlessly under tailored cuffs.");
          }
          if (strap.includes("alligator") || strap.includes("leather")) {
            score += 20;
            reasons.push("Classic leather pairing coordinates with formal footwear.");
          }
        } else if (selectedOccasion === "boardroom") {
          if (cat === "Integrated" || cat === "Chronograph" || cat === "Dress") {
            score += 35;
            reasons.push("Commanding executive presence with horological credibility.");
          }
          if (strap.includes("steel") || strap.includes("jubilee") || strap.includes("oyster")) {
            score += 20;
            reasons.push("Polished bracelet adds crisp structure to business attire.");
          }
        } else if (selectedOccasion === "dive_sports") {
          if (cat === "Diver" || wr >= 200) {
            score += 50;
            reasons.push(`Robust ${w.waterResistance || "200m"} water resistance for aquatic durability.`);
          }
          if (strap.includes("rubber") || strap.includes("nato")) {
            score += 25;
            reasons.push("Hydrophobic strap impervious to perspiration and saltwater.");
          }
        } else if (selectedOccasion === "travel") {
          if (cat === "GMT / Travel" || cat === "GMT/Travel" || cat === "Pilot" || cat === "Chronograph") {
            score += 45;
            reasons.push("Dual-timezone tracking and high legibility for transit.");
          }
        } else {
          // Casual
          if (cat === "Field" || cat === "Chronograph" || cat === "Integrated") {
            score += 35;
            reasons.push("Effortless daily versatility for casual comfort.");
          }
        }

        // Weather weights
        if (selectedWeather === "rainy" || selectedWeather === "tropical") {
          if (wr >= 100) {
            score += 15;
            reasons.push("Sealed screw-down gaskets protect against high humidity.");
          }
          if (strap.includes("leather") && !strap.includes("rubber")) {
            score -= 20;
          }
        } else if (selectedWeather === "snow") {
          if (strap.includes("leather") || strap.includes("suede")) {
            score += 15;
            reasons.push("Warm leather maintains wrist comfort in cold climates.");
          }
        }

        // Favor watches worn fewer times recently
        const daysWorn = w.daysWornCount || 0;
        if (daysWorn < 10) {
          score += 10;
          reasons.push("Due for rotation time in the collection.");
        }

        return {
          watch: w,
          score,
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [watches, selectedWeather, selectedOccasion]);

  const handleWearToday = (watch: Watch) => {
    const updated: Watch = {
      ...watch,
      daysWornCount: (watch.daysWornCount || 0) + 1,
      lastWornDate: new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    onUpdateWatch(updated);
    horologyAudio.playCrownClick();
  };

  const handleSaveStrap = () => {
    if (!activeTargetWatch) return;
    const updated: Watch = {
      ...activeTargetWatch,
      renderingConfig: {
        ...activeTargetWatch.renderingConfig,
        strapType: selectedStrap,
      },
    };
    onUpdateWatch(updated);
    horologyAudio.playCrownClick();
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  return (
    <div
      id="wotd-strap-studio-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border border-amber-500/30 shadow-2xl overflow-hidden text-neutral-200">
        {/* Header Tabs */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="tab-wotd-btn"
              onClick={() => {
                setActiveTab("wotd");
                horologyAudio.playCrownClick();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all ${
                activeTab === "wotd"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-neutral-200 bg-neutral-900"
              }`}
            >
              <Compass size={15} />
              <span>Watch of the Day (WOTD)</span>
            </button>

            <button
              type="button"
              id="tab-strap-monster-btn"
              onClick={() => {
                setActiveTab("strap_studio");
                horologyAudio.playCrownClick();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all ${
                activeTab === "strap_studio"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-neutral-200 bg-neutral-900"
              }`}
            >
              <Layers size={15} />
              <span>Strap Monster Studio</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              horologyAudio.playCaseLid();
              onClose();
            }}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: WATCH OF THE DAY ADVISOR */}
          {activeTab === "wotd" && (
            <div className="space-y-6">
              {/* Context Selector Benches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weather */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono block">
                    Today's Weather & Atmosphere:
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {(
                      [
                        { id: "sunny", label: "Sunny", icon: Sun },
                        { id: "rainy", label: "Rainy", icon: CloudRain },
                        { id: "snow", label: "Cold/Snow", icon: Snowflake },
                        { id: "tropical", label: "Humid Coast", icon: Waves },
                      ] as const
                    ).map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          setSelectedWeather(w.id);
                          horologyAudio.playCrownClick();
                        }}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all ${
                          selectedWeather === w.id
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        <w.icon size={16} />
                        <span className="text-[10px]">{w.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Occasion */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono block">
                    Today's Attire & Occasion:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
                    {(
                      [
                        { id: "casual", label: "Casual", icon: Shirt },
                        { id: "boardroom", label: "Executive", icon: Briefcase },
                        { id: "formal", label: "Black Tie", icon: Award },
                        { id: "dinner", label: "Fine Dining", icon: Utensils },
                        { id: "dive_sports", label: "Sport/Swim", icon: Waves },
                        { id: "travel", label: "Aviation", icon: Plane },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setSelectedOccasion(o.id);
                          horologyAudio.playCrownClick();
                        }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                          selectedOccasion === o.id
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        <o.icon size={14} />
                        <span className="text-[9px] truncate w-full">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations Cards */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-200 font-mono">
                    Top 3 Curated Timepiece Recommendations
                  </h3>
                </div>

                {recommendations.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-neutral-950/80 border border-neutral-800 text-center space-y-3">
                    <Sparkles size={28} className="text-amber-400/60 mx-auto" />
                    <h4 className="text-sm font-bold text-neutral-200">No Timepieces in Vitrine</h4>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      Add timepieces to your vitrine to receive weather, occasion, and horological rotation recommendations.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendations.map((rec, idx) => (
                      <div
                        key={rec.watch.id}
                        className={`relative flex flex-col justify-between p-5 rounded-3xl bg-neutral-950 border transition-all shadow-xl ${
                          idx === 0
                            ? "border-amber-500/60 ring-2 ring-amber-500/20"
                            : "border-neutral-800"
                        }`}
                      >
                        {idx === 0 && (
                          <div className="absolute -top-3 left-4 px-3 py-0.5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-bold uppercase tracking-wider font-mono">
                            ★ Prime Match (Score {rec.score})
                          </div>
                        )}

                        <div className="space-y-3">
                          {/* Live Rendered Watch Preview */}
                          <div className="h-44 flex items-center justify-center pointer-events-none scale-85">
                            <WatchRenderer watch={rec.watch} size="small" interactiveTilt={false} />
                          </div>

                          <div>
                            <div className="text-[11px] font-mono text-amber-400 uppercase font-bold">
                              {rec.watch.brand}
                            </div>
                            <h4 className="text-sm font-bold text-neutral-100">{rec.watch.name}</h4>
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                              {rec.watch.category} • {rec.watch.waterResistance || "50m"}
                            </div>
                          </div>

                          {/* Rationale Blurbs */}
                          <div className="p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1.5 text-xs text-neutral-300">
                            {rec.reasons.map((r, rIdx) => (
                              <div key={rIdx} className="flex items-start gap-1.5 text-[11px] leading-tight">
                                <Check size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => handleInspect(rec.watch)}
                            className="text-[11px] font-mono text-neutral-400 hover:text-amber-300 underline"
                          >
                            Loupe View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleWearToday(rec.watch)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-transform active:scale-95"
                          >
                            <Check size={12} />
                            <span>Wear Today</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STRAP MONSTER STUDIO */}
          {activeTab === "strap_studio" && (
            watches.length === 0 ? (
              <div className="p-12 rounded-3xl bg-neutral-950 border border-neutral-800 text-center space-y-3">
                <Layers size={32} className="text-amber-400/60 mx-auto" />
                <h4 className="text-sm font-bold text-neutral-200">Vitrine is Currently Empty</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Add a timepiece to your collection to audition quick-release straps and view live rendering.
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Live Watch Canvas with Swapped Strap */}
              <div className="lg:col-span-5 flex flex-col items-center justify-between p-6 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl">
                <div className="w-full space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono block">
                    Target Timepiece:
                  </span>
                  <select
                    value={targetWatchId}
                    onChange={(e) => {
                      const found = watches.find((w) => w.id === e.target.value);
                      if (found) {
                        setTargetWatchId(found.id);
                        setSelectedStrap(found.renderingConfig?.strapType || "steel_oyster");
                      }
                      horologyAudio.playCrownClick();
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
                  >
                    {watches.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.brand} - {w.name} ({w.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Big Live Watch Preview */}
                <div className="my-6 pointer-events-none">
                  {activeTargetWatch && (
                    <WatchRenderer
                      watch={activeTargetWatch}
                      customStrap={selectedStrap}
                      size="large"
                      interactiveTilt={false}
                    />
                  )}
                </div>

                {/* Save Strap Action */}
                <div className="w-full pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <div className="text-xs font-mono text-neutral-400">
                    Active: <strong className="text-neutral-200">{(selectedStrap || "steel_oyster").replace(/_/g, " ")}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveStrap}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                      isSavedToast
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-500 hover:bg-amber-400 text-neutral-950"
                    }`}
                  >
                    {isSavedToast ? <Check size={14} /> : <Zap size={14} />}
                    <span>{isSavedToast ? "Strap Saved to Watch" : "Apply Strap to Watch"}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: 12 Quick-Release Strap Audition Options */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
                    Audition Quick-Release Strap Families:
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono">12 Materials Available</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {STRAP_FAMILIES.map((sf) => (
                    <button
                      key={sf.id}
                      type="button"
                      onClick={() => {
                        setSelectedStrap(sf.id);
                        horologyAudio.playCrownClick();
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        selectedStrap === sf.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/20 shadow-md"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs text-neutral-200">
                        <span>{sf.label}</span>
                        <span className="text-[9px] uppercase tracking-wider font-mono text-amber-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                          {sf.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {sf.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
