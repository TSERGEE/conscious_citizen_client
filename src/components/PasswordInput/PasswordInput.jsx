import React, { useState } from 'react';
import '../Auth/Auth.css';

// По умолчанию используются emoji-иконки (можно заменить на свои)
const DefaultEyeOpen = () => <span style={{ fontSize: '1.2rem' }}>👁️</span>;
const DefaultEyeClosed = () => <span style={{ fontSize: '1.2rem' }}>🙈</span>;

const PasswordInput = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  label,
  required,
  error,
  iconShow = <DefaultEyeOpen />,    // иконка "показать"
  iconHide = <DefaultEyeClosed />,  // иконка "скрыть"
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword(prev => !prev);

  return (
    <div className="password-input-group">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="password-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`password-field ${error ? 'error' : ''}`}
        />
        <button
          type="button"
          className="toggle-password"
          onClick={togglePassword}
          aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {showPassword ? iconHide : iconShow}
        </button>
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default PasswordInput;