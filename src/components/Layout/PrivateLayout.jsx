import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext'; // импортируем хук
import './PrivateLayout.css';

const PrivateLayout = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme(); // получаем текущую тему и функцию переключения

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const handleNavigation = (path) => {
    navigate(path);
    closeMenu();
  };

  return (
    <div className="private-layout">
      <header className="private-header">
        <Link to="/main" className="private-logo">Сознательный гражданин</Link>
        <div id="search-root" className="header-search-container"></div>
        {/* Блок с кнопкой темы и гамбургером */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={toggleTheme} className="theme-toggle">
            <img
                src={theme === 'light' ? '/images/moon.png' : '/images/sun.png'}
                alt="Switch theme"
                width={24}
                height={24}
              />
          </button>
          <div className="hamburger" onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </header>

      {menuOpen && <div className="overlay" onClick={closeMenu}></div>}

      <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <div className="menu-logo">{/*Сознательный гражданин*/}</div>
          <button className="about-project" onClick={() => handleNavigation('/about')}>
            О ПРОЕКТЕ
          </button>
          <button className="close-menu" onClick={closeMenu}>✕</button>
        </div>

        <div className="menu-items">
          <button onClick={() => handleNavigation('/my-messages')}>МОИ СООБЩЕНИЯ</button>
          <button onClick={() => handleNavigation('/all-messages')}>ВСЕ СООБЩЕНИЯ</button>
          <button onClick={() => handleNavigation('/drafts')}>ЧЕРНОВИКИ</button>
          <button onClick={() => handleNavigation('/notifications')}>УВЕДОМЛЕНИЯ</button>
          <button onClick={() => handleNavigation('/profile')}>ПРОФИЛЬ</button>
        </div>

        <div className="menu-footer">
          <button className="feedback-btn" onClick={() => handleNavigation('/feedback')}>
            ОБРАТНАЯ СВЯЗЬ
          </button>
        </div>
      </div>

      <main className="private-content">
        {children}
      </main>
    </div>
  );
};

export default PrivateLayout;