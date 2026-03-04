import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Auth/Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  // Функция валидации email (полностью соответствует правилам из регистрации)
  const validateEmail = (email) => {
    if (!email) return 'Email обязателен';
    // Проверка на соответствие формату email с допустимыми спецсимволами
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!re.test(email)) {
      return 'Некорректный email';
    }
    const localPart = email.split('@')[0];
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return 'Email не может начинаться или заканчиваться точкой до @';
    }
    if (localPart.includes('..')) {
      return 'Email не может содержать две точки подряд до @';
    }
    return '';
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError(''); // сбрасываем ошибку при изменении
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Имитация отправки запроса на сброс пароля
    try {
      // Здесь будет реальный запрос к API /forgot-password
      // const response = await fetch('/api/forgot-password', {
      //   method: 'POST',
      //   body: JSON.stringify({ email }),
      //   headers: { 'Content-Type': 'application/json' }
      // });
      // if (!response.ok) throw new Error('Ошибка отправки');

      // Показываем сообщение об успехе и перенаправляем на страницу входа
      alert('Ссылка для сброса пароля отправлена на ваш email');
      navigate('/login');
    } catch (error) {
      alert('Ошибка при отправке. Попробуйте позже.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Сброс пароля</h2>
      <div className="description">Введите ваш email, и мы вышлем ссылку для сброса пароля.</div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            className={error ? 'error' : ''}
            required
          />
          {error && <span className="error-message">{error}</span>}
        </div>
        <button type="submit">Отправить</button>
      </form>
    </div>
  );
};

export default ForgotPassword;