import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../assets/ChatPage.css';
import useAuthCheck from '../hooks/useAuthCheck.js';

const RAG_API_URL = import.meta.env.VITE_RAG_API_URL;

const SUGGESTIONS = [
  'Как создать новый проект?',
  'Расскажи об управлении задачами',
  'Что такое RAG система?',
  'Как настроить права доступа?',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeChat(name) {
  return { id: genId(), name, messages: [], createdAt: Date.now() };
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

// ─── localStorage helpers ────────────────────────────────────────────────────

const LS_CHATS  = 'rag-chats';
const LS_ACTIVE = 'rag-active-chat';

function loadChats() {
  try {
    const raw = localStorage.getItem(LS_CHATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    console.warn('Failed to load chats from localStorage');
  }
  return null;
}

function loadActiveId(chats) {
  try {
    const id = localStorage.getItem(LS_ACTIVE);
    if (id && chats.find(c => c.id === id)) return id;
  } catch {
    console.warn('Failed to load active chat ID from localStorage');
  }
  return chats[0]?.id ?? null;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconBot = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <line x1="12" y1="7" x2="12" y2="11"/>
    <line x1="8" y1="16" x2="8" y2="16" strokeWidth="2.5"/>
    <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2.5"/>
    <line x1="16" y1="16" x2="16" y2="16" strokeWidth="2.5"/>
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconStop = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconWarn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 14, height: 14, flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconSettings = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

// ─── Message content renderer ─────────────────────────────────────────────────

function MessageContent({ text, streaming }) {
  const lines = text.split('\n');
  return (
    <span>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line.split(/(`[^`]+`)/g).map((part, j) =>
            part.startsWith('`') && part.endsWith('`')
              ? <code key={j}>{part.slice(1, -1)}</code>
              : part
          )}
        </span>
      ))}
      {streaming && <span className="cursor" />}
    </span>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function Message({ role, content, timestamp, streaming }) {
  return (
    <div className={`message ${role}`}>
      <div className="message-role">
        <span>{role === 'user' ? 'Вы' : 'RAG Ассистент'}</span>
        {timestamp && !streaming && (
          <span className="message-time">
            {new Date(timestamp).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>
      <div className="message-bubble">
        <MessageContent text={content} streaming={streaming} />
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ chats, activeChatId, onSelect, onCreate, onDelete, connected, collapsed, role }) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo"><IconBot /></div>
        <div className="sidebar-brand-text">
          <div className="sidebar-title">RAG Ассистент</div>
          <div className="sidebar-sub">IT Admin</div>
        </div>
      </div>

      <button className="new-chat-btn" onClick={onCreate}>
        <IconPlus />
        Новый чат
      </button>

      {chats.length > 0 && (
        <div className="chat-list-label">Чаты · {chats.length}</div>
      )}
      <div className="chat-list">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item${chat.id === activeChatId ? ' active' : ''}`}
            onClick={() => onSelect(chat.id)}
          >
            <div className="chat-item-active-bar" />
            <div className="chat-item-inner">
              <div className="chat-item-name">{chat.name}</div>
              <div className="chat-item-meta">
                {chat.messages.length > 0
                  ? `${chat.messages.length} сообщ. · ${formatTime(chat.createdAt)}`
                  : formatTime(chat.createdAt)}
              </div>
            </div>
            <div className="chat-item-actions">
              <button
                className="delete-btn"
                title="Удалить чат"
                onClick={e => { e.stopPropagation(); onDelete(chat.id); }}
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        {(role === 'OPERATOR' || role === 'ADMIN') && (
          <div className="sidebar-nav-links">
            <Link to="/operator" className="sidebar-nav-link">
              <IconShield />
              Панель оператора
            </Link>
            {role === 'ADMIN' && (
              <Link to="/admin" className="sidebar-nav-link">
                <IconSettings />
                Админ-панель
              </Link>
            )}
          </div>
        )}

        <div className="sidebar-status">
          <span className={`status-dot${connected ? '' : ' offline'}`} />
          {connected ? 'Сервер онлайн' : 'Нет соединения'}
        </div>
      </div>
    </aside>
  );
}

// ─── ChatPage ─────────────────────────────────────────────────────────────────

export default function ChatPage({ auth }) {
  useAuthCheck(['USER', 'OPERATOR', 'ADMIN']);
  // ── Init state from localStorage ──────────────────────────────────────────
  const [chats, setChats] = useState(() => {
    const saved = loadChats();
    return saved ?? [makeChat('Новый чат')];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = loadChats();
    const list = saved ?? [makeChat('Новый чат')];
    return loadActiveId(list);
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput]             = useState('');
  const [streaming, setStreaming]     = useState(false);
  const [connected, setConnected]     = useState(true);
  const [error, setError]             = useState(null);

  const textareaRef    = useRef(null);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // ── Persist chats ──────────────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(LS_CHATS, JSON.stringify(chats)); } catch {
      console.warn('Failed to save chats to localStorage');
    }
  }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      try { localStorage.setItem(LS_ACTIVE, activeChatId); } catch {
        console.warn('Failed to save active chat ID to localStorage');
      }
    }
  }, [activeChatId]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeChat = chats.find(c => c.id === activeChatId) ?? null;
  const messages   = activeChat?.messages ?? [];

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Auto-resize textarea ───────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [input]);

  // ─── Chat management ───────────────────────────────────────────────────────

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.abort();
      eventSourceRef.current = null;
    }
    setChats(prev => prev.map(c => {
      const msgs = [...c.messages];
      const last = msgs[msgs.length - 1];
      if (last?.role === 'assistant' && last.timestamp === null) {
        msgs[msgs.length - 1] = { ...last, timestamp: Date.now() };
        return { ...c, messages: msgs };
      }
      return c;
    }));
    setStreaming(false);
  }, []);

  const createChat = useCallback(() => {
    stopStream();
    const chat = makeChat('Новый чат');
    setChats(prev => [chat, ...prev]);
    setActiveChatId(chat.id);
    setInput('');
    setError(null);
  }, [stopStream]);

  const selectChat = useCallback((id) => {
    if (id === activeChatId) return;
    stopStream();
    setActiveChatId(id);
    setInput('');
    setError(null);
  }, [activeChatId, stopStream]);

  const deleteChat = useCallback((id) => {
    if (streaming && id === activeChatId) stopStream();
    setChats(prev => {
      const next = prev.filter(c => c.id !== id);
      if (id === activeChatId) {
        if (next.length === 0) {
          const fresh = makeChat('Новый чат');
          setActiveChatId(fresh.id);
          return [fresh];
        }
        setActiveChatId(next[0].id);
      }
      return next;
    });
  }, [activeChatId, streaming, stopStream]);

  // ─── Messaging ─────────────────────────────────────────────────────────────

  const updateActiveMessages = useCallback((updater) => {
    setChats(prev => prev.map(c =>
      c.id === activeChatId
        ? { ...c, messages: updater(c.messages) }
        : c
    ));
  }, [activeChatId]);

  const sendMessage = useCallback((question) => {
    if (!question.trim() || streaming || !activeChatId) return;

    setError(null);
    const trimmed = question.trim();
    const userTimestamp = Date.now();

    setChats(prev => prev.map(c => {
      if (c.id !== activeChatId) return c;
      const isFirst = c.messages.length === 0;
      return {
        ...c,
        name: isFirst ? trimmed.slice(0, 42) : c.name,
        messages: [...c.messages, { role: 'user', content: trimmed, timestamp: userTimestamp }],
      };
    }));

    setInput('');
    setStreaming(true);

    setTimeout(() => {
      updateActiveMessages(msgs => [...msgs, { role: 'assistant', content: '', timestamp: null }]);
    }, 0);

    const url = `${RAG_API_URL}?question=${encodeURIComponent(trimmed)}`;
    const abortController = new AbortController();
    eventSourceRef.current = abortController;

    (async () => {
      try {
        const response = await fetch(url, {
          signal: abortController.signal,
          headers: { Accept: 'text/event-stream' },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const parseSSEChunk = (raw) => {
          buffer += raw;
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const chunk = line.slice(5); // preserve spaces — do NOT trim
              if (chunk === '[DONE]') continue;

              setChats(prev => prev.map(c => {
                if (c.id !== activeChatId) return c;
                const msgs = [...c.messages];
                const last = msgs[msgs.length - 1];
                if (last?.role === 'assistant') {
                  msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
                }
                return { ...c, messages: msgs };
              }));
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parseSSEChunk(decoder.decode(value, { stream: true }));
        }

        // Stamp assistant message on stream end
        setChats(prev => prev.map(c => {
          if (c.id !== activeChatId) return c;
          const msgs = [...c.messages];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') {
            msgs[msgs.length - 1] = { ...last, timestamp: Date.now() };
          }
          return { ...c, messages: msgs };
        }));

        setStreaming(false);
        eventSourceRef.current = null;

      } catch (err) {
        if (err.name === 'AbortError') return;
        setStreaming(false);
        setConnected(false);
        eventSourceRef.current = null;

        setChats(prev => prev.map(c => {
          if (c.id !== activeChatId) return c;
          const msgs = c.messages;
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant' && last.content === '') {
            setError('Не удалось подключиться к серверу. Убедитесь, что backend запущен на порту 8080.');
            return { ...c, messages: msgs.slice(0, -1) };
          }
          return c;
        }));
        setTimeout(() => setConnected(true), 3000);
      }
    })();
  }, [streaming, activeChatId, updateActiveMessages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!streaming) sendMessage(input);
    }
  };

  const handleSubmit = () => {
    if (streaming) stopStream();
    else sendMessage(input);
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelect={selectChat}
        onCreate={createChat}
        onDelete={deleteChat}
        connected={connected}
        collapsed={!sidebarOpen}
        role={auth.role}
      />

      <div className="main">
        <header className="header">
          <button
            className="toggle-sidebar-btn"
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? 'Скрыть боковую панель' : 'Показать боковую панель'}
          >
            <IconMenu />
          </button>
          <div className="header-chat-name">
            {activeChat?.name ?? 'RAG Ассистент'}
          </div>
          {messages.length > 0 && (
            <div className="header-msg-count">
              {messages.length} сообщ.
            </div>
          )}
        </header>

        <div className="messages-container">
          {isEmpty ? (
            <div className="empty-state">
              <div className="empty-icon"><IconBot /></div>
              <div className="empty-title">Чем могу помочь?</div>
              <div className="empty-desc">
                Я — ИИ-ассистент, обученный на внутренней документации компании.
                Задайте вопрос об IT-проектах, процессах или инструментах.
              </div>
              <div className="suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="suggestion-chip"
                    onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-inner">
              {messages.map((msg, idx) => (
                <Message
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  streaming={
                    streaming &&
                    idx === messages.length - 1 &&
                    msg.role === 'assistant'
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            {error && (
              <div className="error-banner">
                <IconWarn />
                {error}
              </div>
            )}
            <div className="input-box">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Напишите вопрос..."
                disabled={streaming}
              />
              <button
                className={`send-btn${streaming ? ' stop-btn' : ''}`}
                onClick={handleSubmit}
                disabled={!streaming && !input.trim()}
                title={streaming ? 'Остановить' : 'Отправить'}
              >
                {streaming ? <IconStop /> : <IconSend />}
              </button>
            </div>
            <div className="input-hint">
              Enter — отправить&nbsp;&nbsp;·&nbsp;&nbsp;Shift+Enter — новая строка
            </div>
          </div>
        </div>
      </div>
    </>
  );
}