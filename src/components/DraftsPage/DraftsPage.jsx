import React, { useEffect, useState } from 'react';
import { getDraftIncidents } from '../../api'; // Проверь название в api.js
import MessagesList from '../MessagesList/MessagesList';
import placeholderImg from '../../assets/placeholder.png'; // Добавь импорт
import './MessagesPage.css';

const DraftsPage = () => {
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        // 1. Исправлено название функции (убрали нижнее подчеркивание)
        const myDrafts = await getDraftIncidents(); 
        
        // 2. Нормализация данных
        const normalizedDrafts = myDrafts.map(d => ({
          ...d,
          active: false,
          // Гарантируем наличие полей для MessagesList
          title: d.title || d.topic, 
          created: d.created || d.createdAt,
          preview: d.photos?.[0] || placeholderImg 
        }));

        setDrafts(normalizedDrafts);
      } catch (err) {
        console.error('Ошибка загрузки черновиков:', err);
      }
    };
    fetchDrafts();
  }, []); 

  return (
    <div className="messages-page">
      <h1 className="page-title">Черновики</h1>
      <MessagesList messages={drafts} isDraftList={true} />
    </div>
  );
};

export default DraftsPage;