import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch { return null; }
}

export default function useAuthCheck(allowedRoles) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const payload = parseJwt(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      // токен истёк или битый
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
      return;
    }

    const userRole = payload.role; // предполагаем, что бэк шлёт role в JWT
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      navigate('/', { replace: true }); // или на свою страницу 403
    }
  }, [allowedRoles, navigate]);
}