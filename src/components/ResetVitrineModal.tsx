import React, { useState } from "react";
import { WatchCollection, Watch } from "../types";
import { DEFAULT_WATCHES, DEFAULT_COLLECTIONS } from "../data/defaultWatches";
import {
  RotateCcw,
  Trash2,
  Sparkles,
  X,
  AlertTriangle,
  Layers,
  Crown,
  Compass,
  Check,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";

interface ResetVitrineModalProps {
  isOpen?: boolean;
  onClose: () => void;
  targetCollection?: WatchCollection | null;
  targetCollectionId?: string | "all";
  collections: WatchCollection[];
  watches: Watch[];
  onResetVitrine: (collectionId: string | "all", mode: "empty" | "defaults") => void;
}

export const ResetVitrineModal: React.FC<ResetVitrineModalProps> = ({
  isOpen = true,
  onClose,
  targetCollection,
  targetCollectionId,
  collections = [],
  watches = [],
  onResetVitrine,
}) => {
  const initialId = targetCollectionId || (targetCollection ? targetCollection.id : "all");
  const [selectedColId, setSelectedColId] = useState<string | "all">(initialId);
  const [confirmStep, setConfirmStep] = useState<"choose" | "confirm_empty" | "confirm_defaults">("choose");

  if (isOpen === false) return null;

  const isAll = selectedColId === "all";
  const activeCol = collections.find((c) => c.id === selectedColId);
  const currentWatches = isAll
    ? watches
    : watches.filter((w) => w.collectionId === selectedColId);

  const defaultWatchesCount = isAll
    ? DEFAULT_WATCHES.length
    : DEFAULT_WATCHES.filter((w) => w.collectionId === selectedColId).length;

  const handleExecute = (mode: "empty" | "defaults") => {
    horologyAudio.playCaseLid();
    onResetVitrine(selectedColId, mode);
    onClose();
  };

  return (
    <div
      id="reset-vitrine-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-gradient-to-b from-neutral-900 via-neutral-950 to-black rounded-3xl border border-neutral-800 shadow-2xl p-6 sm:p-7 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-reset-vitrine-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-1.5">
          <RotateCcw size={14} />
          <span>Vitrine Reset & Clean Slate</span>
        </div>

        <h3 className="text-xl font-serif font-bold text-neutral-100 mb-1">
          {isAll
            ? "Reset All Vitrines & Timepieces"
            : `Reset Vitrine: ${activeCol?.name || "Selected Vitrine"}`}
        </h3>

        <p className="text-xs text-neutral-400 leading-relaxed mb-5">
          {isAll
            ? "Choose whether to clear all your vitrines for a clean slate or restore the master horological defaults."
            : `Choose whether to clear this specific vitrine to start fresh, or restore its original curated timepieces.`}
        </p>

        {/* Collection Selector if opened from All or to switch target */}
        <div className="mb-5 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
            Target Vitrine:
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              id="reset-select-target-all"
              type="button"
              onClick={() => {
                setSelectedColId("all");
                setConfirmStep("choose");
                horologyAudio.playCrownClick();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedColId === "all"
                  ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20"
                  : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800"
              }`}
            >
              All Vitrines ({watches.length})
            </button>
            {collections.map((col) => {
              const count = watches.filter((w) => w.collectionId === col.id).length;
              return (
                <button
                  key={col.id}
                  id={`reset-select-target-${col.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedColId(col.id);
                    setConfirmStep("choose");
                    horologyAudio.playCrownClick();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedColId === col.id
                      ? "bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20"
                      : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800"
                  }`}
                >
                  {col.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Choices / Confirmations */}
        {confirmStep === "choose" && (
          <div className="space-y-3">
            {/* OPTION 1: START FRESH (EMPTY VITRINE) */}
            <button
              id="btn-action-start-fresh-empty"
              onClick={() => setConfirmStep("confirm_empty")}
              className="w-full text-left p-4 rounded-2xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-rose-500/50 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                  <Trash2 size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-neutral-100 group-hover:text-rose-300 transition-colors">
                      Start Fresh (Empty Vitrine)
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/40 text-rose-300 border border-rose-800/40">
                      Clears {currentWatches.length} {currentWatches.length === 1 ? "watch" : "watches"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Remove all timepieces from this vitrine to obtain an empty showcase ready for your custom acquisitions.
                  </p>
                </div>
              </div>
            </button>

            {/* OPTION 2: RESTORE CURATED DEFAULTS */}
            <button
              id="btn-action-restore-curated-defaults"
              onClick={() => setConfirmStep("confirm_defaults")}
              className="w-full text-left p-4 rounded-2xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0 mt-0.5">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-neutral-100 group-hover:text-amber-300 transition-colors">
                      Restore Curated Factory Defaults
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-800/40">
                      Restores {defaultWatchesCount || 3} curated grails
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Restore the original iconic timepieces, factory finishes, and specifications for this vitrine.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* CONFIRMATION: EMPTY VITRINE */}
        {confirmStep === "confirm_empty" && (
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-200">
                  Confirm Clean Slate for {isAll ? "All Vitrines" : `"${activeCol?.name || "Vitrine"}"`}?
                </h4>
                <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                  This will remove {currentWatches.length} timepiece{currentWatches.length === 1 ? "" : "s"} from this vitrine. You will have an empty showcase to input your own collection.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-rose-500/20">
              <button
                type="button"
                onClick={() => setConfirmStep("choose")}
                className="px-3.5 py-2 rounded-xl text-xs text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 hover:bg-neutral-800"
              >
                Back
              </button>
              <button
                id="btn-confirm-empty-execution"
                type="button"
                onClick={() => handleExecute("empty")}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all"
              >
                Yes, Clear & Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* CONFIRMATION: RESTORE DEFAULTS */}
        {confirmStep === "confirm_defaults" && (
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  Restore Curated Defaults for {isAll ? "All Vitrines" : `"${activeCol?.name || "Vitrine"}"`}?
                </h4>
                <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                  This will reload the landmark curated timepieces and factory case settings for this showcase.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-amber-500/20">
              <button
                type="button"
                onClick={() => setConfirmStep("choose")}
                className="px-3.5 py-2 rounded-xl text-xs text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 hover:bg-neutral-800"
              >
                Back
              </button>
              <button
                id="btn-confirm-defaults-execution"
                type="button"
                onClick={() => handleExecute("defaults")}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/30 transition-all"
              >
                Yes, Restore Curated Defaults
              </button>
            </div>
          </div>
        )}

        {/* Cancel Button */}
        {confirmStep === "choose" && (
          <div className="mt-5 pt-3 border-t border-neutral-800/80 flex justify-end">
            <button
              id="btn-cancel-reset-modal"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
