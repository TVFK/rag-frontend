import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { TOKEN_KEY, ROLE_KEY, USER_KEY } from './api/constants.js';

// Ленивый импорт — CSS грузится только при рендере компонента
const ChatPage     = lazy(() => import('./pages/ChatPage'));
const OperatorPage = lazy(() => import('./pages/OperatorPage'));
const AdminPage    = lazy(() => import('./pages/AdminPage'));

// LoginPage можно оставить обычным — он лёгкий и нужен сразу
import LoginPage from './pages/LoginPage';

function loadAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const role  = localStorage.getItem(ROLE_KEY);
  const user  = localStorage.getItem(USER_KEY);
  return token ? { token, role, user } : null;
}

export default function App() {
  const [auth, setAuth] = useState(loadAuth);

  const handleLogin = (token, role, username) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY,  role);
    localStorage.setItem(USER_KEY,  username);
    setAuth({ token, role, user: username });
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth(null);
  };

  useEffect(() => {
    const handler = () => handleLogout();
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Suspense fallback={null}>
          <Routes>
            <Route
              path="/login"
              element={auth ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />}
            />
            <Route
              path="/"
              element={auth ? <ChatPage auth={auth} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/operator"
              element={
                auth && (auth.role === 'OPERATOR' || auth.role === 'ADMIN')
                  ? <OperatorPage auth={auth} onLogout={handleLogout} />
                  : <Navigate to={auth ? '/' : '/login'} replace />
              }
            />
            <Route
              path="/admin"
              element={
                auth && auth.role === 'ADMIN'
                  ? <AdminPage auth={auth} onLogout={handleLogout} />
                  : <Navigate to={auth ? '/' : '/login'} replace />
              }
            />
            <Route path="*" element={<Navigate to={auth ? '/' : '/login'} replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}