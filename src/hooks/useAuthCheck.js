import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOKEN_KEY } from '../api/constants.js';

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function useAuthCheck(allowedRoles) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const payload = parseJwt(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      navigate('/login', { replace: true });
      return;
    }

    if (allowedRoles && !allowedRoles.includes(payload.role)) {
      navigate('/', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // пустой массив — проверяем только при монтировании
}