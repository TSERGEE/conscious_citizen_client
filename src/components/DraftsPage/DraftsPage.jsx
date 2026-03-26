import React from 'react';
import { useMessages } from '../../contexts/MessagesContext';
import MessagesList from '../../components/MessagesList/MessagesList';
import './DraftsPage.css';

const DraftsPage = () => {
  const { messages } = useMessages();
  const currentUserId = 1;

  const drafts = messages.filter(
    msg => msg.userId === currentUserId && msg.isDraft === true
  );

  return (
    <div className="drafts-page">
      <h1 className="page-title">Черновики</h1>
      <MessagesList messages={drafts} isDraftList={true} />
    </div>
  );
};

export default DraftsPage;