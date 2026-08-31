import React, { useState, useMemo } from "react";
import { Watch } from "../types";
import {
  X,
  PieChart,
  Target,
  Award,
  Sparkles,
  TrendingUp,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  Compass,
  Shield,
  Zap,
  Activity,
  Layers,
  Heart,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";

interface GrailAndAnalyticsModalProps {
  watches: Watch[];
  collections?: any[];
  onClose: () => void;
  onSelectWatchForInspection?: (watch: Watch) => void;
  onAddGrailToCollection?: (grailWatch: any) => void;
}

interface GrailItem {
  id: string;
  brand: string;
  name: string;
  reference: string;
  estimatedPrice: number;
  currentSaved: number;
  targetMilestone: string;
  significanceStory: string;
}

const DEFAULT_GRAILS: GrailItem[] = [
  {
    id: "grail-1",
    brand: "A. Lange & Söhne",
    name: "Lange 1 Grand",
    reference: "191.032 Rose Gold",
    estimatedPrice: 42000,
    currentSaved: 16500,
    targetMilestone: "Closing Milestone Series A",
    significanceStory: "The quintessential Saxon asymmetric dial, twin outsize date, and hand-engraved balance cock in German silver.",
  },
  {
    id: "grail-2",
    brand: "F.P. Journe",
    name: "Chronomètre Bleu",
    reference: "CB Tantalum 39mm",
    estimatedPrice: 85000,
    currentSaved: 22000,
    targetMilestone: "Decade 40th Birthday",
    significanceStory: "Rare tantalum case with mesmerizing mirror-polished chrome blue dial and solid 18k rose gold caliber 1304.",
  },
];

export const GrailAndAnalyticsModal: React.FC<GrailAndAnalyticsModalProps> = ({
  watches,
  onClose,
  onSelectWatchForInspection,
}) => {
  const [activeTab, setActiveTab] = useState<"analytics" | "grails">("analytics");

  // Grail State (Persisted in localStorage)
  const [grails, setGrails] = useState<GrailItem[]>(() => {
    try {
      const saved = localStorage.getItem("chronocase_grail_vault_v1");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_GRAILS;
  });

  const [isAddingGrail, setIsAddingGrail] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [newName, setNewName] = useState("");
  const [newRef, setNewRef] = useState("");
  const [newPrice, setNewPrice] = useState("15000");
  const [newSaved, setNewSaved] = useState("2000");
  const [newMilestone, setNewMilestone] = useState("Personal Milestone");
  const [newStory, setNewStory] = useState("");

  const saveGrails = (updated: GrailItem[]) => {
    setGrails(updated);
    localStorage.setItem("chronocase_grail_vault_v1", JSON.stringify(updated));
  };

  const handleAddGrail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand || !newName) return;
    const item: GrailItem = {
      id: `grail-${Date.now()}`,
      brand: newBrand,
      name: newName,
      reference: newRef || "Ref. Undisclosed",
      estimatedPrice: parseFloat(newPrice) || 10000,
      currentSaved: parseFloat(newSaved) || 0,
      targetMilestone: newMilestone,
      significanceStory: newStory || "A personal grail milestone for the collection.",
    };
    saveGrails([...grails, item]);
    setIsAddingGrail(false);
    setNewBrand("");
    setNewName("");
    setNewRef("");
    horologyAudio.playCrownClick();
  };

  const handleDeleteGrail = (id: string) => {
    saveGrails(grails.filter((g) => g.id !== id));
    horologyAudio.playCrownClick();
  };

  const handleDepositGrail = (id: string, amount: number) => {
    const updated = grails.map((g) => {
      if (g.id === id) {
        return {
          ...g,
          currentSaved: Math.min(g.estimatedPrice, g.currentSaved + amount),
        };
      }
      return g;
    });
    saveGrails(updated);
    horologyAudio.playCrownClick();
  };

  // Portfolio Analytics Computations
  const analytics = useMemo(() => {
    const totalWatches = watches.length;

    // Movement origin breakdown
    const origins: Record<string, number> = {
      Swiss: 0,
      German: 0,
      Japanese: 0,
      Independent: 0,
      Other: 0,
    };

    // Category breakdown
    const categories: Record<string, number> = {};

    // Complication types
    let totalComplications = 0;
    let autoCount = 0;
    let manualCount = 0;
    let quartzCount = 0;

    watches.forEach((w) => {
      // Category
      categories[w.category] = (categories[w.category] || 0) + 1;

      // Origin
      const b = w.brand.toLowerCase();
      if (b.includes("lange") || b.includes("nomos") || b.includes("sinn") || b.includes("glashütte")) {
        origins.German += 1;
      } else if (b.includes("seiko") || b.includes("orient") || b.includes("citizen") || b.includes("casio")) {
        origins.Japanese += 1;
      } else if (b.includes("journe") || b.includes("baltic") || b.includes("farer") || b.includes("ward") || b.includes("brew")) {
        origins.Independent += 1;
      } else {
        origins.Swiss += 1;
      }

      // Movement
      if (w.movement.type === "automatic") autoCount++;
      else if (w.movement.type === "manual") manualCount++;
      else quartzCount++;

      // Complications
      if ((w.renderingConfig.subdials?.length || 0) > 0) totalComplications++;
    });

    // Diversity Score (0-100)
    const categorySpread = Object.keys(categories).length;
    const originSpread = Object.values(origins).filter((v) => v > 0).length;
    const diversityScore = Math.min(100, Math.round((categorySpread / 6) * 50 + (originSpread / 4) * 50));

    return {
      totalWatches,
      origins,
      categories,
      autoCount,
      manualCount,
      quartzCount,
      totalComplications,
      diversityScore,
    };
  }, [watches]);

  return (
    <div
      id="grail-analytics-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border border-amber-500/30 shadow-2xl overflow-hidden text-neutral-200">
        {/* Header Tabs */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="tab-analytics-btn"
              onClick={() => {
                setActiveTab("analytics");
                horologyAudio.playCrownClick();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all ${
                activeTab === "analytics"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-neutral-200 bg-neutral-900"
              }`}
            >
              <PieChart size={15} />
              <span>Vitrine Portfolio Analytics</span>
            </button>

            <button
              type="button"
              id="tab-grail-vault-btn"
              onClick={() => {
                setActiveTab("grails");
                horologyAudio.playCrownClick();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all ${
                activeTab === "grails"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-neutral-200 bg-neutral-900"
              }`}
            >
              <Target size={15} />
              <span>Grail Quest Tracker ({grails.length})</span>
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
          {/* TAB 1: PORTFOLIO ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Top High-Level Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
                    Total Timepieces
                  </span>
                  <div className="text-2xl font-bold font-mono text-neutral-100">
                    {analytics.totalWatches}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Across Active Vitrines
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono">
                    Diversity Health Score
                  </span>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {analytics.diversityScore}/100
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Balanced Category Spread
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 font-mono">
                    Mechanical Calibers
                  </span>
                  <div className="text-2xl font-bold font-mono text-blue-300">
                    {analytics.autoCount + analytics.manualCount}{" "}
                    <span className="text-xs text-neutral-500 font-normal">
                      ({analytics.autoCount} Auto / {analytics.manualCount} Manual)
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Pure Mechanical Heart
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 font-mono">
                    Complication Mastery
                  </span>
                  <div className="text-2xl font-bold font-mono text-purple-300">
                    {analytics.totalComplications}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Subdials & Multi-Registers
                  </span>
                </div>
              </div>

              {/* Breakdown Matrix Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Origin Distribution */}
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                    <Compass size={14} />
                    <span>Movement Manufacture Geographic Heritage</span>
                  </span>

                  <div className="space-y-3 font-mono text-xs">
                    {Object.entries(analytics.origins).map(([origin, countVal]) => {
                      const count = Number(countVal) || 0;
                      const pct = analytics.totalWatches > 0 ? Math.round((count / analytics.totalWatches) * 100) : 0;
                      return (
                        <div key={origin} className="space-y-1">
                          <div className="flex justify-between text-neutral-300">
                            <span>{origin} Horology</span>
                            <span className="font-bold text-neutral-100">
                              {count} watches ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Category Hierarchy */}
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                    <Layers size={14} />
                    <span>Horological Genre & Silhouette Spectrum</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {Object.entries(analytics.categories).map(([cat, count]) => (
                      <div
                        key={cat}
                        className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between"
                      >
                        <span className="text-neutral-300">{cat}</span>
                        <span className="font-bold text-amber-400 bg-black px-2 py-0.5 rounded border border-neutral-800">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GRAIL QUEST TRACKER */}
          {activeTab === "grails" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-200 font-mono">
                    Grail Timepiece Wishlist & Acquisition Vault
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Track future dream additions, milestone achievements, and dedicated savings goals.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingGrail((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md"
                >
                  <Plus size={14} />
                  <span>{isAddingGrail ? "Cancel" : "Add Grail Wish"}</span>
                </button>
              </div>

              {/* Add Grail Form */}
              {isAddingGrail && (
                <form
                  onSubmit={handleAddGrail}
                  className="p-5 rounded-2xl bg-neutral-950 border border-amber-500/40 shadow-xl space-y-3 animate-slide-down text-xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-neutral-400 mb-1">Brand / Manufacture:</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Patek Philippe"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Model Name:</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nautilus 5711/1A"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Reference / Dial:</label>
                      <input
                        type="text"
                        placeholder="e.g. Blue Sunburst 40mm"
                        value={newRef}
                        onChange={(e) => setNewRef(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-neutral-400 mb-1">Target Market Price ($ USD):</label>
                      <input
                        type="number"
                        placeholder="35000"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Current Saved ($ USD):</label>
                      <input
                        type="number"
                        placeholder="5000"
                        value={newSaved}
                        onChange={(e) => setNewSaved(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Target Life Milestone:</label>
                      <input
                        type="text"
                        placeholder="e.g. 40th Birthday / Business Exit"
                        value={newMilestone}
                        onChange={(e) => setNewMilestone(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Why This Is Your Grail:</label>
                    <input
                      type="text"
                      placeholder="e.g. Gérald Genta's iconic porthole design with hand-finished bevels."
                      value={newStory}
                      onChange={(e) => setNewStory(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold"
                    >
                      Save Grail to Wishlist
                    </button>
                  </div>
                </form>
              )}

              {/* Grail Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grails.map((grail) => {
                  const pct = Math.min(
                    100,
                    Math.round((grail.currentSaved / grail.estimatedPrice) * 100)
                  );
                  return (
                    <div
                      key={grail.id}
                      className="p-5 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-xl flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-400 font-mono tracking-wider">
                              {grail.brand}
                            </span>
                            <h4 className="text-base font-bold text-neutral-100 font-serif">
                              {grail.name}
                            </h4>
                            <span className="text-xs text-neutral-400 font-mono">
                              {grail.reference}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteGrail(grail.id)}
                            className="p-1.5 text-neutral-600 hover:text-rose-400 transition-colors"
                            title="Remove Grail"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <p className="text-xs text-neutral-300 italic leading-relaxed">
                          "{grail.significanceStory}"
                        </p>

                        <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-mono">
                          <Target size={12} />
                          <span>Milestone: <strong>{grail.targetMilestone}</strong></span>
                        </div>
                      </div>

                      {/* Progress Bar & Savings Controls */}
                      <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-neutral-400">Funding Progress:</span>
                          <span className="font-bold text-amber-400">
                            ${grail.currentSaved.toLocaleString()} / ${grail.estimatedPrice.toLocaleString()} ({pct}%)
                          </span>
                        </div>

                        <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800">
                          <div
                            className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Quick Deposit:
                          </span>
                          <div className="flex items-center gap-1">
                            {[100, 500, 1000].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => handleDepositGrail(grail.id, amt)}
                                className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-neutral-300 hover:text-amber-300 border border-neutral-700"
                              >
                                +${amt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
