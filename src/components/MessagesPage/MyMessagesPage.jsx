import React from 'react';
import { useMessages } from '../../contexts/MessagesContext';
import MessagesList from '../MessagesList/MessagesList';
import './MessagesPage.css';

const MyMessagesPage = () => {
  const { messages } = useMessages();
  const userId = Number(localStorage.getItem('userId')); // текущий пользователь

  const myMessages = messages.filter(msg => msg.userId === userId && msg.active !== true);


  return (
    <div className="messages-page">
      <h1 className="page-title">Мои сообщения</h1>
      <MessagesList messages={myMessages} />
    </div>
  );
};

export default MyMessagesPage;