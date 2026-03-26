import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const { messages } = useMessages();
  const messageCount = messages.filter(msg => !msg.isDraft).length;

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
      {userData.photo && (
        <div className="profile-photo">
          <img src={userData.photo} alt="Фото профиля" />
        </div>
      )}
      <div className="profile-info">
        <p>
          <strong>ФИО:</strong>{' '}
          {userData.lastName} {userData.firstName} {userData.middleName || ''}
        </p>
        <p><strong>Телефон:</strong> {userData.phone}</p>
        <p>
          <strong>Адрес:</strong>{' '}
          {userData.city}, {userData.street}, д. {userData.house}
          {userData.apartment ? `, кв. ${userData.apartment}` : ''}
        </p>
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