import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import placeholderImg from '../../assets/placeholder.png';
import './LeftPanel.css';

const LeftPanel = () => {
  const navigate = useNavigate();
  const { messages, loading, refreshMessages } = useMessages();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    refreshMessages();
  }, [refreshMessages]);

  const filteredMessages = messages.filter(msg => {
    if (filter === 'drafts') return msg.active === false;
    if (filter === 'PARKING') return msg.type === 'PARKING' && msg.active === true;
    if (filter === 'FOOD_EXPIRED') return msg.type === 'FOOD_EXPIRED' && msg.active === true;
    return msg.active === false; // 'all' – только активные
  });

  const sortedMessages = [...filteredMessages].sort((a, b) => {
    const dateA = a.created ? new Date(a.created) : new Date(0);
    const dateB = b.created ? new Date(b.created) : new Date(0);
    return dateB - dateA;
  });
  console.log('Messages in LeftPanel:', messages);
  console.log('Filtered for all:', messages.filter(msg => msg.active === true));
  console.log('Filtered for drafts:', messages.filter(msg => msg.active === false));
  const handleMessageClick = (id) => {
    navigate(`/message/${id}`);
  };

  return (
    <div className="message-feed-panel">
      <div className="feed-header">
        <h3>Мои сообщения</h3>
      </div>

      <div className="filter-buttons">
        <button onClick={() => setFilter('all')}>Все</button>
        <button onClick={() => setFilter('PARKING')}>Парковка</button>
        <button onClick={() => setFilter('FOOD_EXPIRED')}>Продукты</button>
        <button onClick={() => setFilter('drafts')}>Черновики</button>
      </div>

      <div className="category-messages">
        {loading ? (
          <div className="no-messages">Загрузка...</div>
        ) : sortedMessages.length > 0 ? (
          sortedMessages.map(msg => (
            <div key={msg.id} className="message-item" onClick={() => handleMessageClick(msg.id)}>
              <img src={msg.photos?.[0] || placeholderImg} alt="preview" className="message-thumb" />
              <div className="message-info">
                <div className="message-topic">{msg.title}</div>
                <div className="message-date">
                  {msg.created ? new Date(msg.created).toLocaleDateString() : '—'}
                </div>
                <div className={`message-type ${!msg.active ? 'draft' : msg.type}`}>
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