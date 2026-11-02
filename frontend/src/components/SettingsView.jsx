import React, { useState } from 'react';

/**
 * SettingsView Component:
 * Frontend-only settings panel that replaces the chat list of names when
 * the settings icon (bottom left) is clicked.
 * Includes user profile summary, security status, UI preferences, and the logout option.
 */
export default function SettingsView({
  currentUser,
  onClose,
  onLogout,
  keyLengthBits = 0,
  targetBits = 128,
  sessionStatus = 'idle',
  isDark = false,
  onToggleTheme,
}) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('qkd_pref_sound') !== 'false';
  });
  const [compactView, setCompactView] = useState(() => {
    return localStorage.getItem('qkd_pref_compact') === 'true';
  });
  const [cacheClearedNotice, setCacheClearedNotice] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('qkd_pref_sound', String(next));
  };

  const toggleCompact = () => {
    const next = !compactView;
    setCompactView(next);
    localStorage.setItem('qkd_pref_compact', String(next));
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('qkd_decrypted_cache');
      setCacheClearedNotice(true);
      setTimeout(() => setCacheClearedNotice(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`w-full h-full flex flex-col select-none overflow-hidden transition-colors ${
      isDark ? 'bg-[#0f131e]' : 'bg-[#eef2f8]'
    }`}>
      {/* Settings Header */}
      <div className={`h-16 px-4 border-b flex items-center justify-between flex-shrink-0 transition-colors ${
        isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-[#e6edf7] border-[#d8e2f0]'
      }`}>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 -ml-1 rounded-xl transition flex items-center gap-1 text-xs font-bold ${
              isDark
                ? 'text-[#94a3b8] hover:text-white hover:bg-[#1a2133]'
                : 'text-[#334155] hover:text-[#0f172a] hover:bg-white/80'
            }`}
            title="Back to Contact Directory"
          >
            <svg className="w-5 h-5 text-[#5e67ea]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="hidden sm:inline">Chats</span>
          </button>
          <h3 className={`text-sm font-extrabold flex items-center gap-2 ${
            isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
          }`}>
            <span>⚙️</span> Settings & Profile
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
            isDark
              ? 'text-[#a5b4fc] hover:text-white hover:bg-[#1a2133]'
              : 'text-[#4338ca] hover:text-[#312e81] hover:bg-white/70'
          }`}
        >
          Done
        </button>
      </div>

      {/* Settings Content Scrollable Area */}
      <div className={`flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs ${
        isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
      }`}>
        {/* Profile Card */}
        <div className={`rounded-2xl p-4 border shadow-xs space-y-3 transition-colors ${
          isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-white border-[#d8e2f0]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.email}`}
                alt={currentUser?.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#5e67ea]/30 shadow-xs"
              />
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10b981] border-2 ${
                isDark ? 'border-[#141926]' : 'border-white'
              }`}></span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className={`text-base font-extrabold truncate ${
                isDark ? 'text-white' : 'text-[#0f172a]'
              }`}>
                {currentUser?.name || 'Secure Operator'}
              </h4>
              <p className={`text-xs font-mono font-bold truncate ${
                isDark ? 'text-[#a5b4fc]' : 'text-[#4338ca]'
              }`}>
                {currentUser?.email}
              </p>
              <div className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                isDark ? 'bg-[#1e2738] text-[#cbd5e1]' : 'bg-[#eef2f8] text-[#334155]'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                {currentUser?.site_name || 'Station Alpha Node'}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Quantum Channel Telemetry */}
        <div className={`rounded-2xl p-4 border shadow-xs space-y-2.5 transition-colors ${
          isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-white border-[#d8e2f0]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-extrabold flex items-center gap-1.5 text-xs ${
              isDark ? 'text-white' : 'text-[#0f172a]'
            }`}>
              <span>🛡️</span> Security & Encryption
            </span>
            <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
              isDark
                ? 'bg-[#064e3b]/50 border-[#059669]/60 text-[#34d399]'
                : 'bg-[#dcfce7] border-[#bbf7d0] text-[#059669]'
            }`}>
              AES-256-GCM
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-[#0f131e] border-[#252f44]' : 'bg-[#f8fafd] border-[#e2e8f5]'
            }`}>
              <span className={`block font-sans text-[10px] font-bold ${
                isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
              }`}>Key Exchange</span>
              <span className={`font-extrabold text-xs ${
                isDark ? 'text-[#a5b4fc]' : 'text-[#4338ca]'
              }`}>
                {keyLengthBits} / {targetBits}b
              </span>
            </div>
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-[#0f131e] border-[#252f44]' : 'bg-[#f8fafd] border-[#e2e8f5]'
            }`}>
              <span className={`block font-sans text-[10px] font-bold ${
                isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
              }`}>Status</span>
              <span className="font-extrabold text-[#10b981] text-xs capitalize">
                {sessionStatus === 'key_ready' ? 'Armed' : sessionStatus}
              </span>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleClearCache}
              className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs transition border flex items-center justify-center gap-1.5 ${
                isDark
                  ? 'bg-[#1a2133] hover:bg-[#252f44] text-[#a5b4fc] border-[#252f44]'
                  : 'bg-[#f0f4fa] hover:bg-[#e4ecf7] text-[#4338ca] border-[#d8e2f0]'
              }`}
            >
              <span>🧹</span> Clear Local Decrypted Cache
            </button>
            {cacheClearedNotice && (
              <p className="text-[10px] text-[#10b981] font-bold text-center mt-1">
                ✓ Local plaintext cache cleared from memory.
              </p>
            )}
          </div>
        </div>

        {/* Interface Preferences */}
        <div className={`rounded-2xl p-4 border shadow-xs space-y-3 transition-colors ${
          isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-white border-[#d8e2f0]'
        }`}>
          <span className={`font-extrabold block text-xs ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>
            Interface Preferences
          </span>

          {/* Dark Mode Toggle */}
          {onToggleTheme && (
            <div className="flex items-center justify-between py-1">
              <div>
                <div className={`font-bold ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>Theme Mode</div>
                <div className={`text-[11px] font-semibold ${isDark ? 'text-[#94a3b8]' : 'text-[#334155]'}`}>
                  {isDark ? 'Current: Dark Mode' : 'Current: Light Mode'}
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  isDark
                    ? 'bg-[#1a2133] border-[#252f44] text-[#fbbf24]'
                    : 'bg-[#f0f3fa] border-[#dce2f9] text-[#0f172a]'
                }`}
              >
                <span>{isDark ? '☀️' : '🌙'}</span>
                <span>{isDark ? 'Light' : 'Dark'}</span>
              </button>
            </div>
          )}

          {/* Sound Toggle */}
          <div className={`flex items-center justify-between py-1 border-t ${
            isDark ? 'border-[#1e2638]' : 'border-[#edf0f8]'
          } pt-2.5`}>
            <div>
              <div className={`font-bold ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>Key Ready Audio Chime</div>
              <div className={`text-[11px] font-semibold ${isDark ? 'text-[#94a3b8]' : 'text-[#334155]'}`}>
                Play sound when 100% key bits sifted
              </div>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 ${
                soundEnabled ? 'bg-[#5e67ea]' : isDark ? 'bg-[#252f44]' : 'bg-[#cbd5e1]'
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform ${
                  soundEnabled ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Compact View Toggle */}
          <div className={`flex items-center justify-between py-1 border-t ${
            isDark ? 'border-[#1e2638]' : 'border-[#edf0f8]'
          } pt-2.5`}>
            <div>
              <div className={`font-bold ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>Compact Message Spacing</div>
              <div className={`text-[11px] font-semibold ${isDark ? 'text-[#94a3b8]' : 'text-[#334155]'}`}>
                Optimized padding for large transcripts
              </div>
            </div>
            <button
              type="button"
              onClick={toggleCompact}
              className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 ${
                compactView ? 'bg-[#5e67ea]' : isDark ? 'bg-[#252f44]' : 'bg-[#cbd5e1]'
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform ${
                  compactView ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* About Info */}
        <div className={`rounded-2xl p-4 border shadow-xs space-y-1.5 text-[11px] transition-colors ${
          isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-white border-[#d8e2f0]'
        }`}>
          <div className={`font-extrabold ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>
            Dynamic E91 QKD Secure Platform
          </div>
          <div className={isDark ? 'text-[#94a3b8]' : 'text-[#334155]'}>
            Ekert 91 Entanglement-based Cryptographic Network
          </div>
          <div className={`font-mono text-[10px] font-bold ${isDark ? 'text-[#a5b4fc]' : 'text-[#4338ca]'}`}>
            Bell State: |Φ⁺⟩ = (|00⟩ + |11⟩)/√2
          </div>
        </div>

        {/* Logout Section */}
        <div className={`rounded-2xl p-4 border shadow-xs space-y-2.5 transition-colors ${
          isDark ? 'bg-[#181116] border-[#591d24]' : 'bg-white border-[#fecaca]'
        }`}>
          <div className="flex items-center gap-2 text-[#ef4444] font-extrabold text-xs">
            <span>🚪</span> Station Authentication
          </div>
          <p className={`text-[11px] font-semibold leading-relaxed ${
            isDark ? 'text-[#fca5a5]' : 'text-[#7f1d1d]'
          }`}>
            Logging out will invalidate the active operator session on this station.
          </p>

          {showLogoutConfirm ? (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-[#ef4444]">Confirm station sign out?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white font-extrabold text-xs transition shadow-xs"
                >
                  Yes, Log Out
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className={`px-3 py-2 rounded-xl font-bold text-xs transition border ${
                    isDark
                      ? 'bg-[#1e2738] hover:bg-[#28354d] text-[#cbd5e1] border-[#252f44]'
                      : 'bg-[#f0f4fa] hover:bg-[#e4ecf7] text-[#334155] border-[#d8e2f0]'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs transition border flex items-center justify-center gap-2 shadow-xs ${
                isDark
                  ? 'bg-[#3b1219] hover:bg-[#521822] text-[#fca5a5] border-[#7f1d1d]'
                  : 'bg-[#fee2e2] hover:bg-[#fecaca] text-[#dc2626] border-[#fca5a5]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>Log Out of Operator Node</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
