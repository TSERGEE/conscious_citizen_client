// api.js
//const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
//const BASE_URL = 'http://localhost:54455';

// --- Переменные для предотвращения множественных обновлений токена ---
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// --- Функция обновления access-токена ---
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('Нет refresh токена');
  }

  console.log('[Auth] Обновление токена...');
  const response = await fetch(`/auth/refreshToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    // Очищаем всё, так как refreshToken невалиден
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    throw new Error('Не удалось обновить токен. Пожалуйста, войдите заново.');
  }

  const data = await response.json();
  console.log('[Auth] Токен обновлён:', data);
  
  // ⚠️ Убедитесь, что сервер возвращает поле `token`
  const newAccessToken = data.token || data.accessToken;
  if (!newAccessToken) {
    throw new Error('Сервер не вернул новый токен');
  }
  
  localStorage.setItem('accessToken', newAccessToken);
  // Если сервер выдаёт и новый refreshToken – сохраните его
  if (data.refreshToken) {
    localStorage.setItem('refreshToken', data.refreshToken);
  }
  return newAccessToken;
};

// --- Универсальная обработка ошибок ответа (без рефреша) ---
const handleError = async (response) => {
  let errorMessage = 'Произошла ошибка. Попробуйте позже.';
  const contentType = response.headers.get('content-type');

  try {
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } else {
      const text = await response.text();
      if (text) errorMessage = text;
    }
  } catch (e) {
    errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
  }
  throw new Error(errorMessage);
};

// --- Обёртка для авторизованных запросов с автоматическим обновлением токена ---
export const fetchWithAuth = async (url, options = {}) => {
  // Получаем текущий токен
  const getToken = () => localStorage.getItem('accessToken');

  const executeRequest = async (token) => {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
    // Добавляем X-User-Id, если он есть
    const userId = localStorage.getItem('userId');
    if (userId && !headers['X-User-Id']) {
      headers['X-User-Id'] = userId;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Токен истёк – пробуем обновить
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          onRefreshed(newToken);
          isRefreshing = false;
          // Повторяем исходный запрос с новым токеном
          return executeRequest(newToken);
        } catch (err) {
          isRefreshing = false;
          // Очищаем подписчиков и выбрасываем ошибку
          refreshSubscribers = [];
          throw err;
        }
      } else {
        // Ждём окончания обновления
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(async (newToken) => {
            try {
              const result = await executeRequest(newToken);
              resolve(result);
            } catch (err) {
              reject(err);
            }
          });
        });
      }
    }
    console.log('[fetchWithAuth] token exists:', !!token);
    console.log('[fetchWithAuth] headers:', headers);
    if (!response.ok) {
      await handleError(response);
    }
    return response;
  };

  const token = getToken();
  if (!token) {
    // Если нет токена, но запрос требует авторизации – пробуем выполнить без него?
    // Лучше выбросить ошибку, чтобы не слать запрос без авторизации.
    throw new Error('Нет access токена. Пожалуйста, войдите.');
  }
  return executeRequest(token);
};

// --- Публичные функции без авторизации (не используют fetchWithAuth) ---
export const register = async (userData) => {
  const response = await fetch(`/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) await handleError(response);
  return response.text();
};

export const login = async (credentials) => {
  const response = await fetch(`/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) await handleError(response);
  const data = await response.json();

  localStorage.setItem('accessToken', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', data.id);
  const userLogin = data.login || data.username || credentials.login;
  localStorage.setItem('userLogin', userLogin);

  return { token: data.token, refreshToken: data.refreshToken, userId: data.id };
};

export const requestPasswordReset = async (email) => {
  const response = await fetch(`/user/password/reset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) await handleError(response);
};

export const confirmPasswordReset = async (token, newPassword) => {
  const response = await fetch(`/user/password/reset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!response.ok) await handleError(response);
};

// --- Защищённые функции, переписанные через fetchWithAuth ---

export const getUser = async (login) => {
  const response = await fetchWithAuth(`/user/${login}`, {
    method: 'GET',
  });
  return response.json();
};

export const getUserRole = async (login) => {
  const response = await fetchWithAuth(`/user/${login}/role`, {
    method: 'GET',
  });
  return response.text();
};

export const updateUser = async (login, data) => {
  const response = await fetchWithAuth(`/user/${login}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const createIncident = async (incident) => {
  const response = await fetchWithAuth(`/api/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incident),
  });
  return response.json();
};

export const getAllIncidents = async () => {
  const response = await fetchWithAuth(`/api/incidents`, {
    method: 'GET',
  });
  return response.json();
};

export const getIncidentById = async (id) => {
  const response = await fetchWithAuth(`/api/incidents/${id}`, {
    method: 'GET',
  });
  return response.json();
};

export const getDraftIncidents = async () => {
  const response = await fetchWithAuth(`/api/incidents/drafts`, {
    method: 'GET',
  });
  return response.json();
};

export const uploadIncidentPhoto = async (incidentId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  // Для FormData заголовок Content-Type не устанавливаем
  const response = await fetchWithAuth(`/api/incidents/${incidentId}/photos`, {
    method: 'POST',
    body: formData,
    // Не указываем Content-Type, браузер установит сам
  });
  return true; // просто успех
};

export const getIncidentPhotos = async (incidentId) => {
  const response = await fetchWithAuth(`/api/incidents/${incidentId}/photos`, {
    method: 'GET',
  });
  return response.json();
};

export const getAllAdminIncidents = async () => {
  const response = await fetchWithAuth(`/api/incidents/admin`, {
    method: 'GET',
  });
  return response.json();
};

export const deleteIncident = async (incidentId) => {
  const response = await fetchWithAuth(`/api/incidents/${incidentId}`, {
    method: 'DELETE',
  });
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return { success: true };
};

export const updateIncident = async (incidentId, incidentData) => {
  const response = await fetchWithAuth(`/api/incidents/${incidentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incidentData),
  });
  return response.json();
};

export const getAllUsers = async () => {
  const response = await fetchWithAuth(`/user/admin/userstats`, {
    method: 'GET',
  });
  return response.json();
};

export const generateDocument = async (incidentId) => {
  const response = await fetchWithAuth(`/api/incidents/${incidentId}/document`, {
    method: 'POST',
  });
  // Ожидается 202 Accepted, без тела
};

export const downloadDocument = async (incidentId) => {
  const response = await fetchWithAuth(`/api/incidents/${incidentId}/document`, {
    method: 'GET',
  });
  if (response.status === 404) {
    const error = new Error('Document not generated');
    error.status = 404;
    throw error;
  }
  return response.blob();
};

export const viewDocument = async (incidentId) => {
  const response = await fetchWithAuth(`/api/incidents/${incidentId}/document/view`, {
    method: 'GET',
  });
  return response.blob();
};

export const sendDocumentByEmail = async (incidentId) => {
  const response = await fetchWithAuth(`/api/incidents/${incidentId}/document/send`, {
    method: 'POST',
  });
};

export const deleteIncidentPhoto = async (incidentId, photoId) => {
  const response = await fetchWithAuth(`/api/incidents/${incidentId}/photos/${photoId}`, {
    method: 'DELETE',
  });
  // обычно 204 No Content
};
export const getIncidentCount = async () => {
  const response = await fetchWithAuth(`/api/incidents/count`, {
    method: 'GET',
  });
  return response.json(); // сервер возвращает Integer
};

export const fetchImageAsBlob = async (url) => {
  const response = await fetchWithAuth(url, {
    method: 'GET',
    headers: {
      'Accept': 'image/*'
    }
  });
  if (!response.ok) throw new Error('Ошибка загрузки изображения');
  return await response.blob();
};
export const uploadAvatar = async (userId, login, file) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  if (!login) {
    throw new Error('Login is required');
  }

  // Валидация файла
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Допустимые форматы: JPEG, PNG, JPG');
  }
  if (file.size > 5 * 1024 * 1024) { // 5 MB
    throw new Error('Файл не должен превышать 5 MB');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetchWithAuth(`/user/${login}/avatar`, {
      method: 'PUT',
      body: formData,
      headers: {
        'X-User-Id': userId // Добавляем обязательный заголовок
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка загрузки аватара:', error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Не удалось подключиться к серверу. Проверьте интернет‑соединение.');
    }
    throw error;
  }
};

export const deleteAvatar = async (login) => {
  try {
    const response = await fetchWithAuth(`/user/${login}/avatar`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка удаления аватара:', error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Не удалось подключиться к серверу.');
    }
    throw error;
  }
};