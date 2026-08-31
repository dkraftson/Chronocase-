import React, { useState, useMemo } from "react";
import { Watch, WatchCategory, WatchCollection, HorologySource } from "../types";
import { WatchRenderer } from "./WatchRenderer";
import {
  Search,
  X,
  Filter,
  Sparkles,
  SlidersHorizontal,
  Plus,
  Eye,
  Check,
  Folder,
  ArrowUpDown,
  BookOpen,
  Globe,
  Gem,
  Shirt,
  Crosshair,
  ShieldCheck,
  Newspaper,
  Zap,
  Database,
  Layers,
  Clock,
  Volume2,
  ChevronDown,
  Info,
  Loader2,
} from "lucide-react";
import { HOROLOGY_SOURCES, SOURCE_CATALOG_WATCHES } from "../data/sourceCatalogs";
import { horologyAudio } from "../utils/audio";
import { synthesizeWatchFromQuery } from "../data/fallbackHorology";
import { sanitizeWatch } from "../utils/watchUtils";

const TYPO_MAP: Record<string, string> = {
  muesuem: "museum",
  museam: "museum",
  muesum: "museum",
  submarier: "submariner",
  submarner: "submariner",
  patak: "patek",
  pateck: "patek",
  cartie: "cartier",
  cartye: "cartier",
  rolexx: "rolex",
  rolx: "rolex",
  omga: "omega",
  omeega: "omega",
  breitling: "breitling",
  audemar: "audemars",
  daytonna: "daytona",
  speedy: "speedmaster",
  seiko: "seiko",
};

interface WatchSearchEngineProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWatchForInspection: (watch: Watch) => void;
  onAddWatchToCollection: (watch: Watch, collectionId: string) => void;
  collections: WatchCollection[];
  activeCollectionId: string;
}

export const WatchSearchEngine: React.FC<WatchSearchEngineProps> = ({
  isOpen,
  onClose,
  onSelectWatchForInspection,
  onAddWatchToCollection,
  collections,
  activeCollectionId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMovement, setSelectedMovement] = useState<string>("all");
  const [selectedPriceTier, setSelectedPriceTier] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [targetCollectionId, setTargetCollectionId] = useState<string>(activeCollectionId || (collections[0]?.id ?? "default"));
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "dense">("grid");
  const [addedWatchIds, setAddedWatchIds] = useState<Set<string>>(new Set());

  // Extract all unique brands from the catalog
  const uniqueBrands = useMemo(() => {
    const brands = Array.from(new Set(SOURCE_CATALOG_WATCHES.map((w) => w.brand))).sort();
    return brands;
  }, []);

  // Helper to render source icon
  const renderSourceIcon = (sourceKey: HorologySource | string, size = 14) => {
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
      case "everywatch":
        return <Search size={size} />;
      default:
        return <Sparkles size={size} />;
    }
  };

  // Filter and sort catalog watches
  const filteredWatches = useMemo(() => {
    return SOURCE_CATALOG_WATCHES.filter((w) => {
      // 1. Source filter
      if (selectedSource !== "all" && w.provenanceSource !== selectedSource) {
        return false;
      }

      // 2. Brand filter
      if (selectedBrand !== "all" && w.brand !== selectedBrand) {
        return false;
      }

      // 3. Category filter
      if (selectedCategory !== "all") {
        const normCat = (c: string) => c.toLowerCase().replace(/[\s\/-]/g, "");
        if (!normCat(w.category).includes(normCat(selectedCategory)) && !normCat(selectedCategory).includes(normCat(w.category))) {
          return false;
        }
      }

      // 4. Movement filter
      if (selectedMovement !== "all") {
        const mType = w.movement?.type?.toLowerCase() || "";
        const mCal = w.movement?.caliber?.toLowerCase() || "";
        if (selectedMovement === "automatic" && !mType.includes("automatic")) return false;
        if (selectedMovement === "manual" && !mType.includes("manual")) return false;
        if (selectedMovement === "co-axial" && !mType.includes("co-axial") && !mCal.includes("co-axial")) return false;
        if (selectedMovement === "spring_drive" && !mType.includes("spring drive") && !mCal.includes("spring drive")) return false;
        if (selectedMovement === "high_beat" && (w.movement?.frequencyVph || 0) < 36000) return false;
      }

      // 5. Price Tier filter
      if (selectedPriceTier !== "all") {
        const parsePrice = (priceStr: string) => {
          const num = parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
          return isNaN(num) ? 0 : num;
        };
        const price = parsePrice(w.msrp || w.marketPrice || "$0");
        if (selectedPriceTier === "under_2k" && price > 2000) return false;
        if (selectedPriceTier === "2k_10k" && (price < 2000 || price > 10000)) return false;
        if (selectedPriceTier === "10k_30k" && (price < 10000 || price > 30000)) return false;
        if (selectedPriceTier === "30k_plus" && price < 30000) return false;
      }

      // 6. Search query with multi-token space, typo correction, and keyword support
      if (searchQuery.trim()) {
        const qClean = searchQuery.toLowerCase().trim().replace(/[^a-z0-9\s]/g, " ");
        const rawTokens = qClean.split(/\s+/).filter(Boolean);
        
        // Expand tokens with typo corrections (e.g. muesuem -> museum)
        const tokenVariants = rawTokens.map((t) => {
          const variants = [t];
          if (TYPO_MAP[t]) variants.push(TYPO_MAP[t]);
          return variants;
        });
        
        const searchableText = [
          w.brand,
          w.name,
          `${w.brand} ${w.name}`,
          w.reference,
          w.category,
          w.movement?.type || "",
          w.movement?.caliber || "",
          w.facts?.tagline || "",
          w.facts?.storyBlurb || "",
          ...(w.facts?.keyHighlights || []),
          w.facts?.historicalSignificance || "",
          w.facts?.collectorLore || "",
          w.provenanceSource || "",
          w.sourceBadgeLabel || "",
        ]
          .join(" ")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ");

        // Match if for every query token, at least one of its variants (original or typo-corrected) is found
        const matchesAllTokens = tokenVariants.every((variants) =>
          variants.some((v) => searchableText.includes(v))
        );
        if (!matchesAllTokens) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "brand_asc") {
        return a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name);
      }
      if (sortBy === "diameter_asc") {
        return (a.caseDiameter || 40) - (b.caseDiameter || 40);
      }
      if (sortBy === "diameter_desc") {
        return (b.caseDiameter || 40) - (a.caseDiameter || 40);
      }
      if (sortBy === "vph_desc") {
        return (b.movement?.frequencyVph || 28800) - (a.movement?.frequencyVph || 28800);
      }
      if (sortBy === "year_desc") {
        return parseInt(String(b.yearIntroduced || "2000"), 10) - parseInt(String(a.yearIntroduced || "2000"), 10);
      }
      // Default: Keep curated order
      return 0;
    });
  }, [searchQuery, selectedSource, selectedBrand, selectedCategory, selectedMovement, selectedPriceTier, sortBy]);

  if (!isOpen) return null;

  const handleAddWatch = (watch: Watch) => {
    const safeWatch = sanitizeWatch(watch);
    onAddWatchToCollection(safeWatch, targetCollectionId);
    horologyAudio.playCrownClick();
    setAddedWatchIds((prev) => new Set(prev).add(watch.id));
    setTimeout(() => {
      setAddedWatchIds((prev) => {
        const next = new Set(prev);
        next.delete(watch.id);
        return next;
      });
    }, 2500);
  };

  const handleInspect = (watch: Watch) => {
    horologyAudio.playCaseLid();
    onSelectWatchForInspection(sanitizeWatch(watch));
  };

  const handleSynthesizeCustom = async () => {
    if (!searchQuery.trim()) return;
    setIsSynthesizing(true);
    try {
      let customWatchData: any;
      try {
        const res = await fetch("/api/watches/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        });
        if (res.ok) {
          customWatchData = await res.json();
        } else {
          customWatchData = synthesizeWatchFromQuery(searchQuery);
        }
      } catch (err) {
        customWatchData = synthesizeWatchFromQuery(searchQuery);
      }

      const customWatch: Watch = sanitizeWatch({
        ...customWatchData,
        id: `watch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        collectionId: targetCollectionId,
        dateAdded: new Date().toISOString(),
      });

      horologyAudio.playMinuteRepeaterGong("high");
      onSelectWatchForInspection(customWatch);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSource("all");
    setSelectedBrand("all");
    setSelectedCategory("all");
    setSelectedMovement("all");
    setSelectedPriceTier("all");
    setSortBy("popular");
    horologyAudio.playCrownClick();
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedSource !== "all" ||
    selectedBrand !== "all" ||
    selectedCategory !== "all" ||
    selectedMovement !== "all" ||
    selectedPriceTier !== "all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="watch-search-engine-modal"
        className="relative w-full max-w-7xl max-h-[95vh] h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 shadow-2xl text-neutral-100 overflow-hidden"
      >
        {/* TOP HEADER & SEARCH BAR */}
        <div className="p-4 sm:p-6 pb-3 border-b border-neutral-800/80 bg-neutral-900/90 shrink-0 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Search size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 font-serif">
                    Watch Search & Discovery Engine
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300">
                    {filteredWatches.length} {filteredWatches.length === 1 ? "Option" : "Options"}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Explore curated reference points, market data, and movements across 10 global horology sources.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Destination Collection Selector */}
              {collections.length > 0 && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                  <Folder size={13} className="text-amber-400" />
                  <span className="text-neutral-400">Vitrine:</span>
                  <select
                    id="search-target-collection"
                    value={targetCollectionId}
                    onChange={(e) => setTargetCollectionId(e.target.value)}
                    className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer"
                  >
                    {collections.map((col) => (
                      <option key={col.id} value={col.id} className="bg-neutral-900 text-neutral-200">
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Close Button */}
              <button
                id="search-engine-close-btn"
                onClick={() => {
                  horologyAudio.playCrownClick();
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* MAIN SEARCH INPUT */}
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-neutral-400 pointer-events-none" size={18} />
            <input
              id="watch-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by watch name, brand, reference (e.g., Moonwatch, 126710BLRO, Royal Oak, Spring Drive, 1518, Diver, 36000 vph)..."
              className="w-full pl-11 pr-24 py-3 rounded-2xl bg-neutral-950 border border-neutral-700/80 text-sm sm:text-base text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all font-sans"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 text-xs flex items-center gap-1 transition-colors"
              >
                <X size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* HOROLOGY SOURCE PILLS (9 Sources + All) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
            <button
              id="source-filter-all"
              onClick={() => {
                setSelectedSource("all");
                horologyAudio.playCrownClick();
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                selectedSource === "all"
                  ? "bg-amber-500 text-neutral-950 font-bold shadow-md"
                  : "bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Sparkles size={13} />
              <span>All Sources ({SOURCE_CATALOG_WATCHES.length})</span>
            </button>

            {(Object.keys(HOROLOGY_SOURCES) as HorologySource[]).map((srcKey) => {
              const meta = HOROLOGY_SOURCES[srcKey];
              const isSelected = selectedSource === srcKey;
              const count = SOURCE_CATALOG_WATCHES.filter((w) => w.provenanceSource === srcKey).length;
              return (
                <button
                  key={srcKey}
                  id={`source-filter-${srcKey}`}
                  onClick={() => {
                    setSelectedSource(srcKey);
                    horologyAudio.playCrownClick();
                  }}
                  className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeColor} ring-1 ring-amber-400 font-bold shadow-md`
                      : "bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {renderSourceIcon(srcKey, 13)}
                  <span>{meta.shortName}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* SECONDARY FILTER & SORT TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Brand Filter Dropdown */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400 font-medium">Brand:</span>
                <select
                  id="filter-brand-select"
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    horologyAudio.playCrownClick();
                  }}
                  className="bg-transparent text-neutral-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-neutral-900">All Brands</option>
                  {uniqueBrands.map((brand) => (
                    <option key={brand} value={brand} className="bg-neutral-900">
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter Dropdown */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400 font-medium">Style:</span>
                <select
                  id="filter-category-select"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    horologyAudio.playCrownClick();
                  }}
                  className="bg-transparent text-neutral-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-neutral-900">All Categories</option>
                  <option value="Dress" className="bg-neutral-900">Dress</option>
                  <option value="Chronograph" className="bg-neutral-900">Chronograph</option>
                  <option value="Skeleton" className="bg-neutral-900">Skeleton</option>
                  <option value="Diver" className="bg-neutral-900">Diver</option>
                  <option value="Pilot" className="bg-neutral-900">Pilot / Aviation</option>
                  <option value="Sport" className="bg-neutral-900">Sport</option>
                  <option value="Vintage Swiss" className="bg-neutral-900">Vintage Swiss</option>
                  <option value="Occasion" className="bg-neutral-900">Occasion</option>
                  <option value="Racing" className="bg-neutral-900">Racing / Motorsport</option>
                  <option value="Field" className="bg-neutral-900">Field / Military</option>
                  <option value="Microbrand" className="bg-neutral-900">Microbrand / Independent</option>
                  <option value="GMT / Travel" className="bg-neutral-900">GMT / Travel</option>
                  <option value="Integrated" className="bg-neutral-900">Integrated Sports</option>
                  <option value="Minimalist" className="bg-neutral-900">Minimalist / Bauhaus</option>
                  <option value="Moonphase" className="bg-neutral-900">Moonphase</option>
                  <option value="Worldtimer" className="bg-neutral-900">Worldtimer</option>
                  <option value="Tank / Rectangular" className="bg-neutral-900">Tank / Rectangular</option>
                  <option value="Grand Complication" className="bg-neutral-900">Grand Complication</option>
                  <option value="Everyday" className="bg-neutral-900">Everyday</option>
                </select>
              </div>

              {/* Movement Architecture Filter */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400 font-medium">Movement:</span>
                <select
                  id="filter-movement-select"
                  value={selectedMovement}
                  onChange={(e) => {
                    setSelectedMovement(e.target.value);
                    horologyAudio.playCrownClick();
                  }}
                  className="bg-transparent text-neutral-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-neutral-900">All Movements</option>
                  <option value="automatic" className="bg-neutral-900">Automatic</option>
                  <option value="manual" className="bg-neutral-900">Manual Wind</option>
                  <option value="co-axial" className="bg-neutral-900">Co-Axial Master Chronometer</option>
                  <option value="spring_drive" className="bg-neutral-900">Spring Drive</option>
                  <option value="high_beat" className="bg-neutral-900">Hi-Beat (36,000 vph)</option>
                </select>
              </div>

              {/* Price Tier Filter */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-400 font-medium">Price:</span>
                <select
                  id="filter-price-select"
                  value={selectedPriceTier}
                  onChange={(e) => {
                    setSelectedPriceTier(e.target.value);
                    horologyAudio.playCrownClick();
                  }}
                  className="bg-transparent text-neutral-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-neutral-900">Any Price</option>
                  <option value="under_2k" className="bg-neutral-900">Under $2,000</option>
                  <option value="2k_10k" className="bg-neutral-900">$2,000 - $10,000</option>
                  <option value="10k_30k" className="bg-neutral-900">$10,000 - $30,000</option>
                  <option value="30k_plus" className="bg-neutral-900">$30,000+ Haute Horlogerie</option>
                </select>
              </div>

              {/* Reset Button */}
              {hasActiveFilters && (
                <button
                  id="reset-filters-btn"
                  onClick={clearAllFilters}
                  className="px-2.5 py-1.5 rounded-xl bg-red-950/60 border border-red-800/40 text-red-300 hover:bg-red-900/60 transition-colors font-medium flex items-center gap-1"
                >
                  <X size={12} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <ArrowUpDown size={13} className="text-amber-400" />
                <span className="text-neutral-400 font-medium">Sort:</span>
                <select
                  id="sort-by-select"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    horologyAudio.playCrownClick();
                  }}
                  className="bg-transparent text-neutral-200 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="popular" className="bg-neutral-900">Iconic / Curated</option>
                  <option value="brand_asc" className="bg-neutral-900">Brand (A-Z)</option>
                  <option value="diameter_asc" className="bg-neutral-900">Diameter (Smallest First)</option>
                  <option value="diameter_desc" className="bg-neutral-900">Diameter (Largest First)</option>
                  <option value="vph_desc" className="bg-neutral-900">Frequency (Highest VPH)</option>
                  <option value="year_desc" className="bg-neutral-900">Year Introduced</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* WATCH CARDS SCROLLABLE RESULTS AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-4">
          {filteredWatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredWatches.map((watch) => {
                const srcMeta = HOROLOGY_SOURCES[watch.provenanceSource || "the_watch_revised"];
                const isRecentlyAdded = addedWatchIds.has(watch.id);

                return (
                  <div
                    key={watch.id}
                    id={`search-card-${watch.id}`}
                    className="group relative rounded-2xl bg-neutral-900/70 border border-neutral-800/90 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 flex flex-col justify-between overflow-hidden p-4"
                  >
                    {/* Source Badge Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${srcMeta?.badgeBg || "bg-neutral-800"} ${srcMeta?.badgeBorder || "border-neutral-700"} ${srcMeta?.badgeColor || "text-neutral-300"}`}
                      >
                        {renderSourceIcon(watch.provenanceSource || "", 12)}
                        <span>{srcMeta?.shortName || watch.provenanceSource}</span>
                      </span>

                      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        {watch.category}
                      </span>
                    </div>

                    {/* Interactive Watch Display */}
                    <div
                      onClick={() => handleInspect(watch)}
                      className="relative flex items-center justify-center py-4 bg-neutral-950/60 rounded-xl border border-neutral-800/60 cursor-pointer group-hover:border-amber-500/30 transition-all group-hover:bg-neutral-950/90"
                    >
                      <WatchRenderer watch={watch} size="medium" interactiveTilt={true} showStraps={true} />
                      <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/5 transition-all rounded-xl pointer-events-none" />
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-neutral-900/90 border border-neutral-700 text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Eye size={11} className="text-amber-400" />
                        <span>Inspect</span>
                      </div>
                    </div>

                    {/* Metadata & Specifications */}
                    <div className="mt-3 space-y-2 flex-1">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                          {watch.brand}
                        </div>
                        <h3 className="text-sm font-bold text-neutral-100 line-clamp-1 group-hover:text-amber-300 transition-colors">
                          {watch.name}
                        </h3>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          Ref. {watch.reference} · {watch.yearIntroduced}
                        </div>
                      </div>

                      {/* Caliber & Tagline */}
                      {watch.facts?.tagline && (
                        <p className="text-[11px] text-neutral-400 italic line-clamp-2 leading-relaxed">
                          "{watch.facts.tagline}"
                        </p>
                      )}

                      {/* Technical Specs Strip */}
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-neutral-300 pt-1">
                        <div className="p-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center justify-between">
                          <span className="text-neutral-500">Caliber:</span>
                          <span className="font-semibold text-neutral-200 truncate ml-1">
                            {watch.movement.caliber.replace(/Calibre|Caliber/g, "").trim()}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center justify-between">
                          <span className="text-neutral-500">Diameter:</span>
                          <span className="font-semibold text-neutral-200">{watch.caseDiameter}mm</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center justify-between">
                          <span className="text-neutral-500">Reserve:</span>
                          <span className="font-semibold text-neutral-200">{watch.movement.powerReserve}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center justify-between">
                          <span className="text-neutral-500">Frequency:</span>
                          <span className="font-semibold text-neutral-200">{watch.movement.frequencyVph ? `${(watch.movement.frequencyVph / 1000).toFixed(1)}k` : "28.8k"} vph</span>
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="flex items-baseline justify-between pt-1 border-t border-neutral-800/60">
                        <div className="text-[10px] text-neutral-400">
                          MSRP: <span className="font-semibold text-neutral-200">{watch.msrp}</span>
                        </div>
                        <div className="text-[11px] font-bold text-amber-300">
                          {watch.marketPrice}
                        </div>
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-neutral-800/80">
                      <button
                        id={`inspect-btn-${watch.id}`}
                        onClick={() => handleInspect(watch)}
                        className="py-2 px-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye size={13} className="text-amber-400" />
                        <span>Inspect</span>
                      </button>

                      <button
                        id={`add-to-vitrine-btn-${watch.id}`}
                        onClick={() => handleAddWatch(watch)}
                        disabled={isRecentlyAdded}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isRecentlyAdded
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/10"
                        }`}
                      >
                        {isRecentlyAdded ? (
                          <>
                            <Check size={13} />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <Plus size={13} />
                            <span>Add to Case</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* EMPTY SEARCH RESULTS WITH AI ON-DEMAND ENGINE */
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 max-w-xl mx-auto my-6 space-y-4">
              <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-bold font-serif text-neutral-100">
                No matching reference found for "{searchQuery}"
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Would you like our AI Master Horologist to research, calibrate, and render specifications for{" "}
                <span className="text-amber-300 font-semibold">"{searchQuery}"</span> instantly?
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  id="synthesize-on-demand-btn"
                  onClick={handleSynthesizeCustom}
                  disabled={isSynthesizing || !searchQuery.trim()}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSynthesizing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Synthesizing Horology Specs...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>✨ Synthesize & Inspect with AI Horologist</span>
                    </>
                  )}
                </button>

                <button
                  onClick={clearAllFilters}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-semibold transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER BAR */}
        <div className="p-3 sm:p-4 px-6 border-t border-neutral-800 bg-neutral-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>9 Global Horological Sources Synced: Hodinkee, Wristcheck, WatchBase, Chrono24, The Watch Revised & More</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-300 font-medium">
            <span>Showing {filteredWatches.length} of {SOURCE_CATALOG_WATCHES.length} Total Curated Watches</span>
          </div>
        </div>
      </div>
    </div>
  );
};
