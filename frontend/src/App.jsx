import React, { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from './services/socket';
import {
  startSession,
  getSessionRounds,
  getSessionStatus,
  getConversationMessages,
  clearConversation,
  getOnlineUsers,
  getActiveChannel,
} from './services/api';

import LoginScreen from './components/LoginScreen';
import WhatsAppChat from './components/WhatsAppChat';
import QkdSidePanel from './components/QkdSidePanel';
import SessionHistory from './components/SessionHistory';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('qkd_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [selectedContact, setSelectedContact] = useState(null);

  // QKD Session Configuration & Telemetry State
  const [siteA, setSiteA] = useState('Station Alpha');
  const [siteB, setSiteB] = useState('Station Beta');
  const [injectEve, setInjectEve] = useState(false);
  const [targetBits, setTargetBits] = useState(128);

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('idle'); // 'idle' | 'running' | 'key_ready' | 'aborted'
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(null);
  const [keyLengthBits, setKeyLengthBits] = useState(0);
  const [messages, setMessages] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // Real-time online presence state (Set of lowercase emails)
  const [onlineUserEmails, setOnlineUserEmails] = useState(new Set());

  // UI state: defaults to closed on mobile (< 1024px) for optimal chat experience
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Screen width tracking for smooth mobile/desktop transitions
  const [windowWidth, setWindowWidth] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1200;
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Re-adjustable side panel width (desktop resizer)
  const [sidePanelWidth, setSidePanelWidth] = useState(440);
  const [isDraggingSidePanel, setIsDraggingSidePanel] = useState(false);

  // Theme state: 'light' | 'dark'
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('qkd_theme');
      if (saved) return saved === 'dark';
      return false; // Default to clean light mode
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('qkd_theme', next ? 'dark' : 'light');
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-[#0a0d14] text-[#f8fafc] antialiased select-none';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-[#e6ebf5] text-[#0f172a] antialiased select-none';
    }
  }, [isDark]);

  // Register user presence and track online operators
  useEffect(() => {
    if (!currentUser?.email) return;

    // Register active presence
    socket.emit('register_presence', { email: currentUser.email });

    // Initial snapshot of online users
    getOnlineUsers()
      .then((res) => {
        if (res.onlineEmails) {
          setOnlineUserEmails(new Set(res.onlineEmails.map((e) => e.toLowerCase())));
        }
      })
      .catch((err) => console.error('Failed to get online users:', err));

    const handlePresenceUpdate = (payload) => {
      if (payload?.onlineEmails) {
        setOnlineUserEmails(new Set(payload.onlineEmails.map((e) => e.toLowerCase())));
      }
    };

    socket.on('presence_update', handlePresenceUpdate);
    return () => {
      socket.off('presence_update', handlePresenceUpdate);
    };
  }, [currentUser?.email]);

  // Reset quantum channel state so each login and contact link requires establishing a channel
  const resetQuantumChannel = useCallback(() => {
    setActiveSessionId(null);
    setSessionStatus('idle');
    setRounds([]);
    setCurrentRound(null);
    setKeyLengthBits(0);
    setActiveAlert(null);
    setIsStarting(false);
  }, []);

  // When currentUser or selectedContact changes, update Site names and fetch conversation
  useEffect(() => {
    if (currentUser) {
      setSiteA(currentUser.site_name || currentUser.name || 'Station Alpha');
    }
    if (selectedContact) {
      setSiteB(selectedContact.site_name || selectedContact.name || 'Station Beta');
      loadConversation(selectedContact.email);
    }
  }, [currentUser, selectedContact]);

  const handleSelectContact = useCallback(async (contact) => {
    if (selectedContact?.email?.toLowerCase() !== contact?.email?.toLowerCase()) {
      setSelectedContact(contact);
      loadConversation(contact?.email);

      // Check if an active shared quantum channel was already established between these two users
      if (currentUser?.email && contact?.email) {
        try {
          const channelInfo = await getActiveChannel(currentUser.email, contact.email);
          if (channelInfo && channelInfo.active && channelInfo.sessionId) {
            console.log(`[QKD] Found existing active quantum channel with ${contact.name}:`, channelInfo.sessionId);
            setActiveSessionId(channelInfo.sessionId);
            setSessionStatus(channelInfo.status || 'key_ready');
            setKeyLengthBits(channelInfo.keyLengthBits || 128);
            socket.emit('join_session', channelInfo.sessionId);
            return;
          }
        } catch (e) {
          console.warn('[QKD] Error checking active channel:', e);
        }
      }

      // No active channel yet between this pair
      resetQuantumChannel();
    }
  }, [selectedContact, currentUser, resetQuantumChannel]);

  const loadConversation = async (contactEmail) => {
    if (!currentUser?.email || !contactEmail) return;
    try {
      const res = await getConversationMessages(currentUser.email, contactEmail);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  // Helper to add message with strict string ID deduplication
  const appendMessageUnique = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.some((m) => String(m.id) === String(msg.id))) {
        return prev;
      }
      return [...prev, msg];
    });
  }, []);

  // Socket.IO event listeners
  useEffect(() => {
    const handleRoundStats = (payload) => {
      const { sessionId, data } = payload;
      if (activeSessionId && sessionId !== activeSessionId) return;

      setCurrentRound(data);
      setRounds((prev) => [...prev, data]);
      setKeyLengthBits(data.sifted_bits_count ?? 0);
    };

    const handleEavesdropAlert = (payload) => {
      const { sessionId, alert } = payload;
      if (activeSessionId && sessionId !== activeSessionId) return;

      setActiveAlert({
        roundNum: alert.round_num,
        qber: alert.qber,
        chshS: alert.chsh_s,
        reason: alert.reason,
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    const handleKeyReady = (payload) => {
      const { sessionId, summary } = payload;
      if (activeSessionId && sessionId !== activeSessionId) return;

      setSessionStatus(summary.status);
      setKeyLengthBits(summary.key_length_bits);
    };

    // Shared channel events: syncs both Alice and Bob simultaneously
    const handleChannelStarted = (payload) => {
      const { sessionId, user1, user2 } = payload;
      if (!currentUser?.email || !selectedContact?.email) return;

      const myEmail = currentUser.email.toLowerCase();
      const peerEmail = selectedContact.email.toLowerCase();
      const u1 = (user1 || '').toLowerCase();
      const u2 = (user2 || '').toLowerCase();

      if ((u1 === myEmail && u2 === peerEmail) || (u2 === myEmail && u1 === peerEmail)) {
        console.log(`[Socket.IO] Quantum channel started between ${u1} and ${u2}:`, sessionId);
        setActiveSessionId(sessionId);
        setSessionStatus('running');
        setRounds([]);
        setCurrentRound(null);
        setActiveAlert(null);
        setKeyLengthBits(0);
        socket.emit('join_session', sessionId);
      }
    };

    const handleChannelEstablished = (payload) => {
      const { sessionId, user1, user2, status, keyLengthBits: bits } = payload;
      if (!currentUser?.email || !selectedContact?.email) return;

      const myEmail = currentUser.email.toLowerCase();
      const peerEmail = selectedContact.email.toLowerCase();
      const u1 = (user1 || '').toLowerCase();
      const u2 = (user2 || '').toLowerCase();

      if ((u1 === myEmail && u2 === peerEmail) || (u2 === myEmail && u1 === peerEmail)) {
        console.log(`[Socket.IO] Quantum channel established between ${u1} and ${u2}:`, sessionId);
        setActiveSessionId(sessionId);
        setSessionStatus(status || 'key_ready');
        setKeyLengthBits(bits || 128);
        socket.emit('join_session', sessionId);
      }
    };

    const handleEncryptedMessage = (payload) => {
      const msg = payload.message || payload;
      if (!msg || !currentUser) return;

      // Only display message if it belongs to current active conversation
      const msgSender = (msg.senderEmail || msg.sender_email || '').toLowerCase();
      const msgReceiver = (msg.receiverEmail || msg.receiver_email || '').toLowerCase();
      const curEmail = (currentUser.email || '').toLowerCase();
      const contactEmail = (selectedContact?.email || '').toLowerCase();

      const belongsToCurrentChat =
        (msgSender === curEmail && msgReceiver === contactEmail) ||
        (msgSender === contactEmail && msgReceiver === curEmail);

      if (belongsToCurrentChat) {
        appendMessageUnique(msg);
      }
    };

    const handleChatCleared = (payload) => {
      const { user1, user2 } = payload || {};
      if (!currentUser?.email || !selectedContact?.email) return;

      const myEmail = currentUser.email.toLowerCase();
      const peerEmail = selectedContact.email.toLowerCase();
      const u1 = (user1 || '').toLowerCase();
      const u2 = (user2 || '').toLowerCase();

      if ((u1 === myEmail && u2 === peerEmail) || (u2 === myEmail && u1 === peerEmail)) {
        setMessages([]);
      }
    };

    socket.on('round_stats', handleRoundStats);
    socket.on('eavesdrop_alert', handleEavesdropAlert);
    socket.on('key_ready', handleKeyReady);
    socket.on('channel_started', handleChannelStarted);
    socket.on('channel_established', handleChannelEstablished);
    socket.on('encrypted_message', handleEncryptedMessage);
    socket.on('chat_cleared', handleChatCleared);

    return () => {
      socket.off('round_stats', handleRoundStats);
      socket.off('eavesdrop_alert', handleEavesdropAlert);
      socket.off('key_ready', handleKeyReady);
      socket.off('channel_started', handleChannelStarted);
      socket.off('channel_established', handleChannelEstablished);
      socket.off('encrypted_message', handleEncryptedMessage);
      socket.off('chat_cleared', handleChatCleared);
    };
  }, [activeSessionId, currentUser, selectedContact, appendMessageUnique]);

  const handleClearChat = useCallback(async () => {
    if (!currentUser?.email || !selectedContact?.email) return;
    await clearConversation(currentUser.email, selectedContact.email);
    setMessages([]);
  }, [currentUser, selectedContact]);

  // Start E91 Quantum Key Distribution
  const handleStartSession = async () => {
    setIsStarting(true);
    setRounds([]);
    setCurrentRound(null);
    setActiveAlert(null);
    setKeyLengthBits(0);
    setSessionStatus('running');

    try {
      const res = await startSession({
        siteA,
        siteB,
        injectEve,
        targetKeyBits: Number(targetBits),
        roundDelayMs: 25,
        user1: currentUser?.email,
        user2: selectedContact?.email,
      });

      setActiveSessionId(res.sessionId);
      socket.emit('join_session', res.sessionId);
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setIsSidePanelOpen(true);
      }
    } catch (err) {
      alert(`Failed to start quantum session: ${err.message}`);
      setSessionStatus('idle');
    } finally {
      setIsStarting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('qkd_user');
    localStorage.removeItem('qkd_auth_token');
    resetQuantumChannel();
    setCurrentUser(null);
    setSelectedContact(null);
    setMessages([]);
  };

  const handleLoginSuccess = (user) => {
    resetQuantumChannel();
    setCurrentUser(user);
  };

  const handleSelectHistorySession = async (sessionId) => {
    try {
      const statusRes = await getSessionStatus(sessionId);
      const roundsRes = await getSessionRounds(sessionId);

      setActiveSessionId(sessionId);
      setSiteA(statusRes.session.site_a_name);
      setSiteB(statusRes.session.site_b_name);
      setInjectEve(statusRes.session.inject_eve);
      setSessionStatus(statusRes.session.status);
      setRounds(roundsRes.rounds || []);
      setCurrentRound(roundsRes.rounds?.[roundsRes.rounds.length - 1] || null);
      setKeyLengthBits(statusRes.session.key_length_bits || 0);
      setActiveAlert(null);
      setShowHistoryModal(false);
      setIsSidePanelOpen(true);
    } catch (err) {
      console.error('Error loading session history:', err);
    }
  };

  // Drag resizer for the Quantum Channel Side Panel
  const handleMouseDownSidePanelResize = (e) => {
    e.preventDefault();
    setIsDraggingSidePanel(true);
    const startX = e.clientX;
    const startW = sidePanelWidth;

    const onMouseMove = (moveEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(680, Math.max(340, startW + delta));
      setSidePanelWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDraggingSidePanel(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // If user not authenticated, show Login/Signup portal
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans antialiased transition-colors duration-200 ${
      isDark ? 'bg-[#0a0d14] text-[#f8fafc]' : 'bg-[#e6ebf5] text-[#0f172a]'
    } ${
      isDraggingSidePanel ? 'cursor-col-resize select-none' : ''
    }`}>
      {/* Top Protocol Status Bar */}
      <header className={`h-13 px-3 sm:px-6 flex items-center justify-between text-xs flex-shrink-0 z-20 shadow-xs border-b transition-colors ${
        isDark ? 'bg-[#10141f] border-[#1e2638] text-[#f8fafc]' : 'bg-white border-[#dce2f9] text-[#0f172a]'
      }`}>
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse shadow-sm shadow-[#10b981]/50 flex-shrink-0"></span>
          <span className={`font-extrabold tracking-wider text-[11px] sm:text-xs truncate ${isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'}`}>
            QUANTUM SECURE NETWORK
          </span>
          <span className={`hidden md:inline-block text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border flex-shrink-0 ${
            isDark
              ? 'bg-[#1e1b4b] text-[#a5b4fc] border-[#312e81]'
              : 'bg-[#eef1fc] text-[#4338ca] border-[#dce2f9]'
          }`}>
            E91 Protocol Active
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          <button
            onClick={() => setShowHistoryModal(true)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition font-bold flex items-center gap-1.5 text-xs shadow-xs border ${
              isDark
                ? 'bg-[#161c2b] text-[#f8fafc] border-[#252f44] hover:bg-[#20293d]'
                : 'bg-[#f0f3fa] hover:bg-[#e4e8f7] text-[#0f172a] hover:text-[#4338ca] border-[#dce2f9]'
            }`}
          >
            <span>📜</span> <span className="hidden sm:inline">Audit </span>History
          </button>

          {/* User Name Pill */}
          <div className={`text-xs font-mono px-2.5 sm:px-3 py-1.5 rounded-xl font-bold max-w-[90px] xs:max-w-[130px] sm:max-w-none truncate border ${
            isDark
              ? 'bg-[#1e1b4b] text-[#c7d2fe] border-[#312e81]'
              : 'bg-[#eef1fc] text-[#4338ca] border-[#dce2f9]'
          }`}>
            {currentUser.name}
          </div>

          {/* Perfect Dark / Light Mode Toggle Button (Beside User in Top Right) */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-extrabold shadow-xs ${
              isDark
                ? 'bg-[#1e2738] border-[#334155] text-[#fbbf24] hover:bg-[#28354d]'
                : 'bg-[#f0f3fa] border-[#dce2f9] text-[#334155] hover:text-[#0f172a] hover:bg-[#e4e8f7]'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="text-sm">{isDark ? '☀️' : '🌙'}</span>
            <span className="font-mono text-[11px] hidden md:inline">
              {isDark ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>
      </header>

      {/* Main App Container with 3 Curvy Floating Big Boxes */}
      <div className={`flex-1 flex overflow-hidden relative p-1 sm:p-1.5 gap-1 transition-colors ${
        isDark ? 'bg-[#0a0d14]' : 'bg-[#e6ebf5]'
      }`}>
        {/* Box 1 (Chat List / Settings) & Box 2 (Chat Page) */}
        <WhatsAppChat
          currentUser={currentUser}
          onLogout={handleLogout}
          sessionId={activeSessionId}
          keyReady={sessionStatus === 'key_ready'}
          sessionStatus={sessionStatus}
          messages={messages}
          selectedContact={selectedContact}
          onSelectContact={handleSelectContact}
          onToggleSidePanel={() => setIsSidePanelOpen(!isSidePanelOpen)}
          isSidePanelOpen={isSidePanelOpen}
          activeAlert={activeAlert}
          onMessageSent={appendMessageUnique}
          onlineUserEmails={onlineUserEmails}
          onStartSession={handleStartSession}
          isStarting={isStarting}
          keyLengthBits={keyLengthBits}
          targetBits={targetBits}
          currentRound={currentRound}
          injectEve={injectEve}
          onClearChat={handleClearChat}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />

        {/* Mobile Backdrop for Side Panel Drawer */}
        {isSidePanelOpen && (
          <div
            onClick={() => setIsSidePanelOpen(false)}
            className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-xs z-30 md:hidden transition-opacity duration-200"
            aria-hidden="true"
          />
        )}

        {/* Re-adjustable Border Handle (between Box 2 Chat and Box 3 Quantum Channel on Desktop) */}
        {isSidePanelOpen && (
          <div
            onMouseDown={handleMouseDownSidePanelResize}
            className={`hidden md:flex items-center justify-center w-1 cursor-col-resize group rounded-full transition-colors flex-shrink-0 select-none z-20 ${
              isDark ? 'hover:bg-[#6366f1]/40' : 'hover:bg-[#5e67ea]/30'
            }`}
            title="Drag to resize Quantum Channel & E91 Session panel"
          >
            <div className={`w-0.5 h-8 rounded-full transition-all ${
              isDark ? 'bg-[#252f44] group-hover:bg-[#818cf8] group-hover:w-1' : 'bg-[#cbd5e1] group-hover:bg-[#5e67ea] group-hover:w-1'
            }`}></div>
          </div>
        )}

        {/* Box 3 DESKTOP: Curvy Quantum Channel & E91 Session Page (In-line) */}
        <div
          style={{ width: isSidePanelOpen ? `${sidePanelWidth}px` : 0 }}
          className={`hidden md:flex transition-all duration-150 flex-shrink-0 h-full overflow-hidden ${
            isSidePanelOpen ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className={`w-full h-full rounded-[22px] border shadow-sm overflow-hidden flex flex-col transition-colors ${
            isDark ? 'border-[#1e2638] bg-[#0f131e]' : 'border-[#d2e0f0] bg-[#edf4fb]'
          }`}>
            <QkdSidePanel
              isOpen={isSidePanelOpen}
              onClose={() => setIsSidePanelOpen(false)}
              sessionId={activeSessionId}
              sessionStatus={sessionStatus}
              rounds={rounds}
              currentRound={currentRound}
              keyLengthBits={keyLengthBits}
              targetBits={targetBits}
              setTargetBits={setTargetBits}
              injectEve={injectEve}
              setInjectEve={setInjectEve}
              onStartSession={handleStartSession}
              isStarting={isStarting}
              activeAlert={activeAlert}
              siteA={siteA}
              siteB={siteB}
              isDark={isDark}
            />
          </div>
        </div>

        {/* Box 3 MOBILE: Slide-Over Drawer from Right */}
        <div
          className={`
            md:hidden fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] max-w-[94vw] h-full p-1.5 transition-transform duration-300 ease-in-out
            ${isSidePanelOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
          `}
        >
          <div className={`w-full h-full rounded-[22px] border shadow-2xl overflow-hidden flex flex-col transition-colors ${
            isDark ? 'border-[#1e2638] bg-[#0f131e]' : 'border-[#d2e0f0] bg-[#edf4fb]'
          }`}>
            <QkdSidePanel
              isOpen={isSidePanelOpen}
              onClose={() => setIsSidePanelOpen(false)}
              sessionId={activeSessionId}
              sessionStatus={sessionStatus}
              rounds={rounds}
              currentRound={currentRound}
              keyLengthBits={keyLengthBits}
              targetBits={targetBits}
              setTargetBits={setTargetBits}
              injectEve={injectEve}
              setInjectEve={setInjectEve}
              onStartSession={handleStartSession}
              isStarting={isStarting}
              activeAlert={activeAlert}
              siteA={siteA}
              siteB={siteB}
              isDark={isDark}
            />
          </div>
        </div>
      </div>

      {/* Audit History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col border transition-colors animate-in fade-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#121622] border-[#252f44] text-[#f8fafc]' : 'bg-white border-[#dce2f9] text-[#0f172a]'
          }`}>
            <div className={`flex justify-between items-center border-b pb-3 ${
              isDark ? 'border-[#1e2638]' : 'border-[#edf0f8]'
            }`}>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>📜</span> PostgreSQL Audit Log & Past Sessions
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className={`p-1.5 rounded-full text-base transition font-bold ${
                  isDark ? 'text-[#94a3b8] hover:text-white hover:bg-[#1a2133]' : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f2f4fa]'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <SessionHistory
                currentSessionId={activeSessionId}
                onSelectSession={handleSelectHistorySession}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
