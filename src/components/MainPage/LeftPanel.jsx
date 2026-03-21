import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import './LeftPanel.css';

const LeftPanel = () => {
  const navigate = useNavigate();
  const { messages } = useMessages();
  const currentUserId = 1;

  const [filter, setFilter] = useState('all'); // all | parking | expired | drafts

  const handleMessageClick = (id, isDraft) => {
    if (isDraft) {
      navigate(`/edit-draft/${id}`);
    } else {
      navigate(`/message/${id}`);
    }
  };

  // Универсальный список
  const filteredMessages = [...messages]
    .filter(msg => msg.userId === currentUserId)
    .filter(msg => {
      if (filter === 'all') return !msg.isDraft;
      if (filter === 'drafts') return msg.isDraft;
      return msg.type === filter && !msg.isDraft;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="message-feed-panel">
      
      <div className="feed-header">
        <h3>Мои сообщения</h3>
      </div>

      {/* ФИЛЬТР */}
      <div className="filter-buttons">
        <button onClick={() => setFilter('all')}>
          Все
        </button>
        <button onClick={() => setFilter('parking')}>
          Парковка
        </button>
        <button onClick={() => setFilter('expired')}>
          Продукты
        </button>
        <button onClick={() => setFilter('drafts')}>
          Черновики
        </button>
      </div>

      {/* СПИСОК */}
      <div className="category-messages">
        {filteredMessages.length > 0 ? (
          filteredMessages.map(msg => (
            <div
              key={msg.id}
              className="message-item"
              onClick={() => handleMessageClick(msg.id, msg.isDraft)}
            >
              <img
                src={msg.photos[0]}
                alt="preview"
                className="message-thumb"
              />

              <div className="message-info">
                <div className="message-topic">
                  {msg.topic}
                </div>

                <div className="message-date">
                  {new Date(msg.createdAt).toLocaleDateString()}
                </div>

                {/* Показываем тип */}
                <div
                    className={`message-type ${
                      msg.isDraft
                        ? 'draft'
                        : msg.type === 'parking'
                        ? 'parking'
                        : 'expired'
                    }`}
                  >
                  {msg.isDraft
                    ? 'Черновик'
                    : msg.type === 'parking'
                    ? 'Парковка'
                    : 'Просрочка'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-messages">Нет сообщений</div>
        )}
      </div>
    </div>
  );
};

export default LeftPanel;