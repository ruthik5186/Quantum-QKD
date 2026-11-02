import React, { useMemo } from 'react';

/**
 * QuantumCircuitViewer Component (Ronas IT Clean Edition):
 * Real-time Qiskit-style Quantum Circuit Diagram for E91 QKD protocol.
 * 
 * Visualizes:
 * - Qubit Wire q0 (Alice / Source): |0⟩ -> H -> CNOT Control -> Ry(-θ_A) -> Measure -> c0
 * - Qubit Wire q1 (Bob / Receiver): |0⟩ --------> CNOT Target  -> [Eve Tap] -> Ry(-θ_B) -> Measure -> c1
 * - Live animated photon packet pulses traveling along wires in real time
 * - Live basis rotations, measurement bit outcomes, and key sifting verdicts.
 */
export default function QuantumCircuitViewer({
  currentRound = null,
  sessionStatus = 'idle',
  injectEve = false,
  compact = false,
  isDark = false,
}) {
  const isRunning = sessionStatus === 'running';

  // Extract active round parameters or fall back to nominal defaults
  const roundNum = currentRound?.round_num ?? 0;
  const aliceBasis = currentRound?.alice_basis ?? 'a1 (0°)';
  const bobBasis = currentRound?.bob_basis ?? 'b1 (45°)';
  const aliceBit = currentRound?.alice_bit ?? 0;
  const bobBit = currentRound?.bob_bit ?? 0;
  const isKeyRound = currentRound?.is_key_round ?? false;
  const isChshRound = currentRound?.is_chsh_round ?? true;
  const isDiscarded = currentRound?.discarded ?? false;
  const anomalyFlagged = currentRound?.anomaly_flagged ?? false;
  const eveIntercepted = currentRound?.eve_intercepted ?? injectEve;
  const eveAngleDeg = currentRound?.eve_angle_deg ?? (injectEve ? 45 : null);
  const eveBit = currentRound?.eve_bit ?? null;

  // Sifting verdict pill styling
  const verdict = useMemo(() => {
    if (!currentRound) {
      return {
        text: 'Standby: Quantum circuit initialized and awaiting photon pairs',
        color: isDark ? 'text-[#94a3b8] font-bold' : 'text-[#334155] font-bold',
        bg: isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-[#f0f3fa] border-[#dce2f9]',
      };
    }
    if (anomalyFlagged || (eveIntercepted && isDiscarded)) {
      return {
        text: '🚨 EVE ANOMALY: Bell state perturbed. Discarded to preserve security.',
        color: isDark ? 'text-[#fca5a5] font-extrabold' : 'text-[#991b1b] font-extrabold',
        bg: isDark ? 'bg-[#3b1219] border-[#7f1d1d]' : 'bg-[#fef2f2] border-[#fecaca]',
      };
    }
    if (isKeyRound && !isDiscarded) {
      return {
        text: `✅ SIFTED KEY BIT: Alice (${aliceBit}) = Bob (${bobBit}) · Identical basis match`,
        color: isDark ? 'text-[#34d399] font-extrabold' : 'text-[#15803d] font-extrabold',
        bg: isDark ? 'bg-[#064e3b]/50 border-[#059669]/60' : 'bg-[#dcfce7] border-[#bbf7d0]',
      };
    }
    if (isChshRound) {
      return {
        text: `🔬 CHSH TEST: Correlation sample ⟨A,B⟩ measured for Bell inequality (S > 2.0)`,
        color: isDark ? 'text-[#c7d2fe] font-extrabold' : 'text-[#4338ca] font-extrabold',
        bg: isDark ? 'bg-[#1e1b4b] border-[#312e81]' : 'bg-[#e0e7ff] border-[#c7d2fe]',
      };
    }
    return {
      text: 'Bases uncorrelated. Discarded per E91 protocol rule.',
      color: isDark ? 'text-[#94a3b8] font-bold' : 'text-[#334155] font-bold',
      bg: isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-[#f0f3fa] border-[#dce2f9]',
    };
  }, [currentRound, anomalyFlagged, eveIntercepted, isDiscarded, isKeyRound, aliceBit, bobBit, isChshRound, isDark]);

  return (
    <div className={`border rounded-2xl p-4 font-mono shadow-xs transition-colors ${
      isDark
        ? 'bg-[#141926] border-[#1e2638] text-[#f8fafc]'
        : 'bg-white border-[#dce2f9] text-[#0f172a]'
    } ${
      compact ? 'text-xs' : 'text-xs sm:text-sm'
    }`}>
      {/* Header with Live Status & Qiskit Brand */}
      <div className={`flex items-center justify-between pb-3 mb-3 border-b text-[11px] ${
        isDark ? 'border-[#1e2638]' : 'border-[#edf0f8]'
      }`}>
        <div className={`flex items-center gap-2 font-extrabold ${
          isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isRunning ? 'bg-[#5e67ea] animate-ping' : sessionStatus === 'key_ready' ? 'bg-[#10b981]' : 'bg-[#f59e0b]'
          }`}></span>
          <span className="tracking-wide">QUANTUM CIRCUIT (E91 BELL STATE)</span>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] animate-pulse border ${
              isDark
                ? 'bg-[#1e1b4b] text-[#c7d2fe] border-[#312e81]'
                : 'bg-[#e0e7ff] text-[#4338ca] border-[#c7d2fe]'
            }`}>
              LIVE ROUND #{roundNum}
            </span>
          )}
          <span className={`text-[10px] font-bold font-sans ${
            isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
          }`}>Qiskit 2-Qubit System</span>
        </div>
      </div>

      {/* Circuit Diagram SVG Canvas */}
      <div className="relative overflow-x-auto py-2">
        <svg
          viewBox="0 0 620 180"
          className="w-full min-w-[560px] h-auto select-none overflow-visible"
        >
          <defs>
            {/* Animated Laser Photon Pulse for Wire 0 (Alice) */}
            <linearGradient id="alicePhotonBeam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5e67ea" stopOpacity="0" />
              <stop offset="50%" stopColor="#5e67ea" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>

            {/* Animated Laser Photon Pulse for Wire 1 (Bob) */}
            <linearGradient id="bobPhotonBeam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
              <stop offset="50%" stopColor={eveIntercepted ? "#ef4444" : "#5e67ea"} stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>

            {/* Soft Glow filter */}
            <filter id="circuitGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ============================================================ */}
          {/* WIRE LABELS & BASE WIRES                                     */}
          {/* ============================================================ */}

          {/* Wire 0 (Alice) */}
          <text x="15" y="45" fill="#334155" fontSize="12" fontWeight="bold">q₀: |0⟩</text>
          <line x1="65" y1="40" x2="550" y2="40" stroke="#94a3b8" strokeWidth="2" strokeDasharray={isRunning ? "4 2" : "none"} />

          {/* Wire 1 (Bob) */}
          <text x="15" y="115" fill="#334155" fontSize="12" fontWeight="bold">q₁: |0⟩</text>
          <line x1="65" y1="110" x2="550" y2="110" stroke="#94a3b8" strokeWidth="2" strokeDasharray={isRunning ? "4 2" : "none"} />

          {/* Classical Readout Double Wire c */}
          <line x1="65" y1="158" x2="580" y2="158" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="65" y1="162" x2="580" y2="162" stroke="#cbd5e1" strokeWidth="1.5" />
          <text x="15" y="163" fill="#64748b" fontSize="10">c: /2</text>

          {/* Animated Photon Pulses on wires when running */}
          {isRunning && (
            <>
              <line
                x1="65"
                y1="40"
                x2="550"
                y2="40"
                stroke="url(#alicePhotonBeam)"
                strokeWidth="4"
                className="animate-pulse"
                filter="url(#circuitGlow)"
              />
              <line
                x1="65"
                y1="110"
                x2="550"
                y2="110"
                stroke="url(#bobPhotonBeam)"
                strokeWidth="4"
                className="animate-pulse"
                filter="url(#circuitGlow)"
              />
            </>
          )}

          {/* ============================================================ */}
          {/* STAGE 1: BELL STATE PREPARATION |Φ⁺⟩ = (|00⟩ + |11⟩)/√2     */}
          {/* ============================================================ */}

          {/* Hadamard Gate H on q0 */}
          <g transform="translate(85, 23)">
            <rect
              width="34"
              height="34"
              rx="8"
              fill="#5e67ea"
              className={isRunning ? "filter drop-shadow-[0_2px_8px_rgba(94,103,234,0.35)]" : ""}
            />
            <text x="17" y="22" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">H</text>
          </g>

          {/* CNOT Entangler: Control • on q0, Target ⊕ on q1 */}
          <g transform="translate(150, 40)">
            {/* Vertical Entanglement Bus */}
            <line x1="0" y1="0" x2="0" y2="70" stroke="#4338ca" strokeWidth="2" strokeDasharray="2 2" />
            
            {/* Control Point */}
            <circle cx="0" cy="0" r="5" fill="#4338ca" />

            {/* Target ⊕ */}
            <circle cx="0" cy="70" r="12" fill="#eef1fc" stroke="#4338ca" strokeWidth="2" />
            <line x1="-12" y1="70" x2="12" y2="70" stroke="#4338ca" strokeWidth="2" />
            <line x1="0" y1="58" x2="0" y2="82" stroke="#4338ca" strokeWidth="2" />

            {/* Bell State Tag */}
            <text x="0" y="-12" fill="#4338ca" fontSize="9" fontWeight="bold" textAnchor="middle">
              EPR |Φ⁺⟩
            </text>
          </g>

          {/* ============================================================ */}
          {/* STAGE 2: TRANSMISSION CHANNEL / EVE INTERCEPTION              */}
          {/* ============================================================ */}

          {/* Optical Link Channel Separator */}
          <g transform="translate(195, 10)">
            <rect x="0" y="0" width="120" height="135" fill="none" stroke="#dce2f9" strokeDasharray="3 3" rx="10" />
            <text x="60" y="-3" fill="#334155" fontSize="8" fontWeight="bold" textAnchor="middle" letterSpacing="1">
              OPTICAL QUANTUM LINK
            </text>
          </g>

          {/* If Eve is active: Intercept-Resend Tap on q1 channel */}
          {eveIntercepted ? (
            <g transform="translate(205, 93)">
              <rect
                width="100"
                height="34"
                rx="8"
                fill="#fee2e2"
                stroke="#ef4444"
                strokeWidth="1.5"
                className="animate-pulse"
              />
              <text x="50" y="16" fill="#991b1b" fontSize="10" fontWeight="bold" textAnchor="middle">
                👁️ EVE: Ry({eveAngleDeg ?? 45}°)
              </text>
              <text x="50" y="27" fill="#dc2626" fontSize="8" textAnchor="middle">
                Intercept & Resend
              </text>
            </g>
          ) : (
            <g transform="translate(255, 110)">
              <circle cx="0" cy="0" r="4" fill="#5e67ea" />
              <text x="0" y="18" fill="#10b981" fontSize="8" textAnchor="middle" fontWeight="bold">
                Free-Space Link
              </text>
            </g>
          )}

          {/* ============================================================ */}
          {/* STAGE 3: MEASUREMENT BASIS ROTATIONS Ry(-θ)                  */}
          {/* ============================================================ */}

          {/* Alice's Rotation Gate Ry(-θA) on q0 */}
          <g transform="translate(345, 23)">
            <rect
              width="82"
              height="34"
              rx="8"
              fill="#7c3aed"
              className={isRunning ? "filter drop-shadow-[0_2px_8px_rgba(124,58,237,0.35)]" : ""}
            />
            <text x="41" y="16" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
              Ry(-θ_A)
            </text>
            <text x="41" y="28" fill="#e9d5ff" fontSize="9" fontWeight="bold" textAnchor="middle">
              {aliceBasis}
            </text>
          </g>

          {/* Bob's Rotation Gate Ry(-θB) on q1 */}
          <g transform="translate(345, 93)">
            <rect
              width="82"
              height="34"
              rx="8"
              fill="#10b981"
              className={isRunning ? "filter drop-shadow-[0_2px_8px_rgba(16,185,129,0.35)]" : ""}
            />
            <text x="41" y="16" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
              Ry(-θ_B)
            </text>
            <text x="41" y="28" fill="#d1fae5" fontSize="9" fontWeight="bold" textAnchor="middle">
              {bobBasis}
            </text>
          </g>

          {/* ============================================================ */}
          {/* STAGE 4: MEASUREMENT DETECTORS [ M ] & OUTCOMES              */}
          {/* ============================================================ */}

          {/* Alice Detector [M_A] */}
          <g transform="translate(455, 23)">
            <rect
              width="44"
              height="34"
              rx="8"
              fill={isDark ? "#161c2b" : "#f8fafd"}
              stroke="#4338ca"
              strokeWidth="1.5"
            />
            {/* Meter Icon */}
            <path d="M 12 26 A 12 12 0 0 1 32 26" stroke="#4338ca" strokeWidth="1.5" fill="none" />
            <line x1="22" y1="26" x2="28" y2="15" stroke="#4338ca" strokeWidth="1.5" />
            <text x="22" y="12" fill="#4338ca" fontSize="8" fontWeight="bold" textAnchor="middle">M_A</text>

            {/* Classical Drop Line to Register c0 */}
            <line x1="22" y1="34" x2="22" y2="137" stroke="#4338ca" strokeWidth="1.5" strokeDasharray="3 2" />
            <polygon points="19,134 22,139 25,134" fill="#4338ca" />
          </g>

          {/* Alice Measured Bit Outcome on c0 */}
          <g transform="translate(520, 26)">
            <rect width="28" height="28" rx="8" fill={isDark ? "#161c2b" : "#f0f3fa"} stroke="#5e67ea" strokeWidth="1.5" />
            <text x="14" y="19" fill="#5e67ea" fontSize="14" fontWeight="bold" textAnchor="middle">
              {aliceBit}
            </text>
            <text x="14" y="38" fill={isDark ? "#94a3b8" : "#334155"} fontSize="8" fontWeight="bold" textAnchor="middle">bit a</text>
          </g>

          {/* Bob Detector [M_B] */}
          <g transform="translate(455, 93)">
            <rect
              width="44"
              height="34"
              rx="8"
              fill={isDark ? "#161c2b" : "#f8fafd"}
              stroke="#10b981"
              strokeWidth="1.5"
            />
            {/* Meter Icon */}
            <path d="M 12 26 A 12 12 0 0 1 32 26" stroke="#10b981" strokeWidth="1.5" fill="none" />
            <line x1="22" y1="26" x2="28" y2="15" stroke="#10b981" strokeWidth="1.5" />
            <text x="22" y="12" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">M_B</text>

            {/* Classical Drop Line to Register c1 */}
            <line x1="22" y1="34" x2="22" y2="67" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
            <polygon points="19,64 22,69 25,64" fill="#10b981" />
          </g>

          {/* Bob Measured Bit Outcome on c1 */}
          <g transform="translate(520, 96)">
            <rect width="28" height="28" rx="8" fill={isDark ? "#161c2b" : "#f0f3fa"} stroke="#10b981" strokeWidth="1.5" />
            <text x="14" y="19" fill="#10b981" fontSize="14" fontWeight="bold" textAnchor="middle">
              {bobBit}
            </text>
            <text x="14" y="38" fill={isDark ? "#94a3b8" : "#334155"} fontSize="8" fontWeight="bold" textAnchor="middle">bit b</text>
          </g>

          {/* Classical Register Output Box */}
          <g transform="translate(558, 148)">
            <rect width="52" height="24" rx="6" fill={isDark ? "#1e1b4b" : "#eef1fc"} stroke="#5e67ea" strokeWidth="1" />
            <text x="26" y="16" fill="#5e67ea" fontSize="11" fontWeight="bold" textAnchor="middle">
              {aliceBit}{bobBit}₂
            </text>
          </g>
        </svg>
      </div>

      {/* Real-time Verdict Bar */}
      <div className={`mt-3 p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-[11px] leading-tight ${verdict.bg}`}>
        <span className={`font-semibold ${verdict.color}`}>
          {verdict.text}
        </span>
        <span className={`font-mono text-[10px] font-bold flex-shrink-0 ${isDark ? 'text-[#94a3b8]' : 'text-[#334155]'}`}>
          Bell State: |Φ⁺⟩ = (|00⟩ + |11⟩)/√2
        </span>
      </div>
    </div>
  );
}
