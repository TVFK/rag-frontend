import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import ChatPage from './pages/ChatPage';
import OperatorPage from './pages/OperatorPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import './App.css';

export default function App() {
  const [auth, setAuth] = useState(() => {
    // Восстанавливаем сессию из localStorage при перезагрузке
    const token = localStorage.getItem('rag-jwt');
    const role  = localStorage.getItem('rag-role');
    const user  = localStorage.getItem('rag-user');
    return token ? { token, role, user } : null;
  });

  const handleLogin = (token, role, username) => {
    localStorage.setItem('rag-jwt',  token);
    localStorage.setItem('rag-role', role);
    localStorage.setItem('rag-user', username);
    setAuth({ token, role, user: username });
  };

  const handleLogout = () => {
    localStorage.removeItem('rag-jwt');
    localStorage.removeItem('rag-role');
    localStorage.removeItem('rag-user');
    setAuth(null);
  };

  // Слушаем истечение токена (из handleResponse в api.js)
  useState(() => {
    const handler = () => handleLogout();
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  });

  if (!auth) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<ChatPage onLogout={handleLogout} auth={auth} />} />
          {(auth.role === 'OPERATOR' || auth.role === 'ADMIN') && (
            <Route path="/operator" element={<OperatorPage onLogout={handleLogout} auth={auth} />} />
          )}
          {auth.role === 'ADMIN' && (
            <Route path="/admin" element={<AdminPage onLogout={handleLogout} auth={auth} />} />
          )}
          {/* Редиректим неизвестные пути */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}