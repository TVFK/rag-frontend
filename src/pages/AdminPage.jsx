import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiGetUsers, apiCreateUser, apiUpdateUserRole, apiDeleteUser } from '../api/api.js';
import '../assets/AdminPage.css';

const ROLES = ['USER', 'OPERATOR', 'ADMIN'];

const ROLE_BADGE = {
  ADMIN:    { label: 'Администратор', cls: 'rbadge-admin' },
  OPERATOR: { label: 'Оператор',      cls: 'rbadge-operator' },
  USER:     { label: 'Пользователь',  cls: 'rbadge-user' },
};

/* ── Иконки ─────────────────────────────────────────────────────────────── */

function PlusIcon() { /* ... без изменений */ }
function TrashIcon() { /* ... без изменений */ }
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
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

/* ── Аватар с выпадающим меню выхода ─────────────────────────────────────── */
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

/* ── Боковая панель ─────────────────────────────────────────────────────── */
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

/* ── Модальное окно создания пользователя ────────────────────────────────── */
function CreateUserModal({ onClose, onCreated }) { /* без изменений */ }

/* ── Страница администрирования ─────────────────────────────────────────── */
export default function AdminPage({ auth, onLogout }) {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [roleLoading, setRoleLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState({});
  const [search, setSearch]       = useState('');

  const fetchUsers = useCallback(async () => { /* без изменений */ }, []);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (user, newRole) => { /* без изменений */ };
  const handleDelete = async (user) => { /* без изменений */ };
  const handleCreated = (newUser) => { /* без изменений */ };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <Sidebar />

      <main className="admin-main">
        {/* Верхняя панель с заголовком и аватаром */}
        <div className="admin-topbar">
          <h2 className="admin-title">Управление пользователями</h2>
          <UserAvatar auth={auth} onLogout={onLogout} />
        </div>

        <div className="admin-content">
          {/* Кнопка создания + статистика + поиск */}
          <div className="admin-page-header">
            <div>
              <p className="admin-desc">
                Создавайте аккаунты и управляйте ролями участников системы
              </p>
            </div>
            <button className="admin-add-btn" onClick={() => setShowModal(true)}>
              <PlusIcon />
              Создать пользователя
            </button>
          </div>

          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="admin-search"
                type="text"
                placeholder="Поиск по логину..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="admin-stats">
              {ROLES.map(r => {
                const count = users.filter(u => u.role === r).length;
                return (
                  <div key={r} className={`admin-stat admin-stat--${r.toLowerCase()}`}>
                    <span className="admin-stat-count">{count}</span>
                    <span className="admin-stat-label">{ROLE_BADGE[r].label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Таблица пользователей (весь существующий код загрузки/ошибок/таблицы) */}
          {loading && (
            <div className="admin-loading">
              <span className="btn-spinner" style={{width:24,height:24,borderWidth:2}} />
              Загрузка пользователей...
            </div>
          )}

          {error && (
            <div className="admin-error-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,flexShrink:0}}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
              <button className="admin-retry-btn" onClick={fetchUsers}>Повторить</button>
            </div>
          )}

          {!loading && !error && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Роль</th>
                    <th style={{ width: 52, textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={3} className="admin-empty">
                        {search ? 'Пользователи не найдены' : 'Нет пользователей'}
                      </td>
                    </tr>
                  )}
                  {filtered.map(user => {
                    const isMe = user.username === auth?.user;
                    return (
                      <tr key={user.id} className={isMe ? 'admin-row--me' : ''}>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar">
                              {user.username?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div>
                              <div className="admin-user-name">
                                {user.username}
                                {isMe && <span className="admin-you-badge">вы</span>}
                              </div>
                              {user.enabled === false && (
                                <div className="admin-disabled-label">Отключён</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="role-pill-group">
                            {ROLES.map(r => (
                              <button
                                key={r}
                                className={`role-pill role-pill--${r.toLowerCase()}${user.role === r ? ' active' : ''}`}
                                onClick={() => handleRoleChange(user, r)}
                                disabled={roleLoading[user.id] || isMe}
                                title={isMe ? 'Нельзя изменить свою роль' : undefined}
                              >
                                {ROLE_BADGE[r].label}
                              </button>
                            ))}
                            {roleLoading[user.id] && (
                              <span className="btn-spinner" style={{marginLeft:8}} />
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {!isMe && (
                            <button
                              className="admin-delete-btn"
                              onClick={() => handleDelete(user)}
                              disabled={deleteLoading[user.id]}
                              title="Удалить пользователя"
                            >
                              {deleteLoading[user.id]
                                ? <span className="btn-spinner" style={{width:14,height:14}} />
                                : <TrashIcon />}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}