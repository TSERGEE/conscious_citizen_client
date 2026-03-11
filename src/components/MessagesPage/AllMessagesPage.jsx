import React from 'react';
import { useMessages } from '../../contexts/MessagesContext';
import MessagesList from '../MessagesList/MessagesList';
import './MessagesPage.css';

const AllMessagesPage = () => {
  const { messages } = useMessages();

  return (
    <div className="messages-page">
      <h1 className="page-title">Все сообщения</h1>
      <MessagesList messages={messages} />
    </div>
  );
};

export default AllMessagesPage;