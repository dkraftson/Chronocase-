import React, { useState, useEffect, useRef, useMemo } from "react";
import { Watch } from "../types";

interface MovementExhibitionProps {
  watch: Watch;
  size?: "thumbnail" | "small" | "medium" | "large" | "hero";
  className?: string;
  id?: string;
  onFlipToFront?: () => void;
}

export const MovementExhibition: React.FC<MovementExhibitionProps> = ({
  watch,
  size = "large",
  className = "",
  id,
  onFlipToFront,
}) => {
  const [rotorAngle, setRotorAngle] = useState(45);
  const [balanceAngle, setBalanceAngle] = useState(0);
  const [glideWheelAngle, setGlideWheelAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMouseX = useRef(0);

  // Watch identity & metadata
  const brandLower = (watch?.brand || "").toLowerCase();
  const nameLower = (watch?.name || "").toLowerCase();
  const refLower = (watch?.reference || "").toLowerCase();
  const caseShape = watch?.renderingConfig?.caseShape || "round";

  const isRichardMille =
    brandLower.includes("richard mille") ||
    brandLower.includes("mille") ||
    caseShape === "tonneau" ||
    nameLower.includes("rm 11") ||
    nameLower.includes("rm 0") ||
    nameLower.includes("rm 35") ||
    nameLower.includes("rm 67");

  const isRolex = brandLower.includes("rolex") || brandLower.includes("tudor");
  const isOmegaSpeedmaster =
    (brandLower.includes("omega") && (nameLower.includes("speedmaster") || nameLower.includes("moonwatch"))) ||
    refLower.includes("310.30") ||
    refLower.includes("311.30") ||
    refLower.includes("105.012") ||
    refLower.includes("145.022");
  const isOmega = brandLower.includes("omega");
  const isGrandSeiko = brandLower.includes("grand seiko") || brandLower.includes("seiko");
  const isPatek = brandLower.includes("patek");
  const isAP = brandLower.includes("audemars") || caseShape === "octagonal";
  const isPanerai = brandLower.includes("panerai") || caseShape === "cushion";
  const isCartier = brandLower.includes("cartier") || caseShape === "tank";
  const isLange = brandLower.includes("lange") || brandLower.includes("glashütte") || brandLower.includes("glashutte");
  const isBreitling = brandLower.includes("breitling");
  const isMonaco = brandLower.includes("tag heuer") && (nameLower.includes("monaco") || caseShape === "square");
  const isReverso = brandLower.includes("jaeger") && (nameLower.includes("reverso") || caseShape === "reverso");

  const isManual =
    watch.movement.type === "Manual" ||
    watch.movement.type === "Hand-wound" ||
    nameLower.includes("mechanical") ||
    nameLower.includes("hand-wound") ||
    isOmegaSpeedmaster;

  const isSpringDrive =
    watch.movement.type === "Spring Drive" ||
    nameLower.includes("spring drive") ||
    (watch.movement.caliber || "").includes("9R");

  const isQuartz =
    watch.movement.type === "Quartz" ||
    watch.movement.type === "Solar" ||
    (watch.movement.frequencyVph === 0 && !isManual);

  const isAutomatic = !isManual && !isQuartz;

  // Default caseback style (vintage moonwatch & oyster tool watches historically solid, RM/AP/Patek/exhibition modern)
  const initialCasebackStyle =
    isOmegaSpeedmaster && !nameLower.includes("sapphire")
      ? "solid"
      : isRolex && !nameLower.includes("1908") && !nameLower.includes("daytona 126506")
      ? "solid"
      : "exhibition";

  const [casebackStyle, setCasebackStyle] = useState<"exhibition" | "solid">(initialCasebackStyle);

  // High-frequency mechanical balance wheel oscillation (or continuous glide for Spring Drive)
  useEffect(() => {
    let animId: number;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      const vph = watch.movement.frequencyVph || 28800;

      if (isSpringDrive) {
        // Continuous glide wheel rotation (8 revolutions per second)
        setGlideWheelAngle((elapsed * 360 * 8) % 360);
      } else {
        const freq = vph / 3600;
        const angle = Math.sin(elapsed * freq * Math.PI * 2) * 44;
        setBalanceAngle(angle);
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [watch.movement.frequencyVph, isSpringDrive]);

  // Rotor movement on mouse hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAutomatic || !containerRef.current) return;
    const deltaX = e.clientX - prevMouseX.current;
    prevMouseX.current = e.clientX;
    setRotorAngle((prev) => (prev + deltaX * 2.2) % 360);
  };

  const sizeMap: Record<string, { width: number; height: number; r: number }> = {
    thumbnail: { width: 140, height: 180, r: 48 },
    small: { width: 170, height: 210, r: 60 },
    medium: { width: 220, height: 280, r: 78 },
    large: { width: 320, height: 390, r: 108 },
    hero: { width: 440, height: 520, r: 148 },
  };

  const cur = sizeMap[size] || sizeMap.large || { width: 320, height: 390, r: 108 };
  const cx = cur.width / 2;
  const cy = cur.height / 2;
  const r = cur.r;

  // Case Metal Colors
  const finish = watch?.renderingConfig?.caseFinish || "steel";
  const isRoseGold = finish === "rose_gold";
  const isYellowGold = finish === "yellow_gold";
  const isTitanium = finish === "titanium";
  const isPlatinum = finish === "platinum";
  const isBronze = finish === "bronze";
  const isBlackCeramic = finish === "black_ceramic";

  const isGoldCase = isRoseGold || isYellowGold;

  // Derived serial number (stable per watch ID/reference)
  const serialNo = useMemo(() => {
    const hash = (watch.id + watch.reference).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const num = (hash % 9000) + 1000;
    return `N° ${num}`;
  }, [watch.id, watch.reference]);

  // Geometry dimensions
  const isTonneauShape = caseShape === "tonneau" || isRichardMille;
  const isRectangularShape = caseShape === "tank" || caseShape === "reverso" || caseShape === "square" || isCartier || isReverso || isMonaco;
  const isOctagonalShape = caseShape === "octagonal" || isAP;
  const isCushionShape = caseShape === "cushion" || isPanerai;

  const tw = r * 1.62;
  const th = r * 2.24;
  const tonneauCasebackPath = `M ${cx - tw * 0.36} ${cy - th * 0.49} Q ${cx} ${cy - th * 0.52} ${cx + tw * 0.36} ${cy - th * 0.49} Q ${cx + tw * 0.54} ${cy} ${cx + tw * 0.36} ${cy + th * 0.49} Q ${cx} ${cy + th * 0.52} ${cx - tw * 0.36} ${cy + th * 0.49} Q ${cx - tw * 0.54} ${cy} ${cx - tw * 0.36} ${cy - th * 0.49} Z`;
  const tonneauWindowPath = `M ${cx - tw * 0.28} ${cy - th * 0.40} Q ${cx} ${cy - th * 0.43} ${cx + tw * 0.28} ${cy - th * 0.40} Q ${cx + tw * 0.42} ${cy} ${cx + tw * 0.28} ${cy + th * 0.40} Q ${cx} ${cy + th * 0.43} ${cx - tw * 0.28} ${cy + th * 0.40} Q ${cx - tw * 0.42} ${cy} ${cx - tw * 0.28} ${cy - th * 0.40} Z`;

  const rectW = r * 1.45;
  const rectH = r * (caseShape === "tank" || isReverso ? 2.15 : 1.55);

  const uid = `mv-${watch.id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div
      id={id || `movement-exhibition-${watch.id}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: cur.width, height: cur.height }}
    >
      <svg
        width={cur.width}
        height={cur.height}
        viewBox={`0 0 ${cur.width} ${cur.height}`}
        className="overflow-visible filter drop-shadow-2xl"
      >
        <defs>
          {/* Côtes de Genève stripes pattern */}
          <pattern id={`${uid}-cotes-de-geneve`} width="10" height="20" patternUnits="userSpaceOnUse">
            <rect width="5" height="20" fill="#e2e8f0" />
            <rect x="5" width="5" height="20" fill="#cbd5e1" />
            <line x1="0" y1="0" x2="10" y2="20" stroke="#94a3b8" strokeWidth="0.5" opacity="0.35" />
          </pattern>

          {/* Glashütte German Silver Ribbing (Warmer Champagne Tone) */}
          <pattern id={`${uid}-glashutte-ribs`} width="12" height="24" patternUnits="userSpaceOnUse">
            <rect width="6" height="24" fill="#fef3c7" />
            <rect x="6" width="6" height="24" fill="#fde68a" />
            <line x1="0" y1="0" x2="12" y2="24" stroke="#d97706" strokeWidth="0.5" opacity="0.25" />
          </pattern>

          {/* Arabesque Waves (Omega Co-Axial Radial Spiral) */}
          <pattern id={`${uid}-arabesque-pattern`} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="7" fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.35" />
            <path d="M 0 8 Q 8 0 16 8 Q 8 16 0 8" fill="none" stroke="#cbd5e1" strokeWidth="0.8" opacity="0.4" />
          </pattern>

          {/* Perlage circular graining pattern */}
          <pattern id={`${uid}-perlage-pattern`} width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="3.5" fill="none" stroke="#94a3b8" strokeWidth="0.8" opacity="0.45" />
          </pattern>

          {/* Gold Rotor Gradient */}
          <linearGradient id={`${uid}-gold-rotor-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#eab308" />
            <stop offset="60%" stopColor="#ca8a04" />
            <stop offset="85%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          {/* Platinum / Titanium Rotor Gradient */}
          <linearGradient id={`${uid}-ti-rotor-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="35%" stopColor="#334155" />
            <stop offset="70%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Case Ring Gradient tailored to finish */}
          <linearGradient id={`${uid}-case-ring-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isRoseGold ? (
              <>
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="50%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#7c2d12" />
              </>
            ) : isYellowGold ? (
              <>
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#713f12" />
              </>
            ) : isBronze ? (
              <>
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#451a03" />
              </>
            ) : isBlackCeramic ? (
              <>
                <stop offset="0%" stopColor="#3f3f46" />
                <stop offset="50%" stopColor="#18181b" />
                <stop offset="100%" stopColor="#09090b" />
              </>
            ) : isTitanium ? (
              <>
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="30%" stopColor="#cbd5e1" />
                <stop offset="70%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </>
            )}
          </linearGradient>

          {/* Ruby Jewel Gradient */}
          <radialGradient id={`${uid}-ruby-jewel-grad`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="60%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#881337" />
          </radialGradient>

          {/* Sunray Brushed Solid Caseback */}
          <radialGradient id={`${uid}-solid-medallion-grad`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>

          {/* Grand Seiko Gold Emblem */}
          <radialGradient id={`${uid}-gs-gold-grad`} cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="85%" stopColor="#a16207" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>
        </defs>

        {/* ========================================================================= */}
        {/* 1. OUTER CASEBACK HOUSING ARCHITECTURE (Tailored by case geometry)        */}
        {/* ========================================================================= */}

        {isTonneauShape ? (
          /* TONNEAU CASEBACK HOUSING (Richard Mille / Franck Muller) */
          <g id="tonneau-caseback-body">
            {/* Midcase layer */}
            <path d={tonneauCasebackPath} fill="#09090b" stroke="#18181b" strokeWidth="5" />
            {/* Caseback bezel plate */}
            <path
              d={tonneauCasebackPath}
              fill={`url(#${uid}-case-ring-grad)`}
              stroke="#09090b"
              strokeWidth="2"
              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
            />
            {/* 12 Countersunk Titanium Spline Screws around tonneau perimeter */}
            {[
              { x: cx - tw * 0.30, y: cy - th * 0.44 },
              { x: cx - tw * 0.11, y: cy - th * 0.485 },
              { x: cx + tw * 0.11, y: cy - th * 0.485 },
              { x: cx + tw * 0.30, y: cy - th * 0.44 },
              { x: cx + tw * 0.46, y: cy - th * 0.22 },
              { x: cx + tw * 0.46, y: cy + th * 0.22 },
              { x: cx + tw * 0.30, y: cy + th * 0.44 },
              { x: cx + tw * 0.11, y: cy + th * 0.485 },
              { x: cx - tw * 0.11, y: cy + th * 0.485 },
              { x: cx - tw * 0.30, y: cy + th * 0.44 },
              { x: cx - tw * 0.46, y: cy + th * 0.22 },
              { x: cx - tw * 0.46, y: cy - th * 0.22 },
            ].map((pos, i) => (
              <g key={`rm-cb-screw-${i}`}>
                <circle cx={pos.x} cy={pos.y} r={size === "hero" ? 3.6 : 2.5} fill="#94a3b8" stroke="#1e293b" strokeWidth="0.5" />
                <circle cx={pos.x} cy={pos.y} r={size === "hero" ? 1.6 : 1.1} fill="#09090b" />
                <line x1={pos.x - 1.2} y1={pos.y} x2={pos.x + 1.2} y2={pos.y} stroke="#f8fafc" strokeWidth="0.5" />
              </g>
            ))}

            {/* Personalized Engravings along Top & Bottom Perimeter Flanges */}
            <text
              x={cx}
              y={cy - th * 0.43}
              textAnchor="middle"
              fontSize={size === "hero" ? 8 : 6}
              fontWeight="900"
              fill={isGoldCase ? "#78350f" : "#f8fafc"}
              letterSpacing="1.8"
              fontFamily="sans-serif"
            >
              {watch.brand.toUpperCase()}
            </text>
            <text
              x={cx}
              y={cy + th * 0.46}
              textAnchor="middle"
              fontSize={size === "hero" ? 6.5 : 4.8}
              fontWeight="bold"
              fill={isGoldCase ? "#92400e" : "#94a3b8"}
              letterSpacing="1"
              fontFamily="sans-serif"
            >
              {watch.customEngraving ? `“${watch.customEngraving}”` : `${watch.reference} • ${watch.waterResistance?.toUpperCase() || "50M"} • TITANIUM • ${serialNo}`}
            </text>
          </g>
        ) : isRectangularShape ? (
          /* RECTANGULAR / TANK / REVERSO / MONACO CASEBACK */
          <g id="rectangular-caseback-body">
            <rect
              x={cx - rectW / 2}
              y={cy - rectH / 2}
              width={rectW}
              height={rectH}
              rx="6"
              fill={`url(#${uid}-case-ring-grad)`}
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            {/* 4 Corner Screws */}
            {[
              { x: cx - rectW / 2 + 8, y: cy - rectH / 2 + 8 },
              { x: cx + rectW / 2 - 8, y: cy - rectH / 2 + 8 },
              { x: cx - rectW / 2 + 8, y: cy + rectH / 2 - 8 },
              { x: cx + rectW / 2 - 8, y: cy + rectH / 2 - 8 },
            ].map((pos, i) => (
              <g key={`rect-screw-${i}`}>
                <circle cx={pos.x} cy={pos.y} r={3} fill="#94a3b8" stroke="#1e293b" strokeWidth="0.6" />
                <line x1={pos.x - 2} y1={pos.y} x2={pos.x + 2} y2={pos.y} stroke="#0f172a" strokeWidth="0.8" />
              </g>
            ))}
            {/* Inscriptions */}
            <text
              x={cx}
              y={cy - rectH / 2 + 18}
              textAnchor="middle"
              fontSize={size === "hero" ? 8.5 : 6.5}
              fontWeight="900"
              fill={isGoldCase ? "#78350f" : "#1e293b"}
              letterSpacing="2"
            >
              {watch.brand.toUpperCase()}
            </text>
            <text
              x={cx}
              y={cy + rectH / 2 - 12}
              textAnchor="middle"
              fontSize={size === "hero" ? 6.5 : 5}
              fontWeight="bold"
              fill={isGoldCase ? "#92400e" : "#475569"}
              letterSpacing="1"
            >
              {watch.customEngraving ? `“${watch.customEngraving}”` : `${watch.reference} • ${watch.movement.caliber} • ${serialNo}`}
            </text>
          </g>
        ) : isOctagonalShape ? (
          /* OCTAGONAL AP ROYAL OAK CASEBACK WITH 8 THROUGH-HEX BOLTS */
          <g id="octagonal-caseback-body">
            <polygon
              points={Array.from({ length: 8 })
                .map((_, i) => {
                  const angle = (i * 45 + 22.5) * (Math.PI / 180);
                  return `${cx + r * 1.18 * Math.cos(angle)},${cy + r * 1.18 * Math.sin(angle)}`;
                })
                .join(" ")}
              fill={`url(#${uid}-case-ring-grad)`}
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            {/* 8 Hexagonal Through-Bolts */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 + 22.5) * (Math.PI / 180);
              const bx = cx + r * 1.06 * Math.cos(angle);
              const by = cy + r * 1.06 * Math.sin(angle);
              return (
                <polygon
                  key={`ap-cb-bolt-${i}`}
                  points={Array.from({ length: 6 })
                    .map((_, h) => {
                      const hAngle = (h * 60) * (Math.PI / 180);
                      return `${bx + 3 * Math.cos(hAngle)},${by + 3 * Math.sin(hAngle)}`;
                    })
                    .join(" ")}
                  fill="#ffffff"
                  stroke="#334155"
                  strokeWidth="0.8"
                />
              );
            })}
          </g>
        ) : isPanerai || isCushionShape ? (
          /* PANERAI DECAGONAL SCREW-IN CASEBACK */
          <g id="panerai-caseback-body">
            <circle cx={cx} cy={cy} r={r * 1.18} fill={`url(#${uid}-case-ring-grad)`} stroke="#0f172a" strokeWidth="2.5" />
            <polygon
              points={Array.from({ length: 12 })
                .map((_, i) => {
                  const angle = (i * 30) * (Math.PI / 180);
                  return `${cx + r * 1.10 * Math.cos(angle)},${cy + r * 1.10 * Math.sin(angle)}`;
                })
                .join(" ")}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.2"
            />
          </g>
        ) : (
          /* CLASSIC ROUND CASEBACK HOUSING (Rolex / Omega / Grand Seiko / Patek) */
          <g id="round-caseback-body">
            <circle
              cx={cx}
              cy={cy}
              r={r * 1.16}
              fill={`url(#${uid}-case-ring-grad)`}
              stroke="#1e293b"
              strokeWidth="2.5"
            />
            {/* Rolex / Tudor Oyster Fluted Ring Knurling or Caseback Tool Notches */}
            {isRolex ? (
              <circle
                cx={cx}
                cy={cy}
                r={r * 1.06}
                fill="none"
                stroke="#64748b"
                strokeWidth="4"
                strokeDasharray="2 1.5"
                opacity={0.8}
              />
            ) : (
              [0, 60, 120, 180, 240, 300].map((deg) => {
                const rad = deg * (Math.PI / 180);
                const nx = cx + r * 1.09 * Math.cos(rad);
                const ny = cy + r * 1.09 * Math.sin(rad);
                return (
                  <circle
                    key={deg}
                    cx={nx}
                    cy={ny}
                    r={size === "hero" ? 3 : 2}
                    fill="#0f172a"
                    stroke="#64748b"
                    strokeWidth="0.8"
                  />
                );
              })
            )}

            {/* Circular Perimeter Inscriptions */}
            <text
              x={cx}
              y={cy - r * 0.94}
              textAnchor="middle"
              fontSize={size === "hero" ? 8 : size === "large" ? 6.2 : 4.5}
              fontWeight="bold"
              fill={isGoldCase ? "#78350f" : "#334155"}
              letterSpacing="1.2"
            >
              {watch.brand.toUpperCase()} • {watch.movement.caliber.toUpperCase()} • SWISS
            </text>

            <text
              x={cx}
              y={cy + r * 0.98}
              textAnchor="middle"
              fontSize={size === "hero" ? 7 : size === "large" ? 5.5 : 4}
              fontWeight="bold"
              fill={watch.customEngraving ? "#b45309" : isGoldCase ? "#92400e" : "#475569"}
              letterSpacing="0.8"
            >
              {watch.customEngraving
                ? `“${watch.customEngraving.toUpperCase()}”`
                : `${watch.waterResistance?.toUpperCase() || "100M"} • ${watch.movement.jewels || 31}J • ${serialNo}`}
            </text>
          </g>
        )}

        {/* ========================================================================= */}
        {/* 2. CASEBACK DISPLAY CORE: SOLID MEDALLION vs EXHIBITION SAPPHIRE          */}
        {/* ========================================================================= */}

        {casebackStyle === "solid" ? (
          /* ======================================================================= */
          /* AUTHENTIC SOLID ENGRAVED CASEBACK MEDALLIONS                           */
          /* ======================================================================= */
          <g id="solid-medallion-assembly">
            {isOmegaSpeedmaster ? (
              /* OMEGA SPEEDMASTER MOONWATCH HISTORIC NASA CASEBACK */
              <g id="moonwatch-nasa-caseback">
                <circle cx={cx} cy={cy} r={r * 0.85} fill={`url(#${uid}-solid-medallion-grad)`} stroke="#1e293b" strokeWidth="2" />
                {/* NASA Flight-Qualified Inscription Arc */}
                <circle cx={cx} cy={cy} r={r * 0.70} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 2" />
                <text
                  x={cx}
                  y={cy - r * 0.58}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 6.5 : 4.8}
                  fontWeight="bold"
                  fill="#0f172a"
                  letterSpacing="0.8"
                >
                  FLIGHT-QUALIFIED BY NASA
                </text>
                <text
                  x={cx}
                  y={cy - r * 0.48}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 5.5 : 4}
                  fontWeight="bold"
                  fill="#334155"
                  letterSpacing="0.6"
                >
                  FOR ALL MANNED SPACE MISSIONS
                </text>

                {/* Central Hippocampus Seahorse Medallion */}
                <circle cx={cx} cy={cy} r={r * 0.36} fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize={size === "hero" ? 13 : 9} fontWeight="900" fill="#f8fafc" letterSpacing="1">
                  Ω
                </text>
                <text x={cx} y={cy + 8} textAnchor="middle" fontSize={size === "hero" ? 8 : 6} fontWeight="bold" fill="#38bdf8" letterSpacing="1">
                  SEAMASTER
                </text>

                {/* Bottom Historic Moonwatch Inscription */}
                <text
                  x={cx}
                  y={cy + r * 0.50}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 6.5 : 4.8}
                  fontWeight="bold"
                  fill="#0f172a"
                  letterSpacing="0.8"
                >
                  THE FIRST WATCH
                </text>
                <text
                  x={cx}
                  y={cy + r * 0.60}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 5.8 : 4.2}
                  fontWeight="900"
                  fill="#1e293b"
                  letterSpacing="0.8"
                >
                  WORN ON THE MOON
                </text>
              </g>
            ) : isGrandSeiko ? (
              /* GRAND SEIKO 18K SOLID GOLD LION EMBLEM MEDALLION */
              <g id="gs-lion-medallion">
                <circle cx={cx} cy={cy} r={r * 0.85} fill={`url(#${uid}-solid-medallion-grad)`} stroke="#1e293b" strokeWidth="2" />
                {/* 18K Gold Lion Center Inset */}
                <circle cx={cx} cy={cy} r={r * 0.46} fill={`url(#${uid}-gs-gold-grad)`} stroke="#854d0e" strokeWidth="2" />
                <circle cx={cx} cy={cy} r={r * 0.42} fill="none" stroke="#fef08a" strokeWidth="0.8" strokeDasharray="3 2" />
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize={size === "hero" ? 18 : 13} fontWeight="900" fill="#451a03" letterSpacing="1">
                  GS
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize={size === "hero" ? 7 : 5} fontWeight="bold" fill="#713f12" letterSpacing="1.5">
                  GRAND SEIKO
                </text>
                <text x={cx} y={cy + r * 0.62} textAnchor="middle" fontSize={size === "hero" ? 6.5 : 5} fontWeight="bold" fill="#334155">
                  WATER RESISTANT 10 BAR • {serialNo}
                </text>
              </g>
            ) : isRolex ? (
              /* ROLEX OYSTER PERPETUAL SATIN-BRUSHED MEDALLION */
              <g id="rolex-oyster-medallion">
                <circle cx={cx} cy={cy} r={r * 0.85} fill={`url(#${uid}-solid-medallion-grad)`} stroke="#1e293b" strokeWidth="1.8" />
                <circle cx={cx} cy={cy} r={r * 0.70} fill="none" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />
                {/* Clean satin-brushed face */}
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize={size === "hero" ? 12 : 9} fontWeight="900" fill="#1e293b" letterSpacing="2">
                  {watch.brand.toUpperCase()}
                </text>
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize={size === "hero" ? 7 : 5.5} fontWeight="bold" fill="#475569" letterSpacing="1.2">
                  GENEVA • SWISS MADE
                </text>
                <text x={cx} y={cy + 24} textAnchor="middle" fontSize={size === "hero" ? 6 : 4.5} fill="#64748b">
                  {watch.reference} • {serialNo}
                </text>
              </g>
            ) : (
              /* BESPOKE BRAND ENGRAVED MEDALLION */
              <g id="generic-solid-medallion">
                <circle cx={cx} cy={cy} r={r * 0.85} fill={`url(#${uid}-solid-medallion-grad)`} stroke="#1e293b" strokeWidth="2" />
                <circle cx={cx} cy={cy} r={r * 0.7} fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
                <circle cx={cx} cy={cy} r={r * 0.45} fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                <text
                  x={cx}
                  y={cy - 4}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 13 : 9.5}
                  fontWeight="900"
                  fill="#f8fafc"
                  letterSpacing="2"
                >
                  {watch.brand.toUpperCase()}
                </text>
                <text
                  x={cx}
                  y={cy + 12}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 7.5 : 5.5}
                  fontWeight="bold"
                  fill="#fbbf24"
                  letterSpacing="1"
                >
                  {watch.category.toUpperCase()} • MANUFACTURE
                </text>
                <text
                  x={cx}
                  y={cy + 24}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 6.5 : 4.8}
                  fill="#94a3b8"
                >
                  REF. {watch.reference} • {serialNo}
                </text>
              </g>
            )}
          </g>
        ) : (
          /* ======================================================================= */
          /* SAPPHIRE CRYSTAL EXHIBITION WINDOW (MOVEMENT MECHATRONICS)             */
          /* ======================================================================= */
          <g id="exhibition-sapphire-view">
            {isTonneauShape ? (
              /* TONNEAU SAPPHIRE EXHIBITION (Richard Mille / Franck Muller) */
              <g id="rm-exhibition-core">
                {/* Tonneau Sapphire Window Basin */}
                <path d={tonneauWindowPath} fill="#09090b" stroke="#27272a" strokeWidth="1.8" />
                {/* Grade 5 Titanium Baseplate with Openworked Windows */}
                <path d={tonneauWindowPath} fill={`url(#${uid}-ti-rotor-grad)`} opacity={0.65} />

                {/* Visible Dual Barrels & Geartrain */}
                <circle cx={cx} cy={cy - th * 0.20} r={r * 0.24} fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
                <circle cx={cx} cy={cy - th * 0.20} r={r * 0.20} fill="none" stroke={`url(#${uid}-gold-rotor-grad)`} strokeWidth="1.5" />
                <circle cx={cx} cy={cy - th * 0.20} r="4" fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.5" />

                {/* Oscillating Balance Wheel at 6 o'clock */}
                <g transform={`rotate(${balanceAngle}, ${cx}, ${cy + th * 0.22})`}>
                  <circle cx={cx} cy={cy + th * 0.22} r={r * 0.25} fill="none" stroke={`url(#${uid}-gold-rotor-grad)`} strokeWidth="2.2" />
                  <line x1={cx - r * 0.25} y1={cy + th * 0.22} x2={cx + r * 0.25} y2={cy + th * 0.22} stroke="#ca8a04" strokeWidth="1.6" />
                  <circle cx={cx} cy={cy + th * 0.22} r={r * 0.12} fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity={0.9} />
                </g>
                <circle cx={cx} cy={cy + th * 0.22} r="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
                <circle cx={cx} cy={cy + th * 0.22} r="1.8" fill={`url(#${uid}-ruby-jewel-grad)`} />

                {/* Movement Inscriptions on Titanium Bridge */}
                <text
                  x={cx}
                  y={cy - 6}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 8 : 6}
                  fontWeight="bold"
                  fill="#e2e8f0"
                  letterSpacing="1.2"
                >
                  CALIBRE {watch.movement.caliber.toUpperCase()}
                </text>
                <text
                  x={cx}
                  y={cy + 6}
                  textAnchor="middle"
                  fontSize={size === "hero" ? 6 : 4.5}
                  fill="#94a3b8"
                  letterSpacing="0.8"
                >
                  {watch.movement.jewels || 38} JEWELS • {watch.movement.frequencyVph || 28800} VPH
                </text>

                {/* Signature RICHARD MILLE VARIABLE-GEOMETRY ROTOR */}
                {isAutomatic && (
                  <g transform={`rotate(${rotorAngle}, ${cx}, ${cy})`}>
                    {/* Grade 5 Titanium Central Rotor Ribs */}
                    <path
                      d={`M ${cx - tw * 0.24} ${cy} L ${cx - tw * 0.22} ${cy - th * 0.32} L ${cx + tw * 0.22} ${cy - th * 0.32} L ${cx + tw * 0.24} ${cy} Z`}
                      fill="#27272a"
                      stroke="#52525b"
                      strokeWidth="1.2"
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.7))"
                    />
                    {/* 18K White Gold Heavy Outer Winglets */}
                    <rect x={cx - tw * 0.20} y={cy - th * 0.34} width={tw * 0.40} height={th * 0.08} rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
                    {/* Variable-Geometry 6-Position Adjustment Weights */}
                    {[-12, -4, 4, 12].map((xOff, i) => (
                      <circle key={`rm-w-${i}`} cx={cx + xOff} cy={cy - th * 0.30} r={1.8} fill="#fef08a" stroke="#a16207" strokeWidth="0.5" />
                    ))}
                    {/* Brand marking on rotor */}
                    <text x={cx} y={cy - th * 0.16} textAnchor="middle" fontSize={size === "hero" ? 7.5 : 5.5} fontWeight="900" fill="#f8fafc" letterSpacing="1.2">
                      {watch.brand.toUpperCase()}
                    </text>
                    {/* Rotor Center Pivot Bearing */}
                    <circle cx={cx} cy={cy} r={r * 0.14} fill="#09090b" stroke="#71717a" strokeWidth="1" />
                    <circle cx={cx} cy={cy} r="2.5" fill="#fef08a" />
                  </g>
                )}
              </g>
            ) : isManual ? (
              /* ===================================================================== */
              /* AUTHENTIC MANUAL WIND MOVEMENT (SPEEDMASTER / LANGE / PATEK MANUAL)   */
              /* Exposed Ratchet & Crown Wheels, Glashütte 3/4 Plate, No Rotor!       */
              /* ===================================================================== */
              <g id="manual-wind-movement-core">
                <circle cx={cx} cy={cy} r={r * 0.85} fill="#090d16" stroke="#94a3b8" strokeWidth="1.8" />

                {/* Mainplate with Perlage base */}
                <circle cx={cx} cy={cy} r={r * 0.83} fill={`url(#${uid}-perlage-pattern)`} />

                {/* 3/4 Plate / Finger Bridges with Stripes */}
                <path
                  d={`M ${cx - r * 0.75} ${cy - r * 0.4} Q ${cx} ${cy - r * 0.8} ${cx + r * 0.75} ${cy - r * 0.4} L ${cx + r * 0.75} ${cy + r * 0.35} Q ${cx} ${cy + r * 0.65} ${cx - r * 0.75} ${cy + r * 0.35} Z`}
                  fill={isLange ? `url(#${uid}-glashutte-ribs)` : `url(#${uid}-cotes-de-geneve)`}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                />

                {/* Exposed Mainspring Ratchet Wheel at Top-Left */}
                <g id="ratchet-wheel">
                  <circle cx={cx - r * 0.35} cy={cy - r * 0.35} r={r * 0.28} fill={`url(#${uid}-solid-medallion-grad)`} stroke="#475569" strokeWidth="1" />
                  {/* Sunburst radial brushing rays */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    return (
                      <line
                        key={`rw-${i}`}
                        x1={cx - r * 0.35 + 4 * Math.cos(angle)}
                        y1={cy - r * 0.35 + 4 * Math.sin(angle)}
                        x2={cx - r * 0.35 + (r * 0.26) * Math.cos(angle)}
                        y2={cy - r * 0.35 + (r * 0.26) * Math.sin(angle)}
                        stroke="#f8fafc"
                        strokeWidth="0.8"
                        opacity={0.7}
                      />
                    );
                  })}
                  <circle cx={cx - r * 0.35} cy={cy - r * 0.35} r={4} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="0.8" />
                </g>

                {/* Exposed Crown Wheel at Top-Right */}
                <g id="crown-wheel">
                  <circle cx={cx + r * 0.38} cy={cy - r * 0.42} r={r * 0.18} fill={`url(#${uid}-solid-medallion-grad)`} stroke="#475569" strokeWidth="1" />
                  <circle cx={cx + r * 0.38} cy={cy - r * 0.42} r={3.5} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="0.8" />
                </g>

                {/* Caliber Inscription */}
                <text
                  x={cx - r * 0.25}
                  y={cy + r * 0.05}
                  fontSize={size === "hero" ? 8 : 6}
                  fontWeight="bold"
                  fill="#1e293b"
                  letterSpacing="0.8"
                >
                  CAL. {watch.movement.caliber.toUpperCase()}
                </text>
                <text
                  x={cx - r * 0.25}
                  y={cy + r * 0.16}
                  fontSize={size === "hero" ? 6 : 4.5}
                  fontWeight="600"
                  fill="#475569"
                >
                  MANUAL WIND • {watch.movement.jewels || 21} JEWELS
                </text>

                {/* Gold Chatons & Ruby Jewels */}
                {[
                  { x: cx - r * 0.05, y: cy - r * 0.15, size: 4.8 },
                  { x: cx + r * 0.35, y: cy - r * 0.05, size: 4.2 },
                  { x: cx - r * 0.28, y: cy + r * 0.32, size: 4.5 },
                ].map((jewel, i) => (
                  <g key={`m-jewel-${i}`}>
                    <circle cx={jewel.x} cy={jewel.y} r={jewel.size + 2} fill="#ca8a04" stroke="#854d0e" strokeWidth="0.8" />
                    <circle cx={jewel.x} cy={jewel.y} r={jewel.size} fill={`url(#${uid}-ruby-jewel-grad)`} stroke="#4c0519" strokeWidth="0.6" />
                    <circle cx={jewel.x} cy={jewel.y} r={1.2} fill="#1e1b4b" />
                  </g>
                ))}

                {/* Heat-Blued Screws */}
                {[
                  { x: cx - r * 0.60, y: cy + r * 0.15 },
                  { x: cx + r * 0.55, y: cy - r * 0.25 },
                  { x: cx + r * 0.15, y: cy + r * 0.45 },
                ].map((screw, i) => (
                  <g key={`m-screw-${i}`}>
                    <circle cx={screw.x} cy={screw.y} r={3.2} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="0.8" />
                    <line x1={screw.x - 2} y1={screw.y} x2={screw.x + 2} y2={screw.y} stroke="#f8fafc" strokeWidth="0.6" />
                  </g>
                ))}

                {/* Oscillating Balance Wheel & Hairspring */}
                <g transform={`rotate(${balanceAngle}, ${cx + r * 0.36}, ${cy + r * 0.26})`}>
                  <circle cx={cx + r * 0.36} cy={cy + r * 0.26} r={r * 0.28} fill="none" stroke="#ca8a04" strokeWidth="2" />
                  <line x1={cx + r * 0.36 - r * 0.28} y1={cy + r * 0.26} x2={cx + r * 0.36 + r * 0.28} y2={cy + r * 0.26} stroke="#ca8a04" strokeWidth="1.6" />
                  <circle cx={cx + r * 0.36} cy={cy + r * 0.26} r={r * 0.16} fill="none" stroke="#38bdf8" strokeWidth="0.9" opacity={0.9} />
                </g>
                <path
                  d={`M ${cx + r * 0.14} ${cy + r * 0.04} Q ${cx + r * 0.36} ${cy + r * 0.14} ${cx + r * 0.62} ${cy + r * 0.36} L ${cx + r * 0.5} ${cy + r * 0.48} Z`}
                  fill="#ca8a04"
                  stroke="#854d0e"
                  strokeWidth="1.2"
                />
              </g>
            ) : (
              /* ===================================================================== */
              /* BESPOKE AUTOMATIC / SPRING DRIVE / CO-AXIAL EXHIBITION MOVEMENT       */
              /* ===================================================================== */
              <g id="automatic-movement-core">
                <circle cx={cx} cy={cy} r={r * 0.85} fill="#090d16" stroke="#94a3b8" strokeWidth="1.8" />
                <circle cx={cx} cy={cy} r={r * 0.83} fill={`url(#${uid}-perlage-pattern)`} />

                {/* Bridges with Côtes de Genève or Arabesque */}
                <path
                  d={`M ${cx - r * 0.75} ${cy - r * 0.22} Q ${cx} ${cy - r * 0.65} ${cx + r * 0.75} ${cy - r * 0.22} L ${cx + r * 0.75} ${cy + r * 0.45} Q ${cx} ${cy + r * 0.75} ${cx - r * 0.75} ${cy + r * 0.45} Z`}
                  fill={isOmega ? `url(#${uid}-arabesque-pattern)` : `url(#${uid}-cotes-de-geneve)`}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                />

                {/* Caliber Inscription on Main Bridge */}
                <text
                  x={cx - r * 0.15}
                  y={cy - r * 0.35}
                  fontSize={size === "hero" ? 7.5 : 5.5}
                  fontWeight="bold"
                  fill="#1e293b"
                  letterSpacing="0.8"
                >
                  CAL. {watch.movement.caliber.toUpperCase()}
                </text>
                <text
                  x={cx - r * 0.15}
                  y={cy - r * 0.24}
                  fontSize={size === "hero" ? 6 : 4.5}
                  fontWeight="600"
                  fill="#475569"
                >
                  {isSpringDrive ? "SPRING DRIVE • 72H POWER RESERVE" : "ADJUSTED TO FIVE (5) POSITIONS"}
                </text>

                {/* Gold Chatons & Ruby Jewels */}
                {[
                  { x: cx - r * 0.45, y: cy - r * 0.32, size: 4.8 },
                  { x: cx + r * 0.35, y: cy - r * 0.28, size: 4.2 },
                  { x: cx - r * 0.28, y: cy + r * 0.38, size: 5.2 },
                  { x: cx + r * 0.48, y: cy + r * 0.22, size: 4.6 },
                  { x: cx - r * 0.1, y: cy + r * 0.12, size: 3.8 },
                ].map((jewel, i) => (
                  <g key={`jewel-${i}`}>
                    <circle cx={jewel.x} cy={jewel.y} r={jewel.size + 2.2} fill="#ca8a04" stroke="#854d0e" strokeWidth="0.8" />
                    <circle cx={jewel.x} cy={jewel.y} r={jewel.size} fill={`url(#${uid}-ruby-jewel-grad)`} stroke="#4c0519" strokeWidth="0.6" />
                    <circle cx={jewel.x} cy={jewel.y} r={1.2} fill="#1e1b4b" />
                  </g>
                ))}

                {/* Heat-Blued Screws */}
                {[
                  { x: cx - r * 0.58, y: cy + r * 0.1 },
                  { x: cx + r * 0.58, y: cy - r * 0.42 },
                  { x: cx + r * 0.05, y: cy + r * 0.58 },
                  { x: cx + r * 0.25, y: cy + r * 0.48 },
                  { x: cx - r * 0.42, y: cy - r * 0.5 },
                ].map((screw, i) => (
                  <g key={`screw-${i}`}>
                    <circle cx={screw.x} cy={screw.y} r={3.4} fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="0.8" />
                    <line x1={screw.x - 2.2} y1={screw.y} x2={screw.x + 2.2} y2={screw.y} stroke="#f8fafc" strokeWidth="0.6" />
                  </g>
                ))}

                {/* Balance Wheel or Spring Drive Glide Wheel */}
                {isSpringDrive ? (
                  <g transform={`rotate(${glideWheelAngle}, ${cx + r * 0.36}, ${cy + r * 0.26})`}>
                    <circle cx={cx + r * 0.36} cy={cy + r * 0.26} r={r * 0.26} fill="none" stroke="#eab308" strokeWidth="2.5" />
                    {Array.from({ length: 8 }).map((_, gIdx) => {
                      const gAngle = (gIdx * 45) * (Math.PI / 180);
                      return (
                        <line
                          key={gIdx}
                          x1={cx + r * 0.36}
                          y1={cy + r * 0.26}
                          x2={cx + r * 0.36 + r * 0.25 * Math.cos(gAngle)}
                          y2={cy + r * 0.26 + r * 0.25 * Math.sin(gAngle)}
                          stroke="#ca8a04"
                          strokeWidth="1.2"
                        />
                      );
                    })}
                  </g>
                ) : (
                  <g transform={`rotate(${balanceAngle}, ${cx + r * 0.36}, ${cy + r * 0.26})`}>
                    <circle cx={cx + r * 0.36} cy={cy + r * 0.26} r={r * 0.28} fill="none" stroke="#ca8a04" strokeWidth="2" />
                    <line x1={cx + r * 0.36 - r * 0.28} y1={cy + r * 0.26} x2={cx + r * 0.36 + r * 0.28} y2={cy + r * 0.26} stroke="#ca8a04" strokeWidth="1.6" />
                    <line x1={cx + r * 0.36} y1={cy + r * 0.26 - r * 0.28} x2={cx + r * 0.36} y2={cy + r * 0.26 + r * 0.28} stroke="#ca8a04" strokeWidth="1.6" />
                    <circle cx={cx + r * 0.36} cy={cy + r * 0.26} r={r * 0.16} fill="none" stroke="#38bdf8" strokeWidth="0.9" opacity={0.9} />
                  </g>
                )}

                {/* Hand-engraved Balance Cock Bridge */}
                <path
                  d={`M ${cx + r * 0.14} ${cy + r * 0.04} Q ${cx + r * 0.36} ${cy + r * 0.14} ${cx + r * 0.62} ${cy + r * 0.36} L ${cx + r * 0.5} ${cy + r * 0.48} Z`}
                  fill="#ca8a04"
                  stroke="#854d0e"
                  strokeWidth="1.2"
                />

                {/* Interactive Automatic Winding Rotor */}
                <g transform={`rotate(${rotorAngle}, ${cx}, ${cy})`}>
                  {/* Rotor weight */}
                  <path
                    d={`M ${cx - r * 0.81} ${cy} A ${r * 0.81} ${r * 0.81} 0 0 1 ${cx + r * 0.81} ${cy} L ${cx + r * 0.3} ${cy} A ${r * 0.3} ${r * 0.3} 0 0 0 ${cx - r * 0.3} ${cy} Z`}
                    fill={isAP || isPatek || isGoldCase ? `url(#${uid}-gold-rotor-grad)` : `url(#${uid}-gold-rotor-grad)`}
                    stroke="#854d0e"
                    strokeWidth="1.5"
                    filter="drop-shadow(0px 5px 8px rgba(0,0,0,0.6))"
                  />
                  {/* Skeleton Cutouts on Rotor */}
                  <path
                    d={`M ${cx - r * 0.68} ${cy - 4} A ${r * 0.68} ${r * 0.68} 0 0 1 ${cx - r * 0.35} ${cy - r * 0.58} L ${cx - r * 0.25} ${cy - r * 0.44} A ${r * 0.5} ${r * 0.5} 0 0 0 ${cx - r * 0.5} ${cy - 4} Z`}
                    fill="#090d16"
                    opacity={0.85}
                  />
                  <path
                    d={`M ${cx + r * 0.68} ${cy - 4} A ${r * 0.68} ${r * 0.68} 0 0 0 ${cx + r * 0.35} ${cy - r * 0.58} L ${cx + r * 0.25} ${cy - r * 0.44} A ${r * 0.5} ${r * 0.5} 0 0 1 ${cx + r * 0.5} ${cy - 4} Z`}
                    fill="#090d16"
                    opacity={0.85}
                  />
                  {/* Brand engraving on rotor */}
                  <text
                    x={cx}
                    y={cy - r * 0.56}
                    textAnchor="middle"
                    fontSize={size === "hero" ? 9.5 : size === "large" ? 7.5 : 5.5}
                    fontWeight="900"
                    fill="#451a03"
                    letterSpacing="1.5"
                  >
                    {watch.brand.toUpperCase()}
                  </text>
                  <text
                    x={cx}
                    y={cy - r * 0.42}
                    textAnchor="middle"
                    fontSize={size === "hero" ? 7 : size === "large" ? 5.2 : 4}
                    fontWeight="bold"
                    fill="#78350f"
                    letterSpacing="0.8"
                  >
                    21K GOLD ROTOR • {watch.movement.caliber}
                  </text>

                  {/* Central Ball Bearing Pivot */}
                  <circle cx={cx} cy={cy} r={r * 0.17} fill={`url(#${uid}-case-ring-grad)`} stroke="#334155" strokeWidth="1.2" />
                  {[0, 51, 102, 154, 205, 257, 308].map((deg) => {
                    const rad = deg * (Math.PI / 180);
                    const bx = cx + r * 0.11 * Math.cos(rad);
                    const by = cy + r * 0.11 * Math.sin(rad);
                    return <circle key={deg} cx={bx} cy={by} r={1.8} fill="#f8fafc" stroke="#475569" strokeWidth="0.5" />;
                  })}
                  <circle cx={cx} cy={cy} r={r * 0.05} fill="#09090b" />
                </g>
              </g>
            )}
          </g>
        )}
      </svg>

      {/* Caseback Controls Bar (Toggle Exhibition vs Solid / Hint) */}
      <div className="mt-2 flex items-center gap-2 z-10">
        {isAutomatic && (
          <span className="text-[10px] text-amber-300/80 font-medium bg-neutral-950/80 px-2.5 py-0.5 rounded-full border border-neutral-800 backdrop-blur-sm">
            {isRichardMille ? "Move mouse to spin RM variable-geometry rotor" : "Move mouse to spin 21K rotor"}
          </span>
        )}
        <button
          id={`caseback-style-toggle-${watch.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setCasebackStyle((prev) => (prev === "exhibition" ? "solid" : "exhibition"));
          }}
          className="text-[10px] text-neutral-400 hover:text-white bg-neutral-900 px-2.5 py-0.5 rounded-full border border-neutral-800 hover:border-neutral-700 transition-colors shadow-sm"
        >
          {casebackStyle === "exhibition" ? "View Solid Medallion" : "View Sapphire Exhibition"}
        </button>
      </div>
    </div>
  );
};
