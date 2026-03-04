import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './PrivateLayout.css';

const PrivateLayout = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const handleNavigation = (path) => {
    navigate(path);
    closeMenu();
  };

  return (
    <div className="private-layout">
      {/* Шапка */}
      <header className="private-header">
        <Link to="/main" className="private-logo">Сознательный гражданин</Link>
        <div className="hamburger" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </header>

      {/* Затемнение фона при открытом меню */}
      {menuOpen && <div className="overlay" onClick={closeMenu}></div>}

      {/* Боковое меню */}
      <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <div className="menu-logo">Сознательный гражданин</div>
          <button className="about-project" onClick={() => handleNavigation('/about')}>
            О ПРОЕКТЕ
          </button>
          <button className="close-menu" onClick={closeMenu}>✕</button>
        </div>

        <div className="menu-items">
          <button onClick={() => handleNavigation('/my-messages')}>МОИ СООБЩЕНИЯ</button>
          <button onClick={() => handleNavigation('/all-messages')}>ВСЕ СООБЩЕНИЯ</button>
          <button onClick={() => handleNavigation('/notifications')}>УВЕДОМЛЕНИЯ</button>
          <button onClick={() => handleNavigation('/profile')}>ПРОФИЛЬ</button>
        </div>

        <div className="menu-footer">
          <button className="feedback-btn" onClick={() => handleNavigation('/feedback')}>
            ОБРАТНАЯ СВЯЗЬ
          </button>
          <button className="create-message-btn" onClick={() => handleNavigation('/categories')}>
            Создать сообщение
          </button>
        </div>
      </div>

      {/* Основной контент */}
      <main className="private-content">
        {children}
      </main>
    </div>
  );
};

export default PrivateLayout;