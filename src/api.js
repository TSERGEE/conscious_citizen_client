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
  return response.text();
};

export const login = async (credentials) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    await handleError(response);
  }

  // Успешный ответ: может быть JSON с токеном или пустой
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    return data.token;
  }
  return ''; // если сессионная аутентификация
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