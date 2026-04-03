// api.js
const BASE_URL = ''; // пустая строка, так как используем прокси

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
  return response.json();
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
  const response = await fetch(`${BASE_URL}/user/password/reset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.text();
};

export const confirmPasswordReset = async (token, newPassword) => {
  const response = await fetch(`${BASE_URL}/user/password/reset/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.text();
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