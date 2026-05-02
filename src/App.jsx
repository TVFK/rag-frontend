import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TOKEN_KEY, ROLE_KEY, USER_KEY } from './api/constants.js';
import ChatPage     from './pages/ChatPage';
import OperatorPage from './pages/OperatorPage';
import LoginPage    from './pages/LoginPage';
import AdminPage    from './pages/AdminPage';

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

  // Глобальный обработчик истечения токена (из api.js)
  useEffect(() => {
    const handler = () => handleLogout();
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route
            path="/login"
            element={
              auth
                ? <Navigate to="/" replace />
                : <LoginPage onLogin={handleLogin} />
            }
          />
          <Route
            path="/"
            element={
              auth
                ? <ChatPage auth={auth} onLogout={handleLogout} />
                : <Navigate to="/login" replace />
            }
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
      </div>
    </BrowserRouter>
  );
}