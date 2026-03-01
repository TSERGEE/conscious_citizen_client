import React, { useState } from 'react';
import '../Auth/Auth.css';

const ResetPassword = () => {
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmNewPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      alert('Пароли не совпадают');
      return;
    }
    console.log('New password set:', passwords.newPassword);
  };

  return (
    <div className="auth-container">
      <h2>Установка нового пароля</h2>
      <div className="description">Придумайте новый пароль для входа.</div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="newPassword">Новый пароль</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            placeholder=""
            value={passwords.newPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmNewPassword">Подтвердите пароль</label>
          <input
            type="password"
            id="confirmNewPassword"
            name="confirmNewPassword"
            placeholder=""
            value={passwords.confirmNewPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Сохранить пароль</button>
      </form>
    </div>
  );
};

export default ResetPassword;