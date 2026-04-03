import React from 'react';
import './AboutProject.css';

const AboutProject = () => {
return (
    <div className="about-page">
      <div className="about-card">
        <h1 className="about-title">О проекте</h1>

        <div className="about-section">
          <h2>Описание</h2>
          <p>
            «Сознательный гражданин» — это веб-платформа для
            взаимодействия жителей города с городскими службами.
          </p>

          <p>
            Пользователи могут оставлять обращения о нарушениях
            парковки, просроченных товарах.
          </p>

          <p>
            Все обращения отображаются на карте для удобного
            мониторинга и анализа.
          </p>
        </div>

        <div className="about-section">
          <h2>Контакты</h2>

          <div className="contact-item">
            <span>Email:</span> conscious-citizen2026@yandex.ru
          </div>

          <div className="contact-item">
            <span>Телефон:</span> +7 (999) 123-45-67
          </div>

          <div className="contact-item">
            <span>Адрес:</span> г. Самара, ул. Московское шоссе 77
          </div>
        </div>

        <div className="about-section">
          <h2>Картографический сервис</h2>

          <p>
            Для отображения карты используется сервис
            OpenStreetMap.
          </p>

          <a
            href="https://www.openstreetmap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="about-link"
          >
            Перейти на OpenStreetMap
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutProject;