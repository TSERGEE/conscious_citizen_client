import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Auth/Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login data:', formData);
  };

  return (
    <div className="auth-container">
      <h2>Вход</h2>
      <div className="description">Для продолжения Вам необходимо выполнить вход.</div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Телефон или email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder=""
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder=""
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Войти</button>
      </form>
      <div className="extra-link">
        <Link to="/forgot-password">Забыли пароль?</Link>
      </div>
    </div>
  );
};

export default Login;