import { useState, useEffect, useCallback } from 'react';
import { apiGetUsers, apiCreateUser, apiUpdateUserRole, apiDeleteUser } from '../api/api.js';
import '../assets/AdminPage.css';
import useAuthCheck from '../hooks/useAuthCheck.js';

const ROLES = ['USER', 'OPERATOR', 'ADMIN'];

const ROLE_BADGE = {
  ADMIN:    { label: 'Администратор', cls: 'rbadge-admin' },
  OPERATOR: { label: 'Оператор',      cls: 'rbadge-operator' },
  USER:     { label: 'Пользователь',  cls: 'rbadge-user' },
};

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  );
}

/* ─── Create user modal ─────────────────────────────────────────────────────── */

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ username: '', password: '', role: 'USER' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await apiCreateUser(form.username.trim(), form.password, form.role);
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Новый пользователь</h3>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label">Логин</label>
            <input
              className="modal-input"
              type="text"
              placeholder="username"
              value={form.username}
              onChange={set('username')}
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Пароль</label>
            <div style={{ position: 'relative' }}>
              <input
                className="modal-input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                disabled={loading}
                style={{ paddingRight: 42 }}
              />
              <button type="button" className="modal-eye" onClick={() => setShowPass(s => !s)}>
                {showPass ? '👁' : '👁‍🗨'}
              </button>
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Роль</label>
            <div className="role-select-group">
              {ROLES.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`role-select-btn${form.role === r ? ' active-' + r.toLowerCase() : ''}`}
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  disabled={loading}
                >
                  {ROLE_BADGE[r].label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="modal-error">{error}</div>
          )}

          <div className="modal-actions">
            <button type="button" className="modal-cancel-btn" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button
              type="submit"
              className="modal-submit-btn"
              disabled={loading || !form.username.trim() || !form.password.trim()}
            >
              {loading ? <span className="btn-spinner" /> : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function AdminPage({ currentUsername }) {
  useAuthCheck(['ADMIN']);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [roleLoading, setRoleLoading] = useState({}); // id → bool
  const [deleteLoading, setDeleteLoading] = useState({});
  const [search, setSearch]       = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (user, newRole) => {
    if (user.role === newRole) return;
    setRoleLoading(r => ({ ...r, [user.id]: true }));
    try {
      await apiUpdateUserRole(user.id, newRole);
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, role: newRole } : u
      ));
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      setRoleLoading(r => ({ ...r, [user.id]: false }));
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Удалить пользователя «${user.username}»?`)) return;
    setDeleteLoading(d => ({ ...d, [user.id]: true }));
    try {
      await apiDeleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      setDeleteLoading(d => ({ ...d, [user.id]: false }));
    }
  };

  const handleCreated = (newUser) => {
    if (newUser && newUser.id) {
      setUsers(prev => [...prev, newUser]);
    } else {
      fetchUsers(); // fallback re-fetch if backend returns differently
    }
  };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-root">
      <div className="admin-inner">
        {/* Header */}
        <div className="admin-page-header">
          <div>
            <h2 className="admin-title">Управление пользователями</h2>
            <p className="admin-desc">
              Создавайте аккаунты и управляйте ролями участников системы
            </p>
          </div>
          <button className="admin-add-btn" onClick={() => setShowModal(true)}>
            <PlusIcon />
            Создать пользователя
          </button>
        </div>

        {/* Search + stats */}
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

        {/* Content */}
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
                  const isMe = user.username === currentUsername;
                  return (
                    <tr key={user.id} className={isMe ? 'admin-row--me' : ''}>
                      {/* Username */}
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

                      {/* Role selector */}
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

                      {/* Delete */}
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

      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}