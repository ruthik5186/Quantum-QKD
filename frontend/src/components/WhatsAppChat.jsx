import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sendMessage, getDecryptedMessage, getUsers } from '../services/api';
import { socket } from '../services/socket';
import QuantumCircuitViewer from './QuantumCircuitViewer';
import SettingsView from './SettingsView';

/**
 * WhatsAppChat Component (Curvy Modern Edition):
 * - Light navigation rail that seamlessly matches the light color scheme
 * - Re-adjustable draggable border width (Telegram / WhatsApp Web style)
 * - Curvy rounded edges on all panels
 * - High-contrast readable typography (no washed out grey fonts)
 * - Complete WhatsApp-style Emoji Picker pop-up
 */

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜',
      '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞',
      '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢',
      '😭', '😤', '😠', '😡', '🤯', '😳', '🥵', '🥶', '😱', '😨',
      '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐',
      '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴',
      '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒',
    ],
  },
  {
    name: 'Gestures',
    icon: '👍',
    emojis: [
      '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '👊', '✊', '🤛',
      '🤜', '🤞', '✌️', '🫰', '🤟', '🤘', '👌', '🤌', '🤏', '👈',
      '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙',
      '💪', '✍️', '🙏', '🤳', '💅', '👀', '👁️', '🧠', '🫀', '🫁',
    ],
  },
  {
    name: 'Quantum & Tech',
    icon: '⚡',
    emojis: [
      '⚡', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '📡', '🛡️', '🚨',
      '🛰️', '💻', '🖥️', '🎛️', '🔬', '🔭', '🧪', '🧬', '💡', '🔦',
      '🔋', '🔌', '⚙️', '🧲', '🌐', '🚀', '🛸', '🎯', '🔮', '📊',
      '📈', '📉', '📦', '✉️', '📨', '📩', '📬', '📮', '🏷️', '💎',
    ],
  },
  {
    name: 'Hearts & Vibes',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🔥',
      '✨', '💫', '⭐', '🌟', '💥', '💯', '💢', '💬', '💭', '🗯️',
      '💤', '🏆', '🥇', '🥈', '🥉', '🎉', '🎊', '🎈', '🎁', '🪄',
    ],
  },
];

export default function WhatsAppChat({
  currentUser,
  onLogout,
  sessionId,
  keyReady = false,
  sessionStatus = 'idle',
  messages = [],
  onSelectContact,
  selectedContact,
  onToggleSidePanel,
  isSidePanelOpen,
  activeAlert,
  onMessageSent,
  onlineUserEmails = new Set(),
  onStartSession,
  isStarting = false,
  keyLengthBits = 0,
  targetBits = 128,
  currentRound = null,
  injectEve = false,
  onClearChat,
  isDark = false,
  onToggleTheme,
}) {
  const [contacts, setContacts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [decryptedMap, setDecryptedMap] = useState(() => {
    try {
      const cached = localStorage.getItem('qkd_decrypted_cache');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [expandedCipherId, setExpandedCipherId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState('chats'); // 'chats' | 'settings'

  // Re-adjustable sidebar width
  const [sidebarWidth, setSidebarWidth] = useState(330);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);

  // Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const [emojiFilter, setEmojiFilter] = useState('');
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const updateDecryptedMap = useCallback((newEntries) => {
    setDecryptedMap((prev) => {
      const next = { ...prev, ...newEntries };
      try {
        localStorage.setItem('qkd_decrypted_cache', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const handleConfirmClearChat = async () => {
    if (!onClearChat) return;
    setClearing(true);
    try {
      await onClearChat();
      setDecryptedMap({});
      try {
        localStorage.removeItem('qkd_decrypted_cache');
      } catch (e) {}
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    } finally {
      setClearing(false);
    }
  };

  // Quick infrastructure telemetry prompt chips
  const quickChips = [
    '⚡ Grid SCADA: High-voltage transformer nominal load 74.2%',
    '🔒 Grid Command: Open primary circuit breaker BKR-104',
    '📡 Phase Monitor: Frequency 60.00 Hz locked to atomic clock',
  ];

  // Fetch registered contacts from PostgreSQL
  const fetchContacts = async () => {
    try {
      const res = await getUsers(currentUser?.email);
      const list = res.users || [];
      setContacts(list);

      // Default select first contact if none selected
      if (!selectedContact && list.length > 0) {
        onSelectContact(list[0]);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  useEffect(() => {
    fetchContacts();

    const handleNewUser = (payload) => {
      if (payload.user && payload.user.email !== currentUser?.email) {
        setContacts((prev) => {
          if (prev.some((c) => c.email.toLowerCase() === payload.user.email.toLowerCase())) {
            return prev;
          }
          return [...prev, payload.user];
        });
      }
    };

    socket.on('user_registered', handleNewUser);
    return () => {
      socket.off('user_registered', handleNewUser);
    };
  }, [currentUser?.email]);

  // Pre-decrypt messages for instant viewing
  useEffect(() => {
    messages.forEach((m) => {
      if (!decryptedMap[m.id]) {
        getDecryptedMessage(m.id)
          .then((res) => {
            if (res.plaintext) {
              updateDecryptedMap({ [m.id]: res.plaintext });
            }
          })
          .catch(() => {});
      }
    });
  }, [messages, decryptedMap, updateDecryptedMap]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || !selectedContact) return;

    if (!keyReady) {
      alert('The quantum key exchange is not ready yet. Please establish the Quantum Channel first.');
      return;
    }

    setSending(true);
    try {
      const res = await sendMessage({
        sessionId,
        direction: 'A_to_B',
        text,
        senderEmail: currentUser.email,
        receiverEmail: selectedContact.email,
      });

      // Cache decrypted text immediately for sender view
      if (res.message && res.message.id) {
        updateDecryptedMap({ [res.message.id]: text });
        if (onMessageSent) {
          onMessageSent(res.message);
        }
      }

      setInputText('');
      setShowEmojiPicker(false);
    } catch (err) {
      alert(`Send failed: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const insertEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Draggable resizer between Contact List and Chat Page
  const handleMouseDownSidebarResize = (e) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(500, Math.max(260, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDraggingSidebar(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const filteredContacts = contacts.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex-1 flex overflow-hidden gap-1 bg-transparent ${isDraggingSidebar ? 'cursor-col-resize select-none' : ''}`}>
      {/* ---------------------------------------------------- */}
      {/* Left Slim Navigation Rail (Clean Modern Card)        */}
      {/* ---------------------------------------------------- */}
      <div className={`hidden lg:flex flex-col items-center py-3 px-1.5 w-14 rounded-[22px] border shadow-xs flex-shrink-0 justify-between select-none z-10 transition-colors ${
        isDark ? 'bg-[#10141f] border-[#1e2638]' : 'bg-white border-[#d8e2f0]'
      }`}>
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Navigation Action Pills (Triangle removed) */}
          <nav className="flex flex-col items-center gap-2.5 w-full pt-1">
            <button
              type="button"
              onClick={() => setActiveNavTab('chats')}
              className={`relative p-2.5 rounded-2xl transition ${
                activeNavTab === 'chats'
                  ? 'bg-[#5e67ea] text-white shadow-md shadow-indigo-200'
                  : isDark
                  ? 'text-[#94a3b8] hover:text-white hover:bg-[#1a2133]'
                  : 'text-[#334155] hover:text-[#0f172a] hover:bg-[#eef2f8]'
              }`}
              title="All Chats"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-[#ef4444] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center font-mono">
                {contacts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleSidePanel}
              className={`p-2.5 rounded-2xl transition ${
                isSidePanelOpen
                  ? isDark
                    ? 'bg-[#1e1b4b] text-[#a5b4fc] border border-[#312e81]'
                    : 'bg-[#eef1fc] text-[#5e67ea] border border-[#d0d7f5] shadow-xs'
                  : isDark
                  ? 'text-[#94a3b8] hover:text-white hover:bg-[#1a2133]'
                  : 'text-[#334155] hover:text-[#0f172a] hover:bg-[#eef2f8]'
              }`}
              title="Quantum Channel Panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </button>
          </nav>
        </div>

        {/* Bottom Settings Button (Gear Icon) */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveNavTab(activeNavTab === 'settings' ? 'chats' : 'settings')}
            title="Settings & Profile"
            className={`p-2.5 rounded-2xl transition ${
              activeNavTab === 'settings'
                ? 'bg-[#5e67ea] text-white shadow-md shadow-indigo-200'
                : isDark
                ? 'text-[#94a3b8] hover:text-[#a5b4fc] hover:bg-[#1a2133]'
                : 'text-[#334155] hover:text-[#5e67ea] hover:bg-[#eef2f8]'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.869a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Box 1: Registered Contact Directory OR Settings      */}
      {/* ---------------------------------------------------- */}
      <aside
        style={{ width: selectedContact ? `${sidebarWidth}px` : '100%' }}
        className={`
          ${selectedContact ? 'hidden md:flex' : 'flex'}
          rounded-[22px] border shadow-xs flex-col flex-shrink-0 h-full overflow-hidden select-none transition-colors ${
            isDark ? 'bg-[#0f131e] border-[#1e2638]' : 'bg-[#eef2f8] border-[#d8e2f0]'
          }
        `}
      >
        {activeNavTab === 'settings' ? (
          <SettingsView
            currentUser={currentUser}
            onClose={() => setActiveNavTab('chats')}
            onLogout={onLogout}
            keyLengthBits={keyLengthBits}
            targetBits={targetBits}
            sessionStatus={sessionStatus}
            isDark={isDark}
            onToggleTheme={onToggleTheme}
          />
        ) : (
          <>
            {/* User Profile Header */}
            <div className={`h-16 px-4 flex items-center justify-between border-b flex-shrink-0 transition-colors ${
              isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-[#e6edf7] border-[#d8e2f0]'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.email}`}
                  alt={currentUser?.name}
                  className={`w-10 h-10 rounded-2xl object-cover border shadow-xs flex-shrink-0 ${
                    isDark ? 'border-[#28324a]' : 'border-[#d8e2f0]'
                  }`}
                />
                <div className="min-w-0">
                  <div className={`text-sm font-extrabold leading-tight truncate ${
                    isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
                  }`}>
                    {currentUser?.name || 'Authorized Operator'}
                  </div>
                  <div className="text-xs text-[#4338ca] dark:text-[#a5b4fc] font-bold flex items-center gap-1.5 truncate mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                    {currentUser?.email}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveNavTab('settings')}
                title="Settings & Preferences"
                className={`text-xs font-bold p-2 rounded-xl transition flex-shrink-0 border ${
                  isDark
                    ? 'text-[#94a3b8] hover:text-[#a5b4fc] hover:bg-[#1a2133] border-[#252f44]'
                    : 'text-[#334155] hover:text-[#5e67ea] hover:bg-white/80 border-[#d8e2f0]'
                }`}
              >
                ⚙️
              </button>
            </div>

            {/* Search Bar */}
            <div className={`p-3 border-b flex-shrink-0 transition-colors ${
              isDark ? 'bg-[#0f131e] border-[#1e2638]' : 'bg-[#eef2f8] border-[#d8e2f0]'
            }`}>
              <div className={`rounded-2xl px-3.5 py-2 flex items-center gap-2.5 text-xs border shadow-2xs transition-colors ${
                isDark ? 'bg-[#161c2a] border-[#253046] text-[#f8fafc]' : 'bg-white border-[#d8e2f0] text-[#334155]'
              }`}>
                <svg className="w-4 h-4 text-[#4338ca] dark:text-[#818cf8]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className={`bg-transparent border-none focus:outline-none w-full text-xs font-bold ${
                    isDark ? 'text-[#f8fafc] placeholder-[#64748b]' : 'text-[#0f172a] placeholder-[#475569]'
                  }`}
                />
              </div>
            </div>

            {/* Registered Contacts List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {filteredContacts.length === 0 ? (
                <div className={`p-6 text-center text-xs font-bold leading-relaxed ${
                  isDark ? 'text-[#94a3b8]' : 'text-[#0f172a]'
                }`}>
                  No other operators registered yet.
                  <br />
                  Open an incognito window and sign up another operator to connect!
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedContact?.email === contact.email;
                  const isOnline = onlineUserEmails?.has(contact.email?.toLowerCase());

                  return (
                    <div
                      key={contact.id || contact.email}
                      onClick={() => onSelectContact(contact)}
                      className={`px-3.5 py-3 rounded-2xl flex items-center gap-3 cursor-pointer transition border ${
                        isSelected
                          ? isDark
                            ? 'bg-[#1e2742] shadow-xs text-white border-[#4338ca]'
                            : 'bg-[#dbe7fa] shadow-xs text-[#0f172a] border-[#b3cbfa]'
                          : isDark
                          ? 'bg-[#141926] hover:bg-[#1a2133] text-[#f8fafc] border-[#1e2638]'
                          : 'bg-white hover:bg-[#e4ecf7] text-[#0f172a] border-[#e0e8f5]'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={contact.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${contact.email}`}
                          alt={contact.name}
                          className={`w-12 h-12 rounded-2xl object-cover border shadow-xs ${
                            isDark ? 'border-[#28324a]' : 'border-[#d8e2f0]'
                          }`}
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                            isDark ? 'border-[#141926]' : 'border-white'
                          } ${isOnline ? 'bg-[#10b981]' : 'bg-[#64748b]'}`}
                          title={isOnline ? 'Operator Online' : 'Operator Offline'}
                        ></span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className={`text-sm font-extrabold truncate ${
                            isSelected ? (isDark ? 'text-white' : 'text-[#0f172a]') : isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
                          }`}>
                            {contact.name}
                          </h4>
                          <span className={`text-[10px] font-extrabold flex items-center gap-1 ${
                            isOnline ? 'text-[#10b981]' : isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
                          }`}>
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </div>
                        <div className={`text-xs font-bold truncate ${
                          isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
                        }`}>
                          {contact.site_name || contact.email}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#5e67ea] flex-shrink-0 shadow-xs"></div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Directory Counter (High Contrast) */}
            <div className={`p-3 border-t text-xs text-center font-extrabold flex-shrink-0 transition-colors ${
              isDark ? 'bg-[#141926] border-[#1e2638] text-[#94a3b8]' : 'bg-[#e6edf7] border-[#d8e2f0] text-[#0f172a]'
            }`}>
              {contacts.length} Registered Operators in Network
            </div>
          </>
        )}
      </aside>

      {/* ---------------------------------------------------- */}
      {/* Draggable Resizer Handle (Between Box 1 & Box 2)     */}
      {/* ---------------------------------------------------- */}
      <div
        onMouseDown={handleMouseDownSidebarResize}
        className={`hidden md:flex items-center justify-center w-1 cursor-col-resize group rounded-full transition-all flex-shrink-0 select-none z-20 ${
          isDark ? 'hover:bg-[#6366f1]/40' : 'hover:bg-[#5e67ea]/30'
        }`}
        title="Drag to resize contact list"
      >
        <div className={`w-0.5 h-8 rounded-full transition-all ${
          isDark ? 'bg-[#252f44] group-hover:bg-[#818cf8] group-hover:w-1' : 'bg-[#cbd5e1] group-hover:bg-[#5e67ea] group-hover:w-1'
        }`}></div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Box 2: Conversation Window (Curvy Big Box)           */}
      {/* ---------------------------------------------------- */}
      <section className={`
        ${selectedContact ? 'flex' : 'hidden md:flex'}
        flex-1 flex-col h-full rounded-[22px] border shadow-sm relative overflow-hidden transition-colors ${
          isDark ? 'bg-[#0d111b] border-[#1e2638]' : 'bg-white border-[#d8e2f0]'
        }
      `}>
        {/* Header Bar */}
        <div className={`h-16 px-4 sm:px-6 border-b flex items-center justify-between flex-shrink-0 z-10 gap-2 sm:gap-3 shadow-xs transition-colors ${
          isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-white border-[#edf0f8]'
        }`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {selectedContact && (
              <button
                type="button"
                onClick={() => onSelectContact(null)}
                className={`md:hidden p-2 -ml-1 rounded-full transition flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'text-[#94a3b8] hover:text-white hover:bg-[#1f293d]' : 'text-[#334155] hover:text-[#0f172a] hover:bg-[#f2f4fa]'
                }`}
                title="Back to contacts"
                aria-label="Back to contacts"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {selectedContact ? (
              <>
                <div className="relative flex-shrink-0">
                  <img
                    src={selectedContact.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedContact.email}`}
                    alt={selectedContact.name}
                    className={`w-10 h-10 rounded-2xl object-cover border shadow-xs ${
                      isDark ? 'border-[#28324a]' : 'border-[#dce2f9]'
                    }`}
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                      isDark ? 'border-[#141926]' : 'border-white'
                    } ${
                      onlineUserEmails?.has(selectedContact.email?.toLowerCase())
                        ? 'bg-[#10b981]'
                        : 'bg-[#64748b]'
                    }`}
                  ></span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`text-base font-extrabold leading-tight flex items-center gap-2 truncate ${
                    isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
                  }`}>
                    <span className="truncate">{selectedContact.name}</span>
                    <span className={`hidden sm:inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold flex-shrink-0 border ${
                      isDark
                        ? 'bg-[#1e1b4b] text-[#c7d2fe] border-[#312e81]'
                        : 'bg-[#eef1fc] text-[#4338ca] border-[#dce2f9]'
                    }`}>
                      {selectedContact.site_name || 'PARTNER NODE'}
                    </span>
                  </h3>
                  <p className={`text-xs font-semibold truncate mt-0.5 ${
                    isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
                  }`}>
                    {onlineUserEmails?.has(selectedContact.email?.toLowerCase()) ? (
                      keyReady ? (
                        <span className="text-[#10b981] font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                          <span className="hidden sm:inline">online · </span>Quantum Channel Armed
                        </span>
                      ) : sessionStatus === 'running' ? (
                        <span className="text-[#6366f1] font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#5e67ea] animate-pulse"></span>
                          <span className="hidden sm:inline">online · </span>Exchanging ({keyLengthBits}/{targetBits}b)...
                        </span>
                      ) : sessionStatus === 'aborted' ? (
                        <span className="text-[#ef4444] font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
                          <span className="hidden sm:inline">online · </span>Intrusion Detected
                        </span>
                      ) : (
                        <span className="text-[#f59e0b] font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                          <span className="hidden sm:inline">online · </span>Channel Required
                        </span>
                      )
                    ) : (
                      <span className={`font-extrabold flex items-center gap-1.5 ${
                        isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-[#64748b]"></span>
                        offline · Standby
                      </span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <div className={`text-sm font-bold ${isDark ? 'text-[#94a3b8]' : 'text-[#334155]'}`}>Select an operator to begin</div>
            )}
          </div>

          {/* Action buttons (with Dark Mode toggle beside Bob in top right) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Status Pill */}
            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
              keyReady
                ? isDark
                  ? 'bg-[#064e3b]/50 border-[#059669]/60 text-[#34d399]'
                  : 'bg-[#dcfce7] border-[#bbf7d0] text-[#15803d]'
                : sessionStatus === 'running'
                ? isDark
                  ? 'bg-[#1e1b4b] border-[#4338ca] text-[#c7d2fe] animate-pulse'
                  : 'bg-[#e0e7ff] border-[#c7d2fe] text-[#4338ca] animate-pulse'
                : isDark
                ? 'bg-[#451a03]/50 border-[#b45309]/60 text-[#fcd34d]'
                : 'bg-[#fef3c7] border-[#fde68a] text-[#b45309]'
            }`}>
              <span>{keyReady ? '🔒' : '⏳'}</span>
              <span className="hidden sm:inline">
                {keyReady ? 'AES Key Ready' : sessionStatus === 'running' ? 'Exchanging Photons...' : 'Channel Required'}
              </span>
            </div>

            {/* Clear Chat Button */}
            {selectedContact && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                disabled={messages.length === 0 || clearing}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border disabled:opacity-40 disabled:cursor-not-allowed shadow-xs ${
                  isDark
                    ? 'bg-[#1a2133] hover:bg-[#7f1d1d]/60 hover:text-[#fca5a5] text-[#94a3b8] border-[#252f44] hover:border-[#991b1b]'
                    : 'bg-[#f0f3fa] hover:bg-[#fee2e2] hover:text-[#ef4444] text-[#334155] border-[#dce2f9] hover:border-[#fecaca]'
                }`}
                title="Clear Chat History"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <span className="hidden md:inline">Clear Chat</span>
              </button>
            )}

            <button
              onClick={onToggleSidePanel}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                isSidePanelOpen
                  ? 'bg-[#5e67ea] text-white shadow-indigo-100'
                  : isDark
                  ? 'bg-[#1a2133] hover:bg-[#252f44] text-[#f8fafc] border border-[#252f44]'
                  : 'bg-[#f0f3fa] hover:bg-[#e4e8f7] text-[#0f172a] border border-[#dce2f9]'
              }`}
              title="Quantum Channel & Metrics"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <span className="hidden sm:inline">Quantum Channel</span>
              <span>{isSidePanelOpen ? '◀' : '▶'}</span>
            </button>
          </div>
        </div>

        {/* Threat Flash Banner if Eve detected */}
        {activeAlert && (
          <div className="bg-[#ef4444] text-white px-4 py-2.5 text-xs flex items-center justify-between shadow-md z-10 animate-pulse font-bold">
            <span className="flex items-center gap-2">
              <span className="text-base">🚨</span>
              <span>
                <strong>Eavesdropper Intercept Detected (Round #{activeAlert.roundNum})!</strong> {activeAlert.reason}. Bell inequality broken. Key material discarded.
              </span>
            </span>
          </div>
        )}

        {/* Message Stream with Subtle WhatsApp Doodle Wallpaper Background */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative transition-colors ${
          isDark ? 'bg-[#0a0d14]' : 'bg-[#f4f1ea]'
        }`}>
          {/* WhatsApp-style Subtle Doodle Wallpaper Pattern (Pencil, Eraser, Lock, Key, etc.) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
            <svg className={`w-full h-full ${isDark ? 'opacity-[0.22]' : 'opacity-[0.16]'}`} xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="whatsapp-doodle" width="140" height="120" patternUnits="userSpaceOnUse">
                  {/* Pencil */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 6l4 4L7 21H3v-4L14 6z" />
                    <line x1="12" y1="8" x2="16" y2="12" />
                  </g>
                  {/* Eraser */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="36" y="8" width="14" height="9" rx="2" transform="rotate(-15 43 12)" />
                    <line x1="41" y1="7" x2="39" y2="17" transform="rotate(-15 43 12)" />
                  </g>
                  {/* Padlock */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="68" y="10" width="14" height="11" rx="2" />
                    <path d="M71 10V6.5a4 4 0 0 1 8 0V10" />
                    <circle cx="75" cy="15" r="1.3" fill={isDark ? '#818cf8' : '#334155'} />
                  </g>
                  {/* Key */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="106" cy="12" r="4" />
                    <line x1="110" y1="12" x2="122" y2="12" />
                    <line x1="118" y1="12" x2="118" y2="16" />
                    <line x1="121" y1="12" x2="121" y2="15" />
                  </g>
                  {/* Chat Speech Bubble */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 46c0-5 6-9 13-9s13 4 13 9c0 3.5-3 6.5-7 8l-3 3v-3c-4.5-.8-7-3.5-7-7z" />
                  </g>
                  {/* Star */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.25" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M58 45l1.5 3 3.5.5-2.5 2.5.6 3.5-3.1-1.6-3.1 1.6.6-3.5-2.5-2.5 3.5-.5z" />
                  </g>
                  {/* Shield */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M88 41v6c0 4 3.5 7 7 8 3.5-1 7-4 7-8v-6l-7-3-7 3z" />
                  </g>
                  {/* Coffee Cup */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="18" y="76" width="13" height="11" rx="2" />
                    <path d="M31 79h2.5a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H31" />
                    <line x1="16" y1="89" x2="35" y2="89" />
                  </g>
                  {/* Clock */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="58" cy="82" r="7" />
                    <polyline points="58,78 58,82 61,82" />
                  </g>
                  {/* Paper Plane */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="86,76 102,81 92,86 90,92 88,86" />
                  </g>
                  {/* Musical Note */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.35" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="118" cy="85" r="2.5" />
                    <line x1="120.5" y1="85" x2="120.5" y2="74" />
                    <polyline points="120.5,74 127,72 127,76 120.5,78" />
                  </g>
                  {/* Atom / Entanglement Ring */}
                  <g stroke={isDark ? '#818cf8' : '#334155'} strokeWidth="1.25" fill="none" strokeLinecap="round">
                    <ellipse cx="120" cy="46" rx="9" ry="4" transform="rotate(30 120 46)" />
                    <ellipse cx="120" cy="46" rx="9" ry="4" transform="rotate(-30 120 46)" />
                    <circle cx="120" cy="46" r="1.6" fill={isDark ? '#818cf8' : '#334155'} />
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#whatsapp-doodle)" />
            </svg>
          </div>

          {/* Security Chip Notice */}
          <div className="flex justify-center my-2 relative z-10">
            <div className={`max-w-md text-center backdrop-blur-xs border text-xs p-3 rounded-2xl shadow-sm leading-relaxed font-medium transition-colors ${
              isDark
                ? 'bg-[#141926]/90 border-[#1e2638] text-[#e2e8f0]'
                : 'bg-white/95 border-[#d8e2f0] text-[#0f172a]'
            }`}>
              <span className={`font-extrabold ${isDark ? 'text-white' : 'text-[#0f172a]'}`}>🔒 End-to-End Quantum Encryption:</span> Messages between{' '}
              <strong className={isDark ? 'text-[#a5b4fc]' : 'text-[#4338ca]'}>{currentUser?.name}</strong> and{' '}
              <strong className={isDark ? 'text-[#a5b4fc]' : 'text-[#4338ca]'}>{selectedContact?.name || 'Recipient'}</strong> are secured with AES-256-GCM using keys derived from E91 entangled photon measurements. Plaintext is never stored in PostgreSQL.
            </div>
          </div>

          {/* Mandatory Quantum Channel Gate when Key is NOT Ready */}
          {!keyReady && (
            <div className="my-4 sm:my-6 mx-auto max-w-xl relative z-10">
              {sessionStatus === 'running' ? (
                /* 1. Photon Exchange in Progress with Real-Time Circuit */
                <div className={`border rounded-3xl p-4 sm:p-6 shadow-xl text-center space-y-4 transition-colors ${
                  isDark ? 'bg-[#141926] border-[#312e81]' : 'bg-white border-[#c7d2fe]'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-3 text-xs ${
                    isDark ? 'border-[#1e2638]' : 'border-[#edf0f8]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#5e67ea] animate-ping"></span>
                      <h3 className={`font-extrabold tracking-wide text-xs sm:text-sm ${
                        isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
                      }`}>
                        Establishing Quantum Channel (E91 Real-Time)
                      </h3>
                    </div>
                    <span className="font-mono text-[#5e67ea] dark:text-[#a5b4fc] font-extrabold text-xs">
                      {keyLengthBits} / {targetBits} bits
                    </span>
                  </div>

                  {/* Real-Time Running Quantum Circuit */}
                  <QuantumCircuitViewer
                    currentRound={currentRound}
                    sessionStatus={sessionStatus}
                    injectEve={injectEve}
                    isDark={isDark}
                  />

                  {/* Sifted Key Progress Bar */}
                  <div className="space-y-1.5">
                    <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${
                      isDark ? 'bg-[#1e2638] border-[#2d3748]' : 'bg-[#e5e9f5] border-[#dce2f9]'
                    }`}>
                      <div
                        className="bg-gradient-to-r from-[#5e67ea] to-[#818cf8] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((keyLengthBits / targetBits) * 100))}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className={`text-xs font-mono font-bold flex items-center justify-between pt-1 ${
                    isDark ? 'text-[#cbd5e1]' : 'text-[#0f172a]'
                  }`}>
                    <span>Bell S: <strong className="text-[#5e67ea] dark:text-[#a5b4fc]">{currentRound ? currentRound.chsh_s.toFixed(3) : 'Testing...'}</strong></span>
                    <span>QBER: <strong className="text-[#ef4444]">{currentRound ? (currentRound.qber * 100).toFixed(1) + '%' : '0.0%'}</strong></span>
                    <span className="text-[#5e67ea] dark:text-[#a5b4fc] font-bold flex items-center gap-1 font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5e67ea] animate-pulse"></span>
                      Live Stream
                    </span>
                  </div>
                </div>
              ) : sessionStatus === 'aborted' ? (
                /* 2. Intrusion Aborted Alert */
                <div className={`border rounded-3xl p-5 sm:p-6 shadow-xl text-center space-y-3.5 transition-colors ${
                  isDark ? 'bg-[#2a0e0e] border-[#7f1d1d]' : 'bg-[#fef2f2] border-[#fecaca]'
                }`}>
                  <div className="text-3xl">🚨</div>
                  <div>
                    <h3 className={`text-sm font-extrabold tracking-wide ${isDark ? 'text-[#fca5a5]' : 'text-[#991b1b]'}`}>
                      Quantum Channel Aborted: Eavesdropper Detected!
                    </h3>
                    <p className={`text-xs font-semibold mt-1 max-w-sm mx-auto leading-relaxed ${isDark ? 'text-[#f87171]' : 'text-[#7f1d1d]'}`}>
                      Bell inequality violated classical limit (CHSH S &lt; 2.0) or QBER exceeded 11%. Perturbed photon bits have been discarded immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSidePanelOpen) onToggleSidePanel();
                      if (onStartSession) onStartSession();
                    }}
                    disabled={isStarting}
                    className="px-6 py-2.5 bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition flex items-center justify-center gap-2 mx-auto"
                  >
                    <span>🔄</span> Re-establish Quantum Channel
                  </button>
                </div>
              ) : (
                /* 3. Idle / Channel Required Gate */
                <div className={`border rounded-3xl p-5 sm:p-7 shadow-xl text-center space-y-4 transition-colors ${
                  isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-white border-[#dce2f9]'
                }`}>
                  <div className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center text-2xl shadow-xs ${
                    isDark ? 'bg-[#1e1b4b] border-[#312e81] text-[#a5b4fc]' : 'bg-[#eef1fc] border-[#dce2f9] text-[#5e67ea]'
                  }`}>
                    🔒
                  </div>
                  <div>
                    <h3 className={`text-base font-extrabold tracking-wide ${
                      isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
                    }`}>
                      Quantum Channel Required
                    </h3>
                    <p className={`text-xs font-semibold mt-1.5 leading-relaxed max-w-sm mx-auto ${
                      isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
                    }`}>
                      To initiate communication with <strong className={isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'}>{selectedContact?.name || 'Operator'}</strong>, you must establish an E91 entangled photon channel to negotiate an authenticated AES-256 key.
                    </p>
                  </div>

                  {/* Circuit Preview in Standby Mode */}
                  <QuantumCircuitViewer
                    currentRound={null}
                    sessionStatus="idle"
                    injectEve={injectEve}
                    compact={true}
                    isDark={isDark}
                  />

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isSidePanelOpen) onToggleSidePanel();
                        if (onStartSession) onStartSession();
                      }}
                      disabled={isStarting}
                      className="px-6 py-3 bg-[#5e67ea] hover:bg-[#4f59e0] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mx-auto transition hover:scale-102 active:scale-98"
                    >
                      {isStarting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Initializing Channel...
                        </>
                      ) : (
                        <>
                          <span>⚡</span> Initialize Quantum Channel
                        </>
                      )}
                    </button>
                  </div>

                  <div className={`pt-3 border-t flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs font-bold ${
                    isDark ? 'border-[#1e2638] text-[#cbd5e1]' : 'border-[#edf0f8] text-[#0f172a]'
                  }`}>
                    <span>✓ Bell S &gt; 2.0 Check</span>
                    <span>✓ QBER &lt; 11% Guarantee</span>
                    <span>✓ Zero Classical Leakage</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing Messages */}
          {messages.length === 0 ? (
            keyReady && (
              <div className={`text-center py-12 text-xs font-semibold relative z-10 ${
                isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
              }`}>
                <div className="text-3xl mb-2">💬</div>
                <p>Quantum channel established! Send your first encrypted message below.</p>
              </div>
            )
          ) : (
            messages.map((m) => {
              const isOutgoing =
                m.senderEmail?.toLowerCase() === currentUser?.email.toLowerCase() ||
                m.sender_email?.toLowerCase() === currentUser?.email.toLowerCase();

              const decrypted = decryptedMap[m.id];
              const isCipherExpanded = expandedCipherId === m.id;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col relative z-10 ${isOutgoing ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[72%] px-4 py-3 relative transition-all duration-200 hover:-translate-y-0.5 ${
                      isOutgoing
                        ? 'bg-[#5e67ea] text-white rounded-[20px] rounded-br-[4px] shadow-[0_6px_20px_rgba(94,103,234,0.30)] hover:shadow-[0_8px_24px_rgba(94,103,234,0.40)] border border-[#7e87f5]/40'
                        : isDark
                        ? 'bg-[#161c2b]/95 backdrop-blur-xs text-[#f8fafc] rounded-[20px] rounded-bl-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.50)] border border-[#252f44]'
                        : 'bg-white/95 backdrop-blur-xs text-[#0f172a] rounded-[20px] rounded-bl-[4px] shadow-[0_4px_16px_rgba(15,23,42,0.08)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.14)] border border-[#d8e2f0]'
                    }`}
                  >
                    {/* Message Body */}
                    <div className="text-[13px] leading-relaxed break-words font-sans">
                      {decrypted ? (
                        <span className={`font-medium ${isOutgoing ? 'text-white' : isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'}`}>
                          {decrypted}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 text-xs py-0.5 opacity-90 font-medium">
                          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
                          <span className="italic">Decrypting authenticated quantum ciphertext...</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Checkmark */}
                    <div className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] font-mono ${
                      isOutgoing ? 'text-white/90' : isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
                    }`}>
                      <span className="font-bold">
                        {m.sentAt || m.sent_at
                          ? new Date(m.sentAt || m.sent_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Now'}
                      </span>
                      {isOutgoing && (
                        <span className="text-white font-extrabold">✓✓</span>
                      )}
                    </div>

                    {/* Toggle Stored PostgreSQL Ciphertext Inspector */}
                    <button
                      onClick={() => setExpandedCipherId(isCipherExpanded ? null : m.id)}
                      className={`mt-2 pt-1.5 border-t text-[10px] flex items-center justify-between w-full font-mono font-bold transition ${
                        isOutgoing
                          ? 'border-white/20 text-white hover:text-white/80'
                          : isDark
                          ? 'border-[#252f44] text-[#a5b4fc] hover:text-[#c7d2fe]'
                          : 'border-[#dce2f9] text-[#4338ca] hover:text-[#312e81]'
                      }`}
                    >
                      <span>🔒 View PostgreSQL Ciphertext</span>
                      <span>{isCipherExpanded ? '▲' : '▼'}</span>
                    </button>

                    {/* Expanded Ciphertext Drawer */}
                    {isCipherExpanded && (
                      <div className={`mt-2 p-2.5 rounded-xl border text-[10px] font-mono space-y-1 break-all select-all ${
                        isOutgoing
                          ? 'bg-[#4338ca] border-white/20 text-white'
                          : isDark
                          ? 'bg-[#0f131e] border-[#252f44] text-[#cbd5e1]'
                          : 'bg-[#e5e9f5] border-[#c7d2fe] text-[#0f172a]'
                      }`}>
                        <div className="font-extrabold underline">Stored in PostgreSQL message_logs:</div>
                        <div><strong>Ciphertext:</strong> {m.ciphertext}</div>
                        <div><strong>IV (12B):</strong> {m.iv}</div>
                        <div><strong>Tag (16B):</strong> {m.authTag || m.auth_tag}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Telemetry Chips */}
        {keyReady && (
          <div className={`px-4 py-2.5 border-t flex items-center gap-2 overflow-x-auto transition-colors ${
            isDark ? 'bg-[#10141f] border-[#1e2638]' : 'bg-[#f8fafd] border-[#edf0f8]'
          }`}>
            <span className={`text-[10px] font-bold uppercase flex-shrink-0 ${
              isDark ? 'text-[#94a3b8]' : 'text-[#0f172a]'
            }`}>
              Quick Telemetry:
            </span>
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                disabled={sending}
                className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition font-bold shadow-xs ${
                  isDark
                    ? 'bg-[#161c2b] hover:bg-[#1f283d] text-[#a5b4fc] border-[#252f44]'
                    : 'bg-[#f0f3fa] hover:bg-[#e4e8f7] text-[#4338ca] border-[#dce2f9]'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* EMOJI PICKER POP-UP CONTAINER */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className={`absolute bottom-20 left-4 sm:left-6 z-50 w-72 sm:w-80 border rounded-3xl shadow-2xl p-3 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 transition-colors ${
              isDark ? 'bg-[#141926] border-[#252f44] text-[#f8fafc]' : 'bg-white border-[#dce2f9] text-[#0f172a]'
            }`}
          >
            {/* Header / Category Tabs */}
            <div className={`flex items-center justify-between border-b pb-2 ${
              isDark ? 'border-[#1e2638]' : 'border-[#edf0f8]'
            }`}>
              <div className="flex items-center gap-1">
                {EMOJI_CATEGORIES.map((cat, idx) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setActiveEmojiCategory(idx)}
                    className={`px-2 py-1 rounded-xl text-sm transition ${
                      activeEmojiCategory === idx
                        ? isDark
                          ? 'bg-[#1e1b4b] border border-[#312e81] scale-110'
                          : 'bg-[#eef1fc] border border-[#dce2f9] scale-110'
                        : isDark
                        ? 'hover:bg-[#1a2133] opacity-70 hover:opacity-100'
                        : 'hover:bg-[#f0f3fa] opacity-70 hover:opacity-100'
                    }`}
                    title={cat.name}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className={`text-xs font-bold p-1 rounded-full transition ${
                  isDark ? 'text-[#94a3b8] hover:text-white hover:bg-[#1e2638]' : 'text-[#334155] hover:text-[#0f172a] hover:bg-[#f0f3fa]'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Emoji Grid */}
            <div className="h-44 overflow-y-auto grid grid-cols-7 sm:grid-cols-8 gap-1.5 p-1 select-none">
              {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className={`text-xl sm:text-2xl p-1 rounded-xl hover:scale-125 transition-transform flex items-center justify-center cursor-pointer ${
                    isDark ? 'hover:bg-[#1e2638]' : 'hover:bg-[#f0f3fa]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className={`text-[10px] font-extrabold text-center border-t pt-1 ${
              isDark ? 'border-[#1e2638] text-[#94a3b8]' : 'border-[#edf0f8] text-[#0f172a]'
            }`}>
              Click any emoji to insert into message
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className={`p-3 sm:p-4 border-t flex items-center gap-2 transition-colors ${
          isDark ? 'bg-[#141926] border-[#1e2638]' : 'bg-white border-[#edf0f8]'
        }`}>
          {/* Smiley Emoji Toggle Button */}
          <button
            type="button"
            disabled={!keyReady}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 text-xl transition flex-shrink-0 rounded-2xl ${
              showEmojiPicker
                ? isDark
                  ? 'bg-[#1e1b4b] text-[#a5b4fc]'
                  : 'bg-[#eef1fc] text-[#5e67ea]'
                : isDark
                ? 'text-[#cbd5e1] hover:text-[#a5b4fc] hover:bg-[#1e2638]'
                : 'text-[#0f172a] hover:text-[#5e67ea] hover:bg-[#f0f3fa]'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Choose Emoji"
          >
            😊
          </button>

          <button
            type="button"
            disabled={!keyReady}
            className={`hidden sm:inline-block p-2 text-lg transition disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 rounded-2xl ${
              isDark
                ? 'text-[#94a3b8] hover:text-[#cbd5e1] hover:bg-[#1e2638]'
                : 'text-[#334155] hover:text-[#0f172a] hover:bg-[#f0f3fa]'
            }`}
            title="Attach Document"
          >
            📎
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex-1 flex items-center gap-2 min-w-0"
          >
            <div className="relative flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={!keyReady || sending}
                placeholder={
                  keyReady
                    ? `Message (AES-256 Armed)...`
                    : '🔒 Quantum channel required...'
                }
                className={`w-full border rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none font-bold font-sans disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
                  isDark
                    ? 'bg-[#0f131e] border-[#252f44] text-[#f8fafc] placeholder-[#64748b] focus:border-[#6366f1]'
                    : 'bg-[#f0f3fa] border-[#dce2f9] text-[#0f172a] placeholder-[#475569] focus:border-[#5e67ea]'
                }`}
              />
              {!keyReady && (
                <span className={`absolute right-3 top-2.5 sm:top-3 text-[10px] font-mono pointer-events-none font-bold ${
                  isDark ? 'text-[#f59e0b]' : 'text-[#b45309]'
                }`}>
                  LOCKED
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!keyReady || !inputText.trim() || sending}
              className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center transition flex-shrink-0 shadow-md disabled:cursor-not-allowed text-sm ${
                isDark
                  ? 'bg-[#5e67ea] hover:bg-[#4f59e0] disabled:bg-[#1e2638] disabled:text-[#475569] shadow-indigo-900/30'
                  : 'bg-[#5e67ea] hover:bg-[#4f59e0] disabled:bg-[#e2e7f4] disabled:text-[#94a3b8] shadow-indigo-200'
              }`}
              title={keyReady ? 'Send Encrypted Message' : 'Establish Quantum Channel First'}
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : keyReady ? (
                '➤'
              ) : (
                '🔒'
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 transition-colors ${
            isDark ? 'bg-[#141926] border-[#252f44]' : 'bg-white border-[#dce2f9]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-[#ef4444] flex-shrink-0 ${
                isDark ? 'bg-[#3b1219] border-[#7f1d1d]' : 'bg-[#fee2e2] border-[#fecaca]'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </div>
              <div>
                <h3 className={`text-base font-extrabold leading-snug ${
                  isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
                }`}>
                  Clear Chat Conversation?
                </h3>
                <p className={`text-xs font-semibold mt-0.5 ${
                  isDark ? 'text-[#94a3b8]' : 'text-[#334155]'
                }`}>
                  With {selectedContact?.name || 'Operator'}
                </p>
              </div>
            </div>

            <p className={`text-xs font-medium leading-relaxed ${
              isDark ? 'text-[#cbd5e1]' : 'text-[#334155]'
            }`}>
              This will permanently delete all encrypted messages between{' '}
              <strong className={isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'}>{currentUser?.name}</strong> and{' '}
              <strong className={isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'}>{selectedContact?.name}</strong> from the PostgreSQL database and clear your local chat history.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  isDark
                    ? 'bg-[#1a2133] hover:bg-[#252f44] text-[#cbd5e1] border-[#252f44]'
                    : 'bg-[#f0f3fa] hover:bg-[#e4e8f7] text-[#334155] border-[#dce2f9]'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearChat}
                disabled={clearing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ef4444] hover:bg-[#dc2626] text-white transition flex items-center gap-1.5 shadow-md shadow-rose-900/30"
              >
                {clearing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Clearing...
                  </>
                ) : (
                  'Clear Messages'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
