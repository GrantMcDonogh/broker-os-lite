import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Mic,
  ChevronDown,
  Plus,
  Lock,
  Square,
  Search,
  MessageCircle,
  ClipboardList,
  Users,
  FileText,
} from 'lucide-react';
import type { ChatSession, ChatMessage as DbChatMessage, SessionType } from '../types/database';
import { streamChatMessage, type ChatMessage as AiChatMessage } from '../lib/openrouter';
import { api } from '../lib/api';
import styles from './ChatPanel.module.css';

const SYSTEM_PROMPT = `You are BrokerOS, an AI assistant for insurance brokers at McDonogh Insurance Brokers in South Africa. You help with:
- Managing insurance policies (motor, homeowners, commercial, liability)
- Client relationship management
- Claims processing and FNOL
- Renewal tracking and remarketing
- Generating Records of Advice (ROA)
- Commission reconciliation

You work with South African insurers: Santam, Hollard, Bryte, Old Mutual Insure.
Use South African Rand (R) for currency. Be professional but friendly.
Keep responses concise and actionable.`;

const SESSION_ICONS: Record<SessionType, typeof MessageCircle> = {
  general: MessageCircle,
  task: ClipboardList,
  client: Users,
  policy: FileText,
};

const SESSION_ICON_CLASS: Record<SessionType, string> = {
  general: styles.sessionIconGeneral,
  task: styles.sessionIconTask,
  client: styles.sessionIconClient,
  policy: styles.sessionIconPolicy,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function renderContent(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

interface ChatPanelProps {
  orgId: string;
  userId: string;
}

export default function ChatPanel({ orgId, userId }: ChatPanelProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<DbChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch sessions on mount
  useEffect(() => {
    async function fetchSessions() {
      const data = await api.getChatSessions(orgId);

      if (data && data.length > 0) {
        setSessions(data);
        setActiveSessionId(data[0].id);
      }
    }
    fetchSessions();
  }, [orgId]);

  // Fetch messages when active session changes
  useEffect(() => {
    if (!activeSessionId) return;

    async function fetchMessages() {
      const data = await api.getChatMessages(activeSessionId);

      if (data) {
        setMessages(data);
      }
    }
    fetchMessages();
  }, [activeSessionId]);

  // Scroll to bottom on new messages or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isStreaming || !activeSessionId) return;

    setInputValue('');

    // Save user message
    const userMsg = await api.createChatMessage({ session_id: activeSessionId, role: 'user', content: text, metadata: {} });

    if (userMsg) {
      setMessages((prev) => [...prev, userMsg]);
    }

    // Build conversation history for API
    const history: AiChatMessage[] = [
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: text },
    ];

    setIsStreaming(true);
    setStreamingContent('');

    try {
      const fullContent = await streamChatMessage(history, SYSTEM_PROMPT, (chunk) => {
        setStreamingContent(chunk);
      });

      setStreamingContent('');
      setIsStreaming(false);

      // Save AI response
      const aiMsg = await api.createChatMessage({
        session_id: activeSessionId,
        role: 'assistant',
        content: fullContent,
        metadata: {},
      });

      if (aiMsg) {
        setMessages((prev) => [...prev, aiMsg]);
      }

      // Update session timestamp
      await api.updateChatSession(activeSessionId, { updated_at: new Date().toISOString() });
    } catch {
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [inputValue, isStreaming, activeSessionId, messages]);

  const handleNewChat = useCallback(async () => {
    const data = await api.createChatSession({
      org_id: orgId,
      user_id: userId,
      title: 'New chat',
      session_type: 'general',
      is_active: true,
      is_internal: false,
    });

    if (data) {
      setSessions((prev) => [data, ...prev]);
      setActiveSessionId(data.id);
      setMessages([]);
      setIsDropdownOpen(false);
    }
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setIsDropdownOpen(false);
    setSearchQuery('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Group sessions for dropdown
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeSessions = filteredSessions.filter((s) => s.is_active);
  const todaySessions = filteredSessions.filter((s) => !s.is_active && isToday(s.updated_at));

  const ActiveIcon = activeSession ? SESSION_ICONS[activeSession.session_type] : MessageCircle;
  const activeIconClass = activeSession
    ? SESSION_ICON_CLASS[activeSession.session_type]
    : styles.sessionIconGeneral;

  return (
    <section className={styles.chat}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderTop} ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className={styles.sessionSelector}
            onClick={() => setIsDropdownOpen((v) => !v)}
          >
            <div className={`${styles.sessionIcon} ${activeIconClass}`}>
              <ActiveIcon size={14} />
            </div>
            <div className={styles.sessionInfo}>
              <span className={styles.sessionTitle}>
                {activeSession?.title ?? 'No session'}
              </span>
              {activeSession?.scope_label && (
                <span className={styles.sessionScope}>{activeSession.scope_label}</span>
              )}
            </div>
            <ChevronDown
              size={14}
              className={styles.sessionChevron}
              style={{ transform: isDropdownOpen ? 'rotate(180deg)' : undefined }}
            />
          </button>

          <div className={styles.chatHeaderActions}>
            {activeSession?.is_internal && (
              <span className={styles.internalTag}>
                <Lock size={10} />
                Internal
              </span>
            )}
            <button className={styles.chatHeaderBtn} title="Summarize session">
              <Square size={14} />
            </button>
            <button className={styles.chatHeaderBtn} title="New chat" onClick={handleNewChat}>
              <Plus size={14} />
            </button>
          </div>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className={styles.sessionDropdown}>
              <div className={styles.dropdownSearch}>
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {activeSessions.length > 0 && (
                <div className={styles.dropdownSection}>
                  <span>Active</span>
                  {activeSessions.map((s) => {
                    const Icon = SESSION_ICONS[s.session_type];
                    const iconClass = SESSION_ICON_CLASS[s.session_type];
                    return (
                      <button
                        key={s.id}
                        className={
                          s.id === activeSessionId
                            ? styles.dropdownItemActive
                            : styles.dropdownItem
                        }
                        onClick={() => handleSelectSession(s.id)}
                      >
                        <div className={`${styles.dropdownItemIcon} ${iconClass}`}>
                          <Icon size={14} />
                        </div>
                        <div className={styles.dropdownItemInfo}>
                          <div className={styles.dropdownItemTitle}>{s.title}</div>
                          {s.scope_label && (
                            <div className={styles.dropdownItemMeta}>{s.scope_label}</div>
                          )}
                        </div>
                        <span className={styles.dropdownItemTime}>{timeAgo(s.updated_at)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {todaySessions.length > 0 && (
                <div className={styles.dropdownSection}>
                  <span>Today</span>
                  {todaySessions.map((s) => {
                    const Icon = SESSION_ICONS[s.session_type];
                    const iconClass = SESSION_ICON_CLASS[s.session_type];
                    return (
                      <button
                        key={s.id}
                        className={
                          s.id === activeSessionId
                            ? styles.dropdownItemActive
                            : styles.dropdownItem
                        }
                        onClick={() => handleSelectSession(s.id)}
                      >
                        <div className={`${styles.dropdownItemIcon} ${iconClass}`}>
                          <Icon size={14} />
                        </div>
                        <div className={styles.dropdownItemInfo}>
                          <div className={styles.dropdownItemTitle}>{s.title}</div>
                          {s.scope_label && (
                            <div className={styles.dropdownItemMeta}>{s.scope_label}</div>
                          )}
                        </div>
                        <span className={styles.dropdownItemTime}>{timeAgo(s.updated_at)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <button className={styles.dropdownNew} onClick={handleNewChat}>
                <Plus size={14} />
                New chat session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Context Bar */}
      {activeSession?.scope_label && activeSession.client_id && (
        <div className={styles.contextBar}>
          Chatting about <span className={styles.scopeChip}>{activeSession.scope_label}</span>
        </div>
      )}

      {/* Messages */}
      <div className={styles.chatMessages}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === 'user' ? styles.msgUser : styles.msgAi}
          >
            <div className={styles.bubble}>
              {m.role === 'assistant' ? renderContent(m.content) : m.content}
            </div>
          </div>
        ))}

        {isStreaming && streamingContent && (
          <div className={styles.msgAi}>
            <div className={styles.bubble}>
              {renderContent(streamingContent)}
              <span className={styles.streamingDot} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.chatInputArea}>
        <button className={styles.micBtn} title="Voice input">
          <Mic size={16} />
        </button>
        <input
          className={styles.chatInput}
          type="text"
          placeholder="Ask BrokerOS anything..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={isStreaming || !inputValue.trim()}
          title="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </section>
  );
}
