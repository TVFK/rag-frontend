const BASE = 'api/rag/api';

function getToken() {
  return localStorage.getItem('rag-jwt') ?? '';
}

function authHeaders(extra = {}) {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function handleResponse(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('rag-jwt');
    localStorage.removeItem('rag-user');
    window.dispatchEvent(new Event('auth:expired'));
    throw new Error(res.status === 403 ? 'Нет доступа' : 'Сессия истекла');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function apiLogin(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

// ─── Documents (OPERATOR, ADMIN) ─────────────────────────────────────────────

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
      } else if (xhr.status === 401 || xhr.status === 403) {
        localStorage.removeItem('rag-jwt');
        localStorage.removeItem('rag-user');
        window.dispatchEvent(new Event('auth:expired'));
        reject(new Error('Нет доступа'));
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Ошибка сети'));

    xhr.open('POST', `${BASE}/api/documents/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
    xhr.send(formData);
  });
}

export async function apiGetDocuments() {
  const res = await fetch(`${BASE}/api/documents`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function apiDeleteDocument(id) {
  const res = await fetch(`${BASE}/api/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function apiGetUsers() {
  const res = await fetch(`${BASE}/api/admin/users`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function apiCreateUser(username, password, role) {
  const res = await fetch(`${BASE}/api/admin/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ username, password, role }),
  });
  return handleResponse(res);
}

export async function apiUpdateUserRole(id, role) {
  const res = await fetch(`${BASE}/api/admin/users/${id}/role`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ role }),
  });
  return handleResponse(res);
}

export async function apiDeleteUser(id) {
  const res = await fetch(`${BASE}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── SSE stream helper (used by chat) ────────────────────────────────────────

export function buildAnswerUrl(question) {
  return `${BASE}/api/v1/answer?question=${encodeURIComponent(question)}`;
}

export { getToken };