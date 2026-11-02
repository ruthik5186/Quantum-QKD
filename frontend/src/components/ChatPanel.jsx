import React, { useState } from 'react';
import { sendMessage, getDecryptedMessage } from '../services/api';

/**
 * ChatPanel Component (Ronas IT Clean Edition):
 * Authenticated AES-256-GCM Secure Channel.
 * Encrypts with ephemeral QKD key stored strictly in backend memory.
 */
export default function ChatPanel({
  sessionId,
  siteA = 'Station Alpha',
  siteB = 'Station Beta',
  keyReady = false,
  messages = [],
  onMessageSent,
}) {
  const [inputText, setInputText] = useState('');
  const [direction, setDirection] = useState('A_to_B');
  const [sending, setSending] = useState(false);
  const [decryptedMap, setDecryptedMap] = useState({});
  const [decryptingId, setDecryptingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Critical infrastructure sample messages
  const quickTemplates = [
    '⚡ SCADA_TELEMETRY: Station Alpha 500kV transformer load 74.2% nominal',
    '🔒 EMERGENCY_CMD: Open breaker BKR-104 on North feeder line',
    '📡 SENSOR_HEARTBEAT: Phase alignment 0.04 deg, harmonic distortion < 1%',
  ];

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || !sessionId || !keyReady) return;

    setSending(true);
    setErrorMsg('');
    try {
      const res = await sendMessage({
        sessionId,
        direction,
        text,
      });

      // Automatically decrypt for the receiving site's preview
      if (res.message && res.message.id) {
        try {
          const dec = await getDecryptedMessage(res.message.id);
          setDecryptedMap((prev) => ({ ...prev, [res.message.id]: dec.plaintext }));
        } catch (decErr) {
          console.warn('Auto-decrypt pending:', decErr);
        }
      }

      if (onMessageSent) onMessageSent(res.message);
      setInputText('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to encrypt and transmit message');
    } finally {
      setSending(false);
    }
  };

  const handleManualDecrypt = async (messageId) => {
    setDecryptingId(messageId);
    try {
      const res = await getDecryptedMessage(messageId);
      setDecryptedMap((prev) => ({ ...prev, [messageId]: res.plaintext }));
    } catch (err) {
      alert(`Decryption failed: ${err.message}`);
    } finally {
      setDecryptingId(null);
    }
  };

  return (
    <div className="bg-white border border-[#e2e7f4] rounded-2xl p-5 shadow-xs text-[#151722]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-[#edf0f8] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#151722] flex items-center gap-2">
            <span>🛡️</span> AES-256-GCM Authenticated Quantum-Secured Channel
          </h3>
          <p className="text-[11px] text-[#717892] mt-0.5">
            End-to-end encrypted using the derived 256-bit symmetric session key
          </p>
        </div>

        <div>
          <span className={`text-xs px-3 py-1 rounded-full font-mono font-semibold flex items-center gap-2 border ${
            keyReady
              ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]'
              : 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${keyReady ? 'bg-[#10b981] animate-pulse' : 'bg-[#f59e0b]'}`}></span>
            {keyReady ? 'AES-256-GCM Key Armed in Memory' : 'Key Exchange Incomplete'}
          </span>
        </div>
      </div>

      {/* Security Architecture Guarantee Callout */}
      <div className="mb-4 bg-[#f0f3fa] border border-[#e2e7f4] rounded-xl p-3 text-xs text-[#4b5563] flex items-start gap-2.5">
        <span className="text-[#5e67ea] text-sm mt-0.5">🔐</span>
        <div className="text-[11px] leading-relaxed">
          <span className="font-bold text-[#151722]">PostgreSQL Zero-Storage Guarantee:</span> Only ciphertext, 96-bit IV, and 128-bit authentication tag are stored in <code className="text-[#5e67ea] font-mono font-semibold">message_logs</code>. The raw QKD key and plaintext message never touch disk or database tables.
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="h-64 overflow-y-auto space-y-3 pr-1 mb-4 bg-[#f8fafd] border border-[#e2e7f4] rounded-2xl p-3.5 shadow-inner">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#717892] text-xs">
            <span className="text-2xl mb-1">💬</span>
            <span className="font-semibold text-[#151722]">No encrypted transmissions in this session yet.</span>
            {!keyReady && (
              <span className="mt-1 text-[#8a90a7] text-[11px]">
                Complete an E91 key distribution session above to generate the shared AES key.
              </span>
            )}
          </div>
        ) : (
          messages.map((m) => {
            const isFromA = m.direction === 'A_to_B';
            const senderName = isFromA ? siteA : siteB;
            const receiverName = isFromA ? siteB : siteA;
            const decrypted = decryptedMap[m.id];

            return (
              <div
                key={m.id}
                className="bg-white border border-[#e2e7f4] rounded-2xl p-3 space-y-2 text-xs font-mono transition-all hover:border-[#5e67ea]/40 shadow-xs"
              >
                <div className="flex items-center justify-between text-[#717892] border-b border-[#edf0f8] pb-1.5">
                  <span className="font-bold text-[#5e67ea] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5e67ea]"></span>
                    {senderName} ➔ {receiverName}
                  </span>
                  <span className="text-[10px] text-[#8a90a7]">
                    {m.sentAt || m.sent_at ? new Date(m.sentAt || m.sent_at).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>

                {/* Ciphertext Representation */}
                <div className="bg-[#f0f3fa] p-2.5 rounded-xl border border-[#e2e7f4] text-[11px] break-all">
                  <div className="text-[#717892] text-[10px] font-semibold mb-1 flex justify-between">
                    <span>Stored In PostgreSQL (Ciphertext Only):</span>
                    <span className="text-[#5e67ea] font-mono font-bold">AES-256-GCM</span>
                  </div>
                  <div className="text-[#151722] font-bold tracking-tight bg-white p-1.5 rounded-lg border border-[#e2e7f4] font-mono">
                    {m.ciphertext}
                  </div>
                  <div className="mt-1.5 text-[#717892] text-[10px] flex flex-wrap gap-3 font-mono">
                    <span>IV: <span className="text-[#151722]">{m.iv}</span></span>
                    <span>Tag: <span className="text-[#151722]">{m.authTag || m.auth_tag}</span></span>
                  </div>
                </div>

                {/* Plaintext Outcome */}
                <div className="flex items-center justify-between bg-[#dcfce7] border border-[#bbf7d0] p-2.5 rounded-xl">
                  <div>
                    <span className="text-[#15803d] font-bold block text-[10px] uppercase tracking-wider">
                      Decrypted Plaintext at {receiverName}:
                    </span>
                    <span className="text-[#151722] text-xs font-sans font-medium mt-0.5 block">
                      {decrypted ?? (
                        <span className="text-[#717892] italic font-mono text-[11px]">Awaiting decryption...</span>
                      )}
                    </span>
                  </div>

                  {!decrypted && (
                    <button
                      onClick={() => handleManualDecrypt(m.id)}
                      disabled={decryptingId === m.id}
                      className="px-2.5 py-1 bg-[#10b981] hover:bg-[#059669] text-white text-[11px] rounded-lg font-semibold transition shadow-xs"
                    >
                      {decryptingId === m.id ? 'Decrypting...' : 'Decrypt with Key'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Infrastructure Message Chips */}
      {keyReady && (
        <div className="mb-3">
          <div className="text-[10px] uppercase font-mono text-[#717892] mb-1.5 font-bold">
            Quick Telemetry Templates:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickTemplates.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(tpl)}
                disabled={sending}
                className="text-[10px] font-mono bg-[#f0f3fa] hover:bg-[#e4e8f7] text-[#5e67ea] border border-[#e2e7f4] px-2.5 py-1 rounded-full transition text-left truncate max-w-xs font-medium"
              >
                {tpl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="space-y-3">
        {errorMsg && (
          <div className="text-xs text-[#991b1b] bg-[#fee2e2] border border-[#fecaca] p-2.5 rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Direction toggle */}
          <div className="flex items-center gap-1 bg-[#f0f3fa] border border-[#e2e7f4] rounded-2xl p-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setDirection('A_to_B')}
              className={`px-3 py-1.5 rounded-xl transition font-semibold ${
                direction === 'A_to_B' ? 'bg-[#5e67ea] text-white shadow-xs' : 'text-[#717892] hover:text-[#151722]'
              }`}
            >
              Site A ➔ Site B
            </button>
            <button
              type="button"
              onClick={() => setDirection('B_to_A')}
              className={`px-3 py-1.5 rounded-xl transition font-semibold ${
                direction === 'B_to_A' ? 'bg-[#5e67ea] text-white shadow-xs' : 'text-[#717892] hover:text-[#151722]'
              }`}
            >
              Site B ➔ Site A
            </button>
          </div>

          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!keyReady || sending}
              placeholder={
                keyReady
                  ? 'Type command or telemetry to encrypt with derived QKD key...'
                  : 'Channel locked. Run quantum key distribution to arm encryption.'
              }
              className="flex-1 bg-[#f0f3fa] border border-[#e2e7f4] rounded-2xl px-3.5 py-2 text-xs text-[#151722] placeholder-[#8a90a7] focus:outline-none focus:border-[#5e67ea] disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!keyReady || !inputText.trim() || sending}
              className="px-5 py-2 bg-[#5e67ea] hover:bg-[#4f59e0] disabled:bg-[#f0f3fa] disabled:text-[#8a90a7] text-white text-xs font-bold rounded-2xl transition-all shadow-md shadow-indigo-200 flex items-center gap-2 flex-shrink-0"
            >
              {sending ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Encrypting...
                </>
              ) : (
                <>
                  <span>🔒</span> Encrypt & Send
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
