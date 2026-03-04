import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PasswordInput from '../PasswordInput/PasswordInput'; // путь к компоненту
import '../Auth/Auth.css';
import eyeOpen from '../../assets/icons/eye-open.png';
import eyeClosed from '../../assets/icons/eye-closed.png';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // очищаем ошибку поля при изменении
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Валидация email (по правилам регистрации)
  const validateEmail = (email) => {
    if (!email) return 'Email или телефон обязателен';
    // Проверка на email (упрощённо, можно добавить проверку телефона позже)
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

  // Валидация пароля (аналогично регистрации)
  const validatePassword = (password) => {
    if (!password) return 'Пароль обязателен';
    if (password.length < 8) return 'Пароль должен быть не менее 8 символов';
    if (!/^[A-Za-z0-9 !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/.test(password)) {
      return 'Пароль содержит недопустимые символы';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setErrors({
      email: emailError,
      password: passwordError
    });

    if (emailError || passwordError) return;

    // Имитация отправки на сервер
    try {
      // Здесь будет реальный запрос к API /login
      // const response = await fetch('/api/login', { ... });
      // if (!response.ok) throw new Error('Ошибка входа');
      // const data = await response.json();
      // localStorage.setItem('token', data.token);

      // Пока просто переходим на профиль (или куда нужно)
      navigate('/profile');
    } catch (error) {
      alert('Ошибка входа. Проверьте данные и попробуйте снова.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Вход</h2>
      <div className="description">Для продолжения Вам необходимо выполнить вход.</div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Телефон или email</label>
          <input
            type="text" // используем text, чтобы можно было вводить и телефон, и email
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
            required
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <PasswordInput
          id="password"
          name="password"
          label="Пароль"
          value={formData.password}
          onChange={handleChange}
          required
          error={errors.password}
          iconShow={<img src={eyeOpen} alt="show" width="20" height="20" />}
          iconHide={<img src={eyeClosed} alt="hide" width="20" height="20" />}
        />

        <button type="submit">Войти</button>
      </form>
      <div className="extra-link">
        <Link to="/forgot-password">Забыли пароль?</Link>
      </div>
    </div>
  );
};

export default Login;