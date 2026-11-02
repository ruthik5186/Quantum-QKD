import React, { useEffect, useState } from 'react';
import { getSessionHistory } from '../services/api';

/**
 * SessionHistory Component (Ronas IT Modern Clean Edition):
 * Lists historical QKD sessions from PostgreSQL database with clean light styling.
 */
export default function SessionHistory({ onSelectSession, currentSessionId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSessionHistory();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message || 'Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="bg-white border border-[#dce2f9] rounded-2xl p-5 shadow-xs text-[#0f172a]">
      <div className="flex items-center justify-between gap-3 mb-4 border-b border-[#edf0f8] pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-2">
            <span>📜</span> PostgreSQL Session Audit & Security Logs
          </h3>
          <p className="text-xs text-[#334155] font-semibold mt-0.5">
            Archived sessions, quantum parameter convergence, and eavesdropping audit history
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-3.5 py-1.5 bg-[#f0f3fa] hover:bg-[#e4e8f7] text-[#0f172a] text-xs font-bold rounded-xl border border-[#dce2f9] transition flex items-center gap-1.5"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Log'}
        </button>
      </div>

      {error && (
        <div className="mb-3 text-xs text-[#991b1b] bg-[#fee2e2] border border-[#fecaca] p-3 rounded-xl font-medium">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#dce2f9]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#f8fafd] text-[#0f172a] border-b border-[#dce2f9] text-[11px] uppercase font-extrabold">
            <tr>
              <th className="py-3 px-3">Session ID</th>
              <th className="py-3 px-3">Sites</th>
              <th className="py-3 px-3">Eve Injected</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Final QBER</th>
              <th className="py-3 px-3">Final CHSH (S)</th>
              <th className="py-3 px-3">Key Bits</th>
              <th className="py-3 px-3">Started</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf0f8]">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-8 text-center text-[#334155] font-sans font-bold">
                  {loading ? 'Loading sessions...' : 'No past sessions recorded in PostgreSQL yet.'}
                </td>
              </tr>
            ) : (
              sessions.map((s) => {
                const isSelected = s.id === currentSessionId;
                const isAborted = s.status === 'aborted';
                const isKeyReady = s.status === 'key_ready';

                return (
                  <tr
                    key={s.id}
                    onClick={() => onSelectSession && onSelectSession(s.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#eef1fc] text-[#0f172a]'
                        : 'hover:bg-[#f8fafd] text-[#0f172a]'
                    }`}
                  >
                    <td className="py-3 px-3 text-[11px] text-[#5e67ea] font-extrabold">
                      {s.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="font-extrabold text-[#0f172a]">{s.site_a_name}</span>
                      <span className="text-[#334155] mx-1">➔</span>
                      <span className="font-extrabold text-[#0f172a]">{s.site_b_name}</span>
                    </td>
                    <td className="py-3 px-3">
                      {s.inject_eve ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#fee2e2] border border-[#fecaca] text-[#991b1b] font-extrabold">
                          YES (Eve)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#f0f3fa] text-[#334155] font-bold">
                          NO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isKeyReady
                          ? 'bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d]'
                          : isAborted
                          ? 'bg-[#fee2e2] border border-[#fecaca] text-[#991b1b]'
                          : 'bg-[#f0f3fa] text-[#334155]'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {s.final_qber !== null ? (
                        <span className={Number(s.final_qber) > 0.11 ? 'text-[#ef4444] font-extrabold' : 'text-[#0f172a] font-bold'}>
                          {(Number(s.final_qber) * 100).toFixed(2)}%
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {s.final_chsh_s !== null ? (
                        <span className={Number(s.final_chsh_s) < 2.0 ? 'text-[#ef4444] font-extrabold' : 'text-[#15803d] font-extrabold'}>
                          {Number(s.final_chsh_s).toFixed(4)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-extrabold text-[#0f172a]">
                      {s.key_length_bits ?? 0}
                    </td>
                    <td className="py-3 px-3 text-[10px] text-[#334155] font-bold">
                      {new Date(s.started_at).toLocaleDateString()} {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
