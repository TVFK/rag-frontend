// src/App.jsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import './App.css'; 
import OperatorPage from './pages/OperatorPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>``
          <Route path="/" element={<ChatPage />} />
          <Route path="/operator" element={<OperatorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}