import React, { useState, useEffect } from "react";
import { Watch, StrapType, BezelMaterial, ChatMessage, WatchCollection } from "../types";
import { WatchRenderer } from "./WatchRenderer";
import { MovementExhibition } from "./MovementExhibition";
import {
  X,
  RotateCw,
  Moon,
  Sun,
  Shield,
  Clock,
  Compass,
  DollarSign,
  Sparkles,
  MessageSquare,
  BookOpen,
  Volume2,
  VolumeX,
  Layers,
  ChevronRight,
  Send,
  Loader2,
  Bookmark,
  Check,
  Trash2,
  Folder,
  Zap,
  Eye,
  Disc,
  Feather,
  CircleDot,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";
import { STYLE_METADATA, MOVEMENT_METADATA } from "../utils/styleAndMovement";
import { HOROLOGY_SOURCES } from "../data/sourceCatalogs";

interface WatchInspectionModalProps {
  watch: Watch;
  collections?: WatchCollection[];
  onClose: () => void;
  onUpdateWatch: (updated: Watch) => void;
  onDeleteWatch?: (id: string) => void;
}

export const WatchInspectionModal: React.FC<WatchInspectionModalProps> = ({
  watch,
  collections = [],
  onClose,
  onUpdateWatch,
  onDeleteWatch,
}) => {
  const [activeTab, setActiveTab] = useState<
    "style_movement" | "caseback" | "facts" | "specs" | "lore" | "watchmaker" | "notes"
  >("style_movement");
  const [viewMode, setViewMode] = useState<"front" | "back">("front");
  const [isLumeMode, setIsLumeMode] = useState(false);
  const [selectedStrap, setSelectedStrap] = useState<StrapType>(watch.renderingConfig.strapType);
  const [bezelAngle, setBezelAngle] = useState(0);
  const [isTicking, setIsTicking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Ask Watchmaker Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      sender: "watchmaker",
      text: `Greetings. I am your master horologist and conservator. Ask me anything regarding the ${watch.category} style attributes, ${watch.movement.type} (${watch.movement.caliber}) movement mechanics, heritage, servicing, or market nuances of the ${watch.brand} ${watch.name} (Ref. ${watch.reference}).`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Notes state
  const [collectorNotes, setCollectorNotes] = useState(watch.collectorNotes || "");
  const [customEngraving, setCustomEngraving] = useState(watch.customEngraving || "");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    watch.collectionId || collections[0]?.id || ""
  );
  const [isSavedNotes, setIsSavedNotes] = useState(false);

  // Sync selected strap if watch updates
  useEffect(() => {
    if (watch.renderingConfig.strapType) {
      setSelectedStrap(watch.renderingConfig.strapType);
    }
  }, [watch.renderingConfig.strapType]);

  const styleMeta = STYLE_METADATA[watch.category] || STYLE_METADATA.Everyday;
  const movementMeta = MOVEMENT_METADATA[watch.movement.type] || MOVEMENT_METADATA.Automatic;

  // Toggle Front and Back with Audio Feedback
  const handleToggleView = () => {
    setViewMode((prev) => {
      const next = prev === "front" ? "back" : "front";
      if (next === "back") {
        // If switching to back, highlight caseback tab if on style_movement
        if (activeTab === "style_movement") {
          setActiveTab("caseback");
        }
      } else {
        if (activeTab === "caseback") {
          setActiveTab("style_movement");
        }
      }
      return next;
    });
    horologyAudio.playCrownClick();
  };

  // Keyboard shortcut listener ('f' or Space to flip view)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleToggleView();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, activeTab]);

  // Continuous mechanical tick loop when ticking is enabled
  useEffect(() => {
    if (!isTicking) return;
    const vph = watch.movement.frequencyVph || 28800;
    const intervalMs = (3600 / vph) * 1000;
    let count = 0;

    const timer = setInterval(() => {
      horologyAudio.playMechanicalTick(count % 2 === 0 ? "tick" : "tock");
      count++;
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isTicking, watch.movement.frequencyVph]);

  // Handle Ask Watchmaker
  const handleSendQuestion = async () => {
    if (!inputQuestion.trim() || isAsking) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: inputQuestion.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const questionText = inputQuestion.trim();
    setInputQuestion("");
    setIsAsking(true);

    try {
      const res = await fetch("/api/watches/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watchName: watch.name,
          brand: watch.brand,
          reference: watch.reference,
          question: questionText,
        }),
      });

      if (!res.ok) throw new Error("Failed to consult watchmaker");
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `wm-${Date.now()}`,
        sender: "watchmaker",
        text: data.answer || "Horological inspection completed.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `wm-err-${Date.now()}`,
        sender: "watchmaker",
        text: `Regarding the ${watch.brand} ${watch.name}: This model represents exceptional craftsmanship with its ${watch.movement.caliber} caliber (${watch.movement.type}). Standard recommended service intervals are 5–10 years for complete overhaul and gasket pressure testing.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAsking(false);
    }
  };

  // Handle Save Notes & Collection
  const handleSaveNotes = () => {
    onUpdateWatch({
      ...watch,
      collectorNotes,
      customEngraving,
      collectionId: selectedCollectionId,
      renderingConfig: {
        ...watch.renderingConfig,
        strapType: selectedStrap,
      },
    });
    setIsSavedNotes(true);
    setTimeout(() => setIsSavedNotes(false), 2000);
  };

  const strapOptions: { id: StrapType; label: string }[] = [
    { id: "oyster_bracelet", label: "Oyster Steel" },
    { id: "jubilee_bracelet", label: "Jubilee 5-Link" },
    { id: "integrated_steel", label: "Integrated Steel" },
    { id: "leather_black", label: "Black Leather" },
    { id: "leather_alligator", label: "Alligator Leather" },
    { id: "leather_suede", label: "Suede Leather" },
    { id: "rubber_black", label: "Black Rubber" },
    { id: "rubber_blue", label: "Ocean Blue Rubber" },
    { id: "rubber_orange", label: "Orange Dive Rubber" },
    { id: "rubber_oysterflex", label: "Oysterflex Rubber" },
    { id: "nato_fabric", label: "NATO Strap" },
  ];

  return (
    <div
      id="watch-inspection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col lg:flex-row my-auto max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-inspection-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700/60 transition-colors shadow-lg"
        >
          <X size={18} />
        </button>

        {/* LEFT COLUMN: The Interactive 3D Watch Stage & Live Fine-Tuner */}
        <div className="w-full lg:w-1/2 p-4 sm:p-6 lg:p-7 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-neutral-800 bg-neutral-950/60 relative overflow-y-auto max-h-[50vh] lg:max-h-[94vh] custom-scrollbar">
          {/* Top Stage Controls Bar */}
          <div className="w-full flex items-center justify-between z-20 mb-3">
            <div className="flex items-center gap-2">
              {/* Prominent Flip Watch Front / Back Toggle Button */}
              <button
                id="toggle-view-front-back-btn"
                onClick={handleToggleView}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 shadow-lg ${
                  viewMode === "back"
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 border-amber-400 shadow-amber-500/25 ring-2 ring-amber-400/40"
                    : "bg-neutral-900 text-amber-300 border-amber-500/40 hover:bg-neutral-800 hover:border-amber-400 shadow-black/40"
                }`}
                title="Press 'F' key or click to flip watch"
              >
                <RotateCw
                  size={14}
                  className={`transition-transform duration-500 ${
                    viewMode === "back" ? "rotate-180" : ""
                  }`}
                />
                <span>{viewMode === "front" ? "Flip: View Caseback" : "Flip: View Dial"}</span>
              </button>

              {/* Lume Mode Glow Toggle (front view only) */}
              {viewMode === "front" && (
                <button
                  id="toggle-lume-mode-btn"
                  onClick={() => setIsLumeMode((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    isLumeMode
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse"
                      : "bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-emerald-400"
                  }`}
                  title="Super-LumiNova Dark Glow Test"
                >
                  {isLumeMode ? <Sun size={13} /> : <Moon size={13} />}
                  <span>Lume Test</span>
                </button>
              )}
            </div>

            {/* Escapement Ticking ASMR Toggle & Minute Repeater Gong */}
            <div className="flex items-center gap-1.5">
              <button
                id="toggle-mechanical-ticking-btn"
                onClick={() => {
                  horologyAudio.unlockContext();
                  setIsTicking((prev) => {
                    const next = !prev;
                    if (next) {
                      horologyAudio.setMuted(false);
                    }
                    return next;
                  });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isTicking
                    ? "bg-amber-500/25 text-amber-300 border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40"
                    : "bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-amber-300"
                }`}
                title={`Listen to ${watch.movement.frequencyVph || 28800} vph mechanical escapement pallet oscillation`}
              >
                {isTicking ? <Volume2 size={13} className="animate-pulse text-amber-400" /> : <VolumeX size={13} />}
                <span>{isTicking ? `${((watch.movement.frequencyVph || 28800) / 3600).toFixed(1)}Hz Ticking` : "Escapement ASMR"}</span>
              </button>

              {/* Minute Repeater Cathedral Gong Chime Test */}
              <button
                id="chime-minute-repeater-btn"
                onClick={() => {
                  horologyAudio.unlockContext();
                  horologyAudio.setMuted(false);
                  // Play classic Minute Repeater hour + quarter chime sequence
                  horologyAudio.playMinuteRepeaterGong("low", 1.2);
                  setTimeout(() => horologyAudio.playMinuteRepeaterGong("high", 1.0), 320);
                  setTimeout(() => horologyAudio.playMinuteRepeaterGong("low", 1.4), 640);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-700 text-xs font-medium transition-colors"
                title="Strike Haute Horlogerie Cathedral Gong Chime"
              >
                <Disc size={13} className="text-amber-400" />
                <span className="hidden sm:inline">Chime Gong</span>
              </button>
            </div>
          </div>

          {/* Interactive 3D Watch Stage with Smooth Flip Transition */}
          <div
            className={`relative w-full flex-1 flex flex-col items-center justify-center min-h-[380px] sm:min-h-[440px] rounded-3xl transition-colors duration-500 overflow-hidden ${
              isLumeMode ? "bg-black" : "bg-gradient-to-b from-neutral-900/50 via-neutral-950/80 to-black"
            }`}
            style={{ perspective: "1200px" }}
          >
            {/* Ambient Stage Lighting Glow */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
                viewMode === "back"
                  ? "bg-radial-at-center from-amber-500/10 via-transparent to-transparent opacity-80"
                  : isLumeMode
                  ? "bg-emerald-500/5 opacity-50"
                  : "bg-radial-at-center from-white/5 via-transparent to-transparent opacity-40"
              }`}
            />

            {/* 3D Flip Card Container */}
            <div
              className="relative w-full flex items-center justify-center transition-all duration-700 ease-out"
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {viewMode === "front" ? (
                <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                  <WatchRenderer
                    watch={watch}
                    size="hero"
                    isLumeMode={isLumeMode}
                    interactiveBezel={
                      watch.renderingConfig.caseBezelType === "diver_60" ||
                      watch.renderingConfig.caseBezelType === "gmt_24"
                    }
                    interactiveTilt={true}
                    customStrap={selectedStrap}
                    bezelAngleOffset={bezelAngle}
                    onBezelRotate={(angle) => setBezelAngle(angle)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                  <MovementExhibition watch={watch} size="hero" onFlipToFront={handleToggleView} />
                </div>
              )}
            </div>

            {/* Floating Turn Over / Flip Pill Badge */}
            <button
              id="stage-flip-watch-pill"
              onClick={handleToggleView}
              className="mt-2 group flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-amber-500/30 hover:border-amber-400 text-amber-200 text-xs font-medium backdrop-blur-md transition-all shadow-lg hover:scale-105"
            >
              <RotateCw size={12} className="text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
              <span>
                {viewMode === "front"
                  ? "Turn Over: See Movement & Caseback (Press F)"
                  : "Turn Over: See Watch Face & Dial (Press F)"}
              </span>
            </button>

            {/* Rotating Bezel Hint (when front) */}
            {viewMode === "front" &&
              (watch.renderingConfig.caseBezelType === "diver_60" ||
                watch.renderingConfig.caseBezelType === "gmt_24") && (
                <div className="text-[10px] text-neutral-400 mt-1">
                  Drag outer bezel to rotate elapsed timer
                </div>
              )}
          </div>

          {/* Interactive Dial Color, Case Finish & Strap Customizer Bar */}
          {viewMode === "front" && (
            <div className="w-full mt-3 pt-3 border-t border-neutral-800/80 space-y-2.5">
              {/* Dial Color Selector */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  <span>Dial Color:</span>
                  <span className="text-amber-400 font-mono">
                    {watch.renderingConfig.dialColor === "#e2e8f0"
                      ? "Silver"
                      : watch.renderingConfig.dialColor === "#f8fafc"
                      ? "Opaline White"
                      : watch.renderingConfig.dialColor === "#09090b"
                      ? "Obsidian Black"
                      : watch.renderingConfig.dialColor === "#1e3a8a"
                      ? "Sunburst Blue"
                      : watch.renderingConfig.dialColor === "#064e3b"
                      ? "Emerald Green"
                      : watch.renderingConfig.dialColor === "#d97706"
                      ? "Champagne Gold"
                      : watch.renderingConfig.dialColor === "#fb7185"
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
                      id={`inspect-dial-color-${d.label.toLowerCase()}`}
                      onClick={() => {
                        onUpdateWatch({
                          ...watch,
                          renderingConfig: {
                            ...watch.renderingConfig,
                            dialColor: d.color,
                            markerColor: d.color === "#d97706" ? "#f59e0b" : "#e2e8f0",
                            handsColor: d.color === "#d97706" ? "#fbbf24" : "#ffffff",
                          },
                        });
                        horologyAudio.playCrownClick();
                      }}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${d.bg} ${
                        watch.renderingConfig.dialColor === d.color
                          ? "ring-2 ring-amber-400 scale-110 border-white"
                          : "border-neutral-700/60 hover:scale-105 opacity-80 hover:opacity-100"
                      }`}
                      title={`Set dial color to ${d.label}`}
                    />
                  ))}
                </div>
              </div>

              {/* Case Metal Finish Selector */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
                  <span>Case Metal Finish:</span>
                  <span className="text-amber-400 font-mono capitalize">
                    {watch.renderingConfig.caseFinish.replace("_", " ")}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  {[
                    { id: "steel", label: "Steel / Silver" },
                    { id: "titanium", label: "Titanium" },
                    { id: "yellow_gold", label: "Yellow Gold" },
                    { id: "rose_gold", label: "Rose Gold" },
                  ].map((metal) => (
                    <button
                      key={metal.id}
                      type="button"
                      id={`inspect-metal-finish-${metal.id}`}
                      onClick={() => {
                        const isGold = metal.id.includes("gold");
                        onUpdateWatch({
                          ...watch,
                          renderingConfig: {
                            ...watch.renderingConfig,
                            caseFinish: metal.id as any,
                            markerColor: isGold ? "#f59e0b" : "#e2e8f0",
                            handsColor: isGold ? "#fbbf24" : "#ffffff",
                          },
                        });
                        horologyAudio.playCrownClick();
                      }}
                      className={`px-1.5 py-1 rounded-lg border text-center font-medium transition-all ${
                        watch.renderingConfig.caseFinish === metal.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {metal.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bezel Material Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <CircleDot size={12} />
                    <span>Bezel Material & Insert:</span>
                  </span>
                  <span className="text-[11px] text-amber-400 capitalize">
                    {(watch.renderingConfig.bezelMaterial || "default").replace("_", " ")}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 text-[11px]">
                  {[
                    { id: "ceramic_black", label: "Ceramic Black" },
                    { id: "ceramic_blue", label: "Ceramic Blue" },
                    { id: "ceramic_green", label: "Ceramic Green" },
                    { id: "ceramic_pepsi", label: "Pepsi 24H" },
                    { id: "ceramic_batman", label: "Batman 24H" },
                    { id: "steel_brushed", label: "Brushed Steel" },
                    { id: "steel_polished", label: "Polished Steel" },
                    { id: "yellow_gold", label: "Yellow Gold" },
                    { id: "rose_gold", label: "Rose Gold" },
                    { id: "titanium", label: "Titanium" },
                    { id: "carbon", label: "Forged Carbon" },
                    { id: "fluted_gold", label: "Fluted Gold" },
                    { id: "fluted_steel", label: "Fluted Steel" },
                  ].map((bMat) => (
                    <button
                      key={bMat.id}
                      type="button"
                      id={`inspect-bezel-mat-${bMat.id}`}
                      onClick={() => {
                        const isPepsi = bMat.id === "ceramic_pepsi";
                        const isBatman = bMat.id === "ceramic_batman";
                        const isFluted = bMat.id.startsWith("fluted");
                        onUpdateWatch({
                          ...watch,
                          renderingConfig: {
                            ...watch.renderingConfig,
                            bezelMaterial: bMat.id as any,
                            caseBezelType: (isPepsi || isBatman)
                              ? "gmt_24"
                              : isFluted
                              ? "fluted"
                              : watch.renderingConfig.caseBezelType,
                            bezelColor:
                              bMat.id === "ceramic_black"
                                ? "#09090b"
                                : bMat.id === "ceramic_blue"
                                ? "#1e3a8a"
                                : bMat.id === "ceramic_green"
                                ? "#064e3b"
                                : bMat.id === "yellow_gold"
                                ? "#eab308"
                                : bMat.id === "rose_gold"
                                ? "#fb7185"
                                : watch.renderingConfig.bezelColor,
                          },
                        });
                        horologyAudio.playCrownClick();
                      }}
                      className={`px-1.5 py-1 rounded-lg border text-center font-medium transition-all ${
                        watch.renderingConfig.bezelMaterial === bMat.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {bMat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strap Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <Layers size={12} />
                    <span>Strap & Bracelet Fitting:</span>
                  </span>
                  <span className="text-[11px] text-amber-400 capitalize">
                    {selectedStrap.replace("_", " ")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {strapOptions.map((opt) => (
                    <button
                      key={opt.id}
                      id={`strap-opt-${opt.id}`}
                      onClick={() => {
                        setSelectedStrap(opt.id);
                        onUpdateWatch({
                          ...watch,
                          renderingConfig: {
                            ...watch.renderingConfig,
                            strapType: opt.id,
                          },
                        });
                        horologyAudio.playCrownClick();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        selectedStrap === opt.id
                          ? "bg-amber-500 text-neutral-950 font-bold"
                          : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: The Horological Dossier, Facts, & Style/Movement Breakdown */}
        <div className="w-full lg:w-1/2 flex flex-col h-full max-h-[50vh] lg:max-h-[94vh] overflow-hidden">
          {/* Header Title & Reference */}
          <div className="p-6 pb-4 border-b border-neutral-800 bg-neutral-900/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 font-mono">
                {watch.brand}
              </span>
              <span className="text-xs font-mono text-neutral-400">
                Ref. {watch.reference}
              </span>
            </div>

            <h1 className="text-2xl font-serif font-bold text-neutral-100">
              {watch.name}
            </h1>

            {/* HIGH-VISIBILITY STYLE & MOVEMENT HERO BADGES */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Style Badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${styleMeta.badgeBg} ${styleMeta.badgeText} ${styleMeta.badgeBorder}`}
              >
                <span>{styleMeta.emoji}</span>
                <span className="uppercase">Style: {watch.category}</span>
              </div>

              {/* Movement Badge */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${movementMeta.badgeBg} ${movementMeta.badgeText} ${movementMeta.badgeBorder}`}
              >
                <span>{movementMeta.iconSymbol}</span>
                <span>Movement: {watch.movement.type}</span>
              </div>

              {/* Source Provenance Badge */}
              {watch.provenanceSource && HOROLOGY_SOURCES[watch.provenanceSource] && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${HOROLOGY_SOURCES[watch.provenanceSource].badgeBg} ${HOROLOGY_SOURCES[watch.provenanceSource].badgeColor} ${HOROLOGY_SOURCES[watch.provenanceSource].badgeBorder}`}
                  title={HOROLOGY_SOURCES[watch.provenanceSource].name}
                >
                  <BookOpen size={11} />
                  <span>{HOROLOGY_SOURCES[watch.provenanceSource].shortName}</span>
                </div>
              )}

              {/* Caseback Quick Flip Action */}
              <button
                id="header-flip-caseback-btn"
                onClick={handleToggleView}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 transition-all hover:border-amber-400"
              >
                <RotateCw size={11} />
                <span>{viewMode === "front" ? "Inspect Back" : "Inspect Dial"}</span>
              </button>

              {/* Delete Button (Direct Access in Header) */}
              {onDeleteWatch && (
                <button
                  id="header-delete-watch-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="ml-auto p-1.5 rounded-lg bg-neutral-900 hover:bg-rose-950/80 text-neutral-400 hover:text-rose-400 border border-neutral-800 transition-colors flex items-center gap-1 text-xs"
                  title="Delete timepiece from vitrine"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
            </div>

            {/* Featured Story Behind The Piece Blurb */}
            <div className="mt-3.5 p-3 rounded-xl bg-neutral-950/80 border border-amber-500/30 text-xs shadow-inner">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[10px] mb-1">
                <BookOpen size={12} className="text-amber-400" />
                <span>The Story Behind This Piece</span>
              </div>
              <p className="text-neutral-200 leading-relaxed italic font-serif text-[12.5px]">
                "{watch.facts.storyBlurb || watch.facts.tagline || (watch.facts.historicalSignificance ? watch.facts.historicalSignificance.split('.')[0] + '.' : 'A landmark horological creation.')}"
              </p>
            </div>
          </div>

          {/* Delete Confirmation Banner */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-950/90 border-b border-rose-800 flex items-center justify-between gap-3 text-xs text-rose-100">
              <div className="flex items-center gap-2">
                <Trash2 size={16} className="text-rose-400 shrink-0" />
                <span>
                  Permanently remove <strong>{watch.brand} {watch.name}</strong> from your collection?
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-entry-btn"
                  onClick={() => {
                    if (onDeleteWatch) {
                      onDeleteWatch(watch.id);
                      horologyAudio.playCrownClick();
                      onClose();
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center px-4 border-b border-neutral-800 bg-neutral-950/40 text-xs font-medium overflow-x-auto scrollbar-thin">
            <button
              id="tab-style-movement-btn"
              onClick={() => {
                setActiveTab("style_movement");
                if (viewMode === "back") setViewMode("front");
              }}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "style_movement"
                  ? "border-amber-500 text-amber-300 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Zap size={14} className="text-amber-400" />
              <span>Style & Movement</span>
            </button>

            {/* DEDICATED CASEBACK & MOVEMENT EXHIBITION TAB */}
            <button
              id="tab-caseback-btn"
              onClick={() => {
                setActiveTab("caseback");
                if (viewMode !== "back") {
                  setViewMode("back");
                  horologyAudio.playCrownClick();
                }
              }}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "caseback"
                  ? "border-amber-500 text-amber-300 font-bold bg-amber-500/5"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <RotateCw size={14} className="text-amber-400" />
              <span>Caseback & Caliber</span>
            </button>

            <button
              id="tab-facts-btn"
              onClick={() => setActiveTab("facts")}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "facts"
                  ? "border-amber-500 text-amber-300 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <BookOpen size={14} />
              <span>Dossier & Facts</span>
            </button>

            <button
              id="tab-specs-btn"
              onClick={() => setActiveTab("specs")}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "specs"
                  ? "border-amber-500 text-amber-300 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Shield size={14} />
              <span>Caliber Specs</span>
            </button>

            <button
              id="tab-lore-btn"
              onClick={() => setActiveTab("lore")}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "lore"
                  ? "border-amber-500 text-amber-300 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Sparkles size={14} />
              <span>Collector Lore</span>
            </button>

            <button
              id="tab-watchmaker-btn"
              onClick={() => setActiveTab("watchmaker")}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "watchmaker"
                  ? "border-amber-500 text-amber-300 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <MessageSquare size={14} />
              <span>Ask Watchmaker</span>
            </button>

            <button
              id="tab-notes-btn"
              onClick={() => setActiveTab("notes")}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "notes"
                  ? "border-amber-500 text-amber-300 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Bookmark size={14} />
              <span>Manage & Notes</span>
            </button>
          </div>

          {/* TAB CONTENTS (Scrollable) */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-neutral-300 text-sm">
            {/* 0. DEDICATED STYLE & MOVEMENT BREAKDOWN TAB */}
            {activeTab === "style_movement" && (
              <div className="space-y-6">
                {/* 1. Style Breakdown Card */}
                <div className={`p-4 rounded-2xl border ${styleMeta.badgeBorder} bg-neutral-900/60 shadow-lg`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{styleMeta.emoji}</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
                        Horological Style Classification
                      </span>
                      <h3 className="text-base font-bold text-neutral-100">{styleMeta.label}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed mt-1">
                    {styleMeta.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-neutral-800/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                      Key Defining Style Characteristics:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {styleMeta.keyTraits.map((trait, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-neutral-300 bg-neutral-950/60 p-2 rounded-lg border border-neutral-800"
                        >
                          <Check size={13} className="text-amber-400 shrink-0" />
                          <span>{trait}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Movement Architecture Card */}
                <div className={`p-4 rounded-2xl border ${movementMeta.badgeBorder} bg-neutral-900/60 shadow-lg`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{movementMeta.iconSymbol}</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
                        Escapement & Caliber Mechanics
                      </span>
                      <h3 className="text-base font-bold text-neutral-100">
                        {movementMeta.label} ({watch.movement.caliber})
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed mt-1">
                    {movementMeta.mechanics}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                    <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Frequency / Beat</span>
                      <span className="font-bold text-neutral-100">{watch.movement.frequencyVph.toLocaleString()} VPH</span>
                      <span className="text-[10px] text-neutral-500 block">
                        ({(watch.movement.frequencyVph / 7200).toFixed(1)} Hz)
                      </span>
                    </div>
                    <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-mono block">Power Reserve</span>
                      <span className="font-bold text-neutral-100">{watch.movement.powerReserve}</span>
                      <span className="text-[10px] text-neutral-500 block">Mainspring Autonomy</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-neutral-800/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                      Movement Advantages & Engineering:
                    </span>
                    <div className="space-y-1.5">
                      {movementMeta.keyBenefits.map((ben, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-neutral-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span>{ben}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NEW: DEDICATED CASEBACK & MOVEMENT EXHIBITION TAB */}
            {activeTab === "caseback" && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-neutral-900/90 to-neutral-950 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Disc size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 font-mono">
                          Horological Finishing & Architecture
                        </span>
                        <h3 className="text-base font-bold text-neutral-100">
                          Exhibition Sapphire Caseback
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleView}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <RotateCw size={12} />
                      <span>{viewMode === "back" ? "View Front Dial" : "Flip to Back"}</span>
                    </button>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                    The reverse of the {watch.brand} {watch.name} features an anti-reflective sapphire exhibition window revealing the manufacture Caliber {watch.movement.caliber}.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-amber-400 uppercase font-mono block">Oscillating Rotor</span>
                      <span className="font-bold text-neutral-100">21K Heavy Gold Skeleton</span>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Mounted on ceramic micro-ball bearings for bidirectional winding efficiency.
                      </p>
                    </div>

                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-amber-400 uppercase font-mono block">Escapement & Balance</span>
                      <span className="font-bold text-neutral-100">Glucydur Balance & Silicon Hairspring</span>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Anti-magnetic resistance up to 15,000 Gauss with poising adjustment screws.
                      </p>
                    </div>

                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-amber-400 uppercase font-mono block">Bridge Decoration</span>
                      <span className="font-bold text-neutral-100">Côtes de Genève & Perlage</span>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Hand-chamfered anglage bevels with circular graining on baseplate.
                      </p>
                    </div>

                    <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                      <span className="text-[10px] text-amber-400 uppercase font-mono block">Jewels & Fasteners</span>
                      <span className="font-bold text-neutral-100">
                        {watch.movement.jewels || 31} Synthetic Rubies & Blued Screws
                      </span>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Thermally blued steel screws set in mirror-polished gold chatons.
                      </p>
                    </div>
                  </div>

                  {/* Caseback Custom Engraving Preview */}
                  <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                        Caseback Inscription & Engraving:
                      </span>
                      <span className="text-xs font-mono text-amber-300">
                        {watch.customEngraving ? `“${watch.customEngraving}”` : "Standard Manufacture Reference Engravings"}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveTab("notes")}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>Edit Inscription</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 1. FACTS & HISTORICAL DOSSIER */}
            {activeTab === "facts" && (
              <div className="space-y-6">
                {/* Dedicated Story Behind This Piece Section */}
                <div className="p-4 rounded-2xl bg-neutral-900/80 border border-amber-500/40 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    <BookOpen size={15} />
                    <span>The Story Behind This Timepiece</span>
                  </div>
                  <p className="text-xs text-neutral-100 leading-relaxed italic font-serif text-[13px] bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800/80">
                    "{watch.facts.storyBlurb || watch.facts.tagline || (watch.facts.historicalSignificance ? watch.facts.historicalSignificance.split('.')[0] + '.' : 'A landmark horological creation.')}"
                  </p>
                </div>

                {/* Authoritative Source Citation if available */}
                {(watch.facts.sourceCitation || watch.provenanceSource) && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 shadow-md">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
                      <BookOpen size={14} />
                      <span>
                        {watch.provenanceSource && HOROLOGY_SOURCES[watch.provenanceSource]
                          ? HOROLOGY_SOURCES[watch.provenanceSource].name
                          : "Authoritative Reference Citation"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-200 italic leading-relaxed">
                      {watch.facts.sourceCitation ||
                        (watch.provenanceSource && HOROLOGY_SOURCES[watch.provenanceSource]?.description)}
                    </p>
                  </div>
                )}

                {/* Key Highlights */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                    Horological Highlights
                  </h3>
                  <div className="space-y-2">
                    {watch.facts.keyHighlights.map((hl, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80"
                      >
                        <ChevronRight size={15} className="text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-xs text-neutral-200">{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historical Significance */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    Historical Genesis & Lineage
                  </h3>
                  <p className="text-xs leading-relaxed text-neutral-300 bg-neutral-900/30 p-4 rounded-xl border border-neutral-800/50">
                    {watch.facts.historicalSignificance}
                  </p>
                </div>

                {/* Fascinating Trivia / Fun Facts */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                    Fascinating Horological Facts
                  </h3>
                  <ul className="space-y-2">
                    {watch.facts.funFacts.map((fact, i) => (
                      <li
                        key={i}
                        className="text-xs text-neutral-300 list-disc list-inside bg-neutral-900/40 p-3 rounded-lg border border-neutral-800/60"
                      >
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 2. TECHNICAL SPECS & CALIBER */}
            {activeTab === "specs" && (
              <div className="space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Style</span>
                    <span className="text-sm font-bold text-amber-300">{watch.category}</span>
                  </div>

                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Movement</span>
                    <span className="text-sm font-bold text-emerald-400">{watch.movement.type}</span>
                  </div>

                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Diameter</span>
                    <span className="text-sm font-bold text-neutral-100">{watch.caseDiameter} mm</span>
                  </div>

                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Thickness</span>
                    <span className="text-sm font-bold text-neutral-100">{watch.caseThickness || 12} mm</span>
                  </div>

                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Water Resistance</span>
                    <span className="text-sm font-bold text-neutral-100">{watch.waterResistance || "50m"}</span>
                  </div>

                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Frequency</span>
                    <span className="text-sm font-bold text-neutral-100">
                      {watch.movement.frequencyVph.toLocaleString()} vph
                    </span>
                  </div>

                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Power Reserve</span>
                    <span className="text-sm font-bold text-neutral-100">{watch.movement.powerReserve}</span>
                  </div>

                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Original MSRP</span>
                    <span className="text-sm font-bold text-neutral-100">{watch.msrp || "Inquire"}</span>
                  </div>

                  <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Est. Market Value</span>
                    <span className="text-sm font-bold text-emerald-400">{watch.marketPrice || "Market Dependent"}</span>
                  </div>
                </div>

                {/* Movement Engineering */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    Caliber Architecture & Tolerances
                  </h3>
                  <p className="text-xs leading-relaxed text-neutral-300 bg-neutral-900/30 p-4 rounded-xl border border-neutral-800/50">
                    {watch.facts.movementEngineering}
                  </p>
                </div>

                {/* Caliber Features */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    Patented Features ({watch.movement.caliber})
                  </h3>
                  <div className="space-y-1.5">
                    {watch.movement.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. COLLECTOR LORE & POP CULTURE */}
            {activeTab === "lore" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    Collector Lore & Auction Milestones
                  </h3>
                  <p className="text-xs leading-relaxed text-neutral-300 bg-neutral-900/30 p-4 rounded-xl border border-neutral-800/50">
                    {watch.facts.collectorLore}
                  </p>
                </div>

                {/* Famous Wearers & Cultural Icons */}
                {watch.facts.celebritiesAndIcons && watch.facts.celebritiesAndIcons.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
                      Notable Wearers & Historical Icons
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {watch.facts.celebritiesAndIcons.map((person, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-900 text-amber-200 border border-amber-500/20"
                        >
                          {person}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. ASK THE MASTER WATCHMAKER */}
            {activeTab === "watchmaker" && (
              <div className="flex flex-col h-full min-h-[320px]">
                <div className="flex-1 space-y-3 overflow-y-auto pr-1 mb-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-amber-500 text-neutral-950 font-medium rounded-tr-none"
                            : "bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  ))}
                  {isAsking && (
                    <div className="flex items-center gap-2 text-xs text-neutral-400 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800 w-fit">
                      <Loader2 size={14} className="animate-spin text-amber-400" />
                      <span>Consulting the horological archives...</span>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                  <input
                    id="ask-watchmaker-input"
                    type="text"
                    value={inputQuestion}
                    onChange={(e) => setInputQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendQuestion()}
                    placeholder={`Ask about ${watch.brand} ${watch.name}...`}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    id="ask-watchmaker-send-btn"
                    onClick={handleSendQuestion}
                    disabled={!inputQuestion.trim() || isAsking}
                    className="p-2.5 rounded-xl bg-amber-500 text-neutral-950 disabled:opacity-40 hover:bg-amber-400 transition-colors"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* 5. MANAGE ENTRY & COLLECTOR NOTES */}
            {activeTab === "notes" && (
              <div className="space-y-5">
                {/* Collection Assignment */}
                {collections.length > 0 && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1.5 flex items-center gap-1.5">
                      <Folder size={13} />
                      <span>Assign to Vitrine Collection</span>
                    </label>
                    <select
                      id="watch-collection-select"
                      value={selectedCollectionId}
                      onChange={(e) => setSelectedCollectionId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                    >
                      {collections.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
                    Collector Journal & Provenance Notes
                  </label>
                  <textarea
                    id="collector-notes-textarea"
                    value={collectorNotes}
                    onChange={(e) => setCollectorNotes(e.target.value)}
                    rows={4}
                    placeholder="Document purchase date, personal stories, accuracy checks, or service history..."
                    className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
                    Caseback Bespoke Engraving Inscription
                  </label>
                  <input
                    id="collector-engraving-input"
                    type="text"
                    value={customEngraving}
                    onChange={(e) => setCustomEngraving(e.target.value)}
                    placeholder="e.g. 'To New Horizons • 2026'"
                    className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                  {onDeleteWatch && (
                    <button
                      id="delete-watch-tab-btn"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/40 transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>Delete This Timepiece</span>
                    </button>
                  )}

                  <button
                    id="save-notes-btn"
                    onClick={handleSaveNotes}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-all ml-auto shadow-md shadow-amber-500/20"
                  >
                    {isSavedNotes ? <Check size={14} /> : <Bookmark size={14} />}
                    <span>{isSavedNotes ? "Saved!" : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
