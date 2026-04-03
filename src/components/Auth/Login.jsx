import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PasswordInput from '../PasswordInput/PasswordInput'; // путь к компоненту
import '../Auth/Auth.css';
import eyeOpen from '../../assets/icons/eye-open.png';
import eyeClosed from '../../assets/icons/eye-closed.png';
import { login, getUser, getUserRole } from '../../api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(''); // новое состояние для серверной ошибки

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // очищаем ошибку поля при изменении
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (serverError) setServerError(''); // сбрасываем серверную ошибку при вводе
  };

  // Валидация логина по ТЗ
  const validateLogin = (login) => {
    if (!login.trim()) return 'Логин обязателен';

    // Разрешённые символы: латинские буквы, цифры, дефис, подчёркивание, точка
    const allowedPattern = /^[a-zA-Z0-9._-]+$/;
    if (!allowedPattern.test(login)) {
      return 'Логин может содержать только латинские буквы, цифры, дефис (-), подчёркивание (_) и точку (.)';
    }

    // Запрет на @ и пробел (уже покрыто регуляркой, но на всякий случай)
    if (login.includes('@') || login.includes(' ')) {
      return 'Логин не может содержать @ или пробел';
    }

    // Не начинается и не заканчивается точкой
    if (login.startsWith('.') || login.endsWith('.')) {
      return 'Логин не может начинаться или заканчиваться точкой';
    }

    return '';
  };

  // Валидация пароля с учётом логина
  const validatePassword = (password, login) => {
    if (!password) return 'Пароль обязателен';
    // Исключение для admin/admin
    if (login === 'admin' && password === 'admin') return '';
    if (password.length < 8) return 'Пароль должен быть не менее 8 символов';
    if (!/^[A-Za-z0-9 !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/.test(password)) {
      return 'Пароль содержит недопустимые символы';
    }
    return '';
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const loginError = validateLogin(formData.login);
  const passwordError = validatePassword(formData.password, formData.login); // передаём логин
  setErrors({ login: loginError, password: passwordError });
  if (loginError || passwordError) return;

  try {
    const authData = await login({
      login: formData.login,
      password: formData.password
    });

    localStorage.setItem('accessToken', authData.token);
    localStorage.setItem('refreshToken', authData.refreshToken);
    localStorage.setItem('userLogin', formData.login);

    const user = await getUser(formData.login);
    const role = await getUserRole(formData.login);

    console.log("USER RESPONSE:", user);


    if (!user || user.id == null) {
      throw new Error("Не удалось получить ID пользователя");
    }

    localStorage.setItem('userId', String(user.id));
    const userProfile = {
      ...user,
      role: role
    };

    localStorage.setItem(
      'userProfile',
      JSON.stringify(userProfile)
    );

    console.log("USER PROFILE:", userProfile);

    navigate('/main');
  } catch (error) {
    setServerError(error.message);
  }
};

  return (
    <div className="auth-container">
      <h2>Вход</h2>
      <div className="description">Для продолжения Вам необходимо выполнить вход.</div>
      {serverError && <div className="server-error">{serverError}</div>} {/* блок ошибки */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login">Логин</label>
          <input
            type="text"
            id="login"
            name="login"
            value={formData.login}
            onChange={handleChange}
            className={errors.login ? 'error' : ''}
            required
          />
          {errors.login && <span className="error-message">{errors.login}</span>}
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