import React from 'react';
import { useMessages } from '../../contexts/MessagesContext';
import MessagesList from '../MessagesList/MessagesList';
import './MessagesPage.css';

const AllMessagesPage = () => {
  const { messages } = useMessages();

  // Все опубликованные
  const activeMessages = messages.filter(msg => msg.active !== true);

  return (
    <div className="messages-page">
      <h1 className="page-title">Все сообщения</h1>
      <MessagesList messages={activeMessages} />
    </div>
  );
};

export default AllMessagesPage;