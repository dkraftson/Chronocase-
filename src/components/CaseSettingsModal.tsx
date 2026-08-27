import React, { useState } from "react";
import { CaseSettings, CaseMaterial, CushionColor, VaultLighting } from "../types";
import { X, Sliders, Sun, Shield, Palette, Download, Upload, RotateCcw, Volume2, VolumeX, Disc, Clock } from "lucide-react";
import { horologyAudio } from "../utils/audio";

interface CaseSettingsModalProps {
  settings: CaseSettings;
  onUpdateSettings: (settings: Partial<CaseSettings>) => void;
  onResetCollection: () => void;
  onExportCollection: () => void;
  onImportCollection: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

export const CaseSettingsModal: React.FC<CaseSettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetCollection,
  onExportCollection,
  onImportCollection,
  onClose,
}) => {
  const [audioVolume, setAudioVolume] = useState(horologyAudio.getVolume());
  const materials: { id: CaseMaterial; label: string; desc: string; color: string }[] = [
    { id: "walnut", label: "American Walnut Wood", desc: "Classic satin grain with warm brass accents", color: "bg-[#2b1810]" },
    { id: "piano_black", label: "Piano Black Lacquer", desc: "High-gloss mirror polished black enamel", color: "bg-neutral-950" },
    { id: "forest_leather", label: "British Racing Green", desc: "Hand-stitched calfskin leather with gilt trim", color: "bg-emerald-950" },
    { id: "carbon_fiber", label: "Matte Carbon Fiber", desc: "Modern lightweight composite weave", color: "bg-zinc-900" },
    { id: "mahogany", label: "Imperial Mahogany", desc: "Deep red wood with beveled corners", color: "bg-[#381008]" },
  ];

  const cushions: { id: CushionColor; label: string; color: string }[] = [
    { id: "ivory", label: "Ivory Velvet", color: "bg-amber-100/90 text-neutral-900" },
    { id: "midnight", label: "Midnight Blue", color: "bg-blue-950 text-white" },
    { id: "burgundy", label: "Burgundy Bordeaux", color: "bg-rose-950 text-white" },
    { id: "hunter_green", label: "Hunter Green", color: "bg-emerald-950 text-white" },
    { id: "charcoal", label: "Charcoal Suede", color: "bg-neutral-800 text-white" },
  ];

  const lightings: { id: VaultLighting; label: string; desc: string }[] = [
    { id: "warm_gallery", label: "Museum Gallery (3000K)", desc: "Warm spotlight highlighting dial sunbursts" },
    { id: "daylight_5000k", label: "Studio Daylight (5000K)", desc: "Crisp neutral light revealing metal bevels" },
    { id: "midnight_vault", label: "Midnight Vault", desc: "Moody low light with dramatic shadows" },
    { id: "lume_laboratory", label: "Super-LumiNova Dark Glow", desc: "Fluorescent night glow for dial lume" },
  ];

  return (
    <div
      id="case-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black rounded-3xl border border-neutral-800 shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-settings-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
        >
          <X size={18} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-1">
            <Sliders size={14} />
            <span>Vitrine Craftsmanship</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-neutral-100">
            Watch Case & Display Options
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Tailor the material finish, velvet cushion lining, and ambient gallery illumination of your virtual collector case.
          </p>
        </div>

        {/* 1. Case Material Finish */}
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-3 flex items-center gap-1.5">
            <Shield size={13} />
            <span>Case Wood & Exterior Material</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {materials.map((mat) => (
              <button
                key={mat.id}
                id={`case-mat-${mat.id}`}
                onClick={() => {
                  onUpdateSettings({ material: mat.id });
                  horologyAudio.playCrownClick();
                }}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  settings.material === mat.id
                    ? "bg-amber-500/10 border-amber-500 text-neutral-100 shadow-md shadow-amber-500/10"
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <div className={`w-6 h-6 rounded-md shrink-0 border border-white/20 mt-0.5 ${mat.color}`} />
                <div>
                  <span className="text-xs font-bold block">{mat.label}</span>
                  <span className="text-[10px] text-neutral-400 leading-tight block mt-0.5">{mat.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Velvet Cushion Colors */}
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-3 flex items-center gap-1.5">
            <Palette size={13} />
            <span>Interior Velvet Cushion Plush</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {cushions.map((cush) => (
              <button
                key={cush.id}
                id={`cushion-color-${cush.id}`}
                onClick={() => {
                  onUpdateSettings({ cushionColor: cush.id });
                  horologyAudio.playCrownClick();
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  settings.cushionColor === cush.id
                    ? "bg-amber-500/10 border-amber-500 text-neutral-100"
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <div className={`w-4 h-4 rounded-full shrink-0 border border-white/20 ${cush.color}`} />
                <span className="text-xs font-medium truncate">{cush.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Vault Lighting Ambiance */}
        <div className="mb-8">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-3 flex items-center gap-1.5">
            <Sun size={13} />
            <span>Gallery Lighting Environment</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {lightings.map((lit) => (
              <button
                key={lit.id}
                id={`lighting-${lit.id}`}
                onClick={() => {
                  onUpdateSettings({ lighting: lit.id });
                  horologyAudio.playCrownClick();
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.lighting === lit.id
                    ? "bg-amber-500/10 border-amber-500 text-neutral-100"
                    : "bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <span className="text-xs font-bold block">{lit.label}</span>
                <span className="text-[10px] text-neutral-400 leading-tight block mt-0.5">{lit.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Acoustics & Mechanical Micro-Sound Effects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Volume2 size={14} />
              <span>Horological Acoustics & Mechanical Sound Effects</span>
            </label>
            <button
              id="settings-sound-toggle-btn"
              onClick={() => {
                const next = !settings.soundEnabled;
                horologyAudio.unlockContext();
                horologyAudio.setMuted(!next);
                onUpdateSettings({ soundEnabled: next });
                if (next) horologyAudio.playCrownClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                settings.soundEnabled
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/10"
                  : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200"
              }`}
            >
              {settings.soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span>{settings.soundEnabled ? "Sound Active" : "Sound Muted"}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            {/* Master Volume Slider */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-400 whitespace-nowrap">Master Acoustics Volume:</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={audioVolume}
                disabled={!settings.soundEnabled}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setAudioVolume(val);
                  horologyAudio.setVolume(val);
                }}
                className="flex-1 accent-amber-500 cursor-pointer disabled:opacity-40"
              />
              <span className="text-xs font-mono text-amber-400 w-10 text-right">
                {Math.round(audioVolume * 100)}%
              </span>
            </div>

            {/* Micro-Sound Preview Buttons */}
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                Audition Mechanical Micro-Acoustics:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  id="preview-sound-tick"
                  onClick={() => {
                    horologyAudio.unlockContext();
                    horologyAudio.setMuted(false);
                    onUpdateSettings({ soundEnabled: true });
                    horologyAudio.playMechanicalTick("tick");
                    setTimeout(() => horologyAudio.playMechanicalTick("tock"), 125);
                  }}
                  className="px-2 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 flex flex-col items-center gap-1 transition-colors"
                >
                  <Clock size={14} className="text-amber-400" />
                  <span>Escapement</span>
                </button>

                <button
                  type="button"
                  id="preview-sound-bezel"
                  onClick={() => {
                    horologyAudio.unlockContext();
                    horologyAudio.setMuted(false);
                    onUpdateSettings({ soundEnabled: true });
                    horologyAudio.playBezelClick();
                  }}
                  className="px-2 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 flex flex-col items-center gap-1 transition-colors"
                >
                  <Disc size={14} className="text-blue-400" />
                  <span>Bezel Click</span>
                </button>

                <button
                  type="button"
                  id="preview-sound-crown"
                  onClick={() => {
                    horologyAudio.unlockContext();
                    horologyAudio.setMuted(false);
                    onUpdateSettings({ soundEnabled: true });
                    horologyAudio.playCrownClick();
                  }}
                  className="px-2 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 flex flex-col items-center gap-1 transition-colors"
                >
                  <Sliders size={14} className="text-emerald-400" />
                  <span>Crown Pinion</span>
                </button>

                <button
                  type="button"
                  id="preview-sound-case"
                  onClick={() => {
                    horologyAudio.unlockContext();
                    horologyAudio.setMuted(false);
                    onUpdateSettings({ soundEnabled: true });
                    horologyAudio.playCaseLid();
                  }}
                  className="px-2 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 flex flex-col items-center gap-1 transition-colors"
                >
                  <Shield size={14} className="text-amber-300" />
                  <span>Velvet Box</span>
                </button>

                <button
                  type="button"
                  id="preview-sound-gong"
                  onClick={() => {
                    horologyAudio.unlockContext();
                    horologyAudio.setMuted(false);
                    onUpdateSettings({ soundEnabled: true });
                    horologyAudio.playMinuteRepeaterGong("low", 1.2);
                    setTimeout(() => horologyAudio.playMinuteRepeaterGong("high", 1.0), 300);
                  }}
                  className="px-2 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 flex flex-col items-center gap-1 transition-colors"
                >
                  <Sun size={14} className="text-amber-400" />
                  <span>Cathedral Gong</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data & Collection Management */}
        <div className="pt-5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="export-collection-btn"
              onClick={onExportCollection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-medium transition-colors"
            >
              <Download size={13} />
              <span>Export JSON</span>
            </button>

            <label
              id="import-collection-label"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-medium cursor-pointer transition-colors"
            >
              <Upload size={13} />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={onImportCollection} className="hidden" />
            </label>
          </div>

          <button
            id="reset-default-collection-btn"
            onClick={() => {
              if (confirm("Reset to default curated luxury watch collection?")) {
                onResetCollection();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 text-xs font-medium transition-colors ml-auto"
          >
            <RotateCcw size={13} />
            <span>Reset to Default Grails</span>
          </button>
        </div>
      </div>
    </div>
  );
};
