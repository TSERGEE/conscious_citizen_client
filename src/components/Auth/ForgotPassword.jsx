import React, { useState } from 'react';
import '../Auth/Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Forgot password for email:', email);
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
            placeholder=""
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Отправить</button>
      </form>
    </div>
  );
};

export default ForgotPassword;