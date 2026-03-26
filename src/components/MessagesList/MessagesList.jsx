import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MessagesList.css';

const MessagesList = ({ messages, isDraftList = false }) => {
  const navigate = useNavigate();

  const handleMessageClick = (id) => {
    if (isDraftList) {
      navigate(`/edit-draft/${id}`);
    } else {
      navigate(`/message/${id}`);
    }
  };

  if (messages.length === 0) {
    return <div className="messages-container empty">Нет сообщений для отображения</div>;
  }

  return (
    <div className="messages-container">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="message-card"
          onClick={() => handleMessageClick(msg.id)}
        >
          <div className="message-card-header">
            <span className={`category-badge ${msg.type}`}>
              {msg.type === 'parking' ? 'Парковка' : 'Просроченные продукты'}
            </span>
            <span className="message-date">
              {new Date(msg.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h3 className="message-topic">{msg.topic}</h3>
          <p className="message-address">{msg.address}</p>
          {msg.photos && msg.photos.length > 0 && (
            <div className="message-photos">
              <img src={msg.photos[0]} alt="preview" className="photo-thumb" />
              {msg.photos.length > 1 && (
                <span className="photo-count">+{msg.photos.length - 1}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MessagesList;