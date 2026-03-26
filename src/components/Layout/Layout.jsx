import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  
  const getNavLink = () => {
    if (location.pathname === '/login' || location.pathname === '/') {
      return { to: '/register', text: 'Регистрация' };
    } else if (location.pathname === '/register') {
      return { to: '/login', text: 'Вход' };
    } else if (location.pathname === '/forgot-password') {
      return { to: '/login', text: 'Вход' };
    } else if (location.pathname === '/reset-password') {
      return { to: '/login', text: 'Вход' };
    }
    return { to: '/login', text: 'Вход' };
  };

  const { theme, toggleTheme } = useTheme(); // получаем тему и функцию переключения

  const navLink = getNavLink();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">Сознательный гражданин</Link>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link to={navLink.to} className="nav-link">{navLink.text}</Link>
            <button onClick={toggleTheme} className="theme-toggle">
              <img
                src={theme === 'light' ? '/images/moon.png' : '/images/sun.png'}
                alt="Switch theme"
                width={24}
                height={24}
              />
            </button>
          </div>
        </div>
      </header>
      <main className="content">
        {children}
      </main>
    </div>
  );
};

export default Layout;