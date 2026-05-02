import { TOKEN_KEY, ROLE_KEY, USER_KEY, API_BASE } from './constants.js';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

function authHeaders(extra = {}) {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

async function handleResponse(res) {
  if (res.status === 401) {
    clearAuth();
    window.dispatchEvent(new Event('auth:expired'));
    throw new Error('401 Сессия истекла');
  }
  // 403 — нет доступа, но НЕ разлогиниваем
  if (res.status === 403) {
    throw new Error('403 Нет доступа');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

// ─── Documents (OPERATOR, ADMIN) ──────────────────────────────────────────────
export async function apiUploadDocument(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
      } else if (xhr.status === 401) {
        clearAuth();
        window.dispatchEvent(new Event('auth:expired'));
        reject(new Error('Сессия истекла'));
      } else if (xhr.status === 403) {
        reject(new Error('Нет доступа')); // НЕ разлогиниваем
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Ошибка сети'));

    xhr.open('POST', `${API_BASE}/api/documents/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
    xhr.send(formData);
  });
}

export async function apiGetDocuments() {
  const res = await fetch(`${API_BASE}/api/documents`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function apiDeleteDocument(id) {
  const res = await fetch(`${API_BASE}/api/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export async function apiGetUsers() {
  const res = await fetch(`${API_BASE}/api/admin/users`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function apiCreateUser(username, password, role) {
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ username, password, role }),
  });
  return handleResponse(res);
}

export async function apiUpdateUserRole(id, role) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}/role`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
}

export async function apiDeleteUser(id) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Chat SSE URL ─────────────────────────────────────────────────────────────
export function buildAnswerUrl(question) {
  return `${API_BASE}/api/answer?question=${encodeURIComponent(question)}`;
}