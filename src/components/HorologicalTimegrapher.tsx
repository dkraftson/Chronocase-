import React, { useState, useEffect, useRef, useMemo } from "react";
import { Watch } from "../types";
import {
  Activity,
  Play,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Gauge,
  Compass,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";

interface HorologicalTimegrapherProps {
  watch: Watch;
  onUpdateWatch?: (updated: Watch) => void;
}

type PositionId = "CH" | "CB" | "6H" | "9H" | "3H" | "12H";

interface PositionConfig {
  id: PositionId;
  name: string;
  shortLabel: string;
  description: string;
  rateOffset: number; // s/day gravity variation relative to CH
  ampOffset: number; // amplitude drop in vertical positions
  beatErrorOffset: number;
}

const POSITIONS: PositionConfig[] = [
  {
    id: "CH",
    name: "Dial Up (Cadran Haut)",
    shortLabel: "CH",
    description: "Horizontal: Maximum balance amplitude, minimal pivot friction.",
    rateOffset: 0,
    ampOffset: 0,
    beatErrorOffset: 0,
  },
  {
    id: "CB",
    name: "Dial Down (Cadran Bas)",
    shortLabel: "CB",
    description: "Horizontal: Resting on top balance pivot cap jewel.",
    rateOffset: +1.2,
    ampOffset: -4,
    beatErrorOffset: 0.05,
  },
  {
    id: "6H",
    name: "Crown Down (6H Vertical)",
    shortLabel: "6H",
    description: "Vertical: Standard resting wrist stance when walking with arm down.",
    rateOffset: -3.5,
    ampOffset: -32,
    beatErrorOffset: 0.1,
  },
  {
    id: "9H",
    name: "Crown Left (9H Vertical)",
    shortLabel: "9H",
    description: "Vertical: Typical desk-diver position with arm on keyboard.",
    rateOffset: +2.8,
    ampOffset: -28,
    beatErrorOffset: 0.08,
  },
  {
    id: "3H",
    name: "Crown Right (3H Vertical)",
    shortLabel: "3H",
    description: "Vertical: 3 o'clock oriented downward.",
    rateOffset: -1.8,
    ampOffset: -30,
    beatErrorOffset: 0.12,
  },
  {
    id: "12H",
    name: "Crown Up (12H Vertical)",
    shortLabel: "12H",
    description: "Vertical: 12 o'clock oriented downward.",
    rateOffset: -2.2,
    ampOffset: -31,
    beatErrorOffset: 0.09,
  },
];

export const HorologicalTimegrapher: React.FC<HorologicalTimegrapherProps> = ({
  watch,
  onUpdateWatch,
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState<PositionId>("CH");
  const [liftAngle, setLiftAngle] = useState(52); // Standard Swiss lever lift angle
  const [isAudioTicking, setIsAudioTicking] = useState(false);
  const [userRegulationAdjustment, setUserRegulationAdjustment] = useState(0); // +/- seconds/day fine regulator

  // Caliber specifications
  const vph = watch.movement.frequencyVph || 28800;
  const beatsPerSecond = vph / 3600; // e.g. 8 beats/sec for 28800
  const isChronometer =
    watch.category === "Grand Complication" ||
    watch.facts.historicalSignificance ||
    watch.brand.toLowerCase().includes("rolex") ||
    watch.brand.toLowerCase().includes("omega") ||
    watch.brand.toLowerCase().includes("grand seiko") ||
    watch.movement.type === "automatic";

  const baseRate = useMemo(() => {
    // Inherent caliber quality baseline (+1 to +4 s/d for luxury, +6 for standard)
    return isChronometer ? 1.5 : 4.5;
  }, [isChronometer]);

  const baseAmplitude = 292; // degrees
  const baseBeatError = 0.1; // ms

  const currentPos = useMemo(
    () => POSITIONS.find((p) => p.id === selectedPosition) || POSITIONS[0],
    [selectedPosition]
  );

  // Live regulated metrics
  const liveRate = baseRate + currentPos.rateOffset + userRegulationAdjustment;
  const liveAmplitude = Math.max(220, baseAmplitude + currentPos.ampOffset);
  const liveBeatError = Math.max(0, parseFloat((baseBeatError + currentPos.beatErrorOffset).toFixed(1)));

  // Oscilloscope Dot Canvas Simulation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<{ x: number; y1: number; y2: number }[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const xPosRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = time - lastTime;

      if (isRunning && delta > 1000 / (beatsPerSecond * 2)) {
        lastTime = time;
        xPosRef.current += 2;
        if (xPosRef.current >= width) {
          xPosRef.current = 0;
          pointsRef.current = [];
        }

        // Rate slope drift: positive rate slopes upwards, negative slopes downwards
        const slopeOffset = (liveRate * (xPosRef.current / width) * 20);
        // Beat error separates the two parallel lines (tick vs tock)
        const separation = (liveBeatError * 14);
        const noise = (Math.random() - 0.5) * 1.5;

        const y1 = centerY - slopeOffset - separation / 2 + noise;
        const y2 = centerY - slopeOffset + separation / 2 + noise;

        pointsRef.current.push({ x: xPosRef.current, y1, y2 });

        if (isAudioTicking) {
          horologyAudio.playMechanicalTick(Math.random() > 0.5 ? "tick" : "tock", 0.6);
        }
      }

      // Draw Witschi green phosphor screen
      ctx.fillStyle = "#0a110d";
      ctx.fillRect(0, 0, width, height);

      // Grid Lines
      ctx.strokeStyle = "#14281d";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center baseline reference
      ctx.strokeStyle = "#1b3c2a";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw twin tick/tock dot train
      pointsRef.current.forEach((pt) => {
        // Line 1: Tick impact
        ctx.fillStyle = "#34d399";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y1, 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Line 2: Tock impact
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y2, 1.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Leading scanhead line
      if (isRunning) {
        ctx.strokeStyle = "#6ee7b7";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(xPosRef.current, 0);
        ctx.lineTo(xPosRef.current, height);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, liveRate, liveBeatError, beatsPerSecond, isAudioTicking]);

  // Positional Delta Analysis
  const positionalSpread = useMemo(() => {
    const rates = POSITIONS.map((p) => baseRate + p.rateOffset + userRegulationAdjustment);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const delta = max - min;
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    return { min, max, delta, avg };
  }, [baseRate, userRegulationAdjustment]);

  const chronometerVerdict = useMemo(() => {
    if (positionalSpread.delta <= 4.0 && Math.abs(positionalSpread.avg) <= 3.0) {
      return {
        label: "Master Chronometer / Superlative Precision",
        status: "passed",
        color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
        desc: "Exceeds COSC standard (-4/+6 s/d). Isochronism and balance equilibrium are exceptional.",
      };
    } else if (positionalSpread.delta <= 8.0 && Math.abs(positionalSpread.avg) <= 6.0) {
      return {
        label: "COSC Chronometer Grade",
        status: "passed",
        color: "text-amber-400 border-amber-500/40 bg-amber-500/10",
        desc: "Meets Swiss Official Chronometer Testing (COSC) 5-position regulation standards.",
      };
    } else {
      return {
        label: "Standard Mechanical Tolerance",
        status: "fair",
        color: "text-blue-400 border-blue-500/40 bg-blue-500/10",
        desc: "Typical factory regulation. Fine index regulation can dial this closer to 0 s/day.",
      };
    }
  }, [positionalSpread]);

  const handleResetRegulation = () => {
    setUserRegulationAdjustment(0);
    horologyAudio.playCrownClick();
  };

  return (
    <div id="horological-timegrapher" className="space-y-6 text-neutral-200">
      {/* 1. Header & Live Digital Readout Screen */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-neutral-950 via-[#07120b] to-black border border-emerald-900/40 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
              Witschi Caliber Chrono-Acoustic Diagnostic Studio
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAudioTicking((prev) => !prev);
                horologyAudio.unlockContext();
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all ${
                isAudioTicking
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                  : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200"
              }`}
              title="Acoustic Escapement Stethoscope Audio"
            >
              {isAudioTicking ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span>{isAudioTicking ? "Escapement Audio On" : "Mute Stethoscope"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRunning((prev) => !prev);
                horologyAudio.playCrownClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                isRunning
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-emerald-500 text-neutral-950 hover:bg-emerald-400"
              }`}
            >
              {isRunning ? <Square size={12} className="fill-rose-300" /> : <Play size={12} className="fill-neutral-950" />}
              <span>{isRunning ? "Pause Sweep" : "Resume Sweep"}</span>
            </button>
          </div>
        </div>

        {/* 2. Top Large LCD Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Rate Deviation */}
          <div className="p-3.5 rounded-2xl bg-black/80 border border-emerald-950 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500/70 font-mono">
              Daily Rate Deviation
            </span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400">
                {liveRate >= 0 ? `+${liveRate.toFixed(1)}` : liveRate.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-emerald-500">s/d</span>
            </div>
            <span className="text-[9px] text-neutral-500 font-mono truncate">
              {Math.abs(liveRate) < 2 ? "Chronometer Target" : "Regulated Stance"}
            </span>
          </div>

          {/* Balance Amplitude */}
          <div className="p-3.5 rounded-2xl bg-black/80 border border-emerald-950 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500/70 font-mono">
              Balance Amplitude
            </span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-300">
                {Math.round(liveAmplitude)}
              </span>
              <span className="text-xs font-mono text-emerald-500">°</span>
            </div>
            <span className="text-[9px] text-neutral-500 font-mono">
              Optimal: 270° – 315°
            </span>
          </div>

          {/* Beat Error */}
          <div className="p-3.5 rounded-2xl bg-black/80 border border-emerald-950 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500/70 font-mono">
              Beat Error (Equilibrium)
            </span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-300">
                {liveBeatError.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-emerald-500">ms</span>
            </div>
            <span className="text-[9px] text-neutral-500 font-mono">
              Target: &lt; 0.4 ms
            </span>
          </div>

          {/* Caliber Frequency & Lift Angle */}
          <div className="p-3.5 rounded-2xl bg-black/80 border border-emerald-950 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500/70 font-mono">
              Escapement Parameters
            </span>
            <div className="flex flex-col gap-0.5 my-1 font-mono">
              <span className="text-sm font-bold text-neutral-200">
                {vph.toLocaleString()} vph ({(vph / 3600).toFixed(0)} Hz)
              </span>
              <span className="text-xs text-amber-400">
                Lift Angle: {liftAngle}°
              </span>
            </div>
            <span className="text-[9px] text-neutral-500 font-mono truncate">
              {watch.movement.caliber || "Swiss Lever Escapement"}
            </span>
          </div>
        </div>

        {/* 3. Real-Time Oscilloscope Waveform Canvas */}
        <div className="relative rounded-2xl overflow-hidden border border-emerald-900/50 bg-[#0a110d] shadow-inner">
          <canvas
            ref={canvasRef}
            width={760}
            height={220}
            className="w-full h-[180px] sm:h-[220px] block"
          />

          <div className="absolute top-2 left-3 flex items-center gap-2 pointer-events-none">
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              Position: {currentPos.shortLabel} ({currentPos.name})
            </span>
            <span className="text-[10px] font-mono text-emerald-500/80">
              Dual-Trace Tick / Tock Acoustic Pulse
            </span>
          </div>
        </div>
      </div>

      {/* 4. Interactive 6-Position Test Rig & Regulation Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 6-Position Testing Rig */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <Compass size={13} />
              <span>6-Position Horological Test Rig</span>
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              Gravity & Friction Diagnostics
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {POSITIONS.map((pos) => {
              const posRate = baseRate + pos.rateOffset + userRegulationAdjustment;
              const isSelected = selectedPosition === pos.id;
              return (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => {
                    setSelectedPosition(pos.id);
                    horologyAudio.playCrownClick();
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/40 shadow-sm"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span className="text-xs">{pos.shortLabel}</span>
                    <span className={posRate >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {posRate >= 0 ? `+${posRate.toFixed(1)}` : posRate.toFixed(1)} s/d
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1 line-clamp-1">
                    {pos.name.split("(")[0]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Positional Spread Delta Summary */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-neutral-400 text-[10px] block uppercase">Positional Spread (Delta)</span>
              <span className="font-bold text-neutral-200 text-sm">
                Δ {positionalSpread.delta.toFixed(1)} s/day
              </span>
            </div>
            <div>
              <span className="text-neutral-400 text-[10px] block uppercase">Average 6-Pos Rate</span>
              <span className="font-bold text-emerald-400 text-sm">
                {positionalSpread.avg >= 0 ? `+${positionalSpread.avg.toFixed(1)}` : positionalSpread.avg.toFixed(1)} s/day
              </span>
            </div>
            <div>
              <span className="text-neutral-400 text-[10px] block uppercase">Chronometer Rating</span>
              <span className="font-bold text-amber-400 text-sm">COSC Grade</span>
            </div>
          </div>
        </div>

        {/* Right: Watchmaker Fine Index Regulation Lever */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <Sliders size={13} />
                <span>Microstella / Fine Regulator Lever</span>
              </span>
              <button
                type="button"
                onClick={handleResetRegulation}
                className="text-[10px] text-neutral-400 hover:text-amber-300 underline font-mono"
              >
                Zero Reset
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Adjust the balance spring index curb pin or inertia balance screws to advance (+) or retard (-) the caliber rate.
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-400">- Retard (Slow)</span>
                <span className="font-bold text-neutral-100 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                  {userRegulationAdjustment >= 0 ? `+${userRegulationAdjustment.toFixed(1)}` : userRegulationAdjustment.toFixed(1)} s/day
                </span>
                <span className="text-emerald-400">+ Advance (Fast)</span>
              </div>

              <input
                type="range"
                min="-10.0"
                max="10.0"
                step="0.5"
                value={userRegulationAdjustment}
                onChange={(e) => {
                  setUserRegulationAdjustment(parseFloat(e.target.value));
                  horologyAudio.playCrownClick();
                }}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Chronometer Grade Certification Verdict */}
          <div className={`p-4 rounded-xl border ${chronometerVerdict.color} space-y-1`}>
            <div className="flex items-center gap-1.5 font-bold text-xs font-mono">
              <Sparkles size={14} />
              <span>{chronometerVerdict.label}</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {chronometerVerdict.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
