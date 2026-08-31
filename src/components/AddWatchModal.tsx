import React, { useState } from "react";
import { Watch, WatchCategory, WatchCollection, HorologySource } from "../types";
import { WatchRenderer } from "./WatchRenderer";
import { WatchPhotoScanner } from "./WatchPhotoScanner";
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  Folder,
  Search,
  BookOpen,
  Globe,
  Gem,
  Shirt,
  Crosshair,
  ShieldCheck,
  Newspaper,
  Zap,
  Database,
  Filter,
  ArrowRight,
  Info,
  Check,
  Clock,
  Layers,
  ChevronRight,
  Camera,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";
import { STYLE_METADATA, MOVEMENT_METADATA } from "../utils/styleAndMovement";
import { HOROLOGY_SOURCES, SOURCE_CATALOG_WATCHES, SourceMeta } from "../data/sourceCatalogs";
import { synthesizeWatchFromQuery } from "../data/fallbackHorology";

interface AddWatchModalProps {
  collections: WatchCollection[];
  defaultCollectionId?: string;
  initialMode?: "ai_search" | "source_catalogs" | "photo_scan";
  initialQuery?: string;
  onClose: () => void;
  onAddWatch: (watch: Watch) => void;
}

export const AddWatchModal: React.FC<AddWatchModalProps> = ({
  collections,
  defaultCollectionId,
  initialMode = "ai_search",
  initialQuery = "",
  onClose,
  onAddWatch,
}) => {
  // Navigation Modes: "photo_scan" vs "ai_search" vs "source_catalogs"
  const [modalMode, setModalMode] = useState<"ai_search" | "source_catalogs" | "photo_scan">(initialMode);
  const [selectedSource, setSelectedSource] = useState<HorologySource | "all">("the_watch_revised");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // AI Generation State
  const [query, setQuery] = useState(initialQuery);
  const [sourceLens, setSourceLens] = useState<string>("all");
  const [customNotes, setCustomNotes] = useState("");
  const [selectedColId, setSelectedColId] = useState<string>(
    defaultCollectionId && defaultCollectionId !== "all"
      ? defaultCollectionId
      : collections[0]?.id || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewWatch, setPreviewWatch] = useState<Watch | null>(null);

  // Suggested quick prompts
  const suggestions = [
    { label: "Rolex Daytona Panda", query: "Rolex Daytona 116500LN Panda" },
    { label: "Patek 1518 Perpetual", query: "Patek Philippe 1518 Perpetual Calendar" },
    { label: "Tudor Pelagos 39", query: "Tudor Pelagos 39 Titanium" },
    { label: "Vacheron 222 Gold", query: "Vacheron Constantin 222 Yellow Gold" },
    { label: "Hamilton Khaki Field", query: "Hamilton Khaki Field Mechanical" },
    { label: "Grand Seiko Shunbun", query: "Grand Seiko SBGA413 Shunbun Spring Drive" },
    { label: "Vintage Single Red 1680", query: "Rolex 1680 Red Submariner 1970 Vintage" },
    { label: "Tissot PRX Blue", query: "Tissot PRX Powermatic 80 Blue" },
  ];

  // Helper to render source icon
  const renderSourceIcon = (sourceKey: HorologySource | "all", size = 16) => {
    switch (sourceKey) {
      case "the_watch_revised":
        return <BookOpen size={size} />;
      case "chrono24":
        return <Globe size={size} />;
      case "mayors":
        return <Gem size={size} />;
      case "primer_magazine":
        return <Shirt size={size} />;
      case "teddy_baldassarre":
        return <Crosshair size={size} />;
      case "ebay_vault":
        return <ShieldCheck size={size} />;
      case "hodinkee":
        return <Newspaper size={size} />;
      case "wristcheck":
        return <Zap size={size} />;
      case "watchbase":
        return <Database size={size} />;
      default:
        return <Sparkles size={size} />;
    }
  };

  // Filter watches from curated source catalog
  const filteredCatalogWatches = SOURCE_CATALOG_WATCHES.filter((w) => {
    const matchesSource = selectedSource === "all" || w.provenanceSource === selectedSource;
    const matchesCategory = categoryFilter === "all" || w.category === categoryFilter;
    const matchesSearch =
      !catalogSearch.trim() ||
      w.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      w.brand.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      w.reference.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (w.movement?.caliber || "").toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesSource && matchesCategory && matchesSearch;
  });

  const handleGenerateWatch = async (watchQuery: string) => {
    if (!watchQuery.trim()) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      let data: any = null;

      try {
        const res = await fetch("/api/watches/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: watchQuery,
            customNotes,
            sourceLens: sourceLens !== "all" ? sourceLens : undefined,
          }),
        });

        if (res.ok) {
          data = await res.json();
        } else {
          console.warn("API responded with non-OK status, activating instant local Horological Engine...");
        }
      } catch (fetchErr) {
        console.warn("Network or server unavailable, switching to local Horological Engine:", fetchErr);
      }

      // If server failed or returned empty, generate using our authoritative engine
      if (!data || !data.name) {
        data = synthesizeWatchFromQuery(
          watchQuery,
          customNotes,
          sourceLens !== "all" ? sourceLens : undefined
        );
      }

      const newWatch: Watch = {
        id: `watch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        collectionId: selectedColId,
        name: data.name || watchQuery,
        brand: data.brand || "Fine Watchmaking",
        reference: data.reference || "Custom Ref",
        yearIntroduced: data.yearIntroduced || "Modern",
        category: (data.category as WatchCategory) || "Everyday",
        provenanceSource: (data.provenanceSource as HorologySource) || (sourceLens !== "all" ? (sourceLens as HorologySource) : undefined),
        sourceBadgeLabel: data.sourceBadgeLabel || (sourceLens !== "all" && HOROLOGY_SOURCES[sourceLens as HorologySource]?.badgeLabel) || undefined,
        msrp: data.msrp,
        marketPrice: data.marketPrice,
        caseDiameter: data.caseDiameter || 40,
        caseThickness: data.caseThickness || 12,
        lugToLug: data.lugToLug || 47,
        lugWidth: data.lugWidth || 20,
        waterResistance: data.waterResistance || "100m",
        movement: data.movement || {
          type: "Automatic",
          caliber: "Manufacture Calibre",
          powerReserve: "48 Hours",
          frequencyVph: 28800,
          jewels: 28,
          features: ["Anti-magnetic balance spring", "Stop-seconds mechanism"],
        },
        renderingConfig: data.renderingConfig || {
          caseShape: "round",
          caseFinish: "steel",
          caseBezelType: "smooth",
          dialColor: "#0f172a",
          dialPattern: "matte",
          markerType: "applied_batons",
          markerColor: "#ffffff",
          handsType: "baton",
          handsColor: "#ffffff",
          secondsHandColor: "#ef4444",
          lumeColor: "green",
          strapType: "oyster_bracelet",
          strapColor: "#94a3b8",
        },
        facts: data.facts || {
          tagline: "A Distinguished Horological Masterpiece",
          storyBlurb: "An emblem of mechanical watchmaking history representing timeless design and horological prestige.",
          keyHighlights: ["Superlative precision and finishing", "Iconic case architecture", "In-house manufacture caliber"],
          historicalSignificance: "An emblem of mechanical watchmaking history representing timeless design and horological prestige.",
          movementEngineering: "Engineered with precision escapement, free-sprung balance, and tight chronometric tolerances.",
          collectorLore: "Highly regarded among collectors worldwide for its balance of elegance and engineering.",
          funFacts: [
            "Each component undergoes meticulous micromechanical beveling and testing.",
            "Crafted to endure both formal occasions and everyday wear.",
          ],
        },
        collectorNotes: customNotes,
        dateAdded: new Date().toISOString(),
        userFavorite: false,
      };

      setPreviewWatch(newWatch);
      horologyAudio.playCrownClick();
    } catch (err: any) {
      console.error("Watch generation error:", err);
      // Even in the rarest case of an uncaught exception, synthesize a safe default watch
      const safeData = synthesizeWatchFromQuery(watchQuery, customNotes);
      const safeWatch: Watch = {
        id: `watch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        collectionId: selectedColId,
        name: safeData.name,
        brand: safeData.brand,
        reference: safeData.reference,
        yearIntroduced: safeData.yearIntroduced,
        category: safeData.category,
        msrp: safeData.msrp,
        marketPrice: safeData.marketPrice,
        caseDiameter: safeData.caseDiameter,
        caseThickness: safeData.caseThickness,
        lugToLug: safeData.lugToLug,
        lugWidth: safeData.lugWidth,
        waterResistance: safeData.waterResistance,
        movement: safeData.movement,
        renderingConfig: safeData.renderingConfig,
        facts: safeData.facts,
        collectorNotes: customNotes,
        dateAdded: new Date().toISOString(),
        userFavorite: false,
      };
      setPreviewWatch(safeWatch);
      horologyAudio.playCrownClick();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCuratedWatch = (watchTemplate: Watch) => {
    const clonedWatch: Watch = {
      ...watchTemplate,
      id: `watch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      collectionId: selectedColId,
      collectorNotes: customNotes || watchTemplate.collectorNotes,
      dateAdded: new Date().toISOString(),
    };
    setPreviewWatch(clonedWatch);
    horologyAudio.playCrownClick();
  };

  const handleConfirmAdd = () => {
    if (!previewWatch) return;
    const finalWatch = {
      ...previewWatch,
      collectionId: selectedColId,
    };
    horologyAudio.playCaseLid();
    onAddWatch(finalWatch);
    onClose();
  };

  const currentSourceMeta: SourceMeta =
    selectedSource === "all"
      ? {
          name: "Global Horology Discovery",
          shortName: "All Sources",
          badgeLabel: "Global Benchmark",
          badgeColor: "text-amber-300",
          badgeBg: "bg-amber-950/40",
          badgeBorder: "border-amber-500/40",
          tagline: "Synchronized across 9 Premier Horology Registries",
          description:
            "Searching and filtering across Hodinkee, Wristcheck, WatchBase, Chrono24, The Watch Revised, Mayors, Primer, Teddy Baldassarre, and eBay Authenticity Vault.",
          curatedCategoryFocus: "All Curated References",
        }
      : HOROLOGY_SOURCES[selectedSource];

  return (
    <div
      id="add-watch-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black rounded-3xl border border-neutral-800 shadow-2xl p-4 sm:p-6 md:p-7 overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-add-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 transition-colors shadow-lg"
        >
          <X size={18} />
        </button>

        {/* Modal Header & Navigation Mode Switcher */}
        <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-0.5">
              <Sparkles size={14} />
              <span>Multi-Source Horological Acquisition</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-neutral-100">
              Add Timepiece to Collection
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Explore curated benchmarks from premier horological authorities or analyze any reference with AI recognition.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-neutral-950 rounded-2xl border border-neutral-800 self-start md:self-auto shrink-0">
            <button
              id="tab-photo-scanner-btn"
              onClick={() => {
                setModalMode("photo_scan");
                horologyAudio.playCrownClick();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold transition-all ${
                modalMode === "photo_scan"
                  ? "bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 shadow-md font-bold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Camera size={14} />
              <span>Photo Scanner & Camera</span>
            </button>

            <button
              id="tab-curated-sources-btn"
              onClick={() => {
                setModalMode("source_catalogs");
                horologyAudio.playCrownClick();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold transition-all ${
                modalMode === "source_catalogs"
                  ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <BookOpen size={14} />
              <span>Curated Sources</span>
            </button>

            <button
              id="tab-ai-recognition-btn"
              onClick={() => {
                setModalMode("ai_search");
                horologyAudio.playCrownClick();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold transition-all ${
                modalMode === "ai_search"
                  ? "bg-amber-500 text-neutral-950 shadow-md font-bold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Sparkles size={14} />
              <span>Custom AI Search</span>
            </button>
          </div>
        </div>

        {/* Target Collection Selector Bar */}
        {collections.length > 0 && (
          <div className="mb-3 p-2 px-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-neutral-300 font-medium">
              <Folder size={14} className="text-amber-400" />
              <span>Destination Vitrine:</span>
            </div>
            <select
              id="target-collection-select"
              value={selectedColId}
              onChange={(e) => setSelectedColId(e.target.value)}
              className="px-3 py-1 rounded-lg bg-neutral-950 border border-neutral-700 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
            >
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Main Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2.5 space-y-4 custom-scrollbar">
          {modalMode === "photo_scan" ? (
            /* 1. PHOTO SCANNER & CAMERA VISION VIEW */
            <WatchPhotoScanner
              selectedCollectionId={selectedColId}
              sourceLens={sourceLens}
              onWatchScanned={(scannedWatch) => {
                setPreviewWatch(scannedWatch);
              }}
            />
          ) : modalMode === "source_catalogs" ? (
            /* 2. CURATED SOURCE CATALOGS VIEW */
            <div className="space-y-4">
              {/* 10 Source Pills Bar (All Sources + 9 Authorities) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-10 gap-2">
                <button
                  id="source-btn-all"
                  onClick={() => {
                    setSelectedSource("all");
                    horologyAudio.playCrownClick();
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    selectedSource === "all"
                      ? "bg-amber-950/60 border-amber-500/60 ring-2 ring-amber-400/40 shadow-lg text-amber-300"
                      : "bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-800/60 text-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-1.5 rounded-lg ${selectedSource === "all" ? "text-amber-400" : "text-neutral-400"}`}>
                      <Sparkles size={14} />
                    </div>
                    {selectedSource === "all" && <Check size={14} className="text-amber-400" />}
                  </div>
                  <div>
                    <span className={`text-xs font-bold block ${selectedSource === "all" ? "text-amber-300" : "text-neutral-200"}`}>
                      All Sources
                    </span>
                  </div>
                </button>

                {(Object.keys(HOROLOGY_SOURCES) as HorologySource[]).map((srcKey) => {
                  const meta = HOROLOGY_SOURCES[srcKey];
                  const isSelected = selectedSource === srcKey;
                  return (
                    <button
                      key={srcKey}
                      id={`source-btn-${srcKey}`}
                      onClick={() => {
                        setSelectedSource(srcKey);
                        horologyAudio.playCrownClick();
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? `${meta.badgeBg} ${meta.badgeBorder} ring-2 ring-amber-400/40 shadow-lg`
                          : "bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-800/60 text-neutral-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-1.5 rounded-lg ${isSelected ? meta.badgeColor : "text-neutral-400"}`}>
                          {renderSourceIcon(srcKey, 14)}
                        </div>
                        {isSelected && <Check size={14} className={meta.badgeColor} />}
                      </div>
                      <div>
                        <span className={`text-xs font-bold block ${isSelected ? meta.badgeColor : "text-neutral-200"}`}>
                          {meta.shortName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Source Details Banner */}
              <div className={`p-4 rounded-2xl border ${currentSourceMeta.badgeBg} ${currentSourceMeta.badgeBorder} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${currentSourceMeta.badgeColor}`}>
                      {currentSourceMeta.badgeLabel}
                    </span>
                    <span className="text-xs text-neutral-500">•</span>
                    <span className="text-xs text-neutral-300 font-serif italic">
                      {currentSourceMeta.tagline}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
                    {currentSourceMeta.description}
                  </p>
                </div>
              </div>

              {/* Filters & Search within Source */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder={`Search within ${currentSourceMeta.shortName} (model, reference, or brand)...`}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                  {catalogSearch && (
                    <button
                      onClick={() => setCatalogSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {["all", "Diver", "Chronograph", "Dress", "Integrated", "GMT / Travel", "Field", "Grand Complication"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        categoryFilter === cat
                          ? "bg-neutral-200 text-neutral-950 font-bold"
                          : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                      }`}
                    >
                      {cat === "all" ? "All Styles" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Curated Watch Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCatalogWatches.map((cw) => {
                  const sMeta = STYLE_METADATA[cw.category] || STYLE_METADATA.Everyday;
                  const mMeta = MOVEMENT_METADATA[cw.movement.type] || MOVEMENT_METADATA.Automatic;
                  const isCuratedSelected = previewWatch?.reference === cw.reference;

                  return (
                    <div
                      key={cw.id}
                      id={`curated-card-${cw.id}`}
                      onClick={() => handleSelectCuratedWatch(cw)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isCuratedSelected
                          ? "bg-amber-950/40 border-amber-500/60 ring-2 ring-amber-400/40 shadow-xl"
                          : "bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      {/* Top Bar: Brand, Ref & Year */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                          <span className="text-amber-400 font-bold uppercase">{cw.brand}</span>
                          <span className="text-neutral-400">Ref: {cw.reference}</span>
                        </div>
                        <h4 className="text-sm font-serif font-bold text-neutral-100 line-clamp-1">
                          {cw.name}
                        </h4>
                        <p className="text-[11px] text-neutral-400 italic line-clamp-1 mt-0.5">
                          "{cw.facts.tagline}"
                        </p>
                      </div>

                      {/* Middle Badges: Style, Movement, Price */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full border font-bold ${sMeta.badgeBg} ${sMeta.badgeText} ${sMeta.badgeBorder}`}>
                          {sMeta.emoji} {cw.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border font-bold ${mMeta.badgeBg} ${mMeta.badgeText} ${mMeta.badgeBorder}`}>
                          {mMeta.iconSymbol} {cw.movement.type}
                        </span>
                        {cw.marketPrice && (
                          <span className="px-2 py-0.5 rounded-full bg-neutral-950 text-amber-300 font-mono border border-neutral-800">
                            {cw.marketPrice}
                          </span>
                        )}
                      </div>

                      {/* Story Behind The Piece / Source Quote */}
                      <div className="text-[11px] text-neutral-300 bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80 line-clamp-3">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-0.5">
                          <BookOpen size={10} />
                          <span>Story Behind Piece:</span>
                        </div>
                        <p className="italic leading-snug">
                          "{cw.facts.storyBlurb || (cw.facts.historicalSignificance ? cw.facts.historicalSignificance.split('.')[0] + '.' : cw.facts.tagline)}"
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCuratedWatch(cw);
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          isCuratedSelected
                            ? "bg-amber-500 text-neutral-950 font-bold"
                            : "bg-neutral-800 hover:bg-amber-500/20 text-neutral-300 hover:text-amber-300 border border-neutral-700"
                        }`}
                      >
                        {isCuratedSelected ? (
                          <>
                            <Check size={13} />
                            <span>Selected for Vitrine</span>
                          </>
                        ) : (
                          <>
                            <span>Inspect & Select</span>
                            <ChevronRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {filteredCatalogWatches.length === 0 && (
                <div className="p-8 text-center bg-neutral-950/40 rounded-2xl border border-neutral-800 text-neutral-400 text-xs">
                  No timepieces found matching your search in this catalog. Try clearing your filters or search in the AI tab.
                </div>
              )}
            </div>
          ) : modalMode === "ai_search" ? (
            /* 3. CUSTOM AI SEARCH & HOROLOGICAL LENSES VIEW */
            <div className="space-y-4">
              {/* Input Bar & Lens Selector */}
              <div className="space-y-3">
                {/* Visual Lens Selector Ribbon */}
                <div className="p-3.5 bg-neutral-950/80 rounded-2xl border border-neutral-800/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
                      <Crosshair size={14} />
                      <span>Active AI Search Lens & Provenance Filter:</span>
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      {sourceLens === "all"
                        ? "Synthesizing cross-reference across all 6 verified authorities"
                        : HOROLOGY_SOURCES[sourceLens as HorologySource]?.name}
                    </span>
                  </div>

                  {/* Lens Pills Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                    <button
                      id="lens-pill-all"
                      type="button"
                      onClick={() => {
                        setSourceLens("all");
                        horologyAudio.playCrownClick();
                      }}
                      className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between gap-1 ${
                        sourceLens === "all"
                          ? "bg-amber-500/20 border-amber-500/80 text-amber-300 ring-1 ring-amber-400/50 shadow-md"
                          : "bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold flex items-center gap-1">
                          <Sparkles size={12} className="text-amber-400" /> All Sources
                        </span>
                        {sourceLens === "all" && <Check size={12} className="text-amber-400" />}
                      </div>
                      <span className="text-[9px] text-neutral-500 leading-tight">Omni-Horology</span>
                    </button>

                    {(Object.keys(HOROLOGY_SOURCES) as HorologySource[]).map((srcKey) => {
                      const meta = HOROLOGY_SOURCES[srcKey];
                      const isSelected = sourceLens === srcKey;
                      return (
                        <button
                          key={srcKey}
                          id={`lens-pill-${srcKey}`}
                          type="button"
                          onClick={() => {
                            setSourceLens(srcKey);
                            horologyAudio.playCrownClick();
                          }}
                          className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between gap-1 ${
                            isSelected
                              ? "bg-amber-500/20 border-amber-500/80 text-amber-300 ring-1 ring-amber-400/50 shadow-md"
                              : "bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold flex items-center gap-1 truncate">
                              {renderSourceIcon(srcKey, 12)}
                              <span className="truncate">{meta.shortName}</span>
                            </span>
                            {isSelected && <Check size={12} className="text-amber-400 shrink-0" />}
                          </div>
                          <span className="text-[9px] text-neutral-500 leading-tight truncate">{meta.tagline.split("&")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      id="watch-query-input"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerateWatch(query)}
                      placeholder="e.g. Rolex Daytona Panda, Cartier Crash, Blancpain Fifty Fathoms, Omega Caliber 321..."
                      className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 shadow-inner"
                    />
                  </div>

                  <button
                    id="generate-watch-btn"
                    onClick={() => handleGenerateWatch(query)}
                    disabled={!query.trim() || isLoading}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-semibold text-xs uppercase tracking-wider disabled:opacity-40 flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Render Timepiece</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Popular Source Suggestions */}
                <div>
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Curated Source References:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((sug, i) => (
                      <button
                        key={i}
                        id={`sug-chip-${i}`}
                        onClick={() => {
                          setQuery(sug.query);
                          handleGenerateWatch(sug.query);
                        }}
                        className="px-2.5 py-1 rounded-full text-xs bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-800 transition-colors"
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Custom Notes Input */}
              <div className="p-3 bg-neutral-900/40 rounded-xl border border-neutral-800">
                <label className="text-xs font-semibold text-neutral-400 block mb-1">
                  Optional Collector Notes & Provenance Details:
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Acquired from authorized boutique with box and papers, engraved anniversary inscription..."
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                />
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div className="space-y-0.5">
                    <span className="font-bold text-rose-300 block">Timepiece Analysis Notice</span>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">{errorMessage}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleGenerateWatch(query)}
                      disabled={isLoading || !query.trim()}
                      className="px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles size={13} />
                      <span>Retry Analysis</span>
                    </button>
                    <button
                      onClick={() => {
                        setModalMode("source_catalogs");
                        setErrorMessage("");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <BookOpen size={13} />
                      <span>Curated Catalog</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Live Preview Area (When a watch is generated or selected) */}
          {previewWatch && (
            <div className="bg-neutral-950/90 rounded-2xl border border-amber-500/40 p-5 flex flex-col md:flex-row items-center gap-6 shadow-2xl animate-in fade-in duration-300">
              {/* Watch Rendering & Live Dial/Finish Tuner */}
              <div className="w-full md:w-5/12 flex flex-col items-center justify-center p-3 bg-neutral-900/40 rounded-2xl border border-neutral-800/80">
                <WatchRenderer watch={previewWatch} size="large" interactiveTilt={true} />
                <div className="flex items-center gap-2 mt-2 mb-3">
                  <span className="text-[10px] font-mono text-neutral-400">
                    Live Horological Sweep • {previewWatch.movement.frequencyVph} VPH
                  </span>
                </div>

                {/* Quick Dial Color & Case Finish Live Customizer */}
                <div className="w-full pt-3 border-t border-neutral-800/80 space-y-2.5">
                  {/* Dial Color Selector */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                      <span>Dial Color:</span>
                      <span className="text-amber-400 font-mono">
                        {previewWatch.renderingConfig.dialColor === "#e2e8f0"
                          ? "Silver"
                          : previewWatch.renderingConfig.dialColor === "#f8fafc"
                          ? "Opaline White"
                          : previewWatch.renderingConfig.dialColor === "#09090b"
                          ? "Obsidian Black"
                          : previewWatch.renderingConfig.dialColor === "#1e3a8a"
                          ? "Sunburst Blue"
                          : previewWatch.renderingConfig.dialColor === "#064e3b"
                          ? "Emerald Green"
                          : previewWatch.renderingConfig.dialColor === "#d97706"
                          ? "Champagne Gold"
                          : previewWatch.renderingConfig.dialColor === "#fb7185"
                          ? "Salmon / Copper"
                          : "Custom"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      {[
                        { label: "Silver", color: "#e2e8f0", bg: "bg-slate-200" },
                        { label: "White", color: "#f8fafc", bg: "bg-white" },
                        { label: "Black", color: "#09090b", bg: "bg-neutral-950 border-neutral-700" },
                        { label: "Blue", color: "#1e3a8a", bg: "bg-blue-900" },
                        { label: "Green", color: "#064e3b", bg: "bg-emerald-950 border-emerald-800" },
                        { label: "Gold", color: "#d97706", bg: "bg-amber-600" },
                        { label: "Salmon", color: "#fb7185", bg: "bg-rose-400" },
                        { label: "Slate", color: "#475569", bg: "bg-slate-600" },
                      ].map((d) => (
                        <button
                          key={d.label}
                          type="button"
                          id={`quick-dial-color-${d.label.toLowerCase()}`}
                          onClick={() => {
                            setPreviewWatch((prev) => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                renderingConfig: {
                                  ...prev.renderingConfig,
                                  dialColor: d.color,
                                  markerColor: d.color === "#d97706" ? "#f59e0b" : "#e2e8f0",
                                  handsColor: d.color === "#d97706" ? "#fbbf24" : "#ffffff",
                                },
                              };
                            });
                            horologyAudio.playCrownClick();
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${d.bg} ${
                            previewWatch.renderingConfig.dialColor === d.color
                              ? "ring-2 ring-amber-400 scale-110 border-white"
                              : "border-neutral-700/60 hover:scale-105 opacity-80 hover:opacity-100"
                          }`}
                          title={`Set dial color to ${d.label}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Case Finish Selector */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                      <span>Case Metal Finish:</span>
                      <span className="text-amber-400 font-mono capitalize">
                        {previewWatch.renderingConfig.caseFinish.replace("_", " ")}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                      {[
                        { id: "steel", label: "Steel / Silver" },
                        { id: "titanium", label: "Titanium" },
                        { id: "yellow_gold", label: "Yellow Gold" },
                        { id: "rose_gold", label: "Rose Gold" },
                      ].map((metal) => (
                        <button
                          key={metal.id}
                          type="button"
                          id={`quick-metal-finish-${metal.id}`}
                          onClick={() => {
                            setPreviewWatch((prev) => {
                              if (!prev) return null;
                              const isGold = metal.id.includes("gold");
                              return {
                                ...prev,
                                renderingConfig: {
                                  ...prev.renderingConfig,
                                  caseFinish: metal.id as any,
                                  markerColor: isGold ? "#f59e0b" : "#e2e8f0",
                                  handsColor: isGold ? "#fbbf24" : "#ffffff",
                                },
                              };
                            });
                            horologyAudio.playCrownClick();
                          }}
                          className={`px-1.5 py-1 rounded-lg border text-center font-medium transition-all ${
                            previewWatch.renderingConfig.caseFinish === metal.id
                              ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm"
                              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                          }`}
                        >
                          {metal.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Watch Specs, Style, Movement & Facts Preview */}
              <div className="w-full md:w-7/12 space-y-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-400">
                    <span className="font-bold">{previewWatch.brand}</span>
                    <span>•</span>
                    <span>Ref: {previewWatch.reference}</span>
                    {previewWatch.yearIntroduced && (
                      <>
                        <span>•</span>
                        <span className="text-neutral-400">{previewWatch.yearIntroduced}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-neutral-100 mt-0.5">
                    {previewWatch.name}
                  </h3>
                  <p className="text-xs text-neutral-400 italic mt-0.5">
                    "{previewWatch.facts.tagline}"
                  </p>
                </div>

                {/* High-Visibility Style, Movement & Provenance Badges */}
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const sMeta = STYLE_METADATA[previewWatch.category] || STYLE_METADATA.Everyday;
                    const mMeta = MOVEMENT_METADATA[previewWatch.movement.type] || MOVEMENT_METADATA.Automatic;
                    const provMeta = previewWatch.provenanceSource
                      ? HOROLOGY_SOURCES[previewWatch.provenanceSource]
                      : null;

                    return (
                      <>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sMeta.badgeBg} ${sMeta.badgeText} ${sMeta.badgeBorder}`}>
                          <span>{sMeta.emoji}</span>
                          <span className="uppercase">Style: {previewWatch.category}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${mMeta.badgeBg} ${mMeta.badgeText} ${mMeta.badgeBorder}`}>
                          <span>{mMeta.iconSymbol}</span>
                          <span>Movement: {previewWatch.movement.type}</span>
                        </div>
                        {provMeta && (
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${provMeta.badgeBg} ${provMeta.badgeColor} ${provMeta.badgeBorder}`}>
                            {renderSourceIcon(previewWatch.provenanceSource!, 12)}
                            <span>{provMeta.shortName}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Story Behind The Piece Blurb */}
                <div className="bg-neutral-900/90 p-3 rounded-xl border border-amber-500/30 text-xs shadow-inner">
                  <span className="font-bold text-amber-400 text-[10px] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <BookOpen size={12} />
                    <span>Story Behind The Piece:</span>
                  </span>
                  <p className="text-[11.5px] text-neutral-200 italic font-serif leading-relaxed">
                    "{previewWatch.facts.storyBlurb || previewWatch.facts.tagline || (previewWatch.facts.historicalSignificance ? previewWatch.facts.historicalSignificance.split('.')[0] + '.' : 'A landmark horological creation.')}"
                  </p>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Diameter</span>
                    <span className="font-semibold text-neutral-200">{previewWatch.caseDiameter}mm</span>
                  </div>
                  <div className="bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Caliber</span>
                    <span className="font-semibold text-neutral-200 truncate block">{previewWatch.movement.caliber}</span>
                  </div>
                  <div className="bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Power Reserve</span>
                    <span className="font-semibold text-neutral-200">{previewWatch.movement.powerReserve}</span>
                  </div>
                  <div className="bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Market Value</span>
                    <span className="font-semibold text-amber-300 font-mono">{previewWatch.marketPrice || previewWatch.msrp || "Haute Value"}</span>
                  </div>
                </div>

                {/* Source Citation & Highlights */}
                {previewWatch.facts.sourceCitation && (
                  <div className="bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
                    <span className="font-bold text-amber-400 block mb-0.5">Authoritative Source Citation:</span>
                    <p className="text-[11px] text-neutral-300 italic">{previewWatch.facts.sourceCitation}</p>
                  </div>
                )}

                {/* Place in Vitrine Action */}
                <button
                  id="place-in-vitrine-btn"
                  onClick={handleConfirmAdd}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
                >
                  <CheckCircle2 size={16} />
                  <span>Place Timepiece in Vitrine</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
