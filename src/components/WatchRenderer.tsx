import React, { useState, useEffect, useRef, useMemo, useId } from "react";
import { Watch, WatchRenderingConfig } from "../types";
import { horologyAudio } from "../utils/audio";
import { DEFAULT_RENDERING_CONFIG } from "../utils/watchUtils";

interface WatchRendererProps {
  watch: Watch;
  size?: "thumbnail" | "small" | "medium" | "large" | "hero";
  isLumeMode?: boolean;
  interactiveBezel?: boolean;
  interactiveTilt?: boolean;
  customStrap?: string;
  showStraps?: boolean;
  bezelAngleOffset?: number;
  onBezelRotate?: (newAngle: number) => void;
  className?: string;
  id?: string;
}

export const WatchRenderer: React.FC<WatchRendererProps> = ({
  watch,
  size = "medium",
  isLumeMode = false,
  interactiveBezel = false,
  interactiveTilt = true,
  customStrap,
  showStraps = true,
  bezelAngleOffset = 0,
  onBezelRotate,
  className = "",
  id,
}) => {
  const reactId = useId();
  const uid = useMemo(() => {
    const safeId = (watch?.id || "w").replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeRaw = reactId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return `wr_${safeRaw}_${safeId}`;
  }, [reactId, watch?.id]);

  const [time, setTime] = useState(() => new Date());
  const [bezelRotation, setBezelRotation] = useState(bezelAngleOffset);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingBezel = useRef(false);

  // Sync external bezel angle
  useEffect(() => {
    setBezelRotation(bezelAngleOffset);
  }, [bezelAngleOffset]);

  // High-precision clock timer for mechanical sweeping seconds
  useEffect(() => {
    let animationFrameId: number;
    const update = () => {
      setTime(new Date());
      animationFrameId = requestAnimationFrame(update);
    };
    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const config: WatchRenderingConfig = useMemo(() => ({
    ...DEFAULT_RENDERING_CONFIG,
    ...(watch?.renderingConfig || {}),
  }), [watch?.renderingConfig]);

  const strapType = customStrap || config.strapType || "leather_alligator";
  const watchBrand = watch?.brand || "Watch";
  const watchName = watch?.name || "Timepiece";
  const watchBrandLower = watchBrand.toLowerCase();
  const watchNameLower = watchName.toLowerCase();

  // Compute angles
  const milliseconds = time.getMilliseconds();
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  // Mechanical frequency calculation: e.g. 28,800 vph = 8 ticks per second
  const vph = watch.movement?.frequencyVph || 28800;
  const ticksPerSecond = vph / 3600; // usually 8, 6, 10 or 1 (quartz)
  const quantizedSeconds =
    ticksPerSecond > 1
      ? Math.floor((seconds + milliseconds / 1000) * ticksPerSecond) / ticksPerSecond
      : seconds;

  const secondAngle = (quantizedSeconds / 60) * 360;
  const minuteAngle = (minutes / 60) * 360 + (seconds / 60) * 6;
  const hourAngle = (hours / 12) * 360 + (minutes / 60) * 30;

  // Dimension scaling
  const sizeMap: Record<string, { width: number; height: number; dialR: number; caseR: number }> = {
    thumbnail: { width: 140, height: 180, dialR: 44, caseR: 54 },
    small: { width: 170, height: 210, dialR: 52, caseR: 64 },
    medium: { width: 220, height: 280, dialR: 68, caseR: 82 },
    large: { width: 320, height: 390, dialR: 100, caseR: 120 },
    hero: { width: 440, height: 520, dialR: 138, caseR: 165 },
  };

  const currentSize = sizeMap[size] || sizeMap.medium || { width: 220, height: 280, dialR: 68, caseR: 82 };
  const cx = currentSize.width / 2;
  const cy = currentSize.height / 2;

  // Metal Finish Color Palettes
  const metalColors = useMemo(() => {
    switch (config.caseFinish) {
      case "yellow_gold":
        return {
          base: "#eab308",
          highlight: "#fef08a",
          dark: "#a16207",
          gradient: ["#ca8a04", "#fef08a", "#a16207", "#fef9c3", "#854d0e"],
          text: "#ca8a04",
        };
      case "rose_gold":
        return {
          base: "#f472b6",
          highlight: "#ffe4e6",
          dark: "#9f1239",
          gradient: ["#fb7185", "#ffe4e6", "#be123c", "#fecdd3", "#881337"],
          text: "#e11d48",
        };
      case "white_gold":
      case "platinum":
        return {
          base: "#e2e8f0",
          highlight: "#ffffff",
          dark: "#64748b",
          gradient: ["#cbd5e1", "#ffffff", "#94a3b8", "#f8fafc", "#64748b"],
          text: "#94a3b8",
        };
      case "titanium":
        return {
          base: "#64748b",
          highlight: "#94a3b8",
          dark: "#334155",
          gradient: ["#475569", "#94a3b8", "#334155", "#64748b", "#1e293b"],
          text: "#94a3b8",
        };
      case "bronze":
        return {
          base: "#b45309",
          highlight: "#fde68a",
          dark: "#78350f",
          gradient: ["#92400e", "#fef3c7", "#78350f", "#d97706", "#451a03"],
          text: "#b45309",
        };
      case "black_ceramic":
        return {
          base: "#1e293b",
          highlight: "#475569",
          dark: "#090d16",
          gradient: ["#18181b", "#3f3f46", "#09090b", "#27272a", "#050505"],
          text: "#71717a",
        };
      case "two_tone":
        return {
          base: "#cbd5e1",
          highlight: "#fef08a",
          dark: "#a16207",
          gradient: ["#94a3b8", "#fef08a", "#ca8a04", "#ffffff", "#854d0e"],
          text: "#ca8a04",
        };
      case "steel":
      default:
        return {
          base: "#cbd5e1",
          highlight: "#ffffff",
          dark: "#475569",
          gradient: ["#94a3b8", "#f8fafc", "#475569", "#ffffff", "#334155"],
          text: "#94a3b8",
        };
    }
  }, [config.caseFinish]);

  // Lume Glow Color
  const lumeGlow = useMemo(() => {
    if (!isLumeMode || config.lumeColor === "none") return null;
    switch (config.lumeColor) {
      case "ice_blue":
        return { fill: "#38bdf8", stroke: "#0284c7", filter: `url(#${uid}-lume-blue-glow)` };
      case "vintage_tritium":
        return { fill: "#fde047", stroke: "#ca8a04", filter: `url(#${uid}-lume-amber-glow)` };
      case "green":
      default:
        return { fill: "#4ade80", stroke: "#16a34a", filter: `url(#${uid}-lume-green-glow)` };
    }
  }, [isLumeMode, config.lumeColor, uid]);

  // Handle Mouse Tilt Reflection
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactiveTilt || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setMousePos({ x, y });

    // Handle Bezel Dragging
    if (isDraggingBezel.current && interactiveBezel) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const curX = e.clientX - rect.left - centerX;
      const curY = e.clientY - rect.top - centerY;
      let angle = Math.atan2(curY, curX) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      // Snap to 120 clicks (3 degrees per click)
      const snapped = Math.round(angle / 3) * 3;
      if (snapped !== bezelRotation) {
        setBezelRotation(snapped);
        horologyAudio.playBezelClick();
        if (onBezelRotate) onBezelRotate(snapped);
      }
    }
  };

  const handleBezelMouseDown = (e: React.MouseEvent) => {
    if (!interactiveBezel) return;
    e.stopPropagation();
    isDraggingBezel.current = true;
    horologyAudio.playBezelClick();
  };

  const handleMouseUp = () => {
    isDraggingBezel.current = false;
  };

  // Detect special horological signatures
  const isMuseum =
    config.markerType === "museum_dot" ||
    config.dialPattern === "museum_minimalist" ||
    watchBrandLower.includes("movado") ||
    watchNameLower.includes("museum") ||
    watchNameLower.includes("muesuem");

  const isPanerai =
    config.markerType === "panerai_sandwich" ||
    config.paneraiBridge ||
    config.crownStyle === "panerai_bridge" ||
    watchBrandLower.includes("panerai");

  const isCartier =
    config.caseShape === "tank" ||
    config.caseBezelType === "cartier_tank_brancards" ||
    config.crownStyle === "cabochon" ||
    watchBrandLower.includes("cartier");

  const isRichardMille =
    config.caseShape === "tonneau" ||
    config.bezelScrews === "richard_mille_spline" ||
    config.crownStyle === "richard_mille_flange" ||
    config.pusherStyle === "richard_mille_tactical" ||
    watchBrandLower.includes("richard mille") ||
    watchNameLower.includes("rm ") ||
    watchNameLower.includes("rm-") ||
    watchNameLower.includes("rm 11") ||
    watchNameLower.includes("rm 011") ||
    watchNameLower.includes("rm 27") ||
    watchNameLower.includes("rm 35") ||
    watchNameLower.includes("rm 50");

  const isBullhead =
    config.caseShape === "bullhead" ||
    config.crownStyle === "bullhead_top" ||
    config.pusherStyle === "bullhead_top" ||
    watchNameLower.includes("bullhead");

  const isMonaco =
    (watchBrandLower.includes("heuer") && watchNameLower.includes("monaco")) ||
    config.crownStyle === "left_hand";

  const isChronograph =
    (Boolean(config.subdials && config.subdials.length >= 2)) ||
    (Boolean(config.pusherStyle && config.pusherStyle !== "none")) ||
    watch?.category === "Chronograph" ||
    watchNameLower.includes("chronograph") ||
    watchNameLower.includes("chrono") ||
    watchNameLower.includes("daytona") ||
    watchNameLower.includes("speedmaster") ||
    watchNameLower.includes("navitimer") ||
    watchNameLower.includes("monaco") ||
    watchNameLower.includes("el primero") ||
    watchNameLower.includes("datograph");

  const isSkeleton =
    config.dialPattern === "skeleton" ||
    (config.skeletonDetails !== "none" && Boolean(config.skeletonDetails)) ||
    isRichardMille ||
    watch?.category === "Skeleton" ||
    watchNameLower.includes("skeleton") ||
    watchNameLower.includes("squelette") ||
    (Array.isArray(watch?.movement?.features) &&
      watch.movement.features.some(
        (f) => typeof f === "string" && (f.toLowerCase().includes("skeleton") || f.toLowerCase().includes("openworked"))
      ));

  const isOpenHeart =
    !isSkeleton &&
    (config.dialPattern === "open_heart" ||
      Boolean(config.hasOpenHeartOrTourbillon) ||
      watchNameLower.includes("open heart") ||
      watchNameLower.includes("open-heart") ||
      watchNameLower.includes("heart beat") ||
      watchNameLower.includes("tourbillon"));

  // Kinetic movement animation angles
  const balanceAngle = Math.sin((time.getTime() / 1000) * (vph / 3600) * Math.PI * 2) * 55;
  const escapeWheelAngle = ((time.getTime() / 1000) * 360 * (vph / 3600) / 12) % 360;
  const centerWheelAngle = (time.getSeconds() * 6 + (time.getMilliseconds() / 1000) * 6) % 360;
  const trainWheelAngle = (time.getSeconds() * 12 + (time.getMilliseconds() / 1000) * 12) % 360;

  // Helper for Dial Markers
  const renderMarkers = () => {
    const isTonneau = config.caseShape === "tonneau" || isRichardMille;
    const isSquare = config.caseShape === "square" || config.caseShape === "tank" || config.caseShape === "reverso";

    // For Richard Mille / Tonneau Skeleton, markers & racing numerals are integrated into the skeleton dial
    if (isTonneau && isSkeleton) {
      return null;
    }

    const markers = [];
    const r = currentSize.dialR;
    const tw = r * 1.52;
    const th = r * 2.08;
    const isLume = Boolean(lumeGlow);

    // 1. MOVADO MUSEUM ICONIC DIAL (Designed by Bauhaus artist Nathan George Horwitt)
    // Pure stark dial with ONLY the solitary concave metallic Sun Dot at 12 o'clock, zero minute ticks
    if (isMuseum || config.markerType === "museum_dot") {
      const dotRadius = size === "hero" ? 13 : size === "large" ? 9 : size === "medium" ? 6.5 : 4.5;
      const dotY = cy - r * 0.65;
      const isGoldDot =
        Boolean(config.caseFinish && config.caseFinish.includes("gold")) ||
        config.markerColor === "#f59e0b" ||
        config.dialColor === "#09090b" ||
        Boolean(config.museumDotColor && config.museumDotColor.includes("gold")) ||
        !(config.caseFinish && config.caseFinish.includes("steel"));
      const dotFill = isGoldDot ? `url(#${uid}-museum-dot-gold-grad)` : `url(#${uid}-museum-dot-silver-grad)`;
      const rimStroke = isGoldDot ? "#a16207" : "#475569";

      return (
        <g id="movado-museum-sun-dot">
          {/* Outer Dimensional Concave Rim */}
          <circle
            cx={cx}
            cy={dotY}
            r={dotRadius + 1.2}
            fill="none"
            stroke={rimStroke}
            strokeWidth="0.8"
            opacity={0.8}
          />
          {/* Main Concave Dish Dot */}
          <circle
            cx={cx}
            cy={dotY}
            r={dotRadius}
            fill={dotFill}
            stroke={rimStroke}
            strokeWidth="1.2"
            filter={`url(#${uid}-museum-dot-shadow)`}
          />
          {/* Internal Concave Specular Light Crescent */}
          <ellipse
            cx={cx - dotRadius * 0.25}
            cy={dotY - dotRadius * 0.25}
            rx={dotRadius * 0.55}
            ry={dotRadius * 0.35}
            transform={`rotate(-30, ${cx - dotRadius * 0.25}, ${dotY - dotRadius * 0.25})`}
            fill="#ffffff"
            opacity={0.55}
          />
        </g>
      );
    }

    // 2. PANERAI SANDWICH DIAL (Cutout Stencil Numerals 12, 3, 6, 9 with sunken luminous disc)
    if (config.markerType === "panerai_sandwich" || isPanerai) {
      const sandwichNumerals = [
        { num: "12", angle: 0 },
        { num: "3", angle: 90 },
        { num: "6", angle: 180 },
        { num: "9", angle: 270 },
      ];

      return (
        <g id="panerai-sandwich-dial">
          {/* Sandwich Cutout Numerals at Cardinal Hours */}
          {sandwichNumerals.map(({ num, angle }) => {
            const rad = (angle - 90) * (Math.PI / 180);
            const mR = r - (size === "hero" ? 22 : size === "large" ? 16 : 12);
            const nx = cx + mR * Math.cos(rad);
            const ny = cy + mR * Math.sin(rad);

            return (
              <g key={num} id={`sandwich-num-${num}`}>
                {/* Sunken Lume Glow Underplate */}
                <text
                  x={nx}
                  y={ny + (size === "hero" ? 6 : 4)}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 20 : size === "large" ? 15 : 11}
                  fontFamily="sans-serif"
                  fontWeight="900"
                  fill={isLume ? lumeGlow.fill : "#4ade80"}
                  stroke="#16a34a"
                  strokeWidth="0.5"
                  filter={isLume ? lumeGlow.filter : undefined}
                >
                  {num}
                </text>
                {/* Stencil Cutout Bevel Shadow */}
                <text
                  x={nx - 0.5}
                  y={ny + (size === "hero" ? 5.5 : 3.5)}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 20 : size === "large" ? 15 : 11}
                  fontFamily="sans-serif"
                  fontWeight="900"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="1.2"
                  opacity={0.7}
                >
                  {num}
                </text>
              </g>
            );
          })}

          {/* Elongated Stencil Slits for non-cardinal hours */}
          {[1, 2, 4, 5, 7, 8, 10, 11].map((hour) => {
            const angle = hour * 30;
            const rad = (angle - 90) * (Math.PI / 180);
            const mR = r - (size === "hero" ? 15 : size === "large" ? 11 : 8);
            const bx = cx + mR * Math.cos(rad);
            const by = cy + mR * Math.sin(rad);
            const w = size === "hero" ? 4.5 : 3;
            const h = size === "hero" ? 16 : 11;

            return (
              <g key={hour} transform={`rotate(${angle}, ${bx}, ${by})`}>
                <rect
                  x={bx - w / 2}
                  y={by - h / 2}
                  width={w}
                  height={h}
                  rx="1"
                  fill={isLume ? lumeGlow.fill : "#4ade80"}
                  stroke="#000000"
                  strokeWidth="0.8"
                  filter={isLume ? lumeGlow.filter : undefined}
                />
              </g>
            );
          })}
        </g>
      );
    }

    // 3. CALIFORNIA DIAL (Half Roman on Top, Half Arabic on Bottom)
    if (config.markerType === "california") {
      const caliMarks = [
        { val: "▼", isTri: true }, // 12
        { val: "I" }, // 1
        { val: "II" }, // 2
        { val: "—", isDash: true }, // 3
        { val: "4" }, // 4
        { val: "5" }, // 5
        { val: "—", isDash: true }, // 6
        { val: "7" }, // 7
        { val: "8" }, // 8
        { val: "—", isDash: true }, // 9
        { val: "X" }, // 10
        { val: "XI" }, // 11
      ];

      for (let i = 0; i < 12; i++) {
        const angle = i * 30;
        const rad = (angle - 90) * (Math.PI / 180);
        const markerR = r - (size === "hero" ? 16 : size === "large" ? 12 : 8);
        const mx = cx + markerR * Math.cos(rad);
        const my = cy + markerR * Math.sin(rad);
        const mark = caliMarks[i];

        if (mark.isTri) {
          const triSize = size === "hero" ? 12 : 8;
          markers.push(
            <polygon
              key={i}
              points={`${mx},${my + triSize} ${mx - triSize},${my - triSize / 1.5} ${mx + triSize},${my - triSize / 1.5}`}
              fill={isLume ? lumeGlow.fill : "#fde047"}
              stroke="#ca8a04"
              strokeWidth="1"
              filter={isLume ? lumeGlow.filter : undefined}
            />
          );
        } else if (mark.isDash) {
          markers.push(
            <rect
              key={i}
              x={mx - (size === "hero" ? 7 : 4)}
              y={my - (size === "hero" ? 2 : 1.5)}
              width={size === "hero" ? 14 : 8}
              height={size === "hero" ? 4 : 3}
              rx="1"
              fill={isLume ? lumeGlow.fill : "#fde047"}
              stroke="#ca8a04"
              strokeWidth="0.8"
            />
          );
        } else {
          markers.push(
            <text
              key={i}
              x={mx}
              y={my + (size === "hero" ? 5 : 3)}
              textAnchor="middle"
              fontSize={size === "hero" ? 14 : size === "large" ? 10 : 7.5}
              fontFamily="serif"
              fontWeight="bold"
              fill={isLume ? lumeGlow.fill : "#fde047"}
              transform={`rotate(${angle}, ${mx}, ${my})`}
            >
              {mark.val}
            </text>
          );
        }
      }
      return markers;
    }

    // 4. ROLEX EXPLORER 3-6-9 DIAL
    if (config.markerType === "explorer_369") {
      for (let i = 0; i < 12; i++) {
        const angle = i * 30;
        const rad = (angle - 90) * (Math.PI / 180);
        const markerR = r - (size === "hero" ? 14 : size === "large" ? 10 : 7);
        const mx = cx + markerR * Math.cos(rad);
        const my = cy + markerR * Math.sin(rad);

        if (i === 0) {
          const triSize = size === "hero" ? 12 : 8;
          markers.push(
            <polygon
              key={i}
              points={`${mx},${my + triSize} ${mx - triSize},${my - triSize / 1.5} ${mx + triSize},${my - triSize / 1.5}`}
              fill={isLume ? lumeGlow.fill : "#ffffff"}
              stroke="#64748b"
              strokeWidth="1.2"
              filter={isLume ? lumeGlow.filter : undefined}
            />
          );
        } else if (i === 3 || i === 6 || i === 9) {
          const num = i === 3 ? "3" : i === 6 ? "6" : "9";
          markers.push(
            <text
              key={i}
              x={mx}
              y={my + (size === "hero" ? 6 : 4)}
              textAnchor="middle"
              fontSize={size === "hero" ? 18 : size === "large" ? 13 : 10}
              fontFamily="sans-serif"
              fontWeight="900"
              fill={isLume ? lumeGlow.fill : "#ffffff"}
              stroke="#475569"
              strokeWidth="0.8"
              filter={isLume ? lumeGlow.filter : undefined}
            >
              {num}
            </text>
          );
        } else {
          const w = size === "hero" ? 4 : 2.8;
          const h = size === "hero" ? 13 : 9;
          markers.push(
            <rect
              key={i}
              x={mx - w / 2}
              y={my - h / 2}
              width={w}
              height={h}
              rx="0.8"
              transform={`rotate(${angle}, ${mx}, ${my})`}
              fill={isLume ? lumeGlow.fill : "#ffffff"}
              stroke="#64748b"
              strokeWidth="0.8"
              filter={isLume ? lumeGlow.filter : undefined}
            />
          );
        }
      }
      return markers;
    }

    // 5. Standard Loop (Diver Mixed, Roman Numerals, Arabic Numerals, Applied Batons)
    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      const rad = (angle - 90) * (Math.PI / 180);
      const isQuarter = i % 3 === 0;
      const markerR = isSkeleton
        ? r * 0.89
        : r - (size === "hero" ? 14 : size === "large" ? 10 : 7);
      const mx = isTonneau
        ? cx + (tw * 0.36) * Math.cos(rad)
        : isSquare
        ? cx + (r * 0.72) * Math.cos(rad)
        : cx + markerR * Math.cos(rad);
      const my = isTonneau
        ? cy + (th * 0.38) * Math.sin(rad)
        : isSquare
        ? cy + (r * (config.caseShape === "tank" || config.caseShape === "reverso" ? 1.05 : 0.72)) * Math.sin(rad)
        : cy + markerR * Math.sin(rad);

      // Diver Mixed markers (Rolex Submariner style)
      if (config.markerType === "diver_mixed") {
        if (i === 0) {
          // 12 o'clock downward triangle
          const triSize = size === "hero" ? 12 : 8;
          markers.push(
            <polygon
              key={i}
              points={`${mx},${my + triSize} ${mx - triSize},${my - triSize / 1.5} ${mx + triSize},${my - triSize / 1.5}`}
              fill={isLume ? lumeGlow.fill : "#ffffff"}
              stroke={isLume ? lumeGlow.stroke : "#64748b"}
              strokeWidth="1.2"
              filter={isLume ? lumeGlow.filter : undefined}
            />
          );
        } else if (i === 3 && config.dateWindow) {
          // Date window space, skip marker
        } else if (i === 6 || i === 9) {
          // 6 & 9 o'clock rectangles
          const w = size === "hero" ? 6 : 4;
          const h = size === "hero" ? 14 : 9;
          markers.push(
            <rect
              key={i}
              x={mx - w / 2}
              y={my - h / 2}
              width={w}
              height={h}
              rx="1"
              transform={`rotate(${angle}, ${mx}, ${my})`}
              fill={isLume ? lumeGlow.fill : "#ffffff"}
              stroke={isLume ? lumeGlow.stroke : "#64748b"}
              strokeWidth="1.2"
              filter={isLume ? lumeGlow.filter : undefined}
            />
          );
        } else {
          // Circular dots
          const dotR = size === "hero" ? 5 : size === "large" ? 4 : 2.8;
          markers.push(
            <circle
              key={i}
              cx={mx}
              cy={my}
              r={dotR}
              fill={isLume ? lumeGlow.fill : "#ffffff"}
              stroke={isLume ? lumeGlow.stroke : "#64748b"}
              strokeWidth="1.2"
              filter={isLume ? lumeGlow.filter : undefined}
            />
          );
        }
      } else if (config.markerType === "roman_numerals" || config.markerType === "railroad_roman") {
        const roman = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"][i];
        if (i === 3 && config.dateWindow && config.caseShape !== "square" && config.caseShape !== "tank") continue;
        markers.push(
          <text
            key={i}
            x={mx}
            y={my + (size === "hero" ? 5 : 3)}
            textAnchor="middle"
            fontSize={isQuarter ? (size === "hero" ? 14 : 10) : size === "hero" ? 11 : 8}
            fontFamily="serif"
            fontWeight={isQuarter ? "bold" : "normal"}
            fill={isLume ? lumeGlow.fill : config.markerColor || "#1e293b"}
            transform={`rotate(${angle}, ${mx}, ${my})`}
          >
            {roman}
          </text>
        );
      } else if (config.markerType === "arabic_numerals" || config.markerType === "breguet_numerals") {
        const num = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11][i];
        if (i === 3 && config.dateWindow) continue;
        markers.push(
          <text
            key={i}
            x={mx}
            y={my + (size === "hero" ? 4 : 3)}
            textAnchor="middle"
            fontSize={isQuarter ? (size === "hero" ? 15 : 11) : size === "hero" ? 12 : 9}
            fontFamily={config.markerType === "breguet_numerals" ? "serif" : "sans-serif"}
            fontWeight="bold"
            fill={isLume ? lumeGlow.fill : config.markerColor || "#1e293b"}
          >
            {num}
          </text>
        );
      } else if (config.markerType !== "none") {
        // Applied Batons / Minimal Indices
        const w = isQuarter ? (size === "hero" ? 5 : 3.5) : size === "hero" ? 3.5 : 2;
        const h = isQuarter ? (size === "hero" ? 14 : 9) : size === "hero" ? 10 : 6;
        if (i === 3 && config.dateWindow) continue;
        markers.push(
          <rect
            key={i}
            x={mx - w / 2}
            y={my - h / 2}
            width={w}
            height={h}
            rx="0.5"
            transform={`rotate(${angle}, ${mx}, ${my})`}
            fill={isLume ? lumeGlow.fill : config.markerColor || metalColors.highlight}
            stroke={isLume ? lumeGlow.stroke : metalColors.dark}
            strokeWidth="0.8"
            filter={isLume ? lumeGlow.filter : undefined}
          />
        );
      }
    }

    // Minute Ticks (Skipped on minimalist dials like Movado Museum, and non-round geometry where flange handles tracking)
    if (!isMuseum && config.markerType !== "none" && !isTonneau && !isSquare) {
      for (let m = 0; m < 60; m++) {
        if (m % 5 === 0) continue;
        const angle = m * 6;
        const rad = (angle - 90) * (Math.PI / 180);
        const tickR = r - (size === "hero" ? 6 : 4);
        const tx = cx + tickR * Math.cos(rad);
        const ty = cy + tickR * Math.sin(rad);
        markers.push(
          <line
            key={`min-${m}`}
            x1={tx}
            y1={ty}
            x2={tx + 2 * Math.cos(rad)}
            y2={ty + 2 * Math.sin(rad)}
            stroke={isLume ? "#1e293b" : "#94a3b8"}
            strokeWidth={size === "hero" ? 1.2 : 0.8}
            opacity={0.6}
          />
        );
      }
    }

    return markers;
  };

  // Helper for Hands with 3D Faceted Bevels & Depth Shadows
  const renderHands = () => {
    const isLume = !!lumeGlow;
    const r = currentSize.dialR;
    const hourLen = r * 0.56;
    const minLen = r * 0.84;
    const secLen = r * 0.92;

    const hourWidth = size === "hero" ? 7.5 : size === "large" ? 5.5 : 3.8;
    const minWidth = size === "hero" ? 5.5 : size === "large" ? 4.2 : 2.8;

    return (
      <g id="watch-hands">
        {/* Soft Depth Drop Shadow under entire hand assembly */}
        <g opacity={0.4} transform="translate(1.5, 2)">
          <g transform={`rotate(${hourAngle}, ${cx}, ${cy})`}>
            <rect
              x={cx - hourWidth / 2}
              y={cy - hourLen}
              width={hourWidth}
              height={hourLen + 4}
              rx={hourWidth / 3}
              fill="#000000"
            />
          </g>
          <g transform={`rotate(${minuteAngle}, ${cx}, ${cy})`}>
            <rect
              x={cx - minWidth / 2}
              y={cy - minLen}
              width={minWidth}
              height={minLen + 4}
              rx={minWidth / 3}
              fill="#000000"
            />
          </g>
        </g>

        {/* Hour Hand */}
        <g transform={`rotate(${hourAngle}, ${cx}, ${cy})`}>
          {config.handsType === "mercedes" ? (
            <g>
              <line
                x1={cx}
                y1={cy + 8}
                x2={cx}
                y2={cy - hourLen}
                stroke={metalColors.highlight}
                strokeWidth={hourWidth}
                strokeLinecap="round"
              />
              <circle
                cx={cx}
                cy={cy - hourLen * 0.65}
                r={hourWidth * 1.3}
                fill={isLume ? lumeGlow.fill : "#ffffff"}
                stroke={metalColors.dark}
                strokeWidth="1"
                filter={isLume ? lumeGlow.filter : undefined}
              />
              {/* Mercedes Tri-Star */}
              <line
                x1={cx}
                y1={cy - hourLen * 0.65}
                x2={cx}
                y2={cy - hourLen * 0.65 - hourWidth * 1.3}
                stroke={metalColors.dark}
                strokeWidth="0.8"
              />
              <line
                x1={cx}
                y1={cy - hourLen * 0.65}
                x2={cx - hourWidth}
                y2={cy - hourLen * 0.65 + hourWidth * 0.8}
                stroke={metalColors.dark}
                strokeWidth="0.8"
              />
              <line
                x1={cx}
                y1={cy - hourLen * 0.65}
                x2={cx + hourWidth}
                y2={cy - hourLen * 0.65 + hourWidth * 0.8}
                stroke={metalColors.dark}
                strokeWidth="0.8"
              />
            </g>
          ) : config.handsType === "skeleton" || isSkeleton ? (
            /* Haute Horlogerie Openworked Skeleton Hour Hand */
            <g>
              {/* Outer open frame */}
              <polygon
                points={`${cx},${cy + 4} ${cx - hourWidth},${cy - hourLen * 0.4} ${cx},${cy - hourLen} ${cx + hourWidth},${cy - hourLen * 0.4}`}
                fill={metalColors.highlight}
                stroke={metalColors.dark}
                strokeWidth="0.6"
              />
              {/* Inner cutout exposing dial mechanics */}
              <polygon
                points={`${cx},${cy - 2} ${cx - hourWidth * 0.55},${cy - hourLen * 0.4} ${cx},${cy - hourLen * 0.85} ${cx + hourWidth * 0.55},${cy - hourLen * 0.4}`}
                fill="#09090b"
                opacity={0.9}
              />
              {/* Center spine */}
              <line x1={cx} y1={cy - hourLen * 0.85} x2={cx} y2={cy - hourLen} stroke="#ffffff" strokeWidth="0.8" />
            </g>
          ) : config.handsType === "dauphine" || config.handsType === "alpha" ? (
            /* 3D Faceted Diamond-Cut Dauphine Hand (Left Bright, Right Shadow) */
            <g>
              {/* Left Beveled Facet (Specular Highlight) */}
              <polygon
                points={`${cx},${cy + 4} ${cx - hourWidth},${cy - hourLen * 0.42} ${cx},${cy - hourLen}`}
                fill={metalColors.highlight}
                stroke={metalColors.dark}
                strokeWidth="0.4"
              />
              {/* Right Beveled Facet (Shadow Side) */}
              <polygon
                points={`${cx},${cy + 4} ${cx + hourWidth},${cy - hourLen * 0.42} ${cx},${cy - hourLen}`}
                fill={metalColors.dark}
                stroke={metalColors.dark}
                strokeWidth="0.4"
              />
              {/* Center Razor Ridge */}
              <line x1={cx} y1={cy + 4} x2={cx} y2={cy - hourLen} stroke="#ffffff" strokeWidth="0.5" opacity={0.8} />
            </g>
          ) : (
            /* Faceted Baton / Sword Hand with Luminous Inset Channel */
            <g>
              <rect
                x={cx - hourWidth / 2}
                y={cy - hourLen}
                width={hourWidth}
                height={hourLen + 6}
                rx={hourWidth / 4}
                fill={metalColors.highlight}
                stroke={metalColors.dark}
                strokeWidth="0.8"
              />
              {/* Longitudinal light edge */}
              <line
                x1={cx - hourWidth / 2 + 0.5}
                y1={cy - hourLen + 2}
                x2={cx - hourWidth / 2 + 0.5}
                y2={cy + 4}
                stroke="#ffffff"
                strokeWidth="0.6"
                opacity={0.8}
              />
              {/* Inner Lume Core */}
              <rect
                x={cx - hourWidth / 4}
                y={cy - hourLen + 4}
                width={hourWidth / 2}
                height={hourLen * 0.72}
                rx="1"
                fill={isLume ? lumeGlow.fill : "#f8fafc"}
                stroke={isLume ? lumeGlow.stroke : "#94a3b8"}
                strokeWidth="0.4"
                filter={isLume ? lumeGlow.filter : undefined}
              />
            </g>
          )}
        </g>

        {/* Minute Hand */}
        <g transform={`rotate(${minuteAngle}, ${cx}, ${cy})`}>
          {config.handsType === "skeleton" || isSkeleton ? (
            /* Haute Horlogerie Openworked Skeleton Minute Hand */
            <g>
              <polygon
                points={`${cx},${cy + 4} ${cx - minWidth},${cy - minLen * 0.36} ${cx},${cy - minLen} ${cx + minWidth},${cy - minLen * 0.36}`}
                fill={metalColors.highlight}
                stroke={metalColors.dark}
                strokeWidth="0.6"
              />
              <polygon
                points={`${cx},${cy - 2} ${cx - minWidth * 0.55},${cy - minLen * 0.36} ${cx},${cy - minLen * 0.88} ${cx + minWidth * 0.55},${cy - minLen * 0.36}`}
                fill="#09090b"
                opacity={0.9}
              />
              <line x1={cx} y1={cy - minLen * 0.88} x2={cx} y2={cy - minLen} stroke="#ffffff" strokeWidth="0.8" />
            </g>
          ) : config.handsType === "dauphine" || config.handsType === "alpha" ? (
            /* 3D Faceted Diamond-Cut Minute Hand */
            <g>
              <polygon
                points={`${cx},${cy + 4} ${cx - minWidth},${cy - minLen * 0.38} ${cx},${cy - minLen}`}
                fill={metalColors.highlight}
                stroke={metalColors.dark}
                strokeWidth="0.4"
              />
              <polygon
                points={`${cx},${cy + 4} ${cx + minWidth},${cy - minLen * 0.38} ${cx},${cy - minLen}`}
                fill={metalColors.dark}
                stroke={metalColors.dark}
                strokeWidth="0.4"
              />
              <line x1={cx} y1={cy + 4} x2={cx} y2={cy - minLen} stroke="#ffffff" strokeWidth="0.5" opacity={0.8} />
            </g>
          ) : (
            <g>
              <rect
                x={cx - minWidth / 2}
                y={cy - minLen}
                width={minWidth}
                height={minLen + 8}
                rx={minWidth / 4}
                fill={metalColors.highlight}
                stroke={metalColors.dark}
                strokeWidth="0.8"
              />
              <line
                x1={cx - minWidth / 2 + 0.5}
                y1={cy - minLen + 2}
                x2={cx - minWidth / 2 + 0.5}
                y2={cy + 4}
                stroke="#ffffff"
                strokeWidth="0.6"
                opacity={0.8}
              />
              <rect
                x={cx - minWidth / 4}
                y={cy - minLen + 4}
                width={minWidth / 2}
                height={minLen * 0.78}
                rx="1"
                fill={isLume ? lumeGlow.fill : "#f8fafc"}
                stroke={isLume ? lumeGlow.stroke : "#94a3b8"}
                strokeWidth="0.4"
                filter={isLume ? lumeGlow.filter : undefined}
              />
            </g>
          )}
        </g>

        {/* Sweeping Seconds Hand with Counterweight and Diamond/Lollipop Tip */}
        <g transform={`rotate(${secondAngle}, ${cx}, ${cy})`}>
          {/* Main Needle Blade */}
          <line
            x1={cx}
            y1={cy + 16}
            x2={cx}
            y2={cy - secLen}
            stroke={config.secondsHandColor || "#ef4444"}
            strokeWidth={size === "hero" ? 1.8 : 1.2}
            strokeLinecap="round"
          />
          {/* Lume Pip / Target Lollipop */}
          <circle
            cx={cx}
            cy={cy - secLen * 0.7}
            r={size === "hero" ? 3.8 : 2.4}
            fill={isLume ? lumeGlow.fill : config.secondsHandColor || "#ef4444"}
            stroke={metalColors.dark}
            strokeWidth="0.8"
            filter={isLume ? lumeGlow.filter : undefined}
          />
          {/* Extended Counterweight Balance Disc */}
          <circle
            cx={cx}
            cy={cy + 10}
            r={size === "hero" ? 2.8 : 1.9}
            fill={config.secondsHandColor || "#ef4444"}
            stroke={metalColors.dark}
            strokeWidth="0.5"
          />
        </g>

        {/* Center Pinion, Cap & Mirror-Polished Collar */}
        <circle cx={cx} cy={cy} r={size === "hero" ? 5.2 : 3.6} fill={metalColors.highlight} stroke={metalColors.dark} strokeWidth="1" />
        <circle cx={cx} cy={cy} r={size === "hero" ? 2.2 : 1.4} fill="#09090b" />
        <circle cx={cx - 0.8} cy={cy - 0.8} r="0.6" fill="#ffffff" opacity={0.8} />
      </g>
    );
  };

  // Helper for Subdials (e.g. Chronographs, Sub-seconds, Power Reserve, Moonphase)
  const renderSubdials = () => {
    if (!config.subdials || config.subdials.length === 0) return null;
    const subdialR = currentSize.dialR * 0.28;

    return config.subdials.map((sub, idx) => {
      let sx = cx;
      let sy = cy;
      const offset = currentSize.dialR * 0.48;

      if (sub.position === "3") {
        sx = cx + offset;
      } else if (sub.position === "6" || sub.position === "sub_seconds") {
        sy = cy + offset;
      } else if (sub.position === "9") {
        sx = cx - offset;
      } else if (sub.position === "12") {
        sy = cy - offset;
      }

      // Moonphase Subdial Complication
      if (sub.type === "moonphase") {
        return (
          <g key={idx} id={`subdial-moonphase-${idx}`}>
            {/* Recessed Subdial Basin */}
            <circle
              cx={sx}
              cy={sy}
              r={subdialR}
              fill="#090d16"
              stroke={metalColors.dark}
              strokeWidth="1"
            />
            {/* Midnight Blue Starfield Aperture */}
            <circle cx={sx} cy={sy} r={subdialR * 0.9} fill="#0f172a" />
            {/* Polished Gold Moon Disc */}
            <circle cx={sx - subdialR * 0.2} cy={sy - subdialR * 0.15} r={subdialR * 0.38} fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
            {/* Golden Star Constellation */}
            {[-4, 2, 6, -6].map((xOff, i) => (
              <circle key={i} cx={sx + xOff} cy={sy - 4 + (i % 2) * 6} r={0.8} fill="#fef08a" />
            ))}
            {/* Double Arch Horizon Mask */}
            <path
              d={`M ${sx - subdialR * 0.9} ${sy} Q ${sx - subdialR * 0.4} ${sy + subdialR * 0.5} ${sx} ${sy + subdialR * 0.2} Q ${sx + subdialR * 0.4} ${sy + subdialR * 0.5} ${sx + subdialR * 0.9} ${sy} A ${subdialR * 0.9} ${subdialR * 0.9} 0 0 1 ${sx - subdialR * 0.9} ${sy}`}
              fill={config.dialColor}
              stroke={metalColors.dark}
              strokeWidth="0.6"
            />
            {/* Polished Rim */}
            <circle cx={sx} cy={sy} r={subdialR} fill="none" stroke={metalColors.highlight} strokeWidth="0.8" opacity={0.7} />
          </g>
        );
      }

      // Subdial Hand Angle
      let subAngle = 0;
      if (sub.type === "seconds") {
        subAngle = secondAngle;
      } else if (sub.type === "chrono_min") {
        subAngle = (minutes / 30) * 360;
      } else if (sub.type === "chrono_hour") {
        subAngle = (hours / 12) * 360;
      } else if (sub.type === "power_reserve") {
        subAngle = 45; // 75% full
      }

      return (
        <g key={idx} id={`subdial-${idx}`}>
          {/* Recessed Basin with Azuré Concentric Snailing */}
          <circle
            cx={sx}
            cy={sy}
            r={subdialR}
            fill={config.dialColor}
            stroke={metalColors.dark}
            strokeWidth="1"
            opacity={0.95}
          />
          {/* Azuré Fine Concentric Grooves */}
          <circle cx={sx} cy={sy} r={subdialR * 0.85} fill="none" stroke={metalColors.dark} strokeWidth="0.4" opacity={0.6} />
          <circle cx={sx} cy={sy} r={subdialR * 0.68} fill="none" stroke={metalColors.dark} strokeWidth="0.4" opacity={0.5} />
          <circle cx={sx} cy={sy} r={subdialR * 0.5} fill="none" stroke={metalColors.dark} strokeWidth="0.4" opacity={0.4} />
          <circle cx={sx} cy={sy} r={subdialR * 0.32} fill="none" stroke={metalColors.dark} strokeWidth="0.4" opacity={0.3} />
          
          {/* Polished Chamfer Rim */}
          <circle cx={sx} cy={sy} r={subdialR} fill="none" stroke={metalColors.highlight} strokeWidth="0.8" opacity={0.65} />

          {/* Subdial Label */}
          <text
            x={sx}
            y={sy - subdialR * 0.45}
            textAnchor="middle"
            fontSize={size === "hero" ? 7 : 5}
            fill={metalColors.highlight}
            opacity={0.85}
            fontWeight="700"
            fontFamily="sans-serif"
          >
            {sub.label}
          </text>

          {/* Subdial Hand with Center Pinion */}
          <g transform={`rotate(${subAngle}, ${sx}, ${sy})`}>
            <line
              x1={sx}
              y1={sy + 2}
              x2={sx}
              y2={sy - subdialR * 0.82}
              stroke={config.secondsHandColor || metalColors.highlight}
              strokeWidth={size === "hero" ? 1.4 : 1}
              strokeLinecap="round"
            />
            <circle cx={sx} cy={sy} r={1.6} fill={metalColors.highlight} stroke={metalColors.dark} strokeWidth="0.4" />
          </g>
        </g>
      );
    });
  };

  // Helper for Straps / Bracelets
  const renderStrap = () => {
    if (!showStraps) return null;
    const w = currentSize.dialR * 1.1;
    const topY = cy - currentSize.caseR - 35;
    const botY = cy + currentSize.caseR;
    const strapHeight = 45;

    // 1. Steel & Gold Metal Bracelets
    if (
      strapType === "integrated_steel" ||
      strapType === "oyster_bracelet" ||
      strapType === "jubilee_bracelet" ||
      strapType === "president_bracelet"
    ) {
      const isJubilee = strapType === "jubilee_bracelet";
      const isPresident = strapType === "president_bracelet";
      return (
        <g id="bracelet">
          {/* Top Bracelet Links */}
          <path
            d={`M ${cx - w / 2} ${topY} L ${cx + w / 2} ${topY} L ${cx + w / 2.2} ${cy - currentSize.caseR} L ${cx - w / 2.2} ${cy - currentSize.caseR} Z`}
            fill={`url(#${uid}-bracelet-metal-grad)`}
            stroke={metalColors.dark}
            strokeWidth="1"
          />
          {/* Link segments */}
          {[-25, -15, -5].map((yOffset, i) => (
            <line
              key={`top-link-${i}`}
              x1={cx - w / 2 + 2}
              y1={cy - currentSize.caseR + yOffset}
              x2={cx + w / 2 - 2}
              y2={cy - currentSize.caseR + yOffset}
              stroke={metalColors.dark}
              strokeWidth={isJubilee ? "1.5" : isPresident ? "1.2" : "1"}
            />
          ))}
          {/* Center polished links */}
          <rect
            x={cx - w / 6}
            y={topY}
            width={w / 3}
            height={cy - currentSize.caseR - topY}
            fill={isJubilee || isPresident ? `url(#${uid}-fluted-gold-bezel-grad)` : metalColors.highlight}
            opacity={0.6}
          />

          {/* Bottom Bracelet Links */}
          <path
            d={`M ${cx - w / 2.2} ${cy + currentSize.caseR} L ${cx + w / 2.2} ${cy + currentSize.caseR} L ${cx + w / 2} ${botY + strapHeight} L ${cx - w / 2} ${botY + strapHeight} Z`}
            fill={`url(#${uid}-bracelet-metal-grad)`}
            stroke={metalColors.dark}
            strokeWidth="1"
          />
          {[5, 15, 25, 35].map((yOffset, i) => (
            <line
              key={`bot-link-${i}`}
              x1={cx - w / 2 + 2}
              y1={botY + yOffset}
              x2={cx + w / 2 - 2}
              y2={botY + yOffset}
              stroke={metalColors.dark}
              strokeWidth={isJubilee ? "1.5" : isPresident ? "1.2" : "1"}
            />
          ))}
          <rect
            x={cx - w / 6}
            y={botY}
            width={w / 3}
            height={strapHeight}
            fill={isJubilee || isPresident ? `url(#${uid}-fluted-gold-bezel-grad)` : metalColors.highlight}
            opacity={0.6}
          />
        </g>
      );
    }

    // 2. Black Leather (Italian Alligator / Calfskin with Contrast Stitching)
    if (strapType === "leather_black") {
      return (
        <g id="black-leather-strap">
          {/* Top Strap */}
          <path
            d={`M ${cx - w / 2} ${topY} L ${cx + w / 2} ${topY} L ${cx + w / 2.1} ${cy - currentSize.caseR + 5} L ${cx - w / 2.1} ${cy - currentSize.caseR + 5} Z`}
            fill={`url(#${uid}-leather-black-grad)`}
            stroke="#09090b"
            strokeWidth="1.5"
          />
          {/* Embossed Alligator Texture Lines */}
          {[-26, -18, -10, -2].map((yOff, i) => (
            <path
              key={`alligator-top-${i}`}
              d={`M ${cx - w / 2.3 + 4} ${cy - currentSize.caseR + yOff} Q ${cx} ${cy - currentSize.caseR + yOff - 2} ${cx + w / 2.3 - 4} ${cy - currentSize.caseR + yOff}`}
              stroke="#27272a"
              strokeWidth="0.8"
              fill="none"
              opacity={0.6}
            />
          ))}
          {/* White / Platinum Contrast Edge Stitching */}
          <line
            x1={cx - w / 2 + 4}
            y1={topY + 2}
            x2={cx - w / 2.1 + 4}
            y2={cy - currentSize.caseR + 4}
            stroke="#e2e8f0"
            strokeWidth="0.8"
            strokeDasharray="2.5,2"
            opacity={0.85}
          />
          <line
            x1={cx + w / 2 - 4}
            y1={topY + 2}
            x2={cx + w / 2.1 - 4}
            y2={cy - currentSize.caseR + 4}
            stroke="#e2e8f0"
            strokeWidth="0.8"
            strokeDasharray="2.5,2"
            opacity={0.85}
          />

          {/* Bottom Strap */}
          <path
            d={`M ${cx - w / 2.1} ${cy + currentSize.caseR - 5} L ${cx + w / 2.1} ${cy + currentSize.caseR - 5} L ${cx + w / 2} ${botY + strapHeight} L ${cx - w / 2} ${botY + strapHeight} Z`}
            fill={`url(#${uid}-leather-black-grad)`}
            stroke="#09090b"
            strokeWidth="1.5"
          />
          {/* Alligator Embossing Lines */}
          {[6, 15, 24, 33, 42].map((yOff, i) => (
            <path
              key={`alligator-bot-${i}`}
              d={`M ${cx - w / 2.2 + 4} ${botY + yOff - 35} Q ${cx} ${botY + yOff - 37} ${cx + w / 2.2 - 4} ${botY + yOff - 35}`}
              stroke="#27272a"
              strokeWidth="0.8"
              fill="none"
              opacity={0.6}
            />
          ))}
          {/* Bottom Contrast Edge Stitching */}
          <line
            x1={cx - w / 2.1 + 4}
            y1={cy + currentSize.caseR - 4}
            x2={cx - w / 2 + 4}
            y2={botY + strapHeight - 2}
            stroke="#e2e8f0"
            strokeWidth="0.8"
            strokeDasharray="2.5,2"
            opacity={0.85}
          />
          <line
            x1={cx + w / 2.1 - 4}
            y1={cy + currentSize.caseR - 4}
            x2={cx + w / 2 - 4}
            y2={botY + strapHeight - 2}
            stroke="#e2e8f0"
            strokeWidth="0.8"
            strokeDasharray="2.5,2"
            opacity={0.85}
          />
        </g>
      );
    }

    // 3. Vulcanized Rubber Straps (Black, Oysterflex, Navy Blue, Orange)
    if (
      strapType === "rubber_black" ||
      strapType === "rubber_oysterflex" ||
      strapType === "rubber_blue" ||
      strapType === "rubber_orange"
    ) {
      const isBlue = strapType === "rubber_blue";
      const isOrange = strapType === "rubber_orange";
      const rubberFill = isBlue
        ? `url(#${uid}-rubber-blue-grad)`
        : isOrange
        ? `url(#${uid}-rubber-orange-grad)`
        : `url(#${uid}-rubber-black-grad)`;
      const ribColor = isBlue ? "#172554" : isOrange ? "#9a3412" : "#09090b";
      const highlightColor = isBlue ? "#3b82f6" : isOrange ? "#fb923c" : "#3f3f46";

      return (
        <g id="rubber-strap">
          {/* Top Rubber Section */}
          <path
            d={`M ${cx - w / 2} ${topY} L ${cx + w / 2} ${topY} L ${cx + w / 2.1} ${cy - currentSize.caseR + 4} L ${cx - w / 2.1} ${cy - currentSize.caseR + 4} Z`}
            fill={rubberFill}
            stroke={ribColor}
            strokeWidth="1.5"
          />
          {/* Central Molded Channel & Ergonomic Blade Inset */}
          <rect
            x={cx - w / 5}
            y={topY}
            width={w / 2.5}
            height={cy - currentSize.caseR - topY + 4}
            fill={ribColor}
            rx="1.5"
            opacity={0.7}
          />
          {/* Horizontal Grip Ribs */}
          {[-28, -20, -12, -4].map((yOffset, i) => (
            <line
              key={`top-rubber-rib-${i}`}
              x1={cx - w / 2.3 + 3}
              y1={cy - currentSize.caseR + yOffset}
              x2={cx + w / 2.3 - 3}
              y2={cy - currentSize.caseR + yOffset}
              stroke={highlightColor}
              strokeWidth="1"
              opacity={0.4}
            />
          ))}

          {/* Bottom Rubber Section */}
          <path
            d={`M ${cx - w / 2.1} ${cy + currentSize.caseR - 4} L ${cx + w / 2.1} ${cy + currentSize.caseR - 4} L ${cx + w / 2} ${botY + strapHeight} L ${cx - w / 2} ${botY + strapHeight} Z`}
            fill={rubberFill}
            stroke={ribColor}
            strokeWidth="1.5"
          />
          {/* Bottom Central Channel */}
          <rect
            x={cx - w / 5}
            y={botY - 3}
            width={w / 2.5}
            height={strapHeight + 3}
            fill={ribColor}
            rx="1.5"
            opacity={0.7}
          />
          {/* Bottom Diver Expansion Vents / Ribs */}
          {[6, 14, 22, 30, 38].map((yOffset, i) => (
            <line
              key={`bot-rubber-rib-${i}`}
              x1={cx - w / 2.2 + 3}
              y1={botY + yOffset}
              x2={cx + w / 2.2 - 3}
              y2={botY + yOffset}
              stroke={highlightColor}
              strokeWidth="1"
              opacity={0.4}
            />
          ))}
        </g>
      );
    }

    // 4. Brown / Suede / Alligator Leather
    if (
      strapType === "leather_brown" ||
      strapType === "leather_alligator" ||
      strapType === "leather_suede"
    ) {
      const strapCol = config.strapColor || "#3e2723";
      return (
        <g id="brown-leather-strap">
          {/* Top Strap */}
          <path
            d={`M ${cx - w / 2} ${topY} L ${cx + w / 2} ${topY} L ${cx + w / 2.1} ${cy - currentSize.caseR + 5} L ${cx - w / 2.1} ${cy - currentSize.caseR + 5} Z`}
            fill={strapCol}
            stroke="#1c1917"
            strokeWidth="1.2"
          />
          {/* Stitching */}
          <line
            x1={cx - w / 2 + 4}
            y1={topY + 2}
            x2={cx - w / 2.1 + 4}
            y2={cy - currentSize.caseR + 4}
            stroke="#fde047"
            strokeWidth="0.8"
            strokeDasharray="2,2"
            opacity={0.7}
          />
          <line
            x1={cx + w / 2 - 4}
            y1={topY + 2}
            x2={cx + w / 2.1 - 4}
            y2={cy - currentSize.caseR + 4}
            stroke="#fde047"
            strokeWidth="0.8"
            strokeDasharray="2,2"
            opacity={0.7}
          />

          {/* Bottom Strap */}
          <path
            d={`M ${cx - w / 2.1} ${cy + currentSize.caseR - 5} L ${cx + w / 2.1} ${cy + currentSize.caseR - 5} L ${cx + w / 2} ${botY + strapHeight} L ${cx - w / 2} ${botY + strapHeight} Z`}
            fill={strapCol}
            stroke="#1c1917"
            strokeWidth="1.2"
          />
          {/* Bottom Stitching */}
          <line
            x1={cx - w / 2.1 + 4}
            y1={cy + currentSize.caseR - 4}
            x2={cx - w / 2 + 4}
            y2={botY + strapHeight - 2}
            stroke="#fde047"
            strokeWidth="0.8"
            strokeDasharray="2,2"
            opacity={0.7}
          />
          <line
            x1={cx + w / 2.1 - 4}
            y1={cy + currentSize.caseR - 4}
            x2={cx + w / 2 - 4}
            y2={botY + strapHeight - 2}
            stroke="#fde047"
            strokeWidth="0.8"
            strokeDasharray="2,2"
            opacity={0.7}
          />
        </g>
      );
    }

    // 5. Tactical NATO Fabric
    const strapCol = config.strapColor || "#1e293b";
    return (
      <g id="nato-strap">
        <rect x={cx - w / 2} y={topY} width={w} height={cy - currentSize.caseR - topY + 5} fill={strapCol} stroke="#0f172a" strokeWidth="1" />
        <rect x={cx - w / 2} y={cy + currentSize.caseR - 5} width={w} height={strapHeight + 5} fill={strapCol} stroke="#0f172a" strokeWidth="1" />
        {config.accentColor && (
          <>
            <line x1={cx} y1={topY} x2={cx} y2={cy - currentSize.caseR + 5} stroke={config.accentColor} strokeWidth="4" />
            <line x1={cx} y1={cy + currentSize.caseR - 5} x2={cx} y2={botY + strapHeight} stroke={config.accentColor} strokeWidth="4" />
          </>
        )}
      </g>
    );
  };

  // Helper for Chronograph Pushers & Big Buttons
  const renderPushers = (caseType: string, wVal?: number, hVal?: number, rVal?: number) => {
    const pStyle = config.pusherStyle;
    if (pStyle === "none") return null;

    const r = rVal || currentSize.caseR;
    const isHero = size === "hero";
    const pusherCol = config.pusherColor || metalColors.base;

    // 1. Bullhead Top Horn Pushers (Angled at 10:30 and 1:30 o'clock)
    if (pStyle === "bullhead_top" || caseType === "bullhead" || isBullhead) {
      const pW = isHero ? 13 : 9;
      const pH = isHero ? 18 : 13;
      const pColor = config.pusherColor || (config.accentColor || "#ea580c");

      return (
        <g id="bullhead-horn-pushers">
          {/* Left Horn Pusher at 10:30 */}
          <g transform={`translate(${cx - r * 0.58}, ${cy - r * 0.88}) rotate(-32)`}>
            {/* Threaded Base Collar */}
            <rect x={-pW / 2} y={-pH + 6} width={pW} height={pH} rx="2" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1" />
            <line x1={-pW / 2 + 1} y1={-pH + 11} x2={pW / 2 - 1} y2={-pH + 11} stroke={metalColors.dark} strokeWidth="0.8" />
            {/* Colored / Knurled Plunger Head */}
            <rect x={-pW / 2 + 1.5} y={-pH} width={pW - 3} height={7} rx="2" fill={pColor} stroke="#0f172a" strokeWidth="0.8" />
          </g>

          {/* Right Horn Pusher at 1:30 */}
          <g transform={`translate(${cx + r * 0.58}, ${cy - r * 0.88}) rotate(32)`}>
            <rect x={-pW / 2} y={-pH + 6} width={pW} height={pH} rx="2" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1" />
            <line x1={-pW / 2 + 1} y1={-pH + 11} x2={pW / 2 - 1} y2={-pH + 11} stroke={metalColors.dark} strokeWidth="0.8" />
            <rect x={-pW / 2 + 1.5} y={-pH} width={pW - 3} height={7} rx="2" fill={pColor} stroke="#0f172a" strokeWidth="0.8" />
          </g>
        </g>
      );
    }

    // 2. Richard Mille Tactical Aerodynamic Pushers (integrated into curved case flanks)
    if (pStyle === "richard_mille_tactical" || (isRichardMille && isChronograph)) {
      const tw = wVal || r * 1.6;
      const th = hVal || r * 2.22;
      const btnW = isHero ? 14 : 10;
      const btnH = isHero ? 22 : 16;
      const topY = cy - th * 0.32;
      const botY = cy + th * 0.22;
      const pushX = cx + tw * 0.44;

      return (
        <g id="richard-mille-tactical-pushers">
          {/* Top 2 o'clock Aerodynamic Pusher with Titanium Guard */}
          <g transform={`translate(${pushX}, ${topY}) rotate(18)`}>
            {/* Protective Shoulder Guide */}
            <path d={`M -3 -${btnH / 2 + 2} L ${btnW + 4} -${btnH / 2 - 2} L ${btnW + 2} ${btnH / 2} L -3 ${btnH / 2 + 2} Z`} fill="#18181b" stroke={metalColors.dark} strokeWidth="0.8" />
            {/* Carbon / Colored Pusher Pad */}
            <rect x="0" y={-btnH / 2} width={btnW} height={btnH} rx="3" fill={config.accentColor || "#ef4444"} stroke={metalColors.dark} strokeWidth="1" />
            <line x1="3" y1={-btnH / 2 + 4} x2="3" y2={btnH / 2 - 4} stroke="#ffffff" strokeWidth="1.2" opacity={0.8} />
          </g>

          {/* Bottom 4 o'clock Aerodynamic Pusher */}
          <g transform={`translate(${pushX}, ${botY}) rotate(-18)`}>
            <path d={`M -3 -${btnH / 2 - 2} L ${btnW + 2} -${btnH / 2} L ${btnW + 4} ${btnH / 2 - 2} L -3 ${btnH / 2 + 2} Z`} fill="#18181b" stroke={metalColors.dark} strokeWidth="0.8" />
            <rect x="0" y={-btnH / 2} width={btnW} height={btnH} rx="3" fill={config.accentColor || "#10b981"} stroke={metalColors.dark} strokeWidth="1" />
            <line x1="3" y1={-btnH / 2 + 4} x2="3" y2={btnH / 2 - 4} stroke="#ffffff" strokeWidth="1.2" opacity={0.8} />
          </g>
        </g>
      );
    }

    // 3. Rectangular Paddle Pushers (Audemars Piguet Royal Oak Offshore, Datograph)
    if (pStyle === "rectangular_paddle") {
      const pW = isHero ? 14 : 10;
      const pH = isHero ? 18 : 13;
      return (
        <g id="rectangular-paddle-pushers">
          {/* Top Pusher at 2 o'clock */}
          <g transform={`translate(${cx + r * 0.84}, ${cy - r * 0.62}) rotate(36)`}>
            {/* Rubber / Ceramic Base Guard */}
            <rect x="-2" y={-pH / 2 - 2} width={pW + 4} height={pH + 4} rx="2" fill="#09090b" stroke="#27272a" strokeWidth="0.8" />
            {/* Paddle Button Face */}
            <rect x="0" y={-pH / 2} width={pW} height={pH} rx="2" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1" />
            <line x1="4" y1={-pH / 2 + 2} x2="4" y2={pH / 2 - 2} stroke={metalColors.highlight} strokeWidth="1" opacity={0.8} />
          </g>

          {/* Bottom Pusher at 4 o'clock */}
          <g transform={`translate(${cx + r * 0.84}, ${cy + r * 0.52}) rotate(-36)`}>
            <rect x="-2" y={-pH / 2 - 2} width={pW + 4} height={pH + 4} rx="2" fill="#09090b" stroke="#27272a" strokeWidth="0.8" />
            <rect x="0" y={-pH / 2} width={pW} height={pH} rx="2" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1" />
            <line x1="4" y1={-pH / 2 + 2} x2="4" y2={pH / 2 - 2} stroke={metalColors.highlight} strokeWidth="1" opacity={0.8} />
          </g>
        </g>
      );
    }

    // 4. Screw-Down Knurled Threaded Pushers (Rolex Daytona Oyster Pushers)
    if (pStyle === "screw_down") {
      const pW = isHero ? 13 : 9;
      const pH = isHero ? 14 : 10;
      return (
        <g id="screw-down-pushers">
          {/* Top Pusher at 2 o'clock */}
          <g transform={`translate(${cx + r * 0.83}, ${cy - r * 0.62}) rotate(35)`}>
            {/* Outer Knurled Threaded Collar */}
            <rect x="0" y={-pH / 2} width={pW} height={pH} rx="2" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1" />
            {[-pH / 4, 0, pH / 4].map((offset, i) => (
              <line key={`sd-top-${i}`} x1="1" y1={offset} x2={pW - 2} y2={offset} stroke={metalColors.dark} strokeWidth="0.8" />
            ))}
            {/* Polished Inner Piston Plunger Head */}
            <rect x={pW - 1} y={-pH / 3} width="4" height={pH * 0.66} rx="1.5" fill={metalColors.highlight} stroke={metalColors.dark} strokeWidth="0.8" />
          </g>

          {/* Bottom Pusher at 4 o'clock */}
          <g transform={`translate(${cx + r * 0.83}, ${cy + r * 0.52}) rotate(-35)`}>
            <rect x="0" y={-pH / 2} width={pW} height={pH} rx="2" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1" />
            {[-pH / 4, 0, pH / 4].map((offset, i) => (
              <line key={`sd-bot-${i}`} x1="1" y1={offset} x2={pW - 2} y2={offset} stroke={metalColors.dark} strokeWidth="0.8" />
            ))}
            <rect x={pW - 1} y={-pH / 3} width="4" height={pH * 0.66} rx="1.5" fill={metalColors.highlight} stroke={metalColors.dark} strokeWidth="0.8" />
          </g>
        </g>
      );
    }

    // 5. Oversized Pump Pushers (Prominent large vintage / racing pistons)
    if (pStyle === "oversized_pump" || isChronograph) {
      const pW = isHero ? 14 : 10;
      const pH = isHero ? 14 : 10;
      const ext = isHero ? 6 : 4;

      return (
        <g id="oversized-pump-pushers">
          {/* Top 2 o'clock Big Button */}
          <g transform={`translate(${cx + r * 0.82}, ${cy - r * 0.62}) rotate(35)`}>
            {/* Cylindrical Piston Stem */}
            <rect x="0" y={-pH / 2} width={pW} height={pH} rx="2" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1.2" />
            {/* Prominent Beveled Head Cap */}
            <rect x={pW - 2} y={-pH / 2 - 1} width={ext + 2} height={pH + 2} rx="2" fill={metalColors.highlight} stroke={metalColors.dark} strokeWidth="1" />
            {/* Knurled Collar Ring */}
            <line x1="3" y1={-pH / 2 + 1} x2="3" y2={pH / 2 - 1} stroke={metalColors.dark} strokeWidth="1.2" />
          </g>

          {/* Bottom 4 o'clock Big Button */}
          <g transform={`translate(${cx + r * 0.82}, ${cy + r * 0.52}) rotate(-35)`}>
            <rect x="0" y={-pH / 2} width={pW} height={pH} rx="2" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1.2" />
            <rect x={pW - 2} y={-pH / 2 - 1} width={ext + 2} height={pH + 2} rx="2" fill={metalColors.highlight} stroke={metalColors.dark} strokeWidth="1" />
            <line x1="3" y1={-pH / 2 + 1} x2="3" y2={pH / 2 - 1} stroke={metalColors.dark} strokeWidth="1.2" />
          </g>
        </g>
      );
    }

    return null;
  };

  // Helper for Crown Styles
  const renderCrown = (caseType: string, wVal?: number, hVal?: number, rVal?: number) => {
    const r = rVal || currentSize.caseR;
    const isHero = size === "hero";
    const cStyle = config.crownStyle;

    // 1. Top Crown at 12 o'clock for Bullhead
    if (cStyle === "bullhead_top" || caseType === "bullhead" || isBullhead) {
      const cW = isHero ? 18 : 13;
      const cH = isHero ? 14 : 10;
      const topY = cy - r * 1.04;
      return (
        <g id="bullhead-top-crown">
          <rect x={cx - cW / 2} y={topY - cH} width={cW} height={cH} rx="2.5" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1.2" />
          {[-cW / 3, 0, cW / 3].map((offset, i) => (
            <line key={`bh-cr-${i}`} x1={cx + offset} y1={topY - cH + 1} x2={cx + offset} y2={topY - 1} stroke={metalColors.dark} strokeWidth="1" />
          ))}
        </g>
      );
    }

    // 2. Left-Hand Crown at 9 o'clock (TAG Heuer Monaco Calibre 11 / Destro)
    if (cStyle === "left_hand" || isMonaco) {
      const cW = isHero ? 10 : 7;
      const cH = isHero ? 18 : 12;
      const leftX = caseType === "square" ? cx - (wVal || r * 1.7) / 2 : cx - r;
      return (
        <g id="left-hand-crown">
          <rect x={leftX - cW + 1} y={cy - cH / 2} width={cW} height={cH} rx="2" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1" />
          {[-cH / 4, 0, cH / 4].map((offset, i) => (
            <line key={`lh-cr-${i}`} x1={leftX - cW + 3} y1={cy + offset} x2={leftX - 1} y2={cy + offset} stroke={metalColors.dark} strokeWidth="0.8" />
          ))}
        </g>
      );
    }

    // 3. Richard Mille High-Torque Gear Crown with Polyurethane O-Ring Tire Collar
    if (cStyle === "richard_mille_flange" || isRichardMille) {
      const ringCol = config.crownRingColor || (config.accentColor || "#ef4444");
      const cW = isHero ? 16 : 11;
      const cH = isHero ? 22 : 16;
      const crownX = (wVal ? cx + wVal * 0.46 : cx + r * 0.95);

      return (
        <g id="richard-mille-crown">
          {/* Conical Crown Base */}
          <polygon
            points={`${crownX},${cy - cH / 2 + 2} ${crownX + cW - 2},${cy - cH / 2 - 1} ${crownX + cW},${cy - cH / 2 + 2} ${crownX + cW},${cy + cH / 2 - 2} ${crownX + cW - 2},${cy + cH / 2 + 1} ${crownX},${cy + cH / 2 - 2}`}
            fill={`url(#${uid}-case-metal-grad)`}
            stroke={metalColors.dark}
            strokeWidth="1"
          />
          {/* Vivid Colored Rubber / Polyurethane O-Ring Grip Collar */}
          <rect x={crownX + 3} y={cy - cH / 2} width={cW - 6} height={cH} rx="2" fill={ringCol} stroke="#09090b" strokeWidth="0.8" />
          {/* High-Torque Radial Teeth */}
          {[-cH / 3, -cH / 6, 0, cH / 6, cH / 3].map((offset, i) => (
            <line key={`rm-cr-teeth-${i}`} x1={crownX + 4} y1={cy + offset} x2={crownX + cW - 4} y2={cy + offset} stroke="#ffffff" strokeWidth="1" opacity={0.8} />
          ))}
          {/* Center Titanium Medallion Cap */}
          <circle cx={crownX + cW - 2} cy={cy} r={isHero ? 4 : 2.8} fill={metalColors.highlight} stroke={metalColors.dark} strokeWidth="0.6" />
        </g>
      );
    }

    // 4. Cartier Blue Sapphire Cabochon Crown
    if (cStyle === "cabochon" || isCartier) {
      const cW = isHero ? 8 : 6;
      const cH = isHero ? 14 : 10;
      const rightX = caseType === "tank" || caseType === "square" ? cx + (wVal || r * 1.3) / 2 : cx + r;
      return (
        <g id="cabochon-crown">
          <rect x={rightX - 1} y={cy - cH / 2} width={cW} height={cH} rx="1.5" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="0.8" />
          <circle cx={rightX + cW + (isHero ? 2 : 1)} cy={cy} r={isHero ? 4 : 3} fill={`url(#${uid}-cabochon-sapphire-grad)`} stroke="#1e3a8a" strokeWidth="0.8" />
        </g>
      );
    }

    // 5. Panerai Patented Crescent Locking Lever Bridge
    if (cStyle === "panerai_bridge" || isPanerai) {
      return (
        <g id="panerai-crown-bridge">
          <path
            d={`M ${cx + r * 0.8} ${cy - 18} Q ${cx + r * 1.25} ${cy} ${cx + r * 0.8} ${cy + 18} L ${cx + r * 0.72} ${cy + 16} Q ${cx + r * 1.1} ${cy} ${cx + r * 0.72} ${cy - 16} Z`}
            fill={`url(#${uid}-case-metal-grad)`}
            stroke={metalColors.dark}
            strokeWidth="1.2"
          />
          <rect x={cx + r * 0.88} y={cy - 3.5} width={isHero ? 14 : 10} height={isHero ? 7 : 5} rx="1.5" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="0.8" />
          <circle cx={cx + r * 0.85} cy={cy - 12} r="1.5" fill={metalColors.dark} />
        </g>
      );
    }

    // 6. Oversized Onion Crown (Big Pilot / Trench Watch)
    if (cStyle === "oversized_onion") {
      const cR = isHero ? 12 : 8.5;
      return (
        <g id="oversized-onion-crown">
          <circle cx={cx + r + cR * 0.6} cy={cy} r={cR} fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1.2" />
          {Array.from({ length: 12 }).map((_, idx) => {
            const angle = (idx * 30) * (Math.PI / 180);
            return (
              <line
                key={`onion-${idx}`}
                x1={cx + r + cR * 0.6 + 3 * Math.cos(angle)}
                y1={cy + 3 * Math.sin(angle)}
                x2={cx + r + cR * 0.6 + (cR - 1) * Math.cos(angle)}
                y2={cy + (cR - 1) * Math.sin(angle)}
                stroke={metalColors.dark}
                strokeWidth="0.8"
              />
            );
          })}
        </g>
      );
    }

    // 7. Standard Fluted Knurled Crown at 3 o'clock
    const cW = isHero ? 10 : 7;
    const cH = isHero ? 18 : 12;
    const rightX = caseType === "square" ? cx + (wVal || r * 1.7) / 2 : cx + r;

    return (
      <g id="crown">
        <rect x={rightX - 1} y={cy - cH / 2} width={cW} height={cH} rx="2" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="1" />
        {[-4, 0, 4].map((offset, i) => (
          <line key={`crown-ridge-${i}`} x1={rightX + 2} y1={cy + offset} x2={rightX + cW - 2} y2={cy + offset} stroke={metalColors.dark} strokeWidth="0.8" />
        ))}
      </g>
    );
  };

  // Helper for Watch Case Body
  const renderCase = () => {
    const r = currentSize.caseR;

    // 1. RICHARD MILLE & TONNEAU BARREL CASE
    if (config.caseShape === "tonneau" || isRichardMille) {
      const w = r * 1.62;
      const h = r * 2.24;

      // Tonneau contour path math
      const tonneauPath = `M ${cx - w * 0.36} ${cy - h * 0.49} Q ${cx} ${cy - h * 0.52} ${cx + w * 0.36} ${cy - h * 0.49} Q ${cx + w * 0.54} ${cy} ${cx + w * 0.36} ${cy + h * 0.49} Q ${cx} ${cy + h * 0.52} ${cx - w * 0.36} ${cy + h * 0.49} Q ${cx - w * 0.54} ${cy} ${cx - w * 0.36} ${cy - h * 0.49} Z`;

      // 12 Titanium Spline Screws around tonneau bezel
      const splineScrewPositions = [
        { x: cx - w * 0.30, y: cy - h * 0.44 },
        { x: cx - w * 0.11, y: cy - h * 0.485 },
        { x: cx + w * 0.11, y: cy - h * 0.485 },
        { x: cx + w * 0.30, y: cy - h * 0.44 },
        { x: cx + w * 0.46, y: cy - h * 0.22 },
        { x: cx + w * 0.46, y: cy + h * 0.22 },
        { x: cx + w * 0.30, y: cy + h * 0.44 },
        { x: cx + w * 0.11, y: cy + h * 0.485 },
        { x: cx - w * 0.11, y: cy + h * 0.485 },
        { x: cx - w * 0.30, y: cy + h * 0.44 },
        { x: cx - w * 0.46, y: cy + h * 0.22 },
        { x: cx - w * 0.46, y: cy - h * 0.22 },
      ];

      return (
        <g id="tonneau-case">
          {/* Sandwich Dark Carbon TPT Midcase Layer with Weight-Reduction Cutouts */}
          <path d={tonneauPath} fill="#09090b" stroke="#18181b" strokeWidth="6" />

          {/* Left Midcase Weight-Reduction Pillars */}
          <path
            d={`M ${cx - w * 0.52} ${cy - h * 0.30} Q ${cx - w * 0.46} ${cy} ${cx - w * 0.52} ${cy + h * 0.30}`}
            fill="none"
            stroke={config.accentColor || metalColors.dark}
            strokeWidth="3"
            opacity={0.8}
          />
          {/* Right Midcase Pillars */}
          <path
            d={`M ${cx + w * 0.52} ${cy - h * 0.30} Q ${cx + w * 0.46} ${cy} ${cx + w * 0.52} ${cy + h * 0.30}`}
            fill="none"
            stroke={config.accentColor || metalColors.dark}
            strokeWidth="3"
            opacity={0.8}
          />

          {/* Front Bezel Plate in Metal / Carbon */}
          <path
            d={tonneauPath}
            fill={`url(#${uid}-case-metal-grad)`}
            stroke={metalColors.dark}
            strokeWidth="2.5"
            filter={`url(#${uid}-case-shadow)`}
          />

          {/* 12 Titanium Spline Screws with 5-Star / Torx Cutouts */}
          {splineScrewPositions.map((pos, i) => (
            <g key={`rm-spline-${i}`}>
              {/* Countersunk titanium washer */}
              <circle cx={pos.x} cy={pos.y} r={size === "hero" ? 3.8 : 2.6} fill={metalColors.highlight} stroke={metalColors.dark} strokeWidth="0.6" />
              {/* 5-point star torx center cut */}
              <circle cx={pos.x} cy={pos.y} r={size === "hero" ? 1.8 : 1.2} fill="#09090b" />
              {/* Star points */}
              {Array.from({ length: 5 }).map((_, sIdx) => {
                const sAngle = (sIdx * 72) * (Math.PI / 180);
                return (
                  <line
                    key={sIdx}
                    x1={pos.x}
                    y1={pos.y}
                    x2={pos.x + (size === "hero" ? 1.6 : 1.1) * Math.cos(sAngle)}
                    y2={pos.y + (size === "hero" ? 1.6 : 1.1) * Math.sin(sAngle)}
                    stroke={metalColors.highlight}
                    strokeWidth="0.5"
                  />
                );
              })}
            </g>
          ))}

          {/* Crown and Tactical Pushers */}
          {renderCrown("tonneau", w, h, r)}
          {renderPushers("tonneau", w, h, r)}
        </g>
      );
    }

    // 2. BULLHEAD ASYMMETRIC RACING CHRONOGRAPH CASE
    if (config.caseShape === "bullhead" || isBullhead) {
      const topR = r * 1.08;
      const botR = r * 0.92;

      return (
        <g id="bullhead-case">
          {/* Asymmetric Wedge Helmet Profile */}
          <path
            d={`M ${cx - topR} ${cy - r * 0.6}
                Q ${cx} ${cy - r * 1.1} ${cx + topR} ${cy - r * 0.6}
                Q ${cx + topR * 1.05} ${cy} ${cx + botR} ${cy + r * 0.9}
                Q ${cx} ${cy + r * 1.12} ${cx - botR} ${cy + r * 0.9}
                Q ${cx - topR * 1.05} ${cy} ${cx - topR} ${cy - r * 0.6} Z`}
            fill={`url(#${uid}-case-metal-grad)`}
            stroke={metalColors.dark}
            strokeWidth="2.5"
            filter={`url(#${uid}-case-shadow)`}
          />

          {/* Top Bullhead Crown at 12 o'clock and Horn Pushers at 10:30 & 1:30 */}
          {renderCrown("bullhead", undefined, undefined, r)}
          {renderPushers("bullhead", undefined, undefined, r)}
        </g>
      );
    }

    // 3. Jaeger-LeCoultre Reverso Art Deco Rectangular Case
    if (config.caseShape === "reverso") {
      const rw = r * 1.35;
      const rh = r * 2.1;
      return (
        <g id="reverso-case">
          {/* Main Rectangular Carriage */}
          <rect
            x={cx - rw / 2}
            y={cy - rh / 2}
            width={rw}
            height={rh}
            rx="5"
            fill={`url(#${uid}-case-metal-grad)`}
            stroke={metalColors.dark}
            strokeWidth="2"
            filter={`url(#${uid}-case-shadow)`}
          />
          {/* Top Triple Gadroons (Art Deco fluting) */}
          {[-rh / 2 + 6, -rh / 2 + 10, -rh / 2 + 14].map((gy, i) => (
            <line key={`top-gadroon-${i}`} x1={cx - rw / 2 + 6} y1={cy + gy} x2={cx + rw / 2 - 6} y2={cy + gy} stroke={metalColors.dark} strokeWidth="1.2" />
          ))}
          {/* Bottom Triple Gadroons */}
          {[rh / 2 - 14, rh / 2 - 10, rh / 2 - 6].map((gy, i) => (
            <line key={`bot-gadroon-${i}`} x1={cx - rw / 2 + 6} y1={cy + gy} x2={cx + rw / 2 - 6} y2={cy + gy} stroke={metalColors.dark} strokeWidth="1.2" />
          ))}
          {/* Crown */}
          {renderCrown("reverso", rw, rh, r)}
        </g>
      );
    }

    // 4. Audemars Piguet Royal Oak Octagonal Case
    if (config.caseShape === "octagonal") {
      const points = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45 + 22.5) * (Math.PI / 180);
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return (
        <g id="octagonal-case">
          <polygon
            points={points.join(" ")}
            fill={`url(#${uid}-case-metal-grad)`}
            stroke={metalColors.dark}
            strokeWidth="2.5"
            filter={`url(#${uid}-case-shadow)`}
          />
          {renderCrown("octagonal", undefined, undefined, r)}
          {renderPushers("octagonal", undefined, undefined, r)}
        </g>
      );
    }

    // 5. Cartier Tank & Rectangular Square Cases (including TAG Heuer Monaco)
    if (config.caseShape === "square" || config.caseShape === "tank") {
      const isTank = config.caseShape === "tank";
      const w = isTank ? r * 1.3 : r * 1.7;
      const h = isTank ? r * 1.9 : r * 1.7;

      return (
        <g id="tank-square-case">
          {/* Main Case */}
          <rect
            x={cx - w / 2}
            y={cy - h / 2}
            width={w}
            height={h}
            rx={isTank ? 4 : 10}
            fill={`url(#${uid}-case-metal-grad)`}
            stroke={metalColors.dark}
            strokeWidth="2.5"
            filter={`url(#${uid}-case-shadow)`}
          />
          {/* Cartier Vertical Brancards (Polished flanking side bars) */}
          {isTank && (
            <>
              <rect x={cx - w / 2} y={cy - h / 2} width={w * 0.16} height={h} rx="3" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="0.8" />
              <rect x={cx + w / 2 - w * 0.16} y={cy - h / 2} width={w * 0.16} height={h} rx="3" fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="0.8" />
            </>
          )}
          {/* Crown & Pushers (supports Monaco left-hand crown and pushers at 2 and 4) */}
          {renderCrown(config.caseShape, w, h, r)}
          {renderPushers(config.caseShape, w, h, r)}
        </g>
      );
    }

    // 6. Patek Philippe Nautilus / Cushion Case
    if (config.caseShape === "cushion" || config.caseShape === "nautilus") {
      const isNaut = config.caseShape === "nautilus";
      return (
        <g id="cushion-nautilus-case">
          <rect
            x={cx - r * 0.95}
            y={cy - r * 0.95}
            width={r * 1.9}
            height={r * 1.9}
            rx={r * 0.45}
            fill={`url(#${uid}-case-metal-grad)`}
            stroke={metalColors.dark}
            strokeWidth="2"
            filter={`url(#${uid}-case-shadow)`}
          />
          {/* Nautilus Lateral Ear Hinges */}
          {isNaut && (
            <>
              <path
                d={`M ${cx - r * 1.06} ${cy - 14} L ${cx - r * 0.85} ${cy - 18} L ${cx - r * 0.85} ${cy + 18} L ${cx - r * 1.06} ${cy + 14} Z`}
                fill={`url(#${uid}-case-metal-grad)`}
                stroke={metalColors.dark}
                strokeWidth="1"
              />
              <path
                d={`M ${cx + r * 1.06} ${cy - 14} L ${cx + r * 0.85} ${cy - 18} L ${cx + r * 0.85} ${cy + 18} L ${cx + r * 1.06} ${cy + 14} Z`}
                fill={`url(#${uid}-case-metal-grad)`}
                stroke={metalColors.dark}
                strokeWidth="1"
              />
            </>
          )}
          {renderCrown(config.caseShape, undefined, undefined, r)}
          {renderPushers(config.caseShape, undefined, undefined, r)}
        </g>
      );
    }

    // 7. Default Classical Round Case with Sculpted Lugs
    const lugW = currentSize.dialR * 0.55;
    const lugH = currentSize.caseR * 1.3;

    return (
      <g id="round-case-with-lugs">
        {/* Top-Left Lug */}
        <polygon
          points={`${cx - lugW},${cy - lugH} ${cx - lugW + 16},${cy - lugH} ${cx - lugW + 22},${cy - r * 0.8} ${cx - lugW - 6},${cy - r * 0.8}`}
          fill={`url(#${uid}-case-metal-grad)`}
          stroke={metalColors.dark}
          strokeWidth="1"
        />
        {/* Top-Right Lug */}
        <polygon
          points={`${cx + lugW - 16},${cy - lugH} ${cx + lugW},${cy - lugH} ${cx + lugW + 6},${cy - r * 0.8} ${cx + lugW - 22},${cy - r * 0.8}`}
          fill={`url(#${uid}-case-metal-grad)`}
          stroke={metalColors.dark}
          strokeWidth="1"
        />
        {/* Bottom-Left Lug */}
        <polygon
          points={`${cx - lugW - 6},${cy + r * 0.8} ${cx - lugW + 22},${cy + r * 0.8} ${cx - lugW + 16},${cy + lugH} ${cx - lugW},${cy + lugH}`}
          fill={`url(#${uid}-case-metal-grad)`}
          stroke={metalColors.dark}
          strokeWidth="1"
        />
        {/* Bottom-Right Lug */}
        <polygon
          points={`${cx + lugW - 22},${cy + r * 0.8} ${cx + lugW + 6},${cy + r * 0.8} ${cx + lugW},${cy + lugH} ${cx + lugW - 16},${cy + lugH}`}
          fill={`url(#${uid}-case-metal-grad)`}
          stroke={metalColors.dark}
          strokeWidth="1"
        />

        {/* Main Round Case Body */}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}-case-metal-grad)`} stroke={metalColors.dark} strokeWidth="2.5" filter={`url(#${uid}-case-shadow)`} />

        {/* Crown & Chronograph Pushers */}
        {renderCrown("round", undefined, undefined, r)}
        {renderPushers("round", undefined, undefined, r)}
      </g>
    );
  };

  // Helper for Bezel Material & Styling
  const bezelAppearance = useMemo(() => {
    const mat = config.bezelMaterial;
    const col = config.bezelColor;

    if (mat === "ceramic_black") {
      return { stroke: `url(#${uid}-bezel-ceramic-black-grad)`, textColor: "#f8fafc", isSplit: null, isFluted: false };
    }
    if (mat === "ceramic_blue") {
      return { stroke: `url(#${uid}-bezel-ceramic-blue-grad)`, textColor: "#f8fafc", isSplit: null, isFluted: false };
    }
    if (mat === "ceramic_green") {
      return { stroke: `url(#${uid}-bezel-ceramic-green-grad)`, textColor: "#f8fafc", isSplit: null, isFluted: false };
    }
    if (mat === "ceramic_pepsi") {
      return { stroke: `url(#${uid}-bezel-pepsi-grad)`, textColor: "#ffffff", isSplit: "pepsi", isFluted: false };
    }
    if (mat === "ceramic_batman") {
      return { stroke: `url(#${uid}-bezel-batman-grad)`, textColor: "#ffffff", isSplit: "batman", isFluted: false };
    }
    if (mat === "steel_brushed") {
      return { stroke: `url(#${uid}-case-metal-grad)`, textColor: "#0f172a", isSplit: null, isFluted: false };
    }
    if (mat === "steel_polished") {
      return { stroke: `url(#${uid}-case-metal-grad)`, textColor: "#1e293b", isSplit: null, isFluted: false };
    }
    if (mat === "yellow_gold") {
      return { stroke: `url(#${uid}-bezel-gold-grad)`, textColor: "#ffffff", isSplit: null, isFluted: false };
    }
    if (mat === "rose_gold") {
      return { stroke: `url(#${uid}-bezel-rose-gold-grad)`, textColor: "#ffffff", isSplit: null, isFluted: false };
    }
    if (mat === "titanium") {
      return { stroke: "#475569", textColor: "#f8fafc", isSplit: null, isFluted: false };
    }
    if (mat === "carbon") {
      return { stroke: `url(#${uid}-bezel-carbon-pat)`, textColor: "#38bdf8", isSplit: null, isFluted: false };
    }
    if (mat === "fluted_gold") {
      return { stroke: `url(#${uid}-fluted-gold-bezel-grad)`, textColor: "#fef08a", isSplit: null, isFluted: true };
    }
    if (mat === "fluted_steel") {
      return { stroke: `url(#${uid}-fluted-bezel-grad)`, textColor: "#ffffff", isSplit: null, isFluted: true };
    }

    // Default by bezel color or case finish
    return {
      stroke: col || (config.caseBezelType === "fluted" ? `url(#${uid}-fluted-bezel-grad)` : `url(#${uid}-case-metal-grad)`),
      textColor: col === "#cbd5e1" || col === "#e2e8f0" ? "#0f172a" : "#ffffff",
      isSplit: null,
      isFluted: config.caseBezelType === "fluted",
    };
  }, [config.bezelMaterial, config.bezelColor, config.caseBezelType, metalColors, uid]);

  // Helper for Bezel Archetypes
  const renderBezel = () => {
    // Tonneau, Tank, Square, and Reverso cases have integrated bezel architecture; do not draw circular bezel
    if (
      config.caseShape === "tonneau" ||
      isRichardMille ||
      config.caseShape === "tank" ||
      config.caseShape === "square" ||
      config.caseShape === "reverso"
    ) {
      return null;
    }

    const bezelOuterR = currentSize.caseR * 0.98;
    const bezelInnerR = currentSize.dialR;

    // 1. BREITLING NAVITIMER CIRCULAR SLIDE RULE BEZEL
    if (config.caseBezelType === "slide_rule") {
      return (
        <g id="navitimer-slide-rule-bezel">
          {/* Bezel Ring Insert */}
          <circle
            cx={cx}
            cy={cy}
            r={(bezelOuterR + bezelInnerR) / 2}
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth={bezelOuterR - bezelInnerR}
          />
          {/* Outer Beaded Grip Edge */}
          <circle
            cx={cx}
            cy={cy}
            r={bezelOuterR}
            fill="none"
            stroke={metalColors.dark}
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          {/* Logarithmic Flight Computer Scales */}
          {[10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90].map((val, idx) => {
            const angle = (idx / 15) * 360;
            const rad = (angle - 90) * (Math.PI / 180);
            const scaleR = (bezelOuterR + bezelInnerR) / 2;
            const sx = cx + scaleR * Math.cos(rad);
            const sy = cy + scaleR * Math.sin(rad);

            return (
              <text
                key={`slide-${val}`}
                x={sx}
                y={sy + 2.5}
                textAnchor="middle"
                fontSize={size === "hero" ? 7 : 5}
                fontWeight="bold"
                fill="#b91c1c"
                fontFamily="sans-serif"
                transform={`rotate(${angle}, ${sx}, ${sy})`}
              >
                {val}
              </text>
            );
          })}
          {/* Fine calculation tick marks */}
          {Array.from({ length: 45 }).map((_, idx) => {
            const angle = (idx / 45) * 360;
            const rad = (angle - 90) * (Math.PI / 180);
            return (
              <line
                key={`slide-tick-${idx}`}
                x1={cx + (bezelInnerR + 1) * Math.cos(rad)}
                y1={cy + (bezelInnerR + 1) * Math.sin(rad)}
                x2={cx + (bezelOuterR - 2) * Math.cos(rad)}
                y2={cy + (bezelOuterR - 2) * Math.sin(rad)}
                stroke="#0f172a"
                strokeWidth="0.6"
              />
            );
          })}
        </g>
      );
    }

    // 2. DIVER 60 & GMT 24 ROTATING BEZEL
    if (config.caseBezelType === "diver_60" || config.caseBezelType === "gmt_24") {
      const isDiver = config.caseBezelType === "diver_60";
      const bezelStroke = bezelAppearance.stroke;
      const bezelTextColor = bezelAppearance.textColor;

      return (
        <g
          id="rotating-bezel"
          transform={`rotate(${bezelRotation}, ${cx}, ${cy})`}
          className={interactiveBezel ? "cursor-grab active:cursor-grabbing select-none" : ""}
          onMouseDown={handleBezelMouseDown}
        >
          {/* Bezel Ring Insert */}
          <circle
            cx={cx}
            cy={cy}
            r={(bezelOuterR + bezelInnerR) / 2}
            fill="none"
            stroke={bezelStroke}
            strokeWidth={bezelOuterR - bezelInnerR}
          />
          {/* Knurled Outer Bezel Teeth */}
          <circle
            cx={cx}
            cy={cy}
            r={bezelOuterR}
            fill="none"
            stroke={metalColors.dark}
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />

          {/* Diver 12 o'clock Triangle with Luminous Pip */}
          {isDiver && (
            <g id="bezel-pip">
              <polygon
                points={`${cx},${cy - bezelOuterR + 3} ${cx - 7},${cy - bezelInnerR - 2} ${cx + 7},${cy - bezelInnerR - 2}`}
                fill="#ffffff"
                stroke="#64748b"
                strokeWidth="0.8"
              />
              <circle
                cx={cx}
                cy={cy - (bezelOuterR + bezelInnerR) / 2}
                r={size === "hero" ? 3.5 : 2.2}
                fill={isLumeMode && lumeGlow ? lumeGlow.fill : "#ffffff"}
                stroke="#475569"
                strokeWidth="0.8"
                filter={isLumeMode && lumeGlow ? lumeGlow.filter : undefined}
              />
            </g>
          )}

          {/* Numerals on Bezel: 10, 20, 30, 40, 50 */}
          {isDiver &&
            [10, 20, 30, 40, 50].map((num) => {
              const angle = num * 6;
              const rad = (angle - 90) * (Math.PI / 180);
              const numR = (bezelOuterR + bezelInnerR) / 2;
              const nx = cx + numR * Math.cos(rad);
              const ny = cy + numR * Math.sin(rad);
              return (
                <text
                  key={num}
                  x={nx}
                  y={ny + (size === "hero" ? 4 : 2.5)}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 12 : size === "large" ? 9 : 6.5}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  fill={bezelTextColor}
                  transform={`rotate(${angle}, ${nx}, ${ny})`}
                >
                  {num}
                </text>
              );
            })}

          {/* Diver 1-15 minute hash marks */}
          {isDiver &&
            Array.from({ length: 15 }).map((_, idx) => {
              const angle = (idx + 1) * 6;
              const rad = (angle - 90) * (Math.PI / 180);
              const r1 = bezelInnerR + 2;
              const r2 = bezelOuterR - 2;
              return (
                <line
                  key={`diver-hash-${idx}`}
                  x1={cx + r1 * Math.cos(rad)}
                  y1={cy + r1 * Math.sin(rad)}
                  x2={cx + r2 * Math.cos(rad)}
                  y2={cy + r2 * Math.sin(rad)}
                  stroke={bezelTextColor}
                  strokeWidth="1"
                  opacity={0.8}
                />
              );
            })}

          {/* GMT 24-hr markings if GMT */}
          {!isDiver &&
            [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map((num) => {
              const angle = (num / 24) * 360;
              const rad = (angle - 90) * (Math.PI / 180);
              const numR = (bezelOuterR + bezelInnerR) / 2;
              const nx = cx + numR * Math.cos(rad);
              const ny = cy + numR * Math.sin(rad);
              return (
                <text
                  key={num}
                  x={nx}
                  y={ny + (size === "hero" ? 4 : 2.5)}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 11 : size === "large" ? 8 : 6}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  fill={bezelTextColor}
                  transform={`rotate(${angle}, ${nx}, ${ny})`}
                >
                  {num}
                </text>
              );
            })}
        </g>
      );
    }

    // 3. AUDEMARS PIGUET 8 HEXAGONAL SCREWS BEZEL
    if (config.caseBezelType === "octagonal_screws") {
      const screws = [];
      const screwR = (bezelOuterR + bezelInnerR) / 2;
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45 + 22.5) * (Math.PI / 180);
        const sx = cx + screwR * Math.cos(angle);
        const sy = cy + screwR * Math.sin(angle);
        screws.push(
          <g key={i} transform={`rotate(${i * 45 + 22.5}, ${sx}, ${sy})`}>
            <polygon
              points={`${sx - 3},${sy - 1.8} ${sx},${sy - 3.5} ${sx + 3},${sy - 1.8} ${sx + 3},${sy + 1.8} ${sx},${sy + 3.5} ${sx - 3},${sy + 1.8}`}
              fill={metalColors.highlight}
              stroke={metalColors.dark}
              strokeWidth="0.8"
            />
            {/* Screw Slot aligned tangentially */}
            <line x1={sx - 2.5} y1={sy} x2={sx + 2.5} y2={sy} stroke={metalColors.dark} strokeWidth="0.6" />
          </g>
        );
      }
      return (
        <g id="bezel-screws">
          <circle
            cx={cx}
            cy={cy}
            r={(bezelOuterR + bezelInnerR) / 2}
            fill="none"
            stroke={bezelAppearance.stroke}
            strokeWidth={bezelOuterR - bezelInnerR}
          />
          {screws}
        </g>
      );
    }

    // 4. OMEGA SPEEDMASTER TACHYMETER BEZEL (with 'Dot Over 90')
    if (config.caseBezelType === "tachymeter") {
      return (
        <g id="tachymeter-bezel">
          <circle
            cx={cx}
            cy={cy}
            r={(bezelOuterR + bezelInnerR) / 2}
            fill="none"
            stroke={bezelAppearance.stroke}
            strokeWidth={bezelOuterR - bezelInnerR}
          />
          <text
            x={cx}
            y={cy - (bezelOuterR + bezelInnerR) / 2 + 3.5}
            textAnchor="middle"
            fontSize={size === "hero" ? 8 : 5}
            fontWeight="bold"
            fill={bezelAppearance.textColor}
            letterSpacing="0.8"
            fontFamily="sans-serif"
          >
            TACHYMÈTRE
          </text>
          {/* Key speed units: 500, 300, 200, 120, 90, 60 */}
          {[
            { val: "500", deg: 30 },
            { val: "300", deg: 60 },
            { val: "200", deg: 105 },
            { val: "120", deg: 180 },
            { val: "90", deg: 240 },
            { val: "60", deg: 350 },
          ].map(({ val, deg }) => {
            const rad = (deg - 90) * (Math.PI / 180);
            const numR = (bezelOuterR + bezelInnerR) / 2;
            const nx = cx + numR * Math.cos(rad);
            const ny = cy + numR * Math.sin(rad);
            return (
              <text
                key={val}
                x={nx}
                y={ny + 2.5}
                textAnchor="middle"
                fontSize={size === "hero" ? 6.5 : 4.5}
                fontWeight="bold"
                fill={bezelAppearance.textColor}
                fontFamily="sans-serif"
                transform={`rotate(${deg}, ${nx}, ${ny})`}
              >
                {val}
              </text>
            );
          })}
        </g>
      );
    }

    // 5. ROLEX DATEJUST FLUTED PRISM BEZEL
    if (config.caseBezelType === "fluted" || bezelAppearance.isFluted) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={(bezelOuterR + bezelInnerR) / 2}
          fill="none"
          stroke={bezelAppearance.stroke}
          strokeWidth={bezelOuterR - bezelInnerR}
          strokeDasharray="4,2"
        />
      );
    }

    // 6. Default Sleek Smooth Bezel
    return (
      <circle
        cx={cx}
        cy={cy}
        r={(bezelOuterR + bezelInnerR) / 2}
        fill="none"
        stroke={bezelAppearance.stroke}
        strokeWidth={bezelOuterR - bezelInnerR}
      />
    );
  };

  // Helper for Dial Background & Inscriptions
  const renderDialBackground = () => {
    const r = currentSize.dialR;
    const isSquare = config.caseShape === "square" || config.caseShape === "tank" || config.caseShape === "reverso";
    const isTonneau = config.caseShape === "tonneau" || isRichardMille;
    const tw = r * 1.52;
    const th = r * 2.08;
    const tonneauDialPath = `M ${cx - tw * 0.31} ${cy - th * 0.44} Q ${cx} ${cy - th * 0.47} ${cx + tw * 0.31} ${cy - th * 0.44} Q ${cx + tw * 0.48} ${cy} ${cx + tw * 0.31} ${cy + th * 0.44} Q ${cx} ${cy + th * 0.47} ${cx - tw * 0.31} ${cy + th * 0.44} Q ${cx - tw * 0.48} ${cy} ${cx - tw * 0.31} ${cy - th * 0.44} Z`;

    // 1. RICHARD MILLE & TONNEAU SKELETON ARCHITECTURE
    if (isTonneau && isSkeleton) {
      const barrelX = cx;
      const barrelY = cy - th * 0.24;
      const barrelR = r * 0.26;

      const balX = cx;
      const balY = cy + th * 0.24;
      const balR = r * 0.28;

      return (
        <g id="richard-mille-skeleton-dial">
          {/* Base Dark Titanium Openworked Baseplate */}
          <path d={tonneauDialPath} fill="#09090b" stroke="#18181b" strokeWidth="1.5" />

          {/* Deep Cavity Apertures */}
          <circle cx={barrelX} cy={barrelY} r={barrelR * 1.05} fill="#030712" stroke="#27272a" strokeWidth="0.8" />
          <circle cx={balX} cy={balY} r={balR * 1.05} fill="#030712" stroke="#27272a" strokeWidth="0.8" />

          {/* Mainspring Barrel with Power Reserve at 12 o'clock */}
          <g id="rm-barrel-assembly">
            <circle cx={barrelX} cy={barrelY} r={barrelR} fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
            <path
              d={`M ${barrelX} ${barrelY}
                  m 0 3 a 3 3 0 0 1 0 -6 a 5 5 0 0 1 0 10 a 8 8 0 0 1 0 -16 a 12 12 0 0 1 0 24 a 16 16 0 0 1 0 -32`}
              fill="none"
              stroke="#64748b"
              strokeWidth="0.8"
              opacity={0.8}
            />
            {/* Openworked spoke wheel */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * 60) * (Math.PI / 180);
              return (
                <line
                  key={`rm-barrel-${i}`}
                  x1={barrelX + 3 * Math.cos(angle)}
                  y1={barrelY + 3 * Math.sin(angle)}
                  x2={barrelX + (barrelR - 2) * Math.cos(angle)}
                  y2={barrelY + (barrelR - 2) * Math.sin(angle)}
                  stroke={`url(#${uid}-gold-gear-grad)`}
                  strokeWidth="1.5"
                />
              );
            })}
            <circle cx={barrelX} cy={barrelY} r="4" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.5" />
          </g>

          {/* Live Tourbillon / Oscillating Balance at 6 o'clock */}
          <g id="rm-tourbillon-assembly">
            <g transform={`rotate(${balanceAngle}, ${balX}, ${balY})`}>
              <circle cx={balX} cy={balY} r={balR} fill="none" stroke={`url(#${uid}-gold-gear-grad)`} strokeWidth="2.2" />
              {Array.from({ length: 3 }).map((_, i) => {
                const angle = (i * 120) * (Math.PI / 180);
                return (
                  <line
                    key={`rm-bal-spoke-${i}`}
                    x1={balX + 3 * Math.cos(angle)}
                    y1={balY + 3 * Math.sin(angle)}
                    x2={balX + (balR - 1.5) * Math.cos(angle)}
                    y2={balY + (balR - 1.5) * Math.sin(angle)}
                    stroke={`url(#${uid}-gold-gear-grad)`}
                    strokeWidth="1.8"
                  />
                );
              })}
              {/* Perimeter weighted screws */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 45) * (Math.PI / 180);
                return (
                  <circle
                    key={`rm-bal-screw-${i}`}
                    cx={balX + (balR + 1) * Math.cos(angle)}
                    cy={balY + (balR + 1) * Math.sin(angle)}
                    r="0.9"
                    fill="#fef08a"
                  />
                );
              })}
              {/* Coiled Hairspring */}
              <path
                d={`M ${balX} ${balY}
                    m 0 2 a 2 2 0 0 1 0 -4 a 4 4 0 0 1 0 8 a 6 6 0 0 1 0 -12 a 9 9 0 0 1 0 18 a 12 12 0 0 1 0 -24`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="0.7"
                opacity={0.9}
              />
            </g>

            {/* Tourbillon Bridge Bar in Grade 5 Titanium */}
            <path
              d={`M ${balX - balR * 1.05} ${balY} L ${balX + balR * 1.05} ${balY}`}
              stroke={metalColors.highlight}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx={balX} cy={balY} r="3.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" />
            <circle cx={balX} cy={balY} r="2.2" fill={`url(#${uid}-ruby-jewel-grad)`} />
          </g>

          {/* Signature RM Grade 5 Titanium Diagonal X-Bridges with Polished Chamfers */}
          <g id="rm-structural-x-bridges">
            {/* Top-Left to Bottom-Right Diagonal Structural Strut */}
            <path
              d={`M ${cx - tw * 0.38} ${cy - th * 0.35}
                  L ${cx + tw * 0.38} ${cy + th * 0.35}
                  L ${cx + tw * 0.30} ${cy + th * 0.38}
                  L ${cx - tw * 0.46} ${cy - th * 0.32} Z`}
              fill="#27272a"
              stroke={config.accentColor || metalColors.highlight}
              strokeWidth="1"
              opacity={0.85}
            />
            {/* Top-Right to Bottom-Left Diagonal Strut */}
            <path
              d={`M ${cx + tw * 0.38} ${cy - th * 0.35}
                  L ${cx - tw * 0.38} ${cy + th * 0.35}
                  L ${cx - tw * 0.30} ${cy + th * 0.38}
                  L ${cx + tw * 0.46} ${cy - th * 0.32} Z`}
              fill="#27272a"
              stroke={config.accentColor || metalColors.highlight}
              strokeWidth="1"
              opacity={0.85}
            />
            {/* Center Pinion Jewel */}
            <circle cx={cx} cy={cy} r="4.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
            <circle cx={cx} cy={cy} r="2.8" fill={`url(#${uid}-ruby-jewel-grad)`} />
          </g>

          {/* Perimeter Openworked Skeleton Date Ring */}
          <path
            d={tonneauDialPath}
            fill="none"
            stroke="#18181b"
            strokeWidth="8"
            strokeDasharray="4,3"
            opacity={0.7}
          />

          {/* Inner Racing Flange / Rehaut with 5-Minute Racing Numerals */}
          <g id="rm-rehaut-track">
            {["60", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((num, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const px = cx + (tw * 0.40) * Math.cos(angle);
              const py = cy + (th * 0.42) * Math.sin(angle);
              const isHighlight = num === "60" || num === "15" || num === "30" || num === "45";

              return (
                <text
                  key={`rm-reh-${num}`}
                  x={px}
                  y={py + 2}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 7 : 5}
                  fontWeight="bold"
                  fill={isHighlight ? (config.accentColor || "#ef4444") : "#f8fafc"}
                  fontFamily="sans-serif"
                >
                  {num}
                </text>
              );
            })}
          </g>

          {/* Top Brand Inscription */}
          <text
            x={cx}
            y={cy - th * 0.36}
            textAnchor="middle"
            fontSize={size === "hero" ? 8 : 5.5}
            fontWeight="bold"
            letterSpacing="1.2"
            fill="#ffffff"
            fontFamily="sans-serif"
            className="uppercase"
          >
            {watch.brand}
          </text>
          <text
            x={cx}
            y={cy + th * 0.40}
            textAnchor="middle"
            fontSize={size === "hero" ? 5 : 3.5}
            letterSpacing="0.8"
            fill={config.accentColor || "#38bdf8"}
            fontFamily="sans-serif"
          >
            FLYBACK CHRONOGRAPH • TOURBILLON
          </text>
        </g>
      );
    }

    // 2. STANDARD ROUND SKELETON ARCHITECTURE
    if (isSkeleton) {
      const barrelX = cx;
      const barrelY = cy - r * 0.38;
      const barrelR = r * 0.28;

      const balX = cx - r * 0.18;
      const balY = cy + r * 0.34;
      const balR = r * 0.27;

      const escX = cx + r * 0.18;
      const escY = cy + r * 0.28;
      const escR = r * 0.16;

      const thirdX = cx + r * 0.25;
      const thirdY = cy - r * 0.08;
      const thirdR = r * 0.20;

      return (
        <g id="skeleton-dial-architecture">
          {/* Deep Ruthenium Movement Baseplate with Perlage Texture */}
          <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}-skeleton-plate-grad)`} stroke={metalColors.dark} strokeWidth="1" />
          <circle cx={cx} cy={cy} r={r * 0.94} fill={`url(#${uid}-perlage-pattern)`} opacity={0.65} />

          {/* Deep Skeleton Aperture Cavities (Laser-cut negative spaces) */}
          <g id="skeleton-cutaways">
            {/* Top Barrel Cavity */}
            <circle cx={barrelX} cy={barrelY} r={barrelR * 1.05} fill="#09090b" stroke={metalColors.dark} strokeWidth="1" />
            {/* Balance Cavity */}
            <circle cx={balX} cy={balY} r={balR * 1.08} fill="#09090b" stroke={metalColors.dark} strokeWidth="1" />
            {/* Escapement Cavity */}
            <circle cx={escX} cy={escY} r={escR * 1.1} fill="#09090b" stroke={metalColors.dark} strokeWidth="0.8" />
          </g>

          {/* 1. Mainspring Barrel Assembly at 12 o'clock */}
          <g id="skeleton-mainspring-barrel">
            {/* Coiled Mainspring inside barrel drum */}
            <circle cx={barrelX} cy={barrelY} r={barrelR} fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
            {/* Coiled Steel Spiral Spring */}
            <path
              d={`M ${barrelX} ${barrelY}
                  m 0 3 a 3 3 0 0 1 0 -6 a 5 5 0 0 1 0 10 a 8 8 0 0 1 0 -16 a 12 12 0 0 1 0 24 a 16 16 0 0 1 0 -32 a 20 20 0 0 1 0 40`}
              fill="none"
              stroke="#64748b"
              strokeWidth="0.8"
              opacity={0.7}
            />
            {/* Openworked Barrel Spoke Wheel */}
            <circle cx={barrelX} cy={barrelY} r={barrelR} fill="none" stroke={`url(#${uid}-gold-gear-grad)`} strokeWidth="2.5" />
            {Array.from({ length: 5 }).map((_, i) => {
              const angle = (i * 72) * (Math.PI / 180);
              return (
                <line
                  key={`barrel-spoke-${i}`}
                  x1={barrelX + 4 * Math.cos(angle)}
                  y1={barrelY + 4 * Math.sin(angle)}
                  x2={barrelX + (barrelR - 2) * Math.cos(angle)}
                  y2={barrelY + (barrelR - 2) * Math.sin(angle)}
                  stroke={`url(#${uid}-gold-gear-grad)`}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              );
            })}
            {/* Barrel Arbor & Flame-Blued Central Screw */}
            <circle cx={barrelX} cy={barrelY} r="4.5" fill={`url(#${uid}-gold-gear-grad)`} stroke="#a16207" strokeWidth="0.5" />
            <circle cx={barrelX} cy={barrelY} r="2.8" fill={`url(#${uid}-blued-screw-grad)`} stroke="#1e3a8a" strokeWidth="0.4" />
            <line x1={barrelX - 1.8} y1={barrelY} x2={barrelX + 1.8} y2={barrelY} stroke="#0f172a" strokeWidth="0.6" />
          </g>

          {/* 2. Intermediate Gear Train (Third Wheel & Center Wheel) */}
          <g id="skeleton-geartrain">
            {/* Third Wheel */}
            <g transform={`rotate(${trainWheelAngle * 2}, ${thirdX}, ${thirdY})`}>
              <circle cx={thirdX} cy={thirdY} r={thirdR} fill="none" stroke={`url(#${uid}-gold-gear-grad)`} strokeWidth="2" />
              {Array.from({ length: 4 }).map((_, i) => {
                const angle = (i * 90) * (Math.PI / 180);
                return (
                  <line
                    key={`third-spoke-${i}`}
                    x1={thirdX + 3 * Math.cos(angle)}
                    y1={thirdY + 3 * Math.sin(angle)}
                    x2={thirdX + (thirdR - 1.5) * Math.cos(angle)}
                    y2={thirdY + (thirdR - 1.5) * Math.sin(angle)}
                    stroke={`url(#${uid}-gold-gear-grad)`}
                    strokeWidth="1.2"
                  />
                );
              })}
              {/* Ruby Pivot Jewel in Gold Chaton */}
              <circle cx={thirdX} cy={thirdY} r="3.2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
              <circle cx={thirdX} cy={thirdY} r="2" fill={`url(#${uid}-ruby-jewel-grad)`} />
            </g>

            {/* Escapement Wheel */}
            <g transform={`rotate(${escapeWheelAngle}, ${escX}, ${escY})`}>
              <circle cx={escX} cy={escY} r={escR} fill="none" stroke={`url(#${uid}-gold-gear-grad)`} strokeWidth="1.6" />
              {/* Escapement Club Teeth */}
              {Array.from({ length: 15 }).map((_, i) => {
                const angle = (i * 24) * (Math.PI / 180);
                const ex1 = escX + escR * Math.cos(angle);
                const ey1 = escY + escR * Math.sin(angle);
                const ex2 = escX + (escR + 2.5) * Math.cos(angle + 0.15);
                const ey2 = escY + (escR + 2.5) * Math.sin(angle + 0.15);
                return <line key={`esc-tooth-${i}`} x1={ex1} y1={ey1} x2={ex2} y2={ey2} stroke={`url(#${uid}-gold-gear-grad)`} strokeWidth="1" />;
              })}
              <circle cx={escX} cy={escY} r="2.8" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.4" />
              <circle cx={escX} cy={escY} r="1.6" fill={`url(#${uid}-ruby-jewel-grad)`} />
            </g>

            {/* Center Gilded Wheel */}
            <g transform={`rotate(${centerWheelAngle}, ${cx}, ${cy})`}>
              <circle cx={cx} cy={cy} r={r * 0.20} fill="none" stroke={`url(#${uid}-gold-gear-grad)`} strokeWidth="2.2" />
              {Array.from({ length: 5 }).map((_, i) => {
                const angle = (i * 72) * (Math.PI / 180);
                return (
                  <line
                    key={`center-spoke-${i}`}
                    x1={cx + 3 * Math.cos(angle)}
                    y1={cy + 3 * Math.sin(angle)}
                    x2={cx + (r * 0.20 - 1.5) * Math.cos(angle)}
                    y2={cy + (r * 0.20 - 1.5) * Math.sin(angle)}
                    stroke={`url(#${uid}-gold-gear-grad)`}
                    strokeWidth="1.4"
                  />
                );
              })}
            </g>
          </g>

          {/* 3. LIVE OSCILLATING BALANCE WHEEL & HAIRSPRING AT 6-7 O'CLOCK */}
          <g id="skeleton-balance-escapement">
            {/* Live Oscillating Glucydur Balance Rim */}
            <g transform={`rotate(${balanceAngle}, ${balX}, ${balY})`}>
              <circle cx={balX} cy={balY} r={balR} fill="none" stroke={`url(#${uid}-gold-gear-grad)`} strokeWidth="2.2" />
              {/* 3 Curved Balance Arms */}
              {Array.from({ length: 3 }).map((_, i) => {
                const angle = (i * 120) * (Math.PI / 180);
                return (
                  <line
                    key={`bal-arm-${i}`}
                    x1={balX + 3 * Math.cos(angle)}
                    y1={balY + 3 * Math.sin(angle)}
                    x2={balX + (balR - 1.5) * Math.cos(angle)}
                    y2={balY + (balR - 1.5) * Math.sin(angle)}
                    stroke={`url(#${uid}-gold-gear-grad)`}
                    strokeWidth="1.8"
                  />
                );
              })}
              {/* Perimeter Gold Weighted Timing Screws */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30) * (Math.PI / 180);
                const px = balX + (balR + 1.2) * Math.cos(angle);
                const py = balY + (balR + 1.2) * Math.sin(angle);
                return <circle key={`bal-screw-${i}`} cx={px} cy={py} r="0.9" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.3" />;
              })}
              {/* Fine Oscillating Coiled Hairspring (Breguet Overcoil) */}
              <path
                d={`M ${balX} ${balY}
                    m 0 2 a 2 2 0 0 1 0 -4 a 3.5 3.5 0 0 1 0 7 a 5.5 5.5 0 0 1 0 -11 a 8 8 0 0 1 0 16 a 11 11 0 0 1 0 -22`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="0.6"
                opacity={0.85}
              />
            </g>

            {/* Static Balance Cock Bridge with Incabloc Shock-Protection Jewel & Screws */}
            <g id="balance-cock-bridge">
              {/* Bevelled Bridge Arm spanning to balance pivot */}
              <path
                d={`M ${balX - balR * 1.1} ${balY + balR * 0.6}
                    Q ${balX - balR * 0.4} ${balY} ${balX} ${balY}
                    L ${balX + 4} ${balY + 2}
                    Q ${balX - balR * 0.3} ${balY + balR * 0.4} ${balX - balR * 0.8} ${balY + balR * 1.1} Z`}
                fill={`url(#${uid}-case-metal-grad)`}
                stroke={metalColors.highlight}
                strokeWidth="0.8"
              />
              {/* Flame-blued balance cock fastening screws */}
              <circle cx={balX - balR * 0.9} cy={balY + balR * 0.75} r="2.2" fill={`url(#${uid}-blued-screw-grad)`} stroke="#1e3a8a" strokeWidth="0.3" />
              <line x1={balX - balR * 0.9 - 1.2} y1={balY + balR * 0.75} x2={balX - balR * 0.9 + 1.2} y2={balY + balR * 0.75} stroke="#0f172a" strokeWidth="0.4" />

              {/* Incabloc Spring Lyre & Synthetic Ruby Cap Jewel */}
              <circle cx={balX} cy={balY} r="4.2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" />
              <circle cx={balX} cy={balY} r="2.6" fill={`url(#${uid}-ruby-jewel-grad)`} />
              {/* Gold Incabloc spring clip */}
              <path
                d={`M ${balX - 2.8} ${balY - 1} Q ${balX} ${balY - 3} ${balX + 2.8} ${balY - 1} M ${balX - 2.8} ${balY + 1} Q ${balX} ${balY + 3} ${balX + 2.8} ${balY + 1}`}
                fill="none"
                stroke="#fef08a"
                strokeWidth="0.6"
              />
            </g>
          </g>

          {/* 4. SKELETONIZED STRUCTURAL BRIDGES WITH POLISHED ANGLAGE BEVELS */}
          <g id="skeleton-bridges">
            {/* Top Bridge over Barrel */}
            <path
              d={`M ${cx - r * 0.65} ${cy - r * 0.45}
                  Q ${cx} ${cy - r * 0.68} ${cx + r * 0.65} ${cy - r * 0.45}
                  L ${cx + r * 0.55} ${cy - r * 0.32}
                  Q ${cx} ${cy - r * 0.50} ${cx - r * 0.55} ${cy - r * 0.32} Z`}
              fill={`url(#${uid}-cotes-pattern)`}
              stroke={metalColors.highlight}
              strokeWidth="1.2"
            />
            {/* Bridge Screws */}
            <circle cx={cx - r * 0.58} cy={cy - r * 0.40} r="2.2" fill={`url(#${uid}-blued-screw-grad)`} stroke="#1e3a8a" strokeWidth="0.4" />
            <circle cx={cx + r * 0.58} cy={cy - r * 0.40} r="2.2" fill={`url(#${uid}-blued-screw-grad)`} stroke="#1e3a8a" strokeWidth="0.4" />

            {/* Diagonal Geartrain Bridge */}
            <path
              d={`M ${cx - r * 0.3} ${cy - r * 0.05}
                  L ${cx + r * 0.68} ${cy + r * 0.15}
                  L ${cx + r * 0.58} ${cy + r * 0.28}
                  L ${cx - r * 0.2} ${cy + r * 0.08} Z`}
              fill={`url(#${uid}-cotes-pattern)`}
              stroke={metalColors.highlight}
              strokeWidth="1.2"
            />
            {/* Screws on Diagonal Bridge */}
            <circle cx={cx + r * 0.55} cy={cy + r * 0.20} r="2.2" fill={`url(#${uid}-blued-screw-grad)`} stroke="#1e3a8a" strokeWidth="0.4" />
          </g>

          {/* 5. FLOATING SKELETON CHAPTER RING (High Legibility Perimeter Rail) */}
          <g id="skeleton-chapter-ring">
            {/* Inner & Outer Chapter Ring Borders */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={metalColors.dark} strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r={r * 0.80} fill="none" stroke={metalColors.highlight} strokeWidth="1.2" />
            {/* Ring body gradient fill */}
            <circle
              cx={cx}
              cy={cy}
              r={(r + r * 0.80) / 2}
              fill="none"
              stroke="#18181b"
              strokeWidth={r - r * 0.80}
              opacity={0.88}
            />

            {/* Skeleton Chapter Ring Brand Inscription */}
            <text
              x={cx}
              y={cy - r * 0.83}
              textAnchor="middle"
              fontSize={size === "hero" ? 9 : size === "large" ? 7 : 5}
              fontWeight="bold"
              letterSpacing="1.2"
              fill={config.markerColor || metalColors.highlight}
              fontFamily="sans-serif"
              className="uppercase"
            >
              {watch.brand}
            </text>

            <text
              x={cx}
              y={cy + r * 0.90}
              textAnchor="middle"
              fontSize={size === "hero" ? 5 : 3.5}
              letterSpacing="0.8"
              fill={metalColors.highlight}
              opacity={0.8}
              fontFamily="sans-serif"
            >
              SQUELETTE • {(watch?.movement?.type || "AUTOMATIC").toUpperCase()}
            </text>
          </g>
        </g>
      );
    }

    // 3. OPEN-HEART COMPLICATION APERTURE (e.g. Hamilton Jazzmaster Open Heart, Frederique Constant)
    let patternFill = config.dialColor;

    if (config.dialPattern === "tapisserie") {
      patternFill = `url(#${uid}-tapisserie-pattern)`;
    } else if (config.dialPattern === "snowflake") {
      patternFill = `url(#${uid}-snowflake-pattern)`;
    } else if (config.dialPattern === "sunburst") {
      patternFill = `url(#${uid}-sunburst-grad)`;
    } else if (config.dialPattern === "gradient") {
      patternFill = `url(#${uid}-vignette-grad)`;
    } else if (config.dialPattern === "guilloche") {
      patternFill = `url(#${uid}-guilloche-pattern)`;
    } else if (config.dialPattern === "nautilus_grooves") {
      patternFill = `url(#${uid}-nautilus-groove-pat)`;
    } else if (config.dialPattern === "meteorite") {
      patternFill = `url(#${uid}-meteorite-pattern)`;
    } else if (config.dialPattern === "aventurine") {
      patternFill = `url(#${uid}-aventurine-pattern)`;
    }

    return (
      <g id="dial-surface">
        {/* Dial Face geometry */}
        {isTonneau ? (
          <path d={tonneauDialPath} fill={patternFill} stroke={metalColors.dark} strokeWidth="1" />
        ) : isSquare ? (
          <rect
            x={cx - r * 0.9}
            y={cy - r * (config.caseShape === "tank" || config.caseShape === "reverso" ? 1.25 : 0.9)}
            width={r * 1.8}
            height={r * (config.caseShape === "tank" || config.caseShape === "reverso" ? 2.5 : 1.8)}
            rx="4"
            fill={patternFill}
            stroke={metalColors.dark}
            strokeWidth="1"
          />
        ) : (
          <circle cx={cx} cy={cy} r={r} fill={patternFill} stroke={metalColors.dark} strokeWidth="1" />
        )}

        {/* Omega Speedmaster Stepped Dial Rim Ring */}
        {config.dialPattern === "step_dial" && (
          <circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke={metalColors.dark} strokeWidth="1" opacity={0.6} />
        )}

        {/* Constellation Pie-Pan 12-Faceted Polygon Flange */}
        {config.dialPattern === "pie_pan" && (
          <polygon
            points={Array.from({ length: 12 })
              .map((_, idx) => {
                const angle = (idx * 30 - 90) * (Math.PI / 180);
                return `${cx + r * 0.88 * Math.cos(angle)},${cy + r * 0.88 * Math.sin(angle)}`;
              })
              .join(" ")}
            fill="none"
            stroke={metalColors.dark}
            strokeWidth="1.2"
            opacity={0.7}
          />
        )}

        {/* OPEN-HEART COMPLICATION CUTAWAY (Exposing live oscillating balance wheel) */}
        {isOpenHeart && (
          <g id="open-heart-complication">
            {/* Open Heart Aperture Basin at 12 or 9 o'clock */}
            <circle cx={cx - r * 0.28} cy={cy + r * 0.28} r={r * 0.28} fill="#09090b" stroke={metalColors.highlight} strokeWidth="1.5" />
            <circle cx={cx - r * 0.28} cy={cy + r * 0.28} r={r * 0.26} fill={`url(#${uid}-perlage-pattern)`} opacity={0.7} />

            {/* Live Oscillating Balance Wheel inside Aperture */}
            <g transform={`rotate(${balanceAngle}, ${cx - r * 0.28}, ${cy + r * 0.28})`}>
              <circle cx={cx - r * 0.28} cy={cy + r * 0.28} r={r * 0.22} fill="none" stroke={`url(#${uid}-gold-gear-grad)`} strokeWidth="2" />
              {Array.from({ length: 3 }).map((_, i) => {
                const angle = (i * 120) * (Math.PI / 180);
                return (
                  <line
                    key={`oh-arm-${i}`}
                    x1={cx - r * 0.28 + 3 * Math.cos(angle)}
                    y1={cy + r * 0.28 + 3 * Math.sin(angle)}
                    x2={cx - r * 0.28 + (r * 0.22 - 1) * Math.cos(angle)}
                    y2={cy + r * 0.28 + (r * 0.22 - 1) * Math.sin(angle)}
                    stroke={`url(#${uid}-gold-gear-grad)`}
                    strokeWidth="1.6"
                  />
                );
              })}
              {/* Hairspring */}
              <path
                d={`M ${cx - r * 0.28} ${cy + r * 0.28}
                    m 0 2 a 2 2 0 0 1 0 -4 a 3.5 3.5 0 0 1 0 7 a 5.5 5.5 0 0 1 0 -11 a 8 8 0 0 1 0 16`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="0.6"
                opacity={0.8}
              />
            </g>

            {/* Polished Bridge & Ruby Cap Jewel */}
            <circle cx={cx - r * 0.28} cy={cy + r * 0.28} r="3.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
            <circle cx={cx - r * 0.28} cy={cy + r * 0.28} r="2.2" fill={`url(#${uid}-ruby-jewel-grad)`} />
          </g>
        )}

        {/* MOVADO MUSEUM MINIMALIST BRAND SIGNATURE (Clean 6 o'clock text only) */}
        {isMuseum ? (
          <text
            x={cx}
            y={cy + r * 0.84}
            textAnchor="middle"
            fontSize={size === "hero" ? 6 : 4}
            letterSpacing="1.2"
            fill={config.markerColor || metalColors.highlight}
            opacity={0.75}
            fontFamily="sans-serif"
            className="uppercase font-semibold"
          >
            SWISS MOVADO MADE
          </text>
        ) : (
          // STANDARD HOROLOGICAL DIAL BRANDING & SPECS
          !config.hideDialText && (
            <g id="dial-branding">
              {/* Primary Brand Inscription */}
              <text
                x={cx}
                y={cy - r * 0.42}
                textAnchor="middle"
                fontSize={size === "hero" ? 11 : size === "large" ? 8 : 6}
                fontWeight="bold"
                letterSpacing="1"
                fill={config.markerColor || metalColors.highlight}
                fontFamily="sans-serif"
                className="uppercase"
              >
                {watch.brand}
              </text>

              {/* Model Subtitle */}
              <text
                x={cx}
                y={cy - r * 0.42 + (size === "hero" ? 12 : 8)}
                textAnchor="middle"
                fontSize={size === "hero" ? 7.5 : size === "large" ? 5.5 : 4}
                fontWeight="500"
                letterSpacing="0.5"
                fill={config.markerColor || metalColors.highlight}
                opacity={0.8}
                fontFamily="sans-serif"
              >
                {watch.name.length > 20 ? watch.name.slice(0, 18) + "..." : watch.name}
              </text>

              {/* Lower Movement Certification */}
              <text
                x={cx}
                y={cy + r * 0.52}
                textAnchor="middle"
                fontSize={size === "hero" ? 6.5 : 4.5}
                letterSpacing="0.8"
                fill={config.markerColor || metalColors.highlight}
                opacity={0.7}
                fontFamily="sans-serif"
              >
                {(watch?.movement?.type || "AUTOMATIC").toUpperCase()}
              </text>

              {/* Water Resistance Certification */}
              {watch.waterResistance && (
                <text
                  x={cx}
                  y={cy + r * 0.52 + (size === "hero" ? 9 : 6)}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 5.5 : 3.8}
                  letterSpacing="0.5"
                  fill={config.accentColor || (config.markerColor || metalColors.highlight)}
                  opacity={0.65}
                  fontFamily="sans-serif"
                >
                  {watch.waterResistance}
                </text>
              )}

              {/* Swiss Made Signature at 6 o'clock */}
              <text
                x={cx}
                y={cy + r * 0.92}
                textAnchor="middle"
                fontSize={size === "hero" ? 5 : 3.5}
                letterSpacing="0.5"
                fill={metalColors.highlight}
                opacity={0.5}
                fontFamily="sans-serif"
              >
                SWISS MADE
              </text>
            </g>
          )
        )}
      </g>
    );
  };

  // Helper for Date Window & Cyclops
  const renderDateWindow = () => {
    if (!config.dateWindow) return null;
    const r = currentSize.dialR;
    const dwX = cx + r * 0.58;
    const dwY = cy;
    const dwW = size === "hero" ? 18 : 13;
    const dwH = size === "hero" ? 16 : 11;
    const dateNum = time.getDate();

    return (
      <g id="date-complication">
        {/* Date Aperture Bezel */}
        <rect
          x={dwX - dwW / 2}
          y={dwY - dwH / 2}
          width={dwW}
          height={dwH}
          rx="1"
          fill="#ffffff"
          stroke={metalColors.highlight}
          strokeWidth="1.2"
        />
        {/* Date Number */}
        <text
          x={dwX}
          y={dwY + (size === "hero" ? 4.5 : 3)}
          textAnchor="middle"
          fontSize={size === "hero" ? 11 : 8}
          fontWeight="bold"
          fontFamily="sans-serif"
          fill="#09090b"
        >
          {dateNum}
        </text>

        {/* Rolex 2.5x Cyclops Lens Magnifier on Sapphire Crystal */}
        {config.cyclops && (
          <ellipse
            cx={dwX}
            cy={dwY}
            rx={dwW * 0.8}
            ry={dwH * 0.9}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity={0.6}
            filter={`url(#${uid}-cyclops-lens)`}
          />
        )}
      </g>
    );
  };

  // Sapphire Crystal Specular Shine that tracks mouse tilt
  const renderSapphireReflection = () => {
    if (isLumeMode) return null;
    const r = currentSize.dialR;
    const isSquare = config.caseShape === "square" || config.caseShape === "tank" || config.caseShape === "reverso";
    const isTonneau = config.caseShape === "tonneau" || isRichardMille;
    const tw = r * 1.52;
    const th = r * 2.08;
    const tonneauDialPath = `M ${cx - tw * 0.31} ${cy - th * 0.44} Q ${cx} ${cy - th * 0.47} ${cx + tw * 0.31} ${cy - th * 0.44} Q ${cx + tw * 0.48} ${cy} ${cx + tw * 0.31} ${cy + th * 0.44} Q ${cx} ${cy + th * 0.47} ${cx - tw * 0.31} ${cy + th * 0.44} Q ${cx - tw * 0.48} ${cy} ${cx - tw * 0.31} ${cy - th * 0.44} Z`;

    const glareX = cx + (mousePos.x - 0.5) * r * 0.8;
    const glareY = cy + (mousePos.y - 0.5) * r * 0.8;

    return (
      <g id="sapphire-reflection" pointerEvents="none">
        {/* Curved Anti-Reflective Purple/Cyan Sheen */}
        <ellipse
          cx={glareX}
          cy={glareY - r * 0.2}
          rx={r * 0.85}
          ry={r * 0.35}
          transform={`rotate(-25, ${glareX}, ${glareY})`}
          fill={`url(#${uid}-sapphire-sheen)`}
          opacity={0.35}
        />
        {/* Soft edge highlight matched to watch geometry */}
        {isTonneau ? (
          <path
            d={tonneauDialPath}
            fill="none"
            stroke={`url(#${uid}-crystal-rim-sheen)`}
            strokeWidth="1.5"
            opacity={0.5}
          />
        ) : isSquare ? (
          <rect
            x={cx - r * 0.9}
            y={cy - r * (config.caseShape === "tank" || config.caseShape === "reverso" ? 1.25 : 0.9)}
            width={r * 1.8}
            height={r * (config.caseShape === "tank" || config.caseShape === "reverso" ? 2.5 : 1.8)}
            rx="4"
            fill="none"
            stroke={`url(#${uid}-crystal-rim-sheen)`}
            strokeWidth="1.5"
            opacity={0.5}
          />
        ) : (
          <circle
            cx={cx}
            cy={cy}
            r={r - 1}
            fill="none"
            stroke={`url(#${uid}-crystal-rim-sheen)`}
            strokeWidth="1.5"
            opacity={0.5}
          />
        )}
      </g>
    );
  };

  return (
    <div
      id={id || `watch-renderer-${watch.id}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative inline-flex items-center justify-center select-none transition-all duration-300 ${className}`}
      style={{
        width: currentSize.width,
        height: currentSize.height,
      }}
    >
      <svg
        width={currentSize.width}
        height={currentSize.height}
        viewBox={`0 0 ${currentSize.width} ${currentSize.height}`}
        className="overflow-visible"
      >
        <defs>
          {/* Lume glow filters */}
          <filter id={`${uid}-lume-blue-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-lume-green-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-lume-amber-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Case Drop Shadow */}
          <filter id={`${uid}-case-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.45" />
          </filter>

          {/* Cyclops Drop Shadow Filter */}
          <filter id={`${uid}-cyclops-lens`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
          </filter>

          {/* Movado Sun Dot Shadow */}
          <filter id={`${uid}-museum-dot-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
          </filter>

          {/* Case Metal Linear Gradient */}
          <linearGradient id={`${uid}-case-metal-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={metalColors.gradient[0]} />
            <stop offset="25%" stopColor={metalColors.gradient[1]} />
            <stop offset="50%" stopColor={metalColors.gradient[2]} />
            <stop offset="75%" stopColor={metalColors.gradient[3]} />
            <stop offset="100%" stopColor={metalColors.gradient[4]} />
          </linearGradient>

          {/* Bracelet Metal Gradient */}
          <linearGradient id={`${uid}-bracelet-metal-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={metalColors.gradient[2]} />
            <stop offset="30%" stopColor={metalColors.gradient[1]} />
            <stop offset="50%" stopColor={metalColors.gradient[3]} />
            <stop offset="70%" stopColor={metalColors.gradient[1]} />
            <stop offset="100%" stopColor={metalColors.gradient[2]} />
          </linearGradient>

          {/* Fluted Bezel Ring Gradient */}
          <linearGradient id={`${uid}-fluted-bezel-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={metalColors.highlight} />
            <stop offset="50%" stopColor={metalColors.dark} />
            <stop offset="100%" stopColor={metalColors.highlight} />
          </linearGradient>

          {/* Fluted Gold Bezel Gradient */}
          <linearGradient id={`${uid}-fluted-gold-bezel-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#ca8a04" />
            <stop offset="70%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          {/* Ceramic Bezel Gradients */}
          <linearGradient id={`${uid}-bezel-ceramic-black-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="40%" stopColor="#09090b" />
            <stop offset="80%" stopColor="#18181b" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>

          <linearGradient id={`${uid}-bezel-ceramic-blue-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>

          <linearGradient id={`${uid}-bezel-ceramic-green-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="50%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>

          <linearGradient id={`${uid}-bezel-pepsi-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="49.9%" stopColor="#991b1b" />
            <stop offset="50%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>

          <linearGradient id={`${uid}-bezel-batman-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#09090b" />
            <stop offset="49.9%" stopColor="#18181b" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>

          <linearGradient id={`${uid}-bezel-gold-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#eab308" />
            <stop offset="60%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>

          <linearGradient id={`${uid}-bezel-rose-gold-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="40%" stopColor="#fb923c" />
            <stop offset="75%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>

          {/* Forged Carbon Pattern */}
          <pattern id={`${uid}-bezel-carbon-pat`} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#18181b" />
            <path d="M 0 0 L 4 8 L 8 4 Z" fill="#27272a" opacity="0.6" />
            <path d="M 4 0 L 8 8 L 0 4 Z" fill="#09090b" opacity="0.8" />
          </pattern>

          {/* Leather & Rubber Strap Gradients */}
          <linearGradient id={`${uid}-leather-black-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="25%" stopColor="#27272a" />
            <stop offset="50%" stopColor="#09090b" />
            <stop offset="75%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>

          <linearGradient id={`${uid}-rubber-black-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#09090b" />
            <stop offset="30%" stopColor="#27272a" />
            <stop offset="50%" stopColor="#18181b" />
            <stop offset="70%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>

          <linearGradient id={`${uid}-rubber-blue-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="30%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#172554" />
            <stop offset="70%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id={`${uid}-rubber-orange-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9a3412" />
            <stop offset="30%" stopColor="#ea580c" />
            <stop offset="50%" stopColor="#c2410c" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>

          {/* Tapisserie Pattern (Audemars Piguet waffle) */}
          <pattern id={`${uid}-tapisserie-pattern`} width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill={config.dialColor} />
            <rect x="0.8" y="0.8" width="4.4" height="4.4" rx="0.6" fill={config.dialPatternColor || "#0284c7"} stroke={config.dialColor} strokeWidth="0.4" />
          </pattern>

          {/* Snowflake Pattern (Grand Seiko paper texture) */}
          <pattern id={`${uid}-snowflake-pattern`} width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill={config.dialColor} />
            <path d="M 0 3 Q 6 1 12 3 M 0 9 Q 6 7 12 9" stroke="#e2e8f0" strokeWidth="0.6" opacity="0.6" fill="none" />
          </pattern>

          {/* Guilloche Wave Pattern */}
          <pattern id={`${uid}-guilloche-pattern`} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill={config.dialColor} />
            <circle cx="4" cy="4" r="3" fill="none" stroke={config.dialPatternColor || "#cbd5e1"} strokeWidth="0.5" opacity="0.5" />
          </pattern>

          {/* Sunburst Radial Gradient */}
          <radialGradient id={`${uid}-sunburst-grad`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="40%" stopColor={config.dialColor} />
            <stop offset="100%" stopColor="#09090b" stopOpacity="0.9" />
          </radialGradient>

          {/* Vignette Gradient */}
          <radialGradient id={`${uid}-vignette-grad`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={config.dialPatternColor || config.dialColor} />
            <stop offset="85%" stopColor={config.dialColor} />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>

          {/* Sapphire Anti-reflective Purple/Cyan Sheen */}
          <linearGradient id={`${uid}-sapphire-sheen`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id={`${uid}-crystal-rim-sheen`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
          </linearGradient>

          {/* Movado Museum Sun Dot Gradients */}
          <radialGradient id={`${uid}-museum-dot-gold-grad`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#fef08a" />
            <stop offset="70%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </radialGradient>

          <radialGradient id={`${uid}-museum-dot-silver-grad`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#f1f5f9" />
            <stop offset="75%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>

          {/* Cartier Sapphire Cabochon Crown Gradient */}
          <radialGradient id={`${uid}-cabochon-sapphire-grad`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="40%" stopColor="#2563eb" />
            <stop offset="80%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          {/* Nautilus Horizontal Grooves Pattern */}
          <pattern id={`${uid}-nautilus-groove-pat`} width="100" height="8" patternUnits="userSpaceOnUse">
            <rect width="100" height="8" fill={config.dialColor} />
            <line x1="0" y1="4" x2="100" y2="4" stroke="#000000" strokeWidth="1.2" opacity="0.4" />
            <line x1="0" y1="5" x2="100" y2="5" stroke="#ffffff" strokeWidth="0.8" opacity="0.25" />
          </pattern>

          {/* Meteorite Widmanstätten Pattern */}
          <pattern id={`${uid}-meteorite-pattern`} width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill={config.dialColor} />
            <line x1="0" y1="0" x2="20" y2="20" stroke="#cbd5e1" strokeWidth="0.8" opacity="0.4" />
            <line x1="20" y1="0" x2="0" y2="20" stroke="#94a3b8" strokeWidth="0.6" opacity="0.5" />
            <line x1="0" y1="10" x2="20" y2="10" stroke="#e2e8f0" strokeWidth="0.5" opacity="0.3" />
          </pattern>

          {/* Aventurine Starlight Sparkle Pattern */}
          <pattern id={`${uid}-aventurine-pattern`} width="30" height="30" patternUnits="userSpaceOnUse">
            <rect width="30" height="30" fill={config.dialColor} />
            <circle cx="5" cy="8" r="0.8" fill="#ffffff" opacity="0.8" />
            <circle cx="18" cy="14" r="1.2" fill="#38bdf8" opacity="0.9" />
            <circle cx="24" cy="5" r="0.6" fill="#ffffff" opacity="0.7" />
            <circle cx="12" cy="25" r="1" fill="#bae6fd" opacity="0.85" />
            <circle cx="27" cy="22" r="0.7" fill="#ffffff" opacity="0.6" />
          </pattern>

          {/* Skeleton Perlage Pearl Pattern */}
          <pattern id={`${uid}-perlage-pattern`} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#18181b" />
            <circle cx="5" cy="5" r="4.5" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" opacity="0.85" />
            <circle cx="0" cy="0" r="4.5" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" opacity="0.85" />
            <circle cx="10" cy="0" r="4.5" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" opacity="0.85" />
            <circle cx="0" cy="10" r="4.5" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" opacity="0.85" />
            <circle cx="10" cy="10" r="4.5" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" opacity="0.85" />
          </pattern>

          {/* Côtes de Genève Bridge Striping */}
          <pattern id={`${uid}-cotes-pattern`} width="8" height="40" patternUnits="userSpaceOnUse">
            <rect width="8" height="40" fill="#27272a" />
            <line x1="0" y1="0" x2="8" y2="40" stroke="#3f3f46" strokeWidth="0.8" opacity="0.6" />
            <line x1="0" y1="20" x2="8" y2="60" stroke="#18181b" strokeWidth="0.6" opacity="0.5" />
          </pattern>

          {/* Synthetic Ruby Jewel Bearing Gradient */}
          <radialGradient id={`${uid}-ruby-jewel-grad`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="25%" stopColor="#ef4444" />
            <stop offset="70%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#4c0519" />
          </radialGradient>

          {/* Gilded Brass Gear Wheels Gradient */}
          <linearGradient id={`${uid}-gold-gear-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="80%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          {/* Flame-Blued Steel Screws Gradient */}
          <radialGradient id={`${uid}-blued-screw-grad`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="35%" stopColor="#2563eb" />
            <stop offset="75%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          {/* Skeleton Gunmetal Plate Gradient */}
          <linearGradient id={`${uid}-skeleton-plate-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="40%" stopColor="#27272a" />
            <stop offset="80%" stopColor="#18181b" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
        </defs>

        {/* 1. Strap / Bracelet */}
        {renderStrap()}

        {/* 2. Main Case Body & Lugs */}
        {renderCase()}

        {/* 3. Bezel */}
        {renderBezel()}

        {/* 4. Dial Face & Inscriptions */}
        {renderDialBackground()}

        {/* 5. Complications / Subdials */}
        {renderSubdials()}

        {/* 6. Date Window */}
        {renderDateWindow()}

        {/* 7. Markers & Hour Indices */}
        {renderMarkers()}

        {/* 8. Hands & Seconds Mechanism */}
        {renderHands()}

        {/* 9. Sapphire Crystal Sheen Reflection */}
        {renderSapphireReflection()}
      </svg>
    </div>
  );
};
