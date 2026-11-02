import React, { useState } from 'react';

/**
 * LiveChart Component (Ronas IT Clean Edition):
 * Real-Time Bell Inequality (CHSH S-statistic) & Quantum Bit Error Rate (QBER) Visualizer.
 * Streams every single quantum round dynamically on a crisp light SVG canvas.
 */
export default function LiveChart({ rounds = [], currentRound = null }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Take recent 100 rounds for clean, crisp visualization
  const displayRounds = rounds.slice(-100);

  const width = 720;
  const heightCHSH = 170;
  const heightQBER = 140;
  const padding = { top: 25, right: 35, bottom: 25, left: 50 };

  // Scale for CHSH S (1.0 to 3.2)
  const minS = 1.0;
  const maxS = 3.2;
  const getY_CHSH = (val) => {
    const clamped = Math.max(minS, Math.min(maxS, val));
    return heightCHSH - padding.bottom - ((clamped - minS) / (maxS - minS)) * (heightCHSH - padding.top - padding.bottom);
  };

  // Scale for QBER (0.0 to 0.45)
  const minQ = 0.0;
  const maxQ = 0.45;
  const getY_QBER = (val) => {
    const clamped = Math.max(minQ, Math.min(maxQ, val));
    return heightQBER - padding.bottom - ((clamped - minQ) / (maxQ - minQ)) * (heightQBER - padding.top - padding.bottom);
  };

  const getX = (idx, total) => {
    if (total <= 1) return padding.left;
    return padding.left + (idx / (total - 1)) * (width - padding.left - padding.right);
  };

  // SVG Paths
  const chshPoints = displayRounds.map((r, i) => `${getX(i, displayRounds.length)},${getY_CHSH(r.chsh_s)}`);
  const chshPath = chshPoints.length > 0 ? `M ${chshPoints.join(' L ')}` : '';

  const qberPoints = displayRounds.map((r, i) => `${getX(i, displayRounds.length)},${getY_QBER(r.qber)}`);
  const qberPath = qberPoints.length > 0 ? `M ${qberPoints.join(' L ')}` : '';

  // Critical threshold lines
  const yS_quantumMax = getY_CHSH(2.8284);
  const yS_classicalLimit = getY_CHSH(2.0);
  const yQ_threshold = getY_QBER(0.11);

  const activeData = hoveredIndex !== null && displayRounds[hoveredIndex] ? displayRounds[hoveredIndex] : currentRound;

  // Quantum violation margin
  const sValue = currentRound?.chsh_s ?? 2.8284;
  const violationMargin = sValue - 2.0;

  return (
    <div className="bg-white border border-[#e2e7f4] rounded-2xl p-5 shadow-xs text-[#151722]">
      {/* Chart Header with Telemetry Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[#edf0f8] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#eef1fc] border border-[#dce2f9] flex items-center justify-center text-[#5e67ea] text-sm">
            📈
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#151722] tracking-wide flex items-center gap-2">
              Bell Inequality & Error Rate Telemetry
              <span className="w-2 h-2 rounded-full bg-[#5e67ea] animate-ping"></span>
            </h3>
            <p className="text-[11px] text-[#717892]">
              Per-round computation of CHSH Bell parameter <span className="font-mono text-[#5e67ea] font-semibold">S</span> and QBER
            </p>
          </div>
        </div>

        {/* Live Gauges */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="bg-[#f0f3fa] px-3 py-1.5 rounded-xl border border-[#e2e7f4] flex items-center gap-2">
            <span className="text-[#717892]">Round:</span>
            <span className="text-[#151722] font-bold">{currentRound?.round_num ?? rounds.length}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
            sValue >= 2.0
              ? 'bg-[#dcfce7] border-[#bbf7d0] text-[#15803d]'
              : 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]'
          }`}>
            <span className="opacity-80">CHSH S:</span>
            <span className="font-bold text-sm">{sValue.toFixed(4)}</span>
            <span className="text-[10px] opacity-80">
              {violationMargin >= 0 ? `(+${violationMargin.toFixed(3)})` : `(${violationMargin.toFixed(3)})`}
            </span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
            (currentRound?.qber ?? 0.0) <= 0.11
              ? 'bg-[#e0e7ff] border-[#c7d2fe] text-[#4338ca]'
              : 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]'
          }`}>
            <span className="opacity-80">QBER:</span>
            <span className="font-bold text-sm">{((currentRound?.qber ?? 0.0) * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* CHSH Graph (S Parameter) */}
      <div className="mb-5">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-bold text-[#5e67ea] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5e67ea]"></span>
            CHSH Correlation Parameter (S = |E₁₁ - E₁₃ + E₃₁ + E₃₃|)
          </span>
          <div className="flex items-center gap-3 text-[11px] font-mono text-[#717892]">
            <span className="text-[#5e67ea] flex items-center gap-1 font-semibold">
              <span className="w-2 h-0.5 bg-[#5e67ea] inline-block"></span> 2√2 ≈ 2.8284 (Quantum Limit)
            </span>
            <span className="text-[#f59e0b] flex items-center gap-1 font-semibold">
              <span className="w-2 h-0.5 bg-[#f59e0b] inline-block"></span> S = 2.0 (Bell Bound)
            </span>
          </div>
        </div>

        <div className="relative w-full bg-[#f8fafd] border border-[#e2e7f4] rounded-2xl overflow-hidden p-1 shadow-inner">
          <svg viewBox={`0 0 ${width} ${heightCHSH}`} className="w-full h-44">
            <defs>
              <linearGradient id="chshGradientLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5e67ea" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#5e67ea" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Shaded Quantum Violation Zone (S > 2.0) */}
            <rect
              x={padding.left}
              y={padding.top}
              width={width - padding.left - padding.right}
              height={Math.max(0, yS_classicalLimit - padding.top)}
              fill="rgba(94, 103, 234, 0.04)"
            />

            {/* Reference Line: 2.8284 (Tsirelson's Quantum Maximum) */}
            <line
              x1={padding.left}
              y1={yS_quantumMax}
              x2={width - padding.right}
              y2={yS_quantumMax}
              stroke="#5e67ea"
              strokeDasharray="4 4"
              strokeWidth="1.2"
              opacity="0.8"
            />
            <text x={width - padding.right - 5} y={yS_quantumMax - 4} fill="#5e67ea" fontSize="9" textAnchor="end" fontFamily="monospace" fontWeight="bold">
              Tsirelson's Bound (2.8284)
            </text>

            {/* Reference Line: 2.0 (Classical Local-Realism Threshold) */}
            <line
              x1={padding.left}
              y1={yS_classicalLimit}
              x2={width - padding.right}
              y2={yS_classicalLimit}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
            <text x={width - padding.right - 5} y={yS_classicalLimit - 4} fill="#f59e0b" fontSize="9" textAnchor="end" fontFamily="monospace" fontWeight="bold">
              Classical Limit S = 2.0 (Eavesdropping Bound)
            </text>

            {/* Y Axis Labels */}
            <text x={padding.left - 8} y={getY_CHSH(3.0)} fill="#717892" fontSize="9" textAnchor="end" fontFamily="monospace">3.0</text>
            <text x={padding.left - 8} y={getY_CHSH(2.8284)} fill="#5e67ea" fontSize="9" textAnchor="end" fontFamily="monospace" fontWeight="bold">2.82</text>
            <text x={padding.left - 8} y={getY_CHSH(2.0)} fill="#f59e0b" fontSize="9" textAnchor="end" fontFamily="monospace" fontWeight="bold">2.00</text>
            <text x={padding.left - 8} y={getY_CHSH(1.2)} fill="#717892" fontSize="9" textAnchor="end" fontFamily="monospace">1.20</text>

            {/* S-Curve Path */}
            {chshPath && (
              <>
                <path
                  d={chshPath}
                  fill="none"
                  stroke="#5e67ea"
                  strokeWidth="5"
                  opacity="0.15"
                />
                <path
                  d={chshPath}
                  fill="none"
                  stroke="#5e67ea"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Interactive Data Dots */}
            {displayRounds.map((r, i) => {
              const cx = getX(i, displayRounds.length);
              const cy = getY_CHSH(r.chsh_s);
              const isCompromised = r.chsh_s < 2.0 || r.anomaly_flagged;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={isCompromised ? 3.5 : 2.5}
                  fill={isCompromised ? '#ef4444' : '#5e67ea'}
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="cursor-pointer transition-all hover:scale-150"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* QBER Graph */}
      <div>
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="font-bold text-[#ef4444] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
            Quantum Bit Error Rate (QBER on Matching Key Bases)
          </span>
          <span className="text-[11px] font-mono text-[#ef4444] font-semibold">
            Standard QKD Abort Threshold: 11.0%
          </span>
        </div>

        <div className="relative w-full bg-[#f8fafd] border border-[#e2e7f4] rounded-2xl overflow-hidden p-1 shadow-inner">
          <svg viewBox={`0 0 ${width} ${heightQBER}`} className="w-full h-36">
            {/* 11% Abort Threshold Line */}
            <line
              x1={padding.left}
              y1={yQ_threshold}
              x2={width - padding.right}
              y2={yQ_threshold}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
            <text x={width - padding.right - 5} y={yQ_threshold - 4} fill="#ef4444" fontSize="9" textAnchor="end" fontFamily="monospace" fontWeight="bold">
              Abort Limit: 11%
            </text>

            {/* Y Axis Labels */}
            <text x={padding.left - 8} y={getY_QBER(0.40)} fill="#717892" fontSize="9" textAnchor="end" fontFamily="monospace">40%</text>
            <text x={padding.left - 8} y={getY_QBER(0.25)} fill="#717892" fontSize="9" textAnchor="end" fontFamily="monospace">25%</text>
            <text x={padding.left - 8} y={getY_QBER(0.11)} fill="#ef4444" fontSize="9" textAnchor="end" fontFamily="monospace" fontWeight="bold">11%</text>
            <text x={padding.left - 8} y={getY_QBER(0.0)} fill="#717892" fontSize="9" textAnchor="end" fontFamily="monospace">0%</text>

            {/* QBER Curve */}
            {qberPath && (
              <>
                <path
                  d={qberPath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="5"
                  opacity="0.15"
                />
                <path
                  d={qberPath}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Data Dots */}
            {displayRounds.map((r, i) => {
              const cx = getX(i, displayRounds.length);
              const cy = getY_QBER(r.qber);
              const isHigh = r.qber > 0.11 || r.anomaly_flagged;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={isHigh ? 3.5 : 2.5}
                  fill={isHigh ? '#ef4444' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="cursor-pointer transition-all hover:scale-150"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Live Inspector Strip */}
      {activeData && (
        <div className="mt-4 p-3.5 bg-[#f0f3fa] border border-[#e2e7f4] rounded-xl text-xs font-mono flex flex-wrap items-center justify-between gap-3 text-[#151722] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5e67ea]"></span>
            <span className="text-[#717892]">Inspecting Round:</span>
            <span className="font-bold text-[#151722]">#{activeData.round_num}</span>
          </div>

          <div>
            <span className="text-[#717892]">Alice:</span>{' '}
            <span className="text-[#5e67ea] font-semibold">{activeData.alice_basis}</span>
            <span className="text-[#8a90a7] mx-1.5">vs</span>
            <span className="text-[#717892]">Bob:</span>{' '}
            <span className="text-[#10b981] font-semibold">{activeData.bob_basis}</span>
          </div>

          <div>
            <span className="text-[#717892]">Protocol Action:</span>{' '}
            <span className={activeData.discarded ? 'text-[#ef4444] font-bold' : 'text-[#10b981] font-bold'}>
              {activeData.discarded ? 'DISCARDED (Compromised)' : 'SIFTED (Valid Key)'}
            </span>
          </div>

          {activeData.reason && activeData.reason !== 'Normal quantum transmission' && (
            <div className="w-full text-[11px] text-[#991b1b] bg-[#fee2e2] border border-[#fecaca] p-2 rounded-lg">
              Trigger: {activeData.reason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
