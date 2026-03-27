import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PasswordInput from '../PasswordInput/PasswordInput';
import { confirmPasswordReset } from '../../api';
import '../Auth/Auth.css';
import eyeOpen from '../../assets/icons/eye-open.png';
import eyeClosed from '../../assets/icons/eye-closed.png';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // получаем токен из URL
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

    if (!token) {
      setErrors({ form: 'Недействительная ссылка сброса пароля' });
      return;
    }

    setIsLoading(true);
    try {
      await confirmPasswordReset(token, passwords.newPassword);
      alert('Пароль успешно изменён');
      navigate('/login');
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setIsLoading(false);
    }
  };

return (
    <div className="auth-container">
      <h2>Установка нового пароля</h2>
      <div className="description">Придумайте новый пароль для входа.</div>
      {errors.form && <div className="server-error">{errors.form}</div>}
      <form onSubmit={handleSubmit}>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          label="Новый пароль"
          value={passwords.newPassword}
          onChange={handleChange}
          required
          error={errors.newPassword}
          iconShow={<img src={eyeOpen} alt="show" width="20" height="20" />}
          iconHide={<img src={eyeClosed} alt="hide" width="20" height="20" />}
        />

        <PasswordInput
          id="confirmNewPassword"
          name="confirmNewPassword"
          label="Подтвердите пароль"
          value={passwords.confirmNewPassword}
          onChange={handleChange}
          required
          error={errors.confirmPassword}
          iconShow={<img src={eyeOpen} alt="show" width="20" height="20" />}
          iconHide={<img src={eyeClosed} alt="hide" width="20" height="20" />}
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Сохранение...' : 'Сохранить пароль'}
        </button>
      </form>
    </div>
  );
};


export default ResetPassword;