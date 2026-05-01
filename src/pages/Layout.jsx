import './Layout.css';

const NAV_ITEMS = {
  USER:     ['chat'],
  OPERATOR: ['chat', 'documents'],
  ADMIN:    ['chat', 'documents', 'admin'],
};

const NAV_LABELS = {
  chat:      { label: 'Чат', icon: ChatIcon },
  documents: { label: 'Документы', icon: DocsIcon },
  admin:     { label: 'Пользователи', icon: UsersIcon },
};

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

const ROLE_BADGE = {
  ADMIN:    { label: 'Администратор', cls: 'badge-admin' },
  OPERATOR: { label: 'Оператор',      cls: 'badge-operator' },
  USER:     { label: 'Пользователь',  cls: 'badge-user' },
};

export default function Layout({ role, username, activePage, onNavigate, onLogout, children }) {
  const navItems = NAV_ITEMS[role] ?? ['chat'];
  const badge = ROLE_BADGE[role] ?? ROLE_BADGE.USER;

  return (
    <div className="layout">
      {/* Top navigation bar */}
      <header className="layout-header">
        {/* Brand */}
        <div className="layout-brand">
          <div className="layout-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2"/>
              <circle cx="12" cy="5" r="2"/>
              <line x1="12" y1="7" x2="12" y2="11"/>
              <line x1="8" y1="16" x2="8" y2="16" strokeWidth="2.5"/>
              <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2.5"/>
              <line x1="16" y1="16" x2="16" y2="16" strokeWidth="2.5"/>
            </svg>
          </div>
          <span className="layout-brand-name">RAG Ассистент</span>
        </div>

        {/* Nav tabs */}
        <nav className="layout-nav">
          {navItems.map(key => {
            const Icon = NAV_LABELS[key].icon;
            return (
              <button
                key={key}
                className={`layout-nav-item${activePage === key ? ' active' : ''}`}
                onClick={() => onNavigate(key)}
              >
                <Icon />
                {NAV_LABELS[key].label}
              </button>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="layout-user">
          <div className="layout-user-info">
            <span className="layout-username">{username}</span>
            <span className={`layout-badge ${badge.cls}`}>{badge.label}</span>
          </div>
          <button className="layout-logout-btn" onClick={onLogout} title="Выйти">
            <LogoutIcon />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="layout-content">
        {children}
      </main>
    </div>
  );
}