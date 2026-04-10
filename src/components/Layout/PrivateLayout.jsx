import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useMessages } from '../../contexts/MessagesContext';
import SecureImage from '../SecureImage/SecureImage';
import { getAvatarPlaceholder } from '../../utils/avatar';
import './PrivateLayout.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:54455';

const PrivateLayout = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { messages, readNotifications, markAllAsRead } = useMessages();
  const unreadCount = messages.filter(
    msg => !readNotifications.includes(msg.id)
  ).length;
  const profileRef = useRef();
  const notifRef = useRef();

  // Функция загрузки данных из localStorage
  const loadUserData = () => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      setUserData(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadUserData();
    // Подписываемся на событие обновления профиля
    window.addEventListener('userProfileUpdated', loadUserData);
    return () => window.removeEventListener('userProfileUpdated', loadUserData);
  }, []);

  // закрытие по клику вне
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNav = (path) => {
    navigate(path);
    setProfileOpen(false);
    setNotifOpen(false);
  };

  const getAvatarUrl = () => {
    if (!userData?.avatarUrl) return null;
    return userData.avatarUrl.startsWith('http')
      ? userData.avatarUrl
      : `${BASE_URL}${userData.avatarUrl}`;
  };

  const getPlaceholderName = () => {
    if (!userData) return 'User';
    const fullName = userData.fullName || '';
    const parts = fullName.trim().split(' ');
    const firstName = parts[1] || parts[0] || '';
    const lastName = parts[0] || '';
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    return 'User';
  };

  const avatarUrl = getAvatarUrl();
  const fullNameParts = userData?.fullName?.trim().split(' ') || [];
  const lastName = fullNameParts[0] || '';
  const firstName = fullNameParts[1] || '';
  const placeholderUrl = getAvatarPlaceholder(
    firstName,
    lastName,
    userData?.email,
    40
  );

  return (
    <div className="private-layout">
      <header className="private-header">
        <Link to="/main" className="private-logo">
          Сознательный гражданин
        </Link>

        <div id="search-root" className="header-search-container"></div>

        <div className="header-actions">
          {/* Уведомления */}
          <div className="notif-wrapper" ref={notifRef}>
            <div
              className="notification-btn"
              onClick={() => {
                setNotifOpen(prev => {
                  const next = !prev;
                  if (next) markAllAsRead();
                  return next;
                });
                setProfileOpen(false);
              }}
            >
              <img src="/images/bell.png" alt="notifications" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </div>

            <div className={`notif-dropdown ${notifOpen ? 'open' : ''}`}>
              {messages.length === 0 ? (
                <div className="empty">Нет уведомлений</div>
              ) : (
                messages.slice(-5).reverse().map(msg => (
                  <div
                    key={msg.id}
                    className="notif-item"
                    onClick={() => handleNav(`/message/${msg.id}`)}
                  >
                    <div className="notif-title">Новое сообщение</div>
                    <div className="notif-text">
                      {msg.title || 'Без названия'}
                    </div>
                  </div>
                ))
              )}
              <button onClick={() => handleNav('/all-messages')}>
                Все сообщения
              </button>
            </div>
          </div>

          {/* Тема */}
          <button onClick={toggleTheme} className="theme-toggle">
            <img
              src={theme === 'light' ? '/images/sun.png' : '/images/moon.png'}
              alt="theme"
              width={24}
              height={24}
            />
          </button>

          {/* Профиль */}
          <div className="avatar-wrapper" ref={profileRef}>
            <div
              className="profile-avatar"
              onClick={() => {
                setProfileOpen(prev => !prev);
                setNotifOpen(false);
              }}
            >
              {avatarUrl ? (
                <SecureImage
                  src={avatarUrl}
                  alt="avatar"
                  className="header-avatar"
                />
              ) : (
                <img src={placeholderUrl} alt="avatar" className="avatar-placeholder-img" />
              )}
            </div>

            <div className={`dropdown-menu ${profileOpen ? 'open' : ''}`}>
              <button onClick={() => handleNav('/profile')}>Профиль</button>
              <button onClick={() => handleNav('/unified')}>Сообщения</button>
              <button onClick={() => handleNav('/notifications')}>Уведомления</button>
              <hr />
              <button onClick={() => handleNav('/about')}>О проекте</button>
              {userData?.role === 'ADMIN' && (
                <button onClick={() => handleNav('/admin')}>Админ панель</button>
              )}
              <button
                className="logout-btn"
                onClick={() => {
                  localStorage.removeItem('userProfile');
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('userLogin');
                  navigate('/login');
                }}
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="private-content">{children}</main>
    </div>
  );
};

export default PrivateLayout;