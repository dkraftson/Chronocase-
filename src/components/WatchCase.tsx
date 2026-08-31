import React, { useState } from "react";
import { Watch, WatchCollection, CaseSettings, WatchCategory, WatchMovement } from "../types";
import { WatchRenderer } from "./WatchRenderer";
import { MovementExhibition } from "./MovementExhibition";
import { ErrorBoundary } from "./ErrorBoundary";
import {
  Plus,
  Star,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  Trash2,
  Folder,
  FolderPlus,
  Sliders,
  Crown,
  Compass,
  Layers,
  Award,
  Clock,
  Shield,
  Zap,
  Filter,
  ArrowRightLeft,
  Check,
  RotateCw,
  RotateCcw,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";
import { STYLE_METADATA, MOVEMENT_METADATA } from "../utils/styleAndMovement";
import { HOROLOGY_SOURCES } from "../data/sourceCatalogs";

interface WatchCaseProps {
  watches: Watch[];
  collections: WatchCollection[];
  activeCollectionId: string | "all";
  onSelectCollection: (colId: string | "all") => void;
  onOpenManageCollections: () => void;
  onOpenResetVitrine: (colId: string | "all") => void;
  selectedWatch: Watch | null;
  onSelectWatch: (watch: Watch) => void;
  onAddNewWatch: () => void;
  onToggleFavorite: (id: string) => void;
  onDeleteWatch: (id: string) => void;
  onMoveWatchCollection: (watchId: string, targetCollectionId: string) => void;
  onBatchMoveWatchCollection?: (watchIds: string[], targetCollectionId: string) => void;
  caseSettings: CaseSettings;
  onUpdateCaseSettings: (settings: Partial<CaseSettings>) => void;
  filterCategory: string;
  onFilterChange: (category: string) => void;
  filterMovement: string;
  onFilterMovementChange: (movement: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const WatchCase: React.FC<WatchCaseProps> = ({
  watches,
  collections,
  activeCollectionId,
  onSelectCollection,
  onOpenManageCollections,
  onOpenResetVitrine,
  selectedWatch,
  onSelectWatch,
  onAddNewWatch,
  onToggleFavorite,
  onDeleteWatch,
  onMoveWatchCollection,
  onBatchMoveWatchCollection,
  caseSettings,
  onUpdateCaseSettings,
  filterCategory,
  onFilterChange,
  filterMovement,
  onFilterMovementChange,
  searchQuery,
  onSearchChange,
}) => {
  const [hoveredWatchId, setHoveredWatchId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [movingWatchId, setMovingWatchId] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Drag-and-Drop state for moving watches to vitrines
  const [draggedWatchId, setDraggedWatchId] = useState<string | null>(null);
  const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null);

  // Multi-Select Batch Move state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedBatchWatchIds, setSelectedBatchWatchIds] = useState<string[]>([]);
  const [batchTargetVitrineId, setBatchTargetVitrineId] = useState<string>("");

  const isLumeLighting =
    caseSettings.lighting === "lume_laboratory" || caseSettings.lighting === "midnight_vault";

  // Active collection object (if specific)
  const currentCollection = collections.find((c) => c.id === activeCollectionId);

  // Determine active visual settings (collection-specific or global)
  const activeMaterial = currentCollection?.caseSettings?.material || caseSettings.material;
  const activeCushion = currentCollection?.caseSettings?.cushionColor || caseSettings.cushionColor;

  // Case background & texture classes
  const getCaseTextureClass = () => {
    switch (activeMaterial) {
      case "piano_black":
        return "bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-neutral-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]";
      case "forest_leather":
        return "bg-gradient-to-b from-emerald-950 via-green-950 to-neutral-950 border-emerald-900/60 shadow-[0_25px_60px_-15px_rgba(6,78,59,0.5)]";
      case "carbon_fiber":
        return "bg-gradient-to-b from-slate-900 via-zinc-950 to-black border-zinc-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]";
      case "mahogany":
        return "bg-gradient-to-b from-amber-950 via-stone-950 to-neutral-950 border-amber-900/60 shadow-[0_25px_60px_-15px_rgba(120,53,15,0.4)]";
      case "walnut":
      default:
        return "bg-gradient-to-b from-[#2b1810] via-[#1c0f0a] to-[#0d0705] border-[#5c3a28]/60 shadow-[0_25px_60px_-15px_rgba(43,24,16,0.6)]";
    }
  };

  // Cushion plush background
  const getCushionClass = () => {
    switch (activeCushion) {
      case "ivory":
        return "bg-gradient-to-br from-amber-50/15 via-stone-200/10 to-stone-900/60 border-stone-400/20";
      case "midnight":
        return "bg-gradient-to-br from-blue-950/40 via-slate-900/50 to-slate-950 border-blue-500/20";
      case "burgundy":
        return "bg-gradient-to-br from-rose-950/40 via-red-950/50 to-stone-950 border-rose-600/20";
      case "hunter_green":
        return "bg-gradient-to-br from-emerald-950/40 via-green-950/50 to-stone-950 border-emerald-600/20";
      case "charcoal":
      default:
        return "bg-gradient-to-br from-neutral-800/40 via-neutral-900/60 to-black border-neutral-700/20";
    }
  };

  // Filter watches by collection, category (style), movement, and search query
  const filteredWatches = watches.filter((w) => {
    // Collection match
    const matchesCollection =
      activeCollectionId === "all" || w.collectionId === activeCollectionId;

    // Category / Style match
    const matchesCategory =
      filterCategory === "All" ||
      (filterCategory === "Favorites" && w.userFavorite) ||
      w.category === filterCategory;

    // Movement match
    const matchesMovement =
      filterMovement === "All" || w.movement.type === filterMovement;

    // Search query match with multi-token space support
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const qClean = searchQuery.toLowerCase().trim().replace(/[^a-z0-9\s]/g, " ");
      const tokens = qClean.split(/\s+/).filter(Boolean);
      const searchable = `${w.brand} ${w.name} ${w.reference} ${w.category} ${w.movement?.type || ""} ${w.movement?.caliber || ""}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ");
      matchesSearch = tokens.every((token) => searchable.includes(token));
    }

    return matchesCollection && matchesCategory && matchesMovement && matchesSearch;
  });

  // Calculate watch count per collection
  const watchCountByCollection: Record<string, number> = {};
  collections.forEach((c) => {
    watchCountByCollection[c.id] = watches.filter((w) => w.collectionId === c.id).length;
  });

  const categories = [
    { id: "All", label: "All Styles" },
    { id: "Favorites", label: "★ Favorites" },
    { id: "Dress", label: "👔 Dress" },
    { id: "Diver", label: "🌊 Diver" },
    { id: "Chronograph", label: "🏎️ Chrono" },
    { id: "Integrated", label: "⚙️ Integrated" },
    { id: "GMT / Travel", label: "✈️ GMT / Travel" },
    { id: "Grand Complication", label: "🌌 Grand Comp" },
    { id: "Field", label: "🧭 Field" },
    { id: "Pilot", label: "🛩️ Pilot" },
    { id: "Everyday", label: "⌚ Everyday" },
  ];

  const movements = [
    { id: "All", label: "All Movements" },
    { id: "Automatic", label: "⚡ Automatic" },
    { id: "Manual Wind", label: "🖐️ Manual Wind" },
    { id: "Co-Axial", label: "🌀 Co-Axial" },
    { id: "Spring Drive", label: "🌊 Spring Drive" },
    { id: "Tourbillon", label: "💎 Tourbillon" },
    { id: "Quartz", label: "🔋 Quartz" },
  ];

  const getCollectionIcon = (iconId?: string) => {
    switch (iconId) {
      case "compass":
        return <Compass size={14} />;
      case "sparkles":
        return <Sparkles size={14} />;
      case "shield":
        return <Shield size={14} />;
      case "layers":
        return <Layers size={14} />;
      case "award":
        return <Award size={14} />;
      case "clock":
        return <Clock size={14} />;
      case "crown":
      default:
        return <Crown size={14} />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* 1. COLLECTIONS NAVIGATION BAR (Vitrine Switcher & Drag-Drop Destination) */}
      <div className="bg-neutral-950/70 p-3 sm:p-4 rounded-2xl border border-neutral-800/80 shadow-lg backdrop-blur-md relative">
        {/* Drag Hint Banner */}
        {draggedWatchId && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-2">
              <ArrowRightLeft size={14} className="text-amber-400" />
              <span>Drop onto any Vitrine tab below to instantly relocate timepiece</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400/80 uppercase">Drag & Drop Active</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Collection Tab Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
            {/* All Collections Button */}
            <button
              id="collection-tab-all"
              onClick={() => {
                onSelectCollection("all");
                horologyAudio.playCrownClick();
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCollectionId === "all"
                  ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-bold"
                  : "bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800"
              }`}
            >
              <Layers size={14} />
              <span>All Timepieces</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeCollectionId === "all"
                    ? "bg-neutral-950/20 text-neutral-950"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {watches.length}
              </span>
            </button>

            {/* Individual Collection Tabs (Also HTML5 Drop Targets) */}
            {collections.map((col) => {
              const isActive = activeCollectionId === col.id;
              const isDragOver = dragOverCollectionId === col.id;
              const count = watchCountByCollection[col.id] || 0;

              return (
                <button
                  key={col.id}
                  id={`collection-tab-${col.id}`}
                  onClick={() => {
                    onSelectCollection(col.id);
                    horologyAudio.playCrownClick();
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (dragOverCollectionId !== col.id) {
                      setDragOverCollectionId(col.id);
                    }
                  }}
                  onDragLeave={(e) => {
                    // Only clear if actually leaving this element
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverCollectionId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const wId = e.dataTransfer.getData("text/plain") || draggedWatchId;
                    if (wId) {
                      onMoveWatchCollection(wId, col.id);
                    }
                    setDraggedWatchId(null);
                    setDragOverCollectionId(null);
                  }}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isDragOver
                      ? "bg-amber-400 text-neutral-950 ring-4 ring-amber-400/50 scale-105 shadow-xl font-bold animate-pulse"
                      : isActive
                      ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-bold"
                      : "bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800"
                  }`}
                  title={isDragOver ? `Drop to move watch into "${col.name}"` : `Switch view to ${col.name} or drag watches here`}
                >
                  {getCollectionIcon(col.icon)}
                  <span>{col.name}</span>
                  {isDragOver ? (
                    <span className="text-[10px] bg-neutral-950 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                      + Drop Here
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive
                          ? "bg-neutral-950/20 text-neutral-950"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Manage / Add Collection Buttons & Vitrine Reset Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="reset-vitrine-nav-btn"
              onClick={() => {
                onOpenResetVitrine(activeCollectionId);
                horologyAudio.playCrownClick();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-800 hover:border-amber-500/40 text-xs font-medium transition-all"
              title={
                activeCollectionId === "all"
                  ? "Reset All Vitrines (Start fresh or restore defaults)"
                  : `Reset "${currentCollection?.name || "Vitrine"}" to start fresh or restore defaults`
              }
            >
              <RotateCcw size={13} className="text-amber-400" />
              <span>{activeCollectionId === "all" ? "Reset All" : "Reset Vitrine"}</span>
            </button>

            <button
              id="manage-collections-btn"
              onClick={onOpenManageCollections}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 text-xs font-medium transition-colors"
              title="Organize Collections, Move & Transfer Timepieces"
            >
              <FolderPlus size={14} className="text-amber-400" />
              <span>Manage Collections</span>
            </button>
          </div>
        </div>

        {/* Current Active Collection Subtitle */}
        {currentCollection && (
          <div className="mt-2.5 pt-2.5 border-t border-neutral-800/60 flex items-center justify-between text-xs gap-3">
            <p className="text-neutral-400 italic flex items-center gap-1.5 truncate">
              <span className="text-amber-400 font-medium font-sans">Active Vitrine:</span>
              <span>{currentCollection.description || currentCollection.name}</span>
            </p>
            <button
              id="reset-active-vitrine-sub-btn"
              onClick={() => {
                onOpenResetVitrine(currentCollection.id);
                horologyAudio.playCrownClick();
              }}
              className="text-[11px] text-neutral-400 hover:text-amber-400 font-medium flex items-center gap-1 shrink-0 transition-colors"
              title="Start fresh or restore defaults for this vitrine"
            >
              <RotateCcw size={11} className="text-amber-400" />
              <span>Reset & Start Fresh</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. STYLE & MOVEMENT FILTER BAR */}
      <div className="flex flex-col gap-3 pb-2">
        {/* Style (Category) Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mr-1 flex items-center gap-1">
              <Filter size={12} />
              <span>Style:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`filter-style-${cat.id.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                onClick={() => {
                  onFilterChange(cat.id);
                  horologyAudio.playCrownClick();
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide transition-all ${
                  filterCategory === cat.id
                    ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20"
                    : "bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Ambient Lighting Toggle */}
          <div className="flex items-center bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 text-xs shrink-0">
            <button
              id="lighting-gallery-btn"
              onClick={() => onUpdateCaseSettings({ lighting: "warm_gallery" })}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                caseSettings.lighting === "warm_gallery"
                  ? "bg-amber-500/20 text-amber-300 font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Warm Gallery Lighting"
            >
              Gallery
            </button>
            <button
              id="lighting-daylight-btn"
              onClick={() => onUpdateCaseSettings({ lighting: "daylight_5000k" })}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                caseSettings.lighting === "daylight_5000k"
                  ? "bg-sky-500/20 text-sky-300 font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Studio Daylight"
            >
              Daylight
            </button>
            <button
              id="lighting-lume-btn"
              onClick={() => onUpdateCaseSettings({ lighting: "lume_laboratory" })}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                caseSettings.lighting === "lume_laboratory"
                  ? "bg-emerald-500/30 text-emerald-300 font-bold animate-pulse"
                  : "text-neutral-400 hover:text-emerald-400"
              }`}
              title="Super-LumiNova Dark Glow"
            >
              ★ Lume Glow
            </button>
          </div>
        </div>

        {/* Movement Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-neutral-800/40">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mr-1 flex items-center gap-1">
            <Zap size={12} />
            <span>Movement:</span>
          </span>
          {movements.map((mov) => (
            <button
              key={mov.id}
              id={`filter-movement-${mov.id.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              onClick={() => {
                onFilterMovementChange(mov.id);
                horologyAudio.playCrownClick();
              }}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                filterMovement === mov.id
                  ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold border"
                  : "bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 border border-neutral-800/60 hover:bg-neutral-800"
              }`}
            >
              {mov.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. THE LUXURY COLLECTOR WATCH BOX / VITRINE PRESENTATION */}
      <div
        id="luxury-watch-case"
        className={`relative rounded-3xl p-6 sm:p-8 border-4 transition-all duration-700 ${getCaseTextureClass()}`}
      >
        {/* Brass Beveled Trim & Glass Reflection Overlay */}
        <div className="absolute inset-0 rounded-[22px] pointer-events-none border border-amber-500/15 shadow-[inset_0_1px_30px_rgba(255,255,255,0.05)]" />

        {/* Ambient Top Light Spot */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-44 pointer-events-none blur-3xl transition-opacity duration-700 ${
            caseSettings.lighting === "warm_gallery"
              ? "bg-amber-500/10 opacity-100"
              : caseSettings.lighting === "daylight_5000k"
              ? "bg-sky-400/10 opacity-100"
              : caseSettings.lighting === "lume_laboratory"
              ? "bg-emerald-500/5 opacity-40"
              : "opacity-20"
          }`}
        />

        {/* Vitrine Plaque Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 px-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif tracking-wider text-amber-100/90 font-semibold uppercase">
                  {currentCollection ? currentCollection.name : "Master Horological Vitrine"}
                </h2>
                {isMultiSelectMode && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 shadow-sm animate-pulse">
                    Relocation Mode Active
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                {filteredWatches.length} {filteredWatches.length === 1 ? "Timepiece" : "Timepieces"} Displayed
                {currentCollection && ` • Collection Box`}
                <span className="hidden md:inline ml-2 text-neutral-500">
                  (Drag any watch to a Vitrine tab above to move)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Multi-Select / Batch Move Mode Toggle */}
            {filteredWatches.length > 0 && (
              <button
                id="toggle-multi-move-mode-btn"
                onClick={() => {
                  setIsMultiSelectMode((prev) => !prev);
                  setSelectedBatchWatchIds([]);
                  horologyAudio.playCrownClick();
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                  isMultiSelectMode
                    ? "bg-amber-500 text-neutral-950 border-amber-400 font-bold shadow-md shadow-amber-500/20"
                    : "bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700/60"
                }`}
                title="Select multiple watches to move to another vitrine at once"
              >
                <ArrowRightLeft size={13} />
                <span>{isMultiSelectMode ? "Exit Multi-Move" : "Multi-Move"}</span>
              </button>
            )}

            <button
              id="reset-vitrine-header-btn"
              onClick={() => {
                onOpenResetVitrine(activeCollectionId);
                horologyAudio.playCrownClick();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-700/60 hover:border-amber-500/40 text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95"
              title={
                activeCollectionId === "all"
                  ? "Reset All Vitrines to start fresh or restore defaults"
                  : `Reset "${currentCollection?.name || "Vitrine"}" to start fresh or restore defaults`
              }
            >
              <RotateCcw size={13} className="text-amber-400" />
              <span>Reset & Start Fresh</span>
            </button>

            <button
              id="add-watch-case-header-btn"
              onClick={onAddNewWatch}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-neutral-950 font-bold text-xs tracking-wider uppercase hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Plus size={15} />
              <span>Add Watch</span>
            </button>
          </div>
        </div>

        {/* Multi-Select Batch Action Floating Toolbar Dock */}
        {isMultiSelectMode && (
          <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-neutral-950 border-2 border-amber-500/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 relative z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Check size={14} className="text-amber-400" />
                <span>{selectedBatchWatchIds.length} Selected</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="batch-select-all-btn"
                  onClick={() => {
                    setSelectedBatchWatchIds(filteredWatches.map((w) => w.id));
                    horologyAudio.playCrownClick();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] font-medium border border-neutral-800 transition-colors"
                >
                  Select All
                </button>
                <button
                  id="batch-deselect-all-btn"
                  onClick={() => {
                    setSelectedBatchWatchIds([]);
                    horologyAudio.playCrownClick();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-[11px] font-medium border border-neutral-800 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Batch Destination Selector & Move Button */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-xs text-neutral-400 whitespace-nowrap">Move to Vitrine:</span>
              <select
                id="batch-target-vitrine-select"
                value={batchTargetVitrineId}
                onChange={(e) => setBatchTargetVitrineId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              >
                <option value="">Choose Target Vitrine...</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name} ({watchCountByCollection[col.id] || 0} pieces)
                  </option>
                ))}
              </select>

              <button
                id="execute-batch-move-btn"
                disabled={selectedBatchWatchIds.length === 0 || !batchTargetVitrineId}
                onClick={() => {
                  if (batchTargetVitrineId && selectedBatchWatchIds.length > 0) {
                    if (onBatchMoveWatchCollection) {
                      onBatchMoveWatchCollection(selectedBatchWatchIds, batchTargetVitrineId);
                    } else {
                      selectedBatchWatchIds.forEach((id) => onMoveWatchCollection(id, batchTargetVitrineId));
                    }
                    setSelectedBatchWatchIds([]);
                    setIsMultiSelectMode(false);
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-md shadow-amber-500/20 active:scale-95"
              >
                Move Selected ({selectedBatchWatchIds.length})
              </button>
            </div>
          </div>
        )}

        {/* Watch Grid Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
          {filteredWatches.map((watch) => {
            const isHovered = hoveredWatchId === watch.id;
            const isSelected = selectedWatch?.id === watch.id;
            const isConfirmingDelete = confirmDeleteId === watch.id;
            const isMoving = movingWatchId === watch.id;
            const isBatchSelected = selectedBatchWatchIds.includes(watch.id);

            // Get collection of this watch
            const watchCol = collections.find((c) => c.id === watch.collectionId);

            // Get style and movement metadata
            const styleMeta = STYLE_METADATA[watch?.category || "Everyday"] || STYLE_METADATA.Everyday;
            const movementType = watch?.movement?.type || "Automatic";
            const movementMeta = MOVEMENT_METADATA[movementType] || MOVEMENT_METADATA.Automatic;

            return (
              <ErrorBoundary key={watch.id} isCard>
                <div
                  id={`watch-card-${watch.id}`}
                  draggable={!isMultiSelectMode}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", watch.id);
                  setDraggedWatchId(watch.id);
                  horologyAudio.playCrownClick();
                }}
                onDragEnd={() => {
                  setDraggedWatchId(null);
                  setDragOverCollectionId(null);
                }}
                onMouseEnter={() => setHoveredWatchId(watch.id)}
                onMouseLeave={() => {
                  setHoveredWatchId(null);
                  if (!isConfirmingDelete) setMovingWatchId(null);
                }}
                onClick={() => {
                  if (isMultiSelectMode) {
                    setSelectedBatchWatchIds((prev) =>
                      prev.includes(watch.id) ? prev.filter((id) => id !== watch.id) : [...prev, watch.id]
                    );
                    horologyAudio.playCrownClick();
                  } else {
                    horologyAudio.playCrownClick();
                    onSelectWatch(watch);
                  }
                }}
                className={`group relative rounded-2xl p-4 transition-all duration-300 cursor-pointer border ${getCushionClass()} ${
                  isBatchSelected
                    ? "ring-2 ring-amber-400 bg-amber-500/10 shadow-2xl scale-[1.01]"
                    : isSelected
                    ? "ring-2 ring-amber-500/80 shadow-2xl shadow-amber-500/20 scale-[1.02]"
                    : "hover:border-amber-500/40 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1"
                } ${draggedWatchId === watch.id ? "opacity-40 border-dashed border-amber-400" : ""}`}
              >
                {/* Velvet Pillow Recess Shadow */}
                <div className="absolute inset-2 rounded-xl pointer-events-none shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)] border border-white/5" />

                {/* TOP BADGE BAR: STYLE & QUICK ACTIONS */}
                <div className="relative z-20 flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    {/* Batch Selection Checkbox */}
                    {isMultiSelectMode && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBatchWatchIds((prev) =>
                            prev.includes(watch.id) ? prev.filter((id) => id !== watch.id) : [...prev, watch.id]
                          );
                          horologyAudio.playCrownClick();
                        }}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isBatchSelected
                            ? "bg-amber-500 border-amber-400 text-neutral-950 font-bold"
                            : "bg-neutral-900 border-neutral-700 text-transparent hover:border-amber-400"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}

                    {/* Prominent Style Badge (Dress, Diver, Chronograph, etc.) */}
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border shadow-sm ${styleMeta.badgeBg} ${styleMeta.badgeText} ${styleMeta.badgeBorder}`}
                      title={`${styleMeta.label}: ${styleMeta.description}`}
                    >
                      <span>{styleMeta.emoji}</span>
                      <span className="uppercase">{watch.category}</span>
                    </div>
                  </div>

                  {/* Top Right Action Icons: Flip, Move to Vitrine, Favorite, Delete */}
                  <div className="flex items-center gap-1">
                    {/* Quick Flip to Caseback Button */}
                    <button
                      id={`flip-card-btn-${watch.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlippedCards((prev) => ({ ...prev, [watch.id]: !prev[watch.id] }));
                        horologyAudio.playCrownClick();
                      }}
                      className={`p-1.5 rounded-full transition-all border ${
                        flippedCards[watch.id]
                          ? "bg-amber-500 text-neutral-950 border-amber-400 font-bold"
                          : "text-neutral-400 hover:text-amber-300 bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700/50"
                      }`}
                      title={flippedCards[watch.id] ? "Flip back to dial" : "Flip to view caseback & movement"}
                    >
                      <RotateCw size={13} className={flippedCards[watch.id] ? "rotate-180 transition-transform" : ""} />
                    </button>

                    {/* Move to Collection / Vitrine Button */}
                    <button
                      id={`move-col-btn-${watch.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMovingWatchId((prev) => (prev === watch.id ? null : watch.id));
                      }}
                      className={`p-1.5 rounded-full transition-colors border ${
                        isMoving
                          ? "bg-amber-500 text-neutral-950 border-amber-400"
                          : "text-neutral-400 hover:text-amber-300 bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700/50"
                      }`}
                      title="Move timepiece to another vitrine box"
                    >
                      <ArrowRightLeft size={13} />
                    </button>

                    {/* Favorite Button */}
                    <button
                      id={`fav-btn-${watch.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(watch.id);
                      }}
                      className={`p-1.5 rounded-full transition-all border border-neutral-700/50 ${
                        watch.userFavorite
                          ? "text-amber-400 bg-amber-500/20 border-amber-500/40"
                          : "text-neutral-400 hover:text-amber-300 bg-neutral-900/80 hover:bg-neutral-800"
                      }`}
                      title={watch.userFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Star size={13} fill={watch.userFavorite ? "currentColor" : "none"} />
                    </button>

                    {/* Quick Delete Button */}
                    <button
                      id={`delete-btn-${watch.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isConfirmingDelete) {
                          onDeleteWatch(watch.id);
                          setConfirmDeleteId(null);
                          horologyAudio.playCrownClick();
                        } else {
                          setConfirmDeleteId(watch.id);
                          setTimeout(() => setConfirmDeleteId(null), 3500);
                        }
                      }}
                      className={`p-1.5 rounded-full transition-all border ${
                        isConfirmingDelete
                          ? "bg-rose-600 text-white border-rose-500 ring-2 ring-rose-400 animate-bounce"
                          : "text-neutral-400 hover:text-rose-400 bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700/50"
                      }`}
                      title={isConfirmingDelete ? "Click again to confirm deletion" : "Delete watch from vitrine"}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Move to Vitrine Popover Menu */}
                {isMoving && (
                  <div
                    className="absolute top-12 right-3 z-30 bg-neutral-950 p-3 rounded-2xl border-2 border-amber-500/60 shadow-2xl space-y-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between pb-1 mb-1 border-b border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                        Move To Vitrine:
                      </span>
                      <button
                        onClick={() => setMovingWatchId(null)}
                        className="text-neutral-500 hover:text-neutral-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    {collections.map((c) => {
                      const isCurrent = watch.collectionId === c.id;
                      return (
                        <button
                          key={c.id}
                          id={`move-target-${c.id}`}
                          onClick={() => {
                            onMoveWatchCollection(watch.id, c.id);
                            setMovingWatchId(null);
                            horologyAudio.playCrownClick();
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                            isCurrent
                              ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                              : "hover:bg-neutral-800 text-neutral-200 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-amber-400">{getCollectionIcon(c.icon)}</span>
                            <span className="truncate">{c.name}</span>
                          </div>
                          {isCurrent ? (
                            <span className="text-[10px] font-mono text-amber-400 shrink-0 font-bold">Current</span>
                          ) : (
                            <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                              {watchCountByCollection[c.id] || 0}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Confirm Delete Warning Banner */}
                {isConfirmingDelete && (
                  <div
                    className="absolute top-12 inset-x-4 z-30 bg-rose-950/95 border border-rose-600 p-2 rounded-xl text-center text-xs text-rose-200 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-bold block">Remove Timepiece?</span>
                    <span className="text-[10px] text-rose-300 block">Click trash icon again to delete</span>
                  </div>
                )}

                {/* The Watch Render Canvas (Front Dial vs Exhibition Movement Caseback) */}
                <div className="relative py-2 flex items-center justify-center min-h-[250px]">
                  {flippedCards[watch.id] ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                      <MovementExhibition watch={watch} size="medium" />
                    </div>
                  ) : (
                    <WatchRenderer
                      watch={watch}
                      size="medium"
                      isLumeMode={isLumeLighting}
                      interactiveTilt={isHovered}
                    />
                  )}

                  {/* Quick Inspect Hover Overlay Button */}
                  <div className="absolute bottom-1 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950/90 text-amber-300 text-xs font-medium border border-amber-500/40 shadow-lg backdrop-blur-md">
                      <Eye size={12} />
                      <span>
                        {flippedCards[watch.id] ? "Inspect Movement & Dossier" : "Inspect Details & History"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Watch Metadata Card Details */}
                <div className="mt-1 pt-2.5 border-t border-neutral-800/60">
                  {/* Brand & Reference */}
                  <div className="flex items-baseline justify-between gap-1">
                    <h3 className="font-bold text-sm text-neutral-100 truncate group-hover:text-amber-300 transition-colors">
                      {watch.brand}
                    </h3>
                    <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                      Ref. {watch.reference}
                    </span>
                  </div>

                  {/* Watch Model Name */}
                  <p className="text-xs text-neutral-300 font-medium truncate mt-0.5">
                    {watch.name}
                  </p>

                  {/* PROMINENT MOVEMENT TYPE & CALIBER BADGE */}
                  <div className="mt-2.5 p-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-1 text-amber-300 font-medium truncate">
                      <span>{movementMeta.iconSymbol}</span>
                      <span className="font-semibold">{watch?.movement?.type || "Automatic"}</span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400 shrink-0">
                      {(watch?.movement?.caliber || "Calibre").split(" ")[0]} • {((watch?.movement?.frequencyVph || 28800) / 1000).toFixed(0)}k vph
                    </div>
                  </div>

                  {/* Story Behind The Piece Blurb */}
                  <div className="mt-2.5 p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80 group-hover:border-amber-500/30 transition-all text-left">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-1">
                      <BookOpen size={11} className="text-amber-400 shrink-0" />
                      <span>Story Behind The Piece</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed italic">
                      "{watch?.facts?.storyBlurb || watch?.facts?.tagline || (watch?.facts?.historicalSignificance ? watch.facts.historicalSignificance.split('.')[0] + '.' : 'A landmark horological creation.')}"
                    </p>
                  </div>

                  {/* Secondary Metrics & Provenance Tag & Vitrine Assignment */}
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2.5 font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      {watchCol && (
                        <button
                          id={`card-vitrine-tag-${watch.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovingWatchId((prev) => (prev === watch.id ? null : watch.id));
                          }}
                          className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-[10px] font-sans text-neutral-300 hover:text-amber-300 border border-neutral-700/60 hover:border-amber-500/40 flex items-center gap-1 transition-colors"
                          title={`Assigned to Vitrine: ${watchCol.name} (Click to move)`}
                        >
                          <span className="text-amber-400">{getCollectionIcon(watchCol.icon)}</span>
                          <span className="truncate max-w-[85px]">{watchCol.name}</span>
                        </button>
                      )}
                      {watch.provenanceSource && HOROLOGY_SOURCES[watch.provenanceSource] ? (
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-sans font-semibold ${HOROLOGY_SOURCES[watch.provenanceSource].badgeBg} ${HOROLOGY_SOURCES[watch.provenanceSource].badgeColor} border ${HOROLOGY_SOURCES[watch.provenanceSource].badgeBorder}`}>
                          {HOROLOGY_SOURCES[watch.provenanceSource].shortName}
                        </span>
                      ) : null}
                      <span>{watch.caseDiameter}mm</span>
                    </div>
                    {watch.marketPrice && (
                      <span className="text-amber-400 font-semibold shrink-0">{watch.marketPrice.split(" ")[0]}</span>
                    )}
                  </div>
                </div>
              </div>
            </ErrorBoundary>
            );
          })}

          {/* If vitrine has 0 watches matching or empty, show prominent Empty Vitrine Fresh Slate Card */}
          {filteredWatches.length === 0 && (
            <div
              id="empty-vitrine-slate-card"
              className="col-span-full rounded-3xl p-8 sm:p-12 border-2 border-dashed border-amber-500/30 bg-gradient-to-b from-neutral-900/40 via-neutral-950/60 to-black/80 flex flex-col items-center justify-center text-center my-4 backdrop-blur-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/10">
                <Sparkles size={28} />
              </div>
              <h3 className="text-lg font-serif font-bold text-neutral-100 mb-1">
                {searchQuery || filterCategory !== "All" || filterMovement !== "All"
                  ? "No Timepieces Match Filter Criteria"
                  : `Vitrine "${currentCollection ? currentCollection.name : "Showcase"}" is Empty`}
              </h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mb-6 leading-relaxed">
                {searchQuery || filterCategory !== "All" || filterMovement !== "All"
                  ? "Try clearing your search query or style filters to see all timepieces in this vitrine."
                  : "You have a fresh, clean vitrine ready for your bespoke horological acquisitions and custom references."}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  id="empty-state-add-watch-btn"
                  onClick={onAddNewWatch}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  <Plus size={16} />
                  <span>Input First Watch</span>
                </button>

                <button
                  id="empty-state-restore-defaults-btn"
                  onClick={() => {
                    onOpenResetVitrine(activeCollectionId);
                    horologyAudio.playCrownClick();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-amber-300 border border-neutral-700 hover:border-amber-500/40 text-xs font-semibold tracking-wide transition-all"
                >
                  <RotateCcw size={14} className="text-amber-400" />
                  <span>Restore Curated Defaults</span>
                </button>
              </div>
            </div>
          )}

          {/* Empty Cushion Slot to Add Watch */}
          {filteredWatches.length > 0 && (
            <div
              id="add-watch-slot-card"
              onClick={onAddNewWatch}
              className="rounded-2xl p-6 flex flex-col items-center justify-center min-h-[360px] border-2 border-dashed border-neutral-700/60 hover:border-amber-500/60 transition-all duration-300 cursor-pointer group bg-neutral-900/30 hover:bg-neutral-900/60"
            >
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-all shadow-lg mb-4">
                <Plus size={24} />
              </div>
              <h4 className="text-sm font-semibold text-neutral-200 group-hover:text-amber-300 transition-colors">
                Add Timepiece to Vitrine
              </h4>
              <p className="text-xs text-neutral-400 text-center max-w-[200px] mt-1.5">
                Enter any watch model or vintage reference to render, classify style, and inspect
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
