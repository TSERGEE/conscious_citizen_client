import React, { useEffect, useState } from 'react';
import { getDraftIncidents } from '../../api';
import MessagesList from '../MessagesList/MessagesList';
import './MessagesPage.css';

const DraftsPage = () => {
  const [drafts, setDrafts] = useState([]);
  const userId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        // Сервер уже отфильтровал черновики по X-User-Id, 
        // который добавился в getAuthHeaders() внутри api.js
        const myDrafts = await getDraft_Incidents(); 
        
        // Добавляем нормализацию, как в контексте (чтобы были превью и флаг active)
        const normalizedDrafts = myDrafts.map(d => ({
          ...d,
          active: false, // Мы точно знаем, что это черновики
          preview: placeholderImg // Или логика получения первого фото, если они есть
        }));

        setDrafts(normalizedDrafts);
      } catch (err) {
        console.error('Ошибка загрузки черновиков:', err);
      }
    };
    fetchDrafts();
  }, []); // userId убираем из зависимостей, если он берется из localStorage внутри API

  return (
    <div className="messages-page">
      <h1 className="page-title">Черновики</h1>
      <MessagesList messages={drafts} isDraftList={true} />
    </div>
  );
};

export default DraftsPage;