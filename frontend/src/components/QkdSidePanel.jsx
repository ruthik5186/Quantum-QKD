import React from 'react';
import RealChart from './RealChart';
import EveToggle from './EveToggle';
import QuantumCircuitViewer from './QuantumCircuitViewer';

/**
 * QkdSidePanel Component (Curvy Modern Edition):
 * Right-side panel providing quantum channel controls,
 * Eve attack simulator, and live Chart.js visualization.
 */
export default function QkdSidePanel({
  isOpen,
  onClose,
  sessionId,
  sessionStatus,
  rounds = [],
  currentRound = null,
  keyLengthBits = 0,
  targetBits = 128,
  setTargetBits,
  injectEve,
  setInjectEve,
  onStartSession,
  isStarting,
  activeAlert,
  siteA,
  siteB,
  isDark = false,
}) {
  if (!isOpen) return null;

  const progressPct = Math.min(100, Math.round((keyLengthBits / targetBits) * 100));

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden select-none transition-colors ${
      isDark ? 'bg-[#0f131e]' : 'bg-[#edf4fb]'
    }`}>
      {/* Side Panel Header */}
      <div className={`h-16 px-5 border-b flex items-center justify-between flex-shrink-0 transition-colors ${
        isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-[#e6f0fa] border-[#d2e0f0]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs flex-shrink-0 ${
            isDark ? 'bg-[#1e1b4b] border-[#312e81] text-[#a5b4fc]' : 'bg-white border-[#d2e0f0] text-[#5e67ea]'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <h3 className={`text-sm font-extrabold leading-tight ${
              isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
            }`}>
              Quantum Channel & E91 Session
            </h3>
            <span className={`text-xs font-semibold ${
              isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
            }`}>
              Bell Inequality & QBER Telemetry
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className={`p-2 rounded-full transition text-sm font-bold ${
            isDark
              ? 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1a2133]'
              : 'text-[#334155] hover:text-[#0f172a] hover:bg-white/70'
          }`}
          title="Close Side Panel"
        >
          ✕
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Threat Alert Notice if Eve detected */}
        {activeAlert && (
          <div className={`border rounded-2xl p-4 text-xs space-y-1.5 alert-pulse shadow-md ${
            isDark ? 'bg-[#2a0e0e] border-[#7f1d1d] text-[#fca5a5]' : 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]'
          }`}>
            <div className={`flex items-center justify-between font-extrabold ${
              isDark ? 'text-[#fca5a5]' : 'text-[#991b1b]'
            }`}>
              <span className="flex items-center gap-1.5">
                <span className="text-sm">🚨</span> EAVESDROPPER DETECTED
              </span>
              <span className="text-[10px] bg-[#ef4444] px-2.5 py-0.5 rounded-full text-white font-mono font-bold">
                Round #{activeAlert.roundNum}
              </span>
            </div>
            <p className={`text-xs font-semibold leading-relaxed ${
              isDark ? 'text-[#f87171]' : 'text-[#7f1d1d]'
            }`}>
              {activeAlert.reason}. Bell inequality broken or QBER &gt; 11%. Perturbed photon bits discarded immediately!
            </p>
          </div>
        )}

        {/* Channel Status Card */}
        <div className={`border rounded-2xl p-4 space-y-3.5 shadow-sm transition-colors ${
          isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-white border-[#dce2f9]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-extrabold ${isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'}`}>
              Channel Status
            </span>
            <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full ${
              sessionStatus === 'key_ready'
                ? isDark
                  ? 'bg-[#064e3b]/50 text-[#34d399] border border-[#059669]/60'
                  : 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]'
                : sessionStatus === 'running'
                ? isDark
                  ? 'bg-[#1e1b4b] text-[#c7d2fe] border border-[#312e81] animate-pulse'
                  : 'bg-[#e0e7ff] text-[#4338ca] border border-[#c7d2fe] animate-pulse'
                : sessionStatus === 'aborted'
                ? isDark
                  ? 'bg-[#450a0a]/50 text-[#fca5a5] border border-[#991b1b]/60'
                  : 'bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]'
                : isDark
                ? 'bg-[#451a03]/50 text-[#fcd34d] border border-[#b45309]/60'
                : 'bg-[#fef3c7] text-[#b45309] border border-[#fde68a]'
            }`}>
              {sessionStatus === 'key_ready'
                ? '● KEY READY (ARMED)'
                : sessionStatus === 'running'
                ? '● EXCHANGING PHOTONS'
                : sessionStatus === 'aborted'
                ? '● ABORTED (EVE)'
                : '○ NOT INITIALIZED'}
            </span>
          </div>

          {/* Progress bar */}
          <div>
            <div className={`flex justify-between text-xs font-mono font-bold mb-1.5 ${
              isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
            }`}>
              <span>Sifted Key Bits</span>
              <span className={`font-extrabold ${isDark ? 'text-[#a5b4fc]' : 'text-[#4338ca]'}`}>
                {keyLengthBits} / {targetBits} bits
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${
              isDark ? 'bg-[#0f131e] border-[#252f44]' : 'bg-[#f0f3fa] border-[#dce2f9]'
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  sessionStatus === 'key_ready' ? 'bg-[#10b981]' : 'bg-[#5e67ea]'
                }`}
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>

          {/* Live telemetry row */}
          <div className="grid grid-cols-2 gap-2.5 pt-1 font-mono text-xs">
            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-[#0f131e] border-[#252f44]' : 'bg-[#f8fafd] border-[#dce2f9]'
            }`}>
              <span className={`text-[11px] block font-sans font-extrabold ${
                isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
              }`}>Bell CHSH (S)</span>
              <span className={`font-bold text-base ${
                (currentRound?.chsh_s ?? (injectEve ? 1.4142 : 2.8284)) < 2.0 ? 'text-[#dc2626]' : isDark ? 'text-[#a5b4fc]' : 'text-[#4338ca]'
              }`}>
                {(currentRound?.chsh_s ?? (injectEve ? 1.4142 : 2.8284)).toFixed(4)}
              </span>
              <span className={`text-[10px] block font-sans font-semibold ${
                isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
              }`}>
                {(currentRound?.chsh_s ?? (injectEve ? 1.4142 : 2.8284)) < 2.0 ? 'Broken (<= 2.0)' : 'Quantum: > 2.0'}
              </span>
            </div>
            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-[#0f131e] border-[#252f44]' : 'bg-[#f8fafd] border-[#dce2f9]'
            }`}>
              <span className={`text-[11px] block font-sans font-extrabold ${
                isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
              }`}>QBER Error Rate</span>
              <span className="font-bold text-base text-[#dc2626]">
                {((currentRound?.qber ?? (injectEve ? 0.2500 : 0.0080)) * 100).toFixed(2)}%
              </span>
              <span className={`text-[10px] block font-sans font-semibold ${
                isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
              }`}>Abort limit: 11%</span>
            </div>
          </div>
        </div>

        {/* Real-Time Quantum Circuit Running Diagram */}
        <QuantumCircuitViewer
          currentRound={currentRound}
          sessionStatus={sessionStatus}
          injectEve={injectEve}
          compact={true}
          isDark={isDark}
        />

        {/* Real Chart.js Dual Graph Card */}
        <div className={`border rounded-2xl p-4 space-y-2.5 shadow-sm transition-colors ${
          isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-white border-[#dce2f9]'
        }`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-extrabold flex items-center gap-1.5 ${
              isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
            }`}>
              <span>📈</span> Live Real-Time Graphs
            </span>
          </div>

          <RealChart rounds={rounds} currentRound={currentRound} isDark={isDark} />
        </div>

        {/* Current Round Optics Inspection Card */}
        {currentRound && (
          <div className={`border rounded-2xl p-3.5 text-xs font-mono space-y-2 shadow-sm transition-colors ${
            isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-white border-[#dce2f9]'
          }`}>
            <div className={`flex justify-between border-b pb-2 text-[11px] font-bold ${
              isDark ? 'border-[#1e2638] text-[#f8fafc]' : 'border-[#edf0f8] text-[#0f172a]'
            }`}>
              <span>Round #{currentRound.round_num} Optical State</span>
              <span className={currentRound.discarded ? 'text-[#dc2626] font-extrabold' : 'text-[#10b981] font-extrabold'}>
                {currentRound.discarded ? 'DISCARDED' : 'KEY SIFTED'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className={`font-semibold ${isDark ? 'text-[#94a3b8]' : 'text-[#334155]'}`}>Alice Basis:</span>{' '}
                <span className={`font-extrabold ${isDark ? 'text-[#a5b4fc]' : 'text-[#4338ca]'}`}>{currentRound.alice_basis}</span>
              </div>
              <div>
                <span className={`font-semibold ${isDark ? 'text-[#94a3b8]' : 'text-[#334155]'}`}>Bob Basis:</span>{' '}
                <span className="text-[#10b981] font-extrabold">{currentRound.bob_basis}</span>
              </div>
            </div>
          </div>
        )}

        {/* Eavesdropper Injection & Session Trigger Card */}
        <div className={`border rounded-2xl p-4 space-y-3.5 shadow-sm transition-colors ${
          isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-white border-[#dce2f9]'
        }`}>
          <div className={`text-xs font-extrabold flex items-center justify-between ${
            isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
          }`}>
            <span>Eavesdropping Simulation</span>
            <span className={`text-[10px] font-mono font-bold ${isDark ? 'text-[#94a3b8]' : 'text-[#334155]'}`}>
              Eve Intercept-Resend
            </span>
          </div>

          <EveToggle
            injectEve={injectEve}
            onToggle={setInjectEve}
            disabled={sessionStatus === 'running'}
            isDark={isDark}
          />

          {/* Target bits selector */}
          <div>
            <label className={`block text-xs mb-1 font-mono font-bold ${
              isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
            }`}>
              Target Key Size:
            </label>
            <select
              value={targetBits}
              onChange={(e) => setTargetBits(Number(e.target.value))}
              disabled={sessionStatus === 'running'}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none font-mono transition-colors ${
                isDark
                  ? 'bg-[#0f131e] border-[#252f44] text-[#f8fafc] focus:border-[#6366f1]'
                  : 'bg-[#f0f3fa] border-[#dce2f9] text-[#0f172a] focus:border-[#5e67ea]'
              }`}
            >
              <option value={64}>64 bits (8 bytes — Fast test)</option>
              <option value={128}>128 bits (16 bytes — Standard verification)</option>
              <option value={256}>256 bits (32 bytes — Full AES-256 Key)</option>
            </select>
          </div>

          {/* Trigger Button */}
          <button
            onClick={onStartSession}
            disabled={sessionStatus === 'running' || isStarting}
            className={`w-full py-3 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 ${
              sessionStatus === 'running'
                ? isDark
                  ? 'bg-[#1e2638] text-[#64748b] cursor-not-allowed border border-[#252f44]'
                  : 'bg-[#f0f3fa] text-[#64748b] cursor-not-allowed border border-[#dce2f9]'
                : injectEve
                ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-rose-900/40'
                : 'bg-[#5e67ea] hover:bg-[#4f59e0] text-white shadow-indigo-900/40'
            }`}
          >
            {sessionStatus === 'running' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                Exchanging Photons...
              </>
            ) : (
              <>
                <span>⚡</span>
                {injectEve ? 'Run Exchange (With Eve Attack)' : 'Run Clean E91 Key Exchange'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
