import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import { getUser, getUserRole } from '../../api';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const { messages } = useMessages();
  const messageCount = messages.filter(msg => msg.active).length;

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Исправлено: берём логин из правильного ключа localStorage
        const login = localStorage.getItem('userLogin');
        if (!login) {
          navigate('/login');
          return;
        }

        const user = await getUser(login);
        const role = await getUserRole(login);

        setUserData({
          ...user,
          role,
        });

      } catch (e) {
        console.error(e);
        navigate('/login');
      }
    };

    loadUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userLogin');
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
          <strong>ФИО:</strong> {userData.fullName}
        </p>
        <p><strong>Телефон:</strong> {userData.phone}</p>
        <p><strong>Email:</strong> {userData.email}</p>   {/* Добавлено */}
        <p><strong>Адрес:</strong> {userData.address}</p>
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