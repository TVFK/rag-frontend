import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = 'http://localhost:8080/api/v1/answer';

const SUGGESTIONS = [
  'Как создать новый проект?',
  'Расскажи об управлении задачами',
  'Что такое RAG система?',
  'Как настроить права доступа?',
];

// ─── Icons ──────────────────────────────────────────────────────────────────

function IconBot() {
  return (
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
}

function IconSend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function IconStop() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2"/>
    </svg>
  );
}

function IconWarn() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

// ─── Render message text with simple markdown-like formatting ────────────────

function MessageContent({ text, streaming }) {
  // Very lightweight: handle inline code and line breaks
  const lines = text.split('\n');
  return (
    <span>
      {lines.map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {renderLine(line)}
        </span>
      ))}
      {streaming && <span className="cursor" />}
    </span>
  );
}

function renderLine(line) {
  // Handle inline code `...`
  const parts = line.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ─── Individual message bubble ───────────────────────────────────────────────

function Message({ role, content, streaming }) {
  return (
    <div className={`message ${role}`}>
      <div className="message-role">
        {role === 'user' ? 'Вы' : 'RAG Ассистент'}
      </div>
      <div className="message-bubble">
        <MessageContent text={content} streaming={streaming} />
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [streaming, setStreaming]   = useState(false);
  const [connected, setConnected]   = useState(true);
  const [error, setError]           = useState(null);

  const messagesEndRef  = useRef(null);
  const textareaRef     = useRef(null);
  const eventSourceRef  = useRef(null);
  const containerRef    = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [input]);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStreaming(false);
  }, []);

  const sendMessage = useCallback(async (question) => {
    if (!question.trim() || streaming) return;

    setError(null);
    const userMessage = { role: 'user', content: question.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Add empty assistant message to stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    setStreaming(true);

    const url = `${API_URL}?question=${encodeURIComponent(question.trim())}`;

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        const chunk = event.data;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return updated;
        });
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        setStreaming(false);
        setConnected(false);
        // If the assistant message is still empty, show error
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && last.content === '') {
            setError('Не удалось подключиться к серверу. Проверьте, что backend запущен на порту 8080.');
            return prev.slice(0, -1);
          }
          return prev;
        });
        setTimeout(() => setConnected(true), 3000);
      };

      // Spring AI SSE ends with a special close signal or just stops
      // We detect "end" by a longer silence — or the backend closes the stream
      es.addEventListener('close', () => {
        es.close();
        eventSourceRef.current = null;
        setStreaming(false);
      });

    } catch (err) {
      setStreaming(false);
      setError('Ошибка подключения: ' + err.message);
    }
  }, [streaming]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (streaming) return;
      sendMessage(input);
    }
  };

  const handleSuggestion = (text) => {
    sendMessage(text);
  };

  const handleSubmit = () => {
    if (streaming) {
      stopStream();
    } else {
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">
            <IconBot />
          </div>
          <div>
            <div className="header-title">RAG Ассистент</div>
            <div className="header-subtitle">IT Project Administration</div>
          </div>
        </div>
        <div className="header-status">
          <span className={`status-dot ${connected ? '' : 'offline'}`} />
          {connected ? 'Online' : 'Reconnecting...'}
        </div>
      </header>

      {/* Messages */}
      <div className="messages-container" ref={containerRef}>
        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon">
              <IconBot />
            </div>
            <div className="empty-title">Чем могу помочь?</div>
            <div className="empty-desc">
              Я — ИИ-ассистент, обученный на внутренней документации вашей компании.
              Задайте вопрос об IT-проектах, процессах или инструментах.
            </div>
            <div className="suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => handleSuggestion(s)}
                >
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
                streaming={streaming && idx === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
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
              className={`send-btn ${streaming ? 'stop-btn' : ''}`}
              onClick={handleSubmit}
              disabled={!streaming && !input.trim()}
              title={streaming ? 'Остановить' : 'Отправить'}
            >
              {streaming ? <IconStop /> : <IconSend />}
            </button>
          </div>
          <div className="input-hint">Enter — отправить&nbsp;&nbsp;·&nbsp;&nbsp;Shift+Enter — новая строка</div>
        </div>
      </div>
    </div>
  );
}