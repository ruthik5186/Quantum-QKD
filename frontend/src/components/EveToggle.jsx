import React from 'react';

/**
 * EveToggle Component (Ronas IT Modern Clean Edition):
 * Controls the simulated eavesdropper intercept-resend attack on Bob's quantum channel.
 */
export default function EveToggle({ injectEve, onToggle, disabled = false, isDark = false }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      injectEve
        ? isDark
          ? 'bg-[#3b1219] border-[#7f1d1d] shadow-sm'
          : 'bg-[#fef2f2] border-[#fecaca] shadow-sm'
        : isDark
        ? 'bg-[#0f131e] border-[#252f44] hover:border-[#384561]'
        : 'bg-[#f8fafd] border-[#dce2f9] hover:border-[#c7d2fe]'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
            injectEve
              ? isDark ? 'bg-[#591d24] text-[#ef4444]' : 'bg-[#fee2e2] text-[#ef4444]'
              : isDark ? 'bg-[#1e1b4b] text-[#a5b4fc]' : 'bg-[#eef1fc] text-[#5e67ea]'
          }`}>
            {injectEve ? '⚠️' : '🛡️'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`font-extrabold text-xs ${
                isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
              }`}>
                Simulated Eavesdropper (Eve)
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                injectEve
                  ? isDark ? 'bg-[#591d24] text-[#ef4444]' : 'bg-[#fee2e2] text-[#ef4444]'
                  : isDark ? 'bg-[#1e1b4b] text-[#a5b4fc]' : 'bg-[#eef1fc] text-[#334155]'
              }`}>
                {injectEve ? 'ACTIVE / INTERCEPT' : 'INACTIVE'}
              </span>
            </div>

            <p className={`text-[11px] font-semibold mt-1 leading-relaxed ${
              isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
            }`}>
              {injectEve
                ? 'Eve will intercept Bob’s qubit, collapse entanglement, and introduce high QBER (> 11%) and Bell inequality breakdown (S < 2.0).'
                : 'Photons traverse the quantum channel undisturbed. Bell inequality is maximally violated (S ≈ 2.82) with minimal error.'}
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={injectEve}
            disabled={disabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-xs ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            isDark ? 'bg-[#252f44]' : 'bg-[#cbd5e1]'
          } ${
            injectEve ? 'peer-checked:bg-[#ef4444]' : 'peer-checked:bg-[#5e67ea]'
          }`}></div>
        </label>
      </div>
    </div>
  );
}
