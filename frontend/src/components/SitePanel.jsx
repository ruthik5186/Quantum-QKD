import React from 'react';

/**
 * SitePanel Component (Ronas IT Clean Edition):
 * Quantum Optical Bench & Dual-Site Terminal Visualizer.
 * Displays live entangled photon emission, polarizer orientations,
 * quantum state collapse, and Eve intercept-resend visual tapping.
 */
export default function SitePanel({
  siteA = 'Station Alpha',
  siteB = 'Station Beta',
  currentRound = null,
  keyLengthBits = 0,
  targetKeyBits = 128,
  status = 'idle',
  injectEve = false,
}) {
  const isKeyRound = currentRound?.is_key_round;
  const isDiscarded = currentRound?.discarded;
  const isAnomaly = currentRound?.anomaly_flagged;
  const progressPct = Math.min(100, Math.round((keyLengthBits / targetKeyBits) * 100));

  // Determine polarizer angle in degrees for visual needle rotation
  const getAliceAngleDeg = (basis) => {
    if (!basis) return 0;
    if (basis.includes('0°')) return 0;
    if (basis.includes('45°')) return 45;
    if (basis.includes('90°')) return 90;
    return 0;
  };

  const getBobAngleDeg = (basis) => {
    if (!basis) return 45;
    if (basis.includes('45°')) return 45;
    if (basis.includes('90°')) return 90;
    if (basis.includes('135°')) return 135;
    return 45;
  };

  const aliceAngle = getAliceAngleDeg(currentRound?.alice_basis);
  const bobAngle = getBobAngleDeg(currentRound?.bob_basis);

  return (
    <div className="bg-white border border-[#e2e7f4] rounded-2xl p-5 shadow-xs text-[#151722]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[#edf0f8] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#eef1fc] border border-[#dce2f9] flex items-center justify-center text-[#5e67ea]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#151722] tracking-wide flex items-center gap-2">
              Quantum Optical Channel & Dual-Terminal Bench
            </h3>
            <p className="text-[11px] text-[#717892]">
              State: <span className="font-mono text-[#5e67ea] font-semibold">|Φ⁺⟩ = (|00⟩ + |11⟩)/√2</span> · Photons polarized on Poincare sphere
            </p>
          </div>
        </div>

        {/* Key Accumulator Progress */}
        <div className="flex items-center gap-3 bg-[#f0f3fa] px-3.5 py-1.5 rounded-xl border border-[#e2e7f4]">
          <div className="text-right">
            <div className="text-[10px] text-[#717892] uppercase font-mono font-bold tracking-wider">Sifted Key Progress</div>
            <div className="text-xs font-mono font-bold text-[#5e67ea]">
              {keyLengthBits} / {targetKeyBits} <span className="text-[10px] text-[#8a90a7]">bits</span>
            </div>
          </div>
          <div className="w-24 bg-[#e5e9f5] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#e2e7f4]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === 'key_ready'
                  ? 'bg-[#10b981]'
                  : 'bg-[#5e67ea]'
              }`}
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Optical Bench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
        {/* Site A (Alice) */}
        <div className="lg:col-span-4 bg-[#f8fafd] border border-[#e2e7f4] rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-[#5e67ea]/60 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#5e67ea] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5e67ea] animate-pulse"></span>
                TRANSMITTER TERMINAL
              </span>
              <h4 className="text-sm font-bold text-[#151722] mt-0.5">{siteA}</h4>
              <span className="text-[11px] text-[#717892] font-mono">Node ID: ALICE-TX-01</span>
            </div>

            {/* Polarizer Angle Dial */}
            <div className="relative w-11 h-11 rounded-full border border-[#dce2f9] bg-white flex items-center justify-center shadow-xs">
              <div
                className="w-8 h-0.5 bg-[#5e67ea] transition-transform duration-300 rounded shadow-xs"
                style={{ transform: `rotate(${aliceAngle}deg)` }}
              ></div>
              <span className="absolute text-[8px] font-mono text-[#5e67ea] font-bold bottom-0.5">
                {aliceAngle}°
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#e2e7f4] text-xs font-mono">
            <div className="bg-white p-2 rounded-xl border border-[#e2e7f4]">
              <span className="text-[#717892] text-[10px] block font-sans">Basis Selected</span>
              <span className="text-[#5e67ea] font-bold text-xs">{currentRound?.alice_basis || 'a1 (0°)'}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-[#e2e7f4]">
              <span className="text-[#717892] text-[10px] block font-sans">Measurement</span>
              <span className="text-[#151722] font-bold text-xs">
                {currentRound?.alice_bit !== undefined ? (
                  <span className="text-[#5e67ea] font-bold text-sm">|{currentRound.alice_bit}⟩</span>
                ) : (
                  'Waiting...'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Free Space Link & Optical Channel */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center py-4 relative">
          <div className="w-full relative h-10 flex items-center justify-center">
            <div className="w-full border-t-2 border-dashed border-[#cbd5e1] absolute"></div>
            {status === 'running' && (
              <div className="photon-particle bg-[#5e67ea] shadow-md shadow-indigo-300"></div>
            )}
            <div className="relative z-10 px-3 py-1 rounded-full bg-white border border-[#e2e7f4] text-[10px] font-mono font-bold text-[#5e67ea] shadow-xs">
              {injectEve ? '⚠️ Eve Tap Active' : '⚡ Entangled Beam'}
            </div>
          </div>

          <div className="text-center mt-2 text-[10px] font-mono text-[#717892]">
            {isKeyRound ? (
              <span className="text-[#10b981] font-bold">✓ Coincident Bases</span>
            ) : isAnomaly ? (
              <span className="text-[#ef4444] font-bold">🚨 Bell Perturbation</span>
            ) : (
              'Bell Test Sampling'
            )}
          </div>
        </div>

        {/* Site B (Bob) */}
        <div className="lg:col-span-4 bg-[#f8fafd] border border-[#e2e7f4] rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-[#10b981]/60 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#10b981] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                RECEIVER TERMINAL
              </span>
              <h4 className="text-sm font-bold text-[#151722] mt-0.5">{siteB}</h4>
              <span className="text-[11px] text-[#717892] font-mono">Node ID: BOB-RX-02</span>
            </div>

            {/* Polarizer Angle Dial */}
            <div className="relative w-11 h-11 rounded-full border border-[#dce2f9] bg-white flex items-center justify-center shadow-xs">
              <div
                className="w-8 h-0.5 bg-[#10b981] transition-transform duration-300 rounded shadow-xs"
                style={{ transform: `rotate(${bobAngle}deg)` }}
              ></div>
              <span className="absolute text-[8px] font-mono text-[#10b981] font-bold bottom-0.5">
                {bobAngle}°
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#e2e7f4] text-xs font-mono">
            <div className="bg-white p-2 rounded-xl border border-[#e2e7f4]">
              <span className="text-[#717892] text-[10px] block font-sans">Basis Selected</span>
              <span className="text-[#10b981] font-bold text-xs">{currentRound?.bob_basis || 'b1 (45°)'}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-[#e2e7f4]">
              <span className="text-[#717892] text-[10px] block font-sans">Measurement</span>
              <span className="text-[#151722] font-bold text-xs">
                {currentRound?.bob_bit !== undefined ? (
                  <span className="text-[#10b981] font-bold text-sm">|{currentRound.bob_bit}⟩</span>
                ) : (
                  'Waiting...'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
