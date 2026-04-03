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
        const allDrafts = await getDraftIncidents();
        // фильтруем по текущему пользователю
        const myDrafts = allDrafts.filter(d => d.userId === userId);
        setDrafts(myDrafts);
      } catch (err) {
        console.error('Ошибка загрузки черновиков:', err);
      }
    };
    fetchDrafts();
  }, [userId]);

  return (
    <div className="messages-page">
      <h1 className="page-title">Черновики</h1>
      <MessagesList messages={drafts} isDraftList={true} />
    </div>
  );
};

export default DraftsPage;