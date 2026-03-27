import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestPasswordReset } from '../../api'; // путь к api.js
import '../Auth/Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

const validateEmail = (email) => {
  if (!email) return 'Email обязателен';

  // Базовая проверка формата
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!re.test(email)) {
    return 'Некорректный email';
  }

  const [localPart, domain] = email.split('@');

  // Проверка локальной части
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return 'Email не может начинаться или заканчиваться точкой до @';
  }
  if (localPart.includes('..')) {
    return 'Email не может содержать две точки подряд до @';
  }

  // Проверка доменной части
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) {
    return 'Домен верхнего уровня должен содержать только буквы (минимум 2 символа)';
  }
  if (domainParts.some(part => part.startsWith('-') || part.endsWith('-'))) {
    return 'Сегменты домена не могут начинаться или заканчиваться дефисом';
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

    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      alert('Ссылка для сброса пароля отправлена на ваш email');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Отправка...' : 'Отправить'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;