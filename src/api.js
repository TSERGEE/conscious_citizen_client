// api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Универсальная функция обработки ошибок
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
    // Если чтение не удалось, используем статус
    errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
  }
  throw new Error(errorMessage);
};

export const register = async (userData) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    await handleError(response);
  }

  // Успешный ответ: возвращаем текст (сообщение)
  return response.text();
};

export const login = async (credentials) => {
  const response = await fetch(`/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    await handleError(response);
  }

  const data = await response.json();
  //console.log('RESPONSE:', data);
  localStorage.setItem('accessToken', data.token);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', data.id); // добавить
  console.log('RESPONSE:', data);
  return { token: data.token, refreshToken: data.refreshToken, userId: data.id };
};
export const getUser = async (login) => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`/user/${login}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Ошибка загрузки пользователя');
  }
  //const text = await response.text();
  //console.log('LOGIN RESPONSE:', text);
  return response.json();
};

export const getUserRole = async (login) => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`/user/${login}/role`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Ошибка загрузки роли');
  }

  return response.text();
};

export const updateUser = async (login, data) => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`/user/${login}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Ошибка обновления профиля');
  }

  return response.json();
};
export const requestPasswordReset = async (email) => {
  const response = await fetch('/user/password/reset/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) await handleError(response);
};

export const confirmPasswordReset = async (token, newPassword) => {
  const response = await fetch('/user/password/reset/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!response.ok) await handleError(response);
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken"); // или где хранишь токен после логина
  const userId = localStorage.getItem("userId");
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
    Authorization: `Bearer ${token}`,
  };
};

export const createIncident = async (incident) => {
  const response = await fetch(`${BASE_URL}/api/incidents`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(incident),
  });

  if (!response.ok) {
    let errMessage = 'Ошибка создания инцидента';
    try {
      const err = await response.json();
      errMessage = err.message || errMessage;
    } catch {}
    throw new Error(errMessage);
  }

  return response.json();
};

export const getAllIncidents = async () => {
  const response = await fetch(`${BASE_URL}/api/incidents`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleError(response);
  return response.json();
};

export const getIncidentById = async (id) => {
  const response = await fetch(`${BASE_URL}/api/incidents/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) throw new Error('Инцидент не найден');
  return response.json();
};

export const getDraftIncidents = async () => {
  const response = await fetch(`${BASE_URL}/api/incidents/drafts`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
};

// Функция для загрузки ОДНОЙ фотографии
export const uploadIncidentPhoto = async (incidentId, file) => {
  const token = localStorage.getItem("accessToken");
  const userId = localStorage.getItem("userId");

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/photos`, {
    method: 'POST',
    headers: {
      // Важно: для FormData Content-Type не ставим вручную, браузер сделает это сам
      'X-User-Id': userId,
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
};

// Функция для получения списка фотографий инцидента
export const getIncidentPhotos = async (incidentId) => {
  const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/photos`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
};

/**
 * Получение всех инцидентов для администратора
 * Использует GET /api/incidents/admin
 */
export const getAllAdminIncidents = async () => {
  const response = await fetch(`${BASE_URL}/api/incidents/admin`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleError(response);
  return response.json();
};

/**
 * Удаление инцидента по ID (только для админа)
 * Предполагаем, что на сервере есть DELETE /api/incidents/{id}
 */
export const deleteIncident = async (incidentId) => {
  const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await handleError(response);
  }

  // Проверяем, есть ли что-то в ответе, прежде чем парсить JSON
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  // Если ответа нет (void на сервере), просто возвращаем успех
  return { success: true }; 
};

/**
 * Изменение статуса инцидента (активный/черновик)
 * Предполагаем PUT /api/incidents/{id}/status с телом { active: boolean }
 */
export const updateIncidentStatus = async (incidentId, active) => {
  const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!response.ok) await handleError(response);
  return response.json();
};
export const updateIncident = async (incidentId, incidentData) => {
  const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}`, {
    method: 'PUT', // Spring Boot ждет PUT
    headers: getAuthHeaders(),
    body: JSON.stringify(incidentData),
  });
  if (!response.ok) await handleError(response);
  return response.json();
};
export const getAllUsers = async () => {
  // Путь должен соответствовать @RequestMapping("/user") + @GetMapping("/admin/userstats")
  const response = await fetch(`${BASE_URL}/user/admin/userstats`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    await handleError(response);
  }
  
  return response.json();
};
/**
 * Генерация документа для инцидента (асинхронная)
 * POST /api/incidents/{id}/document
 */
export const generateDocument = async (incidentId) => {
  const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/document`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await handleError(response);
  }

  // Ответ 202 Accepted без тела
  return;
};

/**
 * Скачивание документа (attachment)
 * GET /api/incidents/{id}/document
 * Возвращает Blob с PDF
 */
// api.js — альтернативный вариант без handleError для downloadDocument
export const downloadDocument = async (incidentId) => {
  const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/document`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (response.status === 404) {
    // Пробрасываем специальную ошибку, чтобы waitForDocument мог её распознать
    const error = new Error('Document not generated');
    error.status = 404;
    throw error;
  }

  if (!response.ok) {
    await handleError(response);
  }

  return await response.blob();
};

/**
 * Просмотр документа в браузере (inline)
 * GET /api/incidents/{id}/document/view
 * Возвращает Blob с PDF
 */
export const viewDocument = async (incidentId) => {
  const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/document/view`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return await response.blob();
};

/**
 * Отправка документа по email
 * POST /api/incidents/{id}/document/send
 */
export const sendDocumentByEmail = async (incidentId) => {
  const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/document/send`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return;
};
export const deleteIncidentPhoto = async (incidentId, photoId) => {
  const response = await fetch(`${BASE_URL}/api/incidents/${incidentId}/photos/${photoId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleError(response);
  // обычно 204 No Content
};