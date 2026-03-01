import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css'; // можно вынести стили шапки отдельно или оставить в Auth.css, но для порядка создадим отдельный файл

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Определяем, какая ссылка должна быть справа в зависимости от текущего пути
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
    // По умолчанию
    return { to: '/login', text: 'Вход' };
  };

  const navLink = getNavLink();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
        <Link to="/" className="logo">Сознательный гражданин</Link>
        <Link to={navLink.to} className="nav-link">{navLink.text}</Link>
        </div>
      </header>
      <main className="content">
        {children}
      </main>
    </div>
  );
};

export default Layout;