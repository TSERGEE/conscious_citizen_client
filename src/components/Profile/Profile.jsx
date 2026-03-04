import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [messageCount] = useState(42); // заглушка

  useEffect(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      setUserData(JSON.parse(saved));
    } else {
      // Если нет данных, перенаправляем на редактирование
      navigate('/profile/edit');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    // Здесь также можно очистить токен и перенаправить на логин
    navigate('/login');
  };

  const handleEdit = () => {
    navigate('/profile/edit');
  };

  if (!userData) return <div>Загрузка...</div>;

  return (
    <div className="profile-container">
      <h2>Профиль пользователя</h2>
      <div className="profile-info">
        <p><strong>Фамилия:</strong> {userData.lastName}</p>
        <p><strong>Имя:</strong> {userData.firstName}</p>
        <p><strong>Отчество:</strong> {userData.middleName || '—'}</p>
        <p><strong>Телефон:</strong> {userData.phone}</p>
        <p><strong>Город:</strong> {userData.city}</p>
        <p><strong>Улица:</strong> {userData.street}</p>
        <p><strong>Дом:</strong> {userData.house}</p>
        <p><strong>Квартира:</strong> {userData.apartment || '—'}</p>
        <p><strong>Количество сообщений:</strong> {messageCount}</p>
      </div>
      <div className="profile-actions">
        <button onClick={handleEdit} className="edit-btn">Редактировать</button>
        <button onClick={handleLogout} className="logout-btn">Выйти</button>
      </div>
    </div>
  );
};

export default Profile;