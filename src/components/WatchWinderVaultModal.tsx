import React, { useState, useEffect } from "react";
import { Watch } from "../types";
import { WatchRenderer } from "./WatchRenderer";
import {
  X,
  RotateCw,
  RotateCcw,
  Sparkles,
  Play,
  Square,
  Zap,
  Shield,
  Lightbulb,
  Clock,
  Compass,
  Sliders,
  Volume2,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";

interface WatchWinderVaultModalProps {
  watches: Watch[];
  onClose: () => void;
  onSelectWatch?: (watch: Watch) => void;
  onSelectWatchForInspection?: (watch: Watch) => void;
}

type WinderDirection = "cw" | "ccw" | "bidirectional";
type WinderSpeedTPD = 650 | 800 | 950 | 1200;
type VaultLighting = "warm_amber" | "crisp_daylight" | "uv_neon";

export const WatchWinderVaultModal: React.FC<WatchWinderVaultModalProps> = ({
  watches = [],
  onClose,
  onSelectWatch,
  onSelectWatchForInspection,
}) => {
  const handleInspect = (w: Watch) => {
    if (onSelectWatch) {
      onSelectWatch(w);
    } else if (onSelectWatchForInspection) {
      onSelectWatchForInspection(w);
    }
    onClose();
  };

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [direction, setDirection] = useState<WinderDirection>("bidirectional");
  const [tpd, setTpd] = useState<WinderSpeedTPD>(800);
  const [lighting, setLighting] = useState<VaultLighting>("warm_amber");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [selectedSlotWatches, setSelectedSlotWatches] = useState<(Watch | null)[]>([
    watches[0] || null,
    watches[1] || null,
    watches[2] || null,
    watches[3] || null,
  ]);

  // Animated rotation loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const speedMultiplier = (tpd / 800) * 0.4; // degrees per frame

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (isRunning) {
        setRotationAngle((prev) => {
          if (direction === "cw") {
            return (prev + speedMultiplier) % 360;
          } else if (direction === "ccw") {
            return (prev - speedMultiplier + 360) % 360;
          } else {
            // Bidirectional: smoothly sine wave rocking and completing full rotations
            return (prev + speedMultiplier * 0.8) % 360;
          }
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, direction, tpd]);

  const lightingGlow = {
    warm_amber: "from-amber-500/10 via-black to-black border-amber-500/30",
    crisp_daylight: "from-sky-500/10 via-black to-black border-sky-500/30",
    uv_neon: "from-purple-500/15 via-black to-black border-purple-500/40",
  }[lighting];

  return (
    <div
      id="watch-winder-vault-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
    >
      <div
        className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b ${lightingGlow} border shadow-2xl overflow-hidden text-neutral-200`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800/80 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <RotateCw size={20} className={isRunning ? "animate-spin" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-neutral-100">
                  Haute Horlogerie Gyroscopic Vault Winder
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40 font-bold uppercase">
                  Continuous Mainspring Top-Up
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Precision magnetic-shielded rotor winding pods with customizable Turns Per Day (TPD)
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-winder-modal-btn"
            onClick={() => {
              horologyAudio.playCaseLid();
              onClose();
            }}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Main 4-Pod Vault Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedSlotWatches.map((slotWatch, idx) => (
              <div
                key={idx}
                className="relative flex flex-col items-center justify-between p-5 rounded-3xl bg-neutral-950 border border-neutral-800/90 shadow-2xl group overflow-hidden"
              >
                {/* Spot Beam Effect */}
                <div
                  className={`absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40 ${
                    lighting === "warm_amber"
                      ? "bg-amber-400"
                      : lighting === "crisp_daylight"
                      ? "bg-sky-400"
                      : "bg-purple-500"
                  }`}
                />

                <div className="w-full flex items-center justify-between text-[11px] font-mono text-neutral-400 z-10 mb-2">
                  <span className="font-bold text-amber-400">POD 0{idx + 1}</span>
                  <span>{slotWatch ? `${slotWatch.movement?.powerReserve || "48 Hours"} Reserve` : "Empty Pod"}</span>
                </div>

                {/* Rotating Winder Bezel & Cushion Ring */}
                <div className="relative w-44 h-44 my-2 flex items-center justify-center">
                  {/* Outer Aluminum Ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-neutral-800 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]" />

                  {/* Gyro Spinning Pod Platform */}
                  <div
                    className="w-36 h-36 rounded-full bg-neutral-900 border-2 border-amber-500/30 flex items-center justify-center shadow-lg transition-transform"
                    style={{
                      transform: `rotate(${rotationAngle * (idx % 2 === 0 ? 1 : -1)}deg)`,
                      transition: isRunning ? "none" : "transform 0.5s ease-out",
                    }}
                  >
                    {slotWatch ? (
                      <div className="scale-75 pointer-events-none">
                        <WatchRenderer
                          watch={slotWatch}
                          size="small"
                          interactiveTilt={false}
                        />
                      </div>
                    ) : (
                      <div className="text-center p-3 text-neutral-600 font-mono text-xs">
                        No Watch Loaded
                      </div>
                    )}
                  </div>
                </div>

                {/* Pod Watch Info & Quick Actions */}
                <div className="w-full text-center mt-3 z-10">
                  {slotWatch ? (
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-neutral-100 truncate">
                        {slotWatch.brand} {slotWatch.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono truncate">
                        {slotWatch.movement.caliber} • {slotWatch.movement.type}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInspect(slotWatch)}
                        className="mt-2 text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline font-mono"
                      >
                        Inspect Under Loupe →
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 font-mono py-2">
                      Assign watch below
                    </div>
                  )}

                  {/* Slot Selector Dropdown */}
                  <select
                    value={slotWatch?.id || ""}
                    onChange={(e) => {
                      const found = watches.find((w) => w.id === e.target.value) || null;
                      setSelectedSlotWatches((prev) => {
                        const next = [...prev];
                        next[idx] = found;
                        return next;
                      });
                      horologyAudio.playCrownClick();
                    }}
                    className="w-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1 text-[11px] text-neutral-300 focus:border-amber-500 focus:outline-none truncate"
                  >
                    <option value="">-- Empty Slot --</option>
                    {watches.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.brand} - {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Master Winder Controls Deck */}
          <div className="p-5 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="toggle-winder-motor-btn"
                  onClick={() => {
                    setIsRunning((prev) => !prev);
                    horologyAudio.playCrownClick();
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold font-mono text-xs transition-all shadow-md active:scale-95 ${
                    isRunning
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/50"
                      : "bg-emerald-500 text-neutral-950 hover:bg-emerald-400"
                  }`}
                >
                  {isRunning ? <Square size={14} className="fill-rose-300" /> : <Play size={14} className="fill-neutral-950" />}
                  <span>{isRunning ? "Stop Winder Motors" : "Start Gyroscopic Cycles"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    horologyAudio.playRotorWobble();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-mono"
                  title="Audition Low-Noise Ceramic Bearing Acoustic Profile"
                >
                  <Volume2 size={13} className="text-amber-400" />
                  <span>Acoustic Profile</span>
                </button>
              </div>

              {/* Turns Per Day (TPD) Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">TPD Target:</span>
                {([650, 800, 950, 1200] as WinderSpeedTPD[]).map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => {
                      setTpd(speed);
                      horologyAudio.playCrownClick();
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                      tpd === speed
                        ? "bg-amber-500 text-neutral-950 shadow-sm"
                        : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-800/80">
              {/* Direction Mode */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono block">
                  Rotor Direction Logic:
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  {(
                    [
                      { id: "cw", label: "Clockwise" },
                      { id: "ccw", label: "Counter-CW" },
                      { id: "bidirectional", label: "Bidirectional" },
                    ] as const
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setDirection(d.id);
                        horologyAudio.playCrownClick();
                      }}
                      className={`p-2 rounded-xl border text-center font-bold transition-all ${
                        direction === d.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vitrine LED Accent Lighting */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono block">
                  Vault Spotlight Theme:
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  {(
                    [
                      { id: "warm_amber", label: "Warm Gallery" },
                      { id: "crisp_daylight", label: "Daylight" },
                      { id: "uv_neon", label: "UV Lume Glow" },
                    ] as const
                  ).map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setLighting(l.id);
                        horologyAudio.playCrownClick();
                      }}
                      className={`p-2 rounded-xl border text-center font-bold transition-all ${
                        lighting === l.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
