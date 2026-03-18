import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PasswordInput from '../PasswordInput/PasswordInput';
import '../Auth/Auth.css';
import eyeOpen from '../../assets/icons/eye-open.png';
import eyeClosed from '../../assets/icons/eye-closed.png';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    login: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [subscribeNews, setSubscribeNews] = useState(true); // по умолчанию true

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Сбрасываем ошибку поля при изменении
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Валидация логина
  const validateLogin = (login) => {
    if (!login) return 'Логин обязателен';
    // Допустимые символы: латиница, цифры, тире, подчёркивание, точка
    if (!/^[a-zA-Z0-9._-]+$/.test(login)) {
      return 'Логин может содержать только латинские буквы, цифры, точки, тире и подчёркивания';
    }
    if (login.startsWith('.') || login.endsWith('.')) {
      return 'Логин не может начинаться или заканчиваться точкой';
    }
    //if (login.includes('..')) {
    //  return 'Логин не может содержать две точки подряд';
    //}
    return '';
  };

  // Валидация email по расширенным правилам
  const validateEmail = (email) => {
    if (!email) return 'Email обязателен';
    // Общее регулярное выражение для email, допускающее спецсимволы до @
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!re.test(email)) {
      return 'Некорректный email';
    }
    // Дополнительно: точка не может быть первым или последним символом в локальной части
    const localPart = email.split('@')[0];
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return 'Email не может начинаться или заканчиваться точкой до @';
    }
    if (localPart.includes('..')) {
      return 'Email не может содержать две точки подряд до @';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Пароль обязателен';
    if (password.length < 8) return 'Пароль должен быть не менее 8 символов';
    // Проверка на допустимые символы (по спецификации: латиница, цифры, спецсимволы, пробел)
    // Включает пробел, знаки пунктуации и т.д. — практически любой печатный символ ASCII кроме кириллицы.
    if (!/^[A-Za-z0-9 !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/.test(password)) {
      return 'Пароль содержит недопустимые символы';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Валидация всех полей
    const loginError = validateLogin(formData.login);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmError = formData.password !== formData.confirmPassword ? 'Пароли не совпадают' : '';

    setErrors({
      login: loginError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmError
    });

    if (loginError || emailError || passwordError || confirmError) {
      return;
    }

    if (!agreeTerms) {
      alert('Необходимо согласиться с правилами проекта');
      return;
    }

    // Имитация отправки на сервер
    try {
      // Здесь будет реальный запрос к API
      // const response = await fetch('/api/register', { ... });
      // if (!response.ok) throw new Error('Ошибка');

      // Сохраняем базовую информацию (например, email) в localStorage
      localStorage.setItem('user', JSON.stringify({ email: formData.email, login: formData.login }));

      // Переход на экран ввода данных профиля
      navigate('/profile/edit');
    } catch (error) {
      alert('Ошибка регистрации. Попробуйте позже.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Регистрация</h2>
      <div className="description">Для продолжения Вам необходимо выполнить регистрацию</div>
      <form onSubmit={handleSubmit}>
        {/* Логин */}
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

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? 'error' : ''}
            required
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        {/* Пароль */}
        <PasswordInput
          id="password"
          name="password"
          label="Пароль"
          value={formData.password}
          onChange={handleChange}
          placeholder=""
          required
          error={errors.password}
          iconShow={<img src={eyeOpen} alt="show" width="20" height="20" />}
          iconHide={<img src={eyeClosed} alt="hide" width="20" height="20" />}
        />

        {/* Подтверждение пароля */}
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Подтверждение пароля"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder=""
          required
          error={errors.confirmPassword}
          iconShow={<img src={eyeOpen} alt="show" width="20" height="20" />}
          iconHide={<img src={eyeClosed} alt="hide" width="20" height="20" />}
        />

        {/* Согласие с правилами */}
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
            <span>
              Я согласен с <Link to="/rules" target="_blank">правилами проекта "Сознательный гражданин"</Link>
            </span>
          </label>
        </div>

        {/* Согласие на рассылку */}
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={subscribeNews}
              onChange={(e) => setSubscribeNews(e.target.checked)}
            />
            <span>Я хочу получать рассылку о новостях на email</span>
          </label>
        </div>

        <button type="submit">Зарегистрироваться</button>
      </form>
    </div>
  );
};

export default Register;