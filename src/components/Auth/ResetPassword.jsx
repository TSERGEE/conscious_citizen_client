import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordInput from '../PasswordInput/PasswordInput';
import '../Auth/Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    // сбрасываем ошибку конкретного поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // также сбрасываем ошибку несовпадения, если меняется одно из полей
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
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

  const validateForm = () => {
    const newPasswordError = validatePassword(passwords.newPassword);
    const confirmError = passwords.newPassword !== passwords.confirmNewPassword
      ? 'Пароли не совпадают'
      : '';

    setErrors({
      newPassword: newPasswordError,
      confirmPassword: confirmError
    });

    return !newPasswordError && !confirmError;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Имитация отправки нового пароля на сервер
    try {
      // Здесь будет реальный запрос на /reset-password с токеном из URL
      // const response = await fetch('/api/reset-password', {
      //   method: 'POST',
      //   body: JSON.stringify({ password: passwords.newPassword, token: '...' }),
      //   headers: { 'Content-Type': 'application/json' }
      // });
      // if (!response.ok) throw new Error('Ошибка');

      alert('Пароль успешно изменён');
      navigate('/login');
    } catch (error) {
      alert('Ошибка при смене пароля. Попробуйте позже.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Установка нового пароля</h2>
      <div className="description">Придумайте новый пароль для входа.</div>
      <form onSubmit={handleSubmit}>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          label="Новый пароль"
          value={passwords.newPassword}
          onChange={handleChange}
          required
          error={errors.newPassword}
        />

        <PasswordInput
          id="confirmNewPassword"
          name="confirmNewPassword"
          label="Подтвердите пароль"
          value={passwords.confirmNewPassword}
          onChange={handleChange}
          required
          error={errors.confirmPassword}
        />

        <button type="submit">Сохранить пароль</button>
      </form>
    </div>
  );
};

export default ResetPassword;