import React, { useState, useEffect, useRef } from "react";
import { Watch } from "../types";

interface MovementExhibitionProps {
  watch: Watch;
  size?: "small" | "medium" | "large" | "hero";
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
  const [isHovered, setIsHovered] = useState(false);
  const [casebackStyle, setCasebackStyle] = useState<"exhibition" | "solid">("exhibition");
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMouseX = useRef(0);

  const isAutomatic =
    watch.movement.type === "Automatic" ||
    watch.movement.type === "Co-Axial" ||
    watch.movement.type === "Spring Drive";

  // Balance wheel oscillation animation (rapid tick oscillation)
  useEffect(() => {
    let animId: number;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      // High frequency oscillation: 4 Hz (8 beats per sec)
      const freq = (watch.movement.frequencyVph || 28800) / 3600;
      const angle = Math.sin(elapsed * freq * Math.PI * 2) * 42;
      setBalanceAngle(angle);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [watch.movement.frequencyVph]);

  // Rotor movement on mouse hover (weighted rotor physics with drag)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAutomatic || !containerRef.current) return;
    const deltaX = e.clientX - prevMouseX.current;
    prevMouseX.current = e.clientX;
    setRotorAngle((prev) => (prev + deltaX * 1.8) % 360);
  };

  const sizeMap = {
    small: { width: 170, height: 210, r: 60 },
    medium: { width: 220, height: 280, r: 78 },
    large: { width: 320, height: 390, r: 108 },
    hero: { width: 440, height: 520, r: 148 },
  };

  const cur = sizeMap[size];
  const cx = cur.width / 2;
  const cy = cur.height / 2;
  const r = cur.r;

  // Case Metal Color Gradients based on watch case
  const isGold =
    watch.renderingConfig.caseFinish === "rose_gold" ||
    watch.renderingConfig.caseFinish === "yellow_gold";
  const isBlack = watch.renderingConfig.caseFinish === "dlc_black";

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
          <pattern id={`cotes-de-geneve-${watch.id}`} width="10" height="20" patternUnits="userSpaceOnUse">
            <rect width="5" height="20" fill="#e2e8f0" />
            <rect x="5" width="5" height="20" fill="#cbd5e1" />
            <line x1="0" y1="0" x2="10" y2="20" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3" />
          </pattern>

          {/* Perlage circular graining pattern */}
          <pattern id={`perlage-pattern-${watch.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="3.5" fill="none" stroke="#94a3b8" strokeWidth="0.8" opacity="0.4" />
          </pattern>

          {/* Gold Rotor Gradient */}
          <linearGradient id={`gold-rotor-grad-${watch.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="25%" stopColor="#eab308" />
            <stop offset="60%" stopColor="#ca8a04" />
            <stop offset="85%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          {/* Steel Case Ring Gradient */}
          <linearGradient id={`case-ring-grad-${watch.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {isGold ? (
              <>
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#713f12" />
              </>
            ) : isBlack ? (
              <>
                <stop offset="0%" stopColor="#3f3f46" />
                <stop offset="50%" stopColor="#18181b" />
                <stop offset="100%" stopColor="#09090b" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="30%" stopColor="#f8fafc" />
                <stop offset="70%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#475569" />
              </>
            )}
          </linearGradient>

          {/* Ruby Jewel Gradient */}
          <radialGradient id={`ruby-jewel-grad-${watch.id}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="60%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#881337" />
          </radialGradient>

          {/* Sunray Brushed Solid Caseback */}
          <radialGradient id={`solid-medallion-grad-${watch.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="60%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </radialGradient>
        </defs>

        {/* Outer Steel Caseback Bezel Rim */}
        <circle
          cx={cx}
          cy={cy}
          r={r * 1.16}
          fill={`url(#case-ring-grad-${watch.id})`}
          stroke="#1e293b"
          strokeWidth="3"
        />

        {/* Caseback Screw Notches / Rolex Fluted Edge Or Decagonal Notches */}
        {[0, 60, 120, 180, 240, 300].map((deg) => {
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
        })}

        {/* Caseback Outer Inscription Ring */}
        <circle cx={cx} cy={cy} r={r * 1.01} fill="none" stroke="#475569" strokeWidth="0.8" strokeDasharray="3 3" />
        
        {/* Curved / Arc Text Inscriptions */}
        <text
          x={cx}
          y={cy - r * 0.9}
          textAnchor="middle"
          fontSize={size === "hero" ? 8.5 : size === "large" ? 6.8 : 5}
          fontWeight="bold"
          fill={isBlack ? "#a1a1aa" : isGold ? "#78350f" : "#334155"}
          letterSpacing="1.2"
        >
          {watch.brand.toUpperCase()} • {watch.movement.caliber.toUpperCase()} • SWISS MANUFACTURE
        </text>

        {/* Custom Engraving or Official Reference Inscription */}
        <text
          x={cx}
          y={cy + r * 0.96}
          textAnchor="middle"
          fontSize={size === "hero" ? 7.5 : size === "large" ? 6 : 4.5}
          fontWeight="bold"
          fill={watch.customEngraving ? "#b45309" : isBlack ? "#71717a" : "#475569"}
          letterSpacing="0.8"
        >
          {watch.customEngraving
            ? `“${watch.customEngraving.toUpperCase()}”`
            : `${watch.waterResistance?.toUpperCase() || "100M"} • ${watch.movement.jewels || 31} JEWELS • ${watch.movement.frequencyVph} VPH`}
        </text>

        {/* Caseback Display Body: Exhibition Sapphire vs Solid Engraved */}
        {casebackStyle === "solid" ? (
          /* SOLID ENGRAVED MEDALLION CASEBACK */
          <g>
            <circle cx={cx} cy={cy} r={r * 0.85} fill={`url(#solid-medallion-grad-${watch.id})`} stroke="#1e293b" strokeWidth="2" />
            <circle cx={cx} cy={cy} r={r * 0.7} fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
            {/* Medallion Emblem */}
            <circle cx={cx} cy={cy} r={r * 0.45} fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fontSize={size === "hero" ? 14 : 10}
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
              fontSize={size === "hero" ? 8 : 6}
              fontWeight="bold"
              fill="#fbbf24"
              letterSpacing="1"
            >
              GENÈVE • CERTIFIED
            </text>
            <text
              x={cx}
              y={cy + 24}
              textAnchor="middle"
              fontSize={size === "hero" ? 7 : 5}
              fill="#94a3b8"
            >
              N° {watch.reference.replace(/[^0-9]/g, "").slice(0, 5) || "08421"}
            </text>
          </g>
        ) : (
          /* SAPPHIRE CRYSTAL EXHIBITION CASEBACK WINDOW */
          <g>
            {/* Sapphire Crystal Window to Movement */}
            <circle cx={cx} cy={cy} r={r * 0.85} fill="#090d16" stroke="#94a3b8" strokeWidth="1.8" />

            {/* Mainplate with Perlage base */}
            <circle cx={cx} cy={cy} r={r * 0.83} fill={`url(#perlage-pattern-${watch.id})`} />

            {/* Bridges with Côtes de Genève finish */}
            <path
              d={`M ${cx - r * 0.75} ${cy - r * 0.22} Q ${cx} ${cy - r * 0.65} ${cx + r * 0.75} ${cy - r * 0.22} L ${cx + r * 0.75} ${cy + r * 0.45} Q ${cx} ${cy + r * 0.75} ${cx - r * 0.75} ${cy + r * 0.45} Z`}
              fill={`url(#cotes-de-geneve-${watch.id})`}
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
              y={cy - r * 0.25}
              fontSize={size === "hero" ? 6 : 4.5}
              fontWeight="600"
              fill="#475569"
            >
              ADJUSTED TO FIVE (5) POSITIONS
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
                {/* Gold Chaton Ring */}
                <circle
                  cx={jewel.x}
                  cy={jewel.y}
                  r={jewel.size + 2.2}
                  fill="#ca8a04"
                  stroke="#854d0e"
                  strokeWidth="0.8"
                />
                {/* Ruby Gem */}
                <circle
                  cx={jewel.x}
                  cy={jewel.y}
                  r={jewel.size}
                  fill={`url(#ruby-jewel-grad-${watch.id})`}
                  stroke="#4c0519"
                  strokeWidth="0.6"
                />
                {/* Center Pivot hole */}
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
                <circle
                  cx={screw.x}
                  cy={screw.y}
                  r={3.4}
                  fill="#1d4ed8"
                  stroke="#1e3a8a"
                  strokeWidth="0.8"
                />
                <line
                  x1={screw.x - 2.2}
                  y1={screw.y}
                  x2={screw.x + 2.2}
                  y2={screw.y}
                  stroke="#f8fafc"
                  strokeWidth="0.6"
                />
              </g>
            ))}

            {/* Oscillating Balance Wheel & Hairspring at bottom right */}
            <g transform={`rotate(${balanceAngle}, ${cx + r * 0.36}, ${cy + r * 0.26})`}>
              {/* Balance Wheel Rim (Glucydur) */}
              <circle
                cx={cx + r * 0.36}
                cy={cy + r * 0.26}
                r={r * 0.28}
                fill="none"
                stroke="#ca8a04"
                strokeWidth="2"
              />
              {/* Balance Spokes */}
              <line
                x1={cx + r * 0.36 - r * 0.28}
                y1={cy + r * 0.26}
                x2={cx + r * 0.36 + r * 0.28}
                y2={cy + r * 0.26}
                stroke="#ca8a04"
                strokeWidth="1.6"
              />
              <line
                x1={cx + r * 0.36}
                y1={cy + r * 0.26 - r * 0.28}
                x2={cx + r * 0.36}
                y2={cy + r * 0.26 + r * 0.28}
                stroke="#ca8a04"
                strokeWidth="1.6"
              />
              {/* Poising weights screws */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                const rad = deg * (Math.PI / 180);
                const bx = cx + r * 0.36 + r * 0.28 * Math.cos(rad);
                const by = cy + r * 0.26 + r * 0.28 * Math.sin(rad);
                return <circle key={deg} cx={bx} cy={by} r={1.2} fill="#fef08a" stroke="#854d0e" strokeWidth="0.4" />;
              })}
              {/* Silicon / Blue Hairspring spiral */}
              <circle
                cx={cx + r * 0.36}
                cy={cy + r * 0.26}
                r={r * 0.16}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="0.9"
                opacity="0.9"
              />
              <circle
                cx={cx + r * 0.36}
                cy={cy + r * 0.26}
                r={r * 0.09}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="0.9"
                opacity="0.9"
              />
            </g>

            {/* Hand-engraved Balance Cock Bridge */}
            <path
              d={`M ${cx + r * 0.14} ${cy + r * 0.04} Q ${cx + r * 0.36} ${cy + r * 0.14} ${cx + r * 0.62} ${cy + r * 0.36} L ${cx + r * 0.5} ${cy + r * 0.48} Z`}
              fill="#ca8a04"
              stroke="#854d0e"
              strokeWidth="1.2"
            />

            {/* Automatic Winding Skeleton Rotor (if automatic) */}
            {isAutomatic && (
              <g transform={`rotate(${rotorAngle}, ${cx}, ${cy})`}>
                {/* Semi-circular Oscillating Weight */}
                <path
                  d={`M ${cx - r * 0.81} ${cy} A ${r * 0.81} ${r * 0.81} 0 0 1 ${cx + r * 0.81} ${cy} L ${cx + r * 0.3} ${cy} A ${r * 0.3} ${r * 0.3} 0 0 0 ${cx - r * 0.3} ${cy} Z`}
                  fill={`url(#gold-rotor-grad-${watch.id})`}
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
                <circle
                  cx={cx}
                  cy={cy}
                  r={r * 0.17}
                  fill={`url(#case-ring-grad-${watch.id})`}
                  stroke="#334155"
                  strokeWidth="1.2"
                />
                {[0, 51, 102, 154, 205, 257, 308].map((deg) => {
                  const rad = deg * (Math.PI / 180);
                  const bx = cx + r * 0.11 * Math.cos(rad);
                  const by = cy + r * 0.11 * Math.sin(rad);
                  return (
                    <circle
                      key={deg}
                      cx={bx}
                      cy={by}
                      r={1.8}
                      fill="#f8fafc"
                      stroke="#475569"
                      strokeWidth="0.5"
                    />
                  );
                })}
                <circle cx={cx} cy={cy} r={r * 0.05} fill="#09090b" />
              </g>
            )}
          </g>
        )}
      </svg>

      {/* Caseback Controls Bar (Toggle Exhibition vs Solid / Hint) */}
      <div className="mt-2 flex items-center gap-2 z-10">
        {isAutomatic && (
          <span className="text-[10px] text-amber-300/80 font-medium bg-neutral-950/80 px-2.5 py-0.5 rounded-full border border-neutral-800 backdrop-blur-sm">
            Hover cursor to spin 21K rotor
          </span>
        )}
        <button
          id={`caseback-style-toggle-${watch.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setCasebackStyle((prev) => (prev === "exhibition" ? "solid" : "exhibition"));
          }}
          className="text-[10px] text-neutral-400 hover:text-white bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800 transition-colors"
        >
          {casebackStyle === "exhibition" ? "Solid Medallion" : "Exhibition Sapphire"}
        </button>
      </div>
    </div>
  );
};
