import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import homeIcon from '../../assets/icons/home.png';
import { useMessages } from '../../contexts/MessagesContext';
import { getUser, getUserRole } from '../../api';
import SecureImage from '../SecureImage/SecureImage';
import { getAvatarPlaceholder } from '../../utils/avatar';
import './Profile.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const { totalCount } = useMessages();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const login = localStorage.getItem('userLogin');
        if (!login) {
          navigate('/login');
          return;
        }

        const user = await getUser(login);
        const role = await getUserRole(login);

        const updatedUser = { ...user, role };

        setUserData(updatedUser);

        localStorage.setItem(
          'userProfile',
          JSON.stringify(updatedUser)
        );
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

  // Разбираем fullName (предполагаем формат "Фамилия Имя Отчество")
  const fullNameParts = userData.fullName?.trim().split(' ') || [];
  const lastName = fullNameParts[0] || '';
  const firstName = fullNameParts[1] || '';
  // Формируем строку "Имя Фамилия" для ui-avatars (как в ProfileEdit)
  const nameForPlaceholder = firstName && lastName ? `${firstName} ${lastName}` : (userData.fullName || 'User');
  const avatarPlaceholderUrl = `https://ui-avatars.com/api/?background=0D8F81&color=fff&rounded=true&size=120&bold=true&name=${encodeURIComponent(nameForPlaceholder)}`;

  return (
    <div className="profile-container">
      <button
        className="home-button"
        onClick={() => navigate('/main')}
        aria-label="На главную"
      >
        <img src={homeIcon} alt="На главную" className="icon-img" />
      </button>
      <h2>Профиль пользователя</h2>
      <div className="profile-photo">
        {userData.avatarUrl ? (
          <SecureImage 
            src={`${BASE_URL}${userData.avatarUrl}`} 
            alt="Аватар" 
            className="profile-avatar" 
          />
        ) : (
          <img
            src={getAvatarPlaceholder(
              firstName,
              lastName,
              userData.email
            )}
            alt="Аватар"
            className="profile-avatar"
          />
        )}
      </div>
      <div className="profile-info">
        <p><strong>ФИО:</strong> {userData.fullName}</p>
        <p><strong>Телефон:</strong> {userData.phone}</p>
        <p><strong>Email:</strong> {userData.email}</p>
        <p><strong>Адрес:</strong> {userData.address}</p>
        <p><strong>Количество сообщений:</strong> {totalCount}</p>
      </div>
      <div className="profile-actions">
        <button onClick={handleEdit} className="edit-btn">Редактировать</button>
        <button onClick={handleLogout} className="logout-btn">Выйти</button>
      </div>
    </div>
  );
};

export default Profile;