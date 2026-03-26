import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useMessages } from '../../contexts/MessagesContext';
import './PrivateLayout.css';

const PrivateLayout = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { messages } = useMessages();

  const menuRef = useRef();

  // Загружаем пользователя
  useEffect(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) setUserData(JSON.parse(saved));
  }, []);

  // Закрытие при клике вне меню
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // реальный счётчик (пример: все сообщения)
  const notificationCount = messages.length;

  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="private-layout">
      <header className="private-header">
        <Link to="/main" className="private-logo">
          Сознательный гражданин
        </Link>

        <div id="search-root" className="header-search-container"></div>

        <div className="header-actions">

          {/* Уведомления */}
          <div
            className="notification-btn"
            onClick={() => navigate('/notifications')}
          >
            <img src="/images/bell.png" alt="notifications" />
            {notificationCount > 0 && (
              <span className="notification-badge">
                {notificationCount}
              </span>
            )}
          </div>

          {/* 🌙 Тема */}
          <button onClick={toggleTheme} className="theme-toggle">
            <img
              src={theme === 'light' ? '/images/moon.png' : '/images/sun.png'}
              alt="theme"
              width={24}
              height={24}
            />
          </button>

          {/* 👤 Аватар + dropdown */}
          <div className="avatar-wrapper" ref={menuRef}>
            <div
              className="profile-avatar"
              onClick={() => setMenuOpen(prev => !prev)}
            >
              {userData?.photo ? (
                <img src={userData.photo} alt="avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {userData?.firstName?.[0] || 'U'}
                </div>
              )}
            </div>

            {/* Dropdown */}
            <div className={`dropdown-menu ${menuOpen ? 'open' : ''}`}>
              <button onClick={() => handleNavigation('/profile')}>
                Профиль
              </button>
              <button onClick={() => handleNavigation('/my-messages')}>
                Мои сообщения
              </button>
              <button onClick={() => handleNavigation('/drafts')}>
                Черновики
              </button>
              <button onClick={() => handleNavigation('/notifications')}>
                Уведомления
              </button>
              <hr />
              <button onClick={() => handleNavigation('/feedback')}>
                Обратная связь
              </button>
              <button
                className="logout-btn"
                onClick={() => {
                  localStorage.removeItem('userProfile');
                  navigate('/login');
                }}
              >
                Выйти
              </button>
            </div>
          </div>

        </div>
      </header>

      <main className="private-content">
        {children}
      </main>
    </div>
  );
};

export default PrivateLayout;