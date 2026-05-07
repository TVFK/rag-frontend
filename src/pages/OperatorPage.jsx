import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiUploadDocument } from '../api/api.js';
import '../assets/OperatorPage.css';
import useAuthCheck from '../hooks/useAuthCheck.js';

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/markdown',
  'text/csv',
];

const ALLOWED_EXT = ['.pdf', '.txt', '.doc', '.docx', '.md', '.csv'];

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}

function FileIcon({ type }) {
  const color = type?.includes('pdf') ? '#f87171'
    : type?.includes('word') || type?.includes('doc') ? '#60a5fa'
    : type?.includes('text') || type?.includes('markdown') ? '#a3e635'
    : '#94a3b8';

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28,flexShrink:0}}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

function UploadItem({ item, onRemove }) {
  return (
    <div className={`upload-item upload-item--${item.status}`}>
      <FileIcon type={item.file.type} />
      <div className="upload-item-info">
        <div className="upload-item-name">{item.file.name}</div>
        <div className="upload-item-meta">
          {formatBytes(item.file.size)}
          {item.status === 'uploading' && (
            <span className="upload-item-progress"> · {item.progress}%</span>
          )}
          {item.status === 'done' && (
            <span className="upload-item-ok"> · Загружено</span>
          )}
          {item.status === 'error' && (
            <span className="upload-item-err"> · {item.error}</span>
          )}
        </div>
        {item.status === 'uploading' && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${item.progress}%` }} />
          </div>
        )}
      </div>
      <div className="upload-item-right">
        {item.status === 'uploading' && <span className="upload-spinner" />}
        {item.status === 'done' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
        {item.status === 'error' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        )}
        {item.status !== 'uploading' && (
          <button className="upload-item-remove" onClick={() => onRemove(item.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Иконки (скопированы из AdminPage) ─────────────────────────────────── */
function IconBot() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ── Аватар с выпадающим меню выхода ─────────────────────────────────── */
function UserAvatar({ auth, onLogout }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}
      onMouseDown={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        title={auth?.user ?? 'Профиль'}
        style={{
          width: 34, height: 34, borderRadius: '50%',
          background: '#6366f1', border: '2px solid transparent',
          cursor: 'pointer', color: '#fff', fontWeight: 700,
          fontSize: 13, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
          transition: 'border-color .15s',
          ...(open ? { borderColor: '#818cf8' } : {}),
        }}
      >
        {(auth?.user?.[0] ?? '?').toUpperCase()}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 42,
          background: '#13131f', border: '1px solid #2a2a3e',
          borderRadius: 10, padding: 6, minWidth: 170,
          zIndex: 300, boxShadow: '0 8px 28px rgba(0,0,0,.55)',
        }}>
          <div style={{
            padding: '6px 10px 10px',
            borderBottom: '1px solid #2a2a3e', marginBottom: 4,
          }}>
            <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>Вы вошли как</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{auth?.user}</div>
          </div>
          <button
            onClick={onLogout}
            style={{
              width: '100%', padding: '7px 10px',
              background: 'transparent', border: 'none',
              borderRadius: 6, cursor: 'pointer',
              color: '#f87171', fontSize: 13,
              textAlign: 'left', display: 'flex',
              alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <IconLogout />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Боковая панель ─────────────────────────────────────────────────── */
function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo"><IconBot /></div>
        <div className="sidebar-brand-text">
          <div className="sidebar-title">RAG Ассистент</div>
          <div className="sidebar-sub">IT Admin</div>
        </div>
      </div>

      <nav className="sidebar-nav-links" style={{ marginTop: 24 }}>
        <Link to="/" className="sidebar-nav-link">
          <IconChat />
          Чат с ИИ
        </Link>
        <Link to="/operator" className="sidebar-nav-link">
          <IconShield />
          Панель оператора
        </Link>
        <Link to="/admin" className="sidebar-nav-link">
          <IconShield />
          Панель администратора
        </Link>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="status-dot" />
          Сервер онлайн
        </div>
      </div>
    </aside>
  );
}

/* ── Страница оператора (теперь с боковой панелью и аватаром) ────────── */
export default function OperatorPage({ auth, onLogout }) {
  useAuthCheck(['OPERATOR', 'ADMIN']);
  const [items, setItems]     = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = useCallback((files) => {
    const newItems = [...files].map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      status: 'pending',
      progress: 0,
      error: null,
    }));
    setItems(prev => [...prev, ...newItems]);

    // Upload each file
    newItems.forEach(item => {
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'uploading' } : i
      ));

      apiUploadDocument(item.file, (pct) => {
        setItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, progress: pct } : i
        ));
      })
        .then(() => {
          setItems(prev => prev.map(i =>
            i.id === item.id ? { ...i, status: 'done', progress: 100 } : i
          ));
        })
        .catch(err => {
          setItems(prev => prev.map(i =>
            i.id === item.id ? { ...i, status: 'error', error: err.message } : i
          ));
        });
    });
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleFileInput = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const clearDone = () => setItems(prev => prev.filter(i => i.status !== 'done'));

  const doneCount = items.filter(i => i.status === 'done').length;
  const uploadingCount = items.filter(i => i.status === 'uploading').length;

  return (
    <div className="op-layout">
      <Sidebar />

      <main className="op-main">
        {/* Верхняя панель с заголовком, кнопкой очистки и аватаром */}
        <div className="op-topbar">
          <h2 className="op-title">Загрузка документов</h2>
          {doneCount > 0 && !uploadingCount && (
            <button className="op-clear-btn" onClick={clearDone}>
              Очистить завершённые
            </button>
          )}
          <UserAvatar auth={auth} onLogout={onLogout} />
        </div>

        <div className="op-content">
          <p className="op-desc">
            Добавьте файлы для обработки и индексации в базу знаний RAG-системы
          </p>

          {/* Drop zone */}
          <div
            className={`drop-zone${dragging ? ' drop-zone--active' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_EXT.join(',')}
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <div className="drop-zone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div className="drop-zone-text">
              {dragging ? 'Отпустите файлы' : 'Перетащите файлы или нажмите для выбора'}
            </div>
            <div className="drop-zone-hint">
              {ALLOWED_EXT.join('  ·  ')}
            </div>
          </div>

          {/* File list */}
          {items.length > 0 && (
            <div className="upload-list">
              <div className="upload-list-header">
                <span>Файлы · {items.length}</span>
                {uploadingCount > 0 && (
                  <span className="upload-list-active">
                    Загружается {uploadingCount}...
                  </span>
                )}
              </div>
              {items.map(item => (
                <UploadItem key={item.id} item={item} onRemove={removeItem} />
              ))}
            </div>
          )}

          {/* Allowed types info */}
          <div className="op-info-block">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0,marginTop:1}}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>Поддерживаемые форматы:</strong> PDF, TXT.
              Загруженные документы будут обработаны и добавлены в базу знаний системы.
              После индексации ИИ-ассистент сможет использовать эти данные для ответов.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}