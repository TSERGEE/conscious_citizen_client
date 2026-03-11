import React from 'react';
import { useMessages } from '../../contexts/MessagesContext';
import MessagesList from '../MessagesList/MessagesList';
import './MessagesPage.css';

const MyMessagesPage = () => {
  const { messages } = useMessages();
  const currentUserId = 1; // замените на реальный ID из контекста аутентификации

  const myMessages = messages.filter(msg => msg.userId === currentUserId);

  return (
    <div className="messages-page">
      <h1 className="page-title">Мои сообщения</h1>
      <MessagesList messages={myMessages}/>
    </div>
  );
};

export default MyMessagesPage;