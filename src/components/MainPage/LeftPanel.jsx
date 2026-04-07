import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import SecureImage from '../SecureImage/SecureImage';
import './LeftPanel.css';

const LeftPanel = () => {
  const navigate = useNavigate();
  const { messages, loading, refreshMessages, loadThumbnail } = useMessages();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    refreshMessages();
  }, [refreshMessages]);

  // Подгружаем миниатюры для всех отображаемых сообщений
  useEffect(() => {
    const visibleMessages = messages.filter(msg => {
      if (filter === 'drafts') return msg.active === false;
      if (filter === 'PARKING') return msg.type === 'PARKING' && msg.active === true;
      if (filter === 'FOOD_EXPIRED') return (msg.type === 'FOOD_EXPIRED' || msg.type === 'EXPIRED') && msg.active === true;
      return msg.active === true;
    });
    visibleMessages.forEach(msg => {
      loadThumbnail(msg.id);
    });
  }, [messages, filter, loadThumbnail]);

  const filteredMessages = messages.filter(msg => {
    if (filter === 'drafts') return msg.active === false;
    if (filter === 'PARKING') return msg.type === 'PARKING' && msg.active === true;
    if (filter === 'FOOD_EXPIRED') return (msg.type === 'FOOD_EXPIRED' || msg.type === 'EXPIRED') && msg.active === true;
    return msg.active === true;
  });

  const sortedMessages = [...filteredMessages].sort((a, b) => {
    const dateA = a.created ? new Date(a.created) : new Date(0);
    const dateB = b.created ? new Date(b.created) : new Date(0);
    return dateB - dateA;
  });

  // Обработчик клика: черновик → редактирование, иначе → просмотр
  const handleMessageClick = (id, isActive) => {
    if (!isActive) {
      navigate(`/edit/${id}`);
    } else {
      navigate(`/message/${id}`);
    }
  };

  return (
    <div className="message-feed-panel">
      <div className="feed-header">
        <h3>Сообщения</h3>
      </div>

      <div className="filter-buttons">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Все</button>
        <button className={filter === 'PARKING' ? 'active' : ''} onClick={() => setFilter('PARKING')}>Парковка</button>
        <button className={filter === 'FOOD_EXPIRED' ? 'active' : ''} onClick={() => setFilter('FOOD_EXPIRED')}>Продукты</button>
        <button className={filter === 'drafts' ? 'active' : ''} onClick={() => setFilter('drafts')}>Черновики</button>
      </div>

      <div className="category-messages">
        {loading ? (
          <div className="no-messages">Загрузка...</div>
        ) : sortedMessages.length > 0 ? (
          sortedMessages.map(msg => (
            <div
              key={msg.id}
              className="message-item"
              onClick={() => handleMessageClick(msg.id, msg.active)}
            >
              <SecureImage
                src={msg.preview}
                alt="preview"
                className="message-thumb"
              />

              <div className="message-info">
                <div className="message-topic">{msg.title}</div>
                <div className="message-date">
                  {msg.created ? (
                    <>
                      {new Date(msg.created).toLocaleDateString()} в {new Date(msg.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </>
                  ) : '—'}
                </div>

                <div className={`message-type ${
                  !msg.active
                    ? 'draft'
                    : msg.type === 'FOOD_EXPIRED' ? 'expired' : msg.type?.toLowerCase()
                }`}>
                  {!msg.active
                    ? 'Черновик'
                    : msg.type === 'PARKING'
                    ? 'Парковка'
                    : msg.type === 'FOOD_EXPIRED'
                    ? 'Просрочка'
                    : msg.type}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-messages">
            {filter === 'drafts' ? 'Нет черновиков' : 'Нет сообщений'}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftPanel;