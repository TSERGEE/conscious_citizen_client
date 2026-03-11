import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import './LeftPanel.css';

const LeftPanel = () => {
  const navigate = useNavigate();
  const { messages } = useMessages();
  const currentUserId = 1; // замените на реального пользователя из контекста аутентификации

  const userMessages = messages.filter(msg => msg.userId === currentUserId);

  const parkingMessages = userMessages.filter(msg => msg.category === 'parking');
  const expiredMessages = userMessages.filter(msg => msg.category === 'expired');

  const [collapsedSections, setCollapsedSections] = useState({
    parking: false,
    expired: false,
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleMessageClick = (id) => {
    navigate(`/message/${id}`);
  };

  return (
    <div className="message-feed-panel">
      <div className="feed-header">
        <h3>Мои сообщения</h3>
      </div>
      <div className="feed-sections">
        {/* Парковки */}
        <div className="category-section">
          <div className="category-header" onClick={() => toggleSection('parking')}>
            <span>Парковки</span>
            <span className="collapse-icon">{collapsedSections.parking ? '▼' : '▲'}</span>
          </div>
          {!collapsedSections.parking && (
            <div className="category-messages">
              {parkingMessages.length > 0 ? (
                parkingMessages.map(msg => (
                  <div key={msg.id} className="message-item" onClick={() => handleMessageClick(msg.id)}>
                    <img src={msg.photos[0]} alt="preview" className="message-thumb" />
                    <div className="message-info">
                      <div className="message-topic">{msg.topic}</div>
                      <div className="message-date">{new Date(msg.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-messages">Нет сообщений</div>
              )}
            </div>
          )}
        </div>

        {/* Просроченные продукты */}
        <div className="category-section">
          <div className="category-header" onClick={() => toggleSection('expired')}>
            <span>Просроченные продукты</span>
            <span className="collapse-icon">{collapsedSections.expired ? '▼' : '▲'}</span>
          </div>
          {!collapsedSections.expired && (
            <div className="category-messages">
              {expiredMessages.length > 0 ? (
                expiredMessages.map(msg => (
                  <div key={msg.id} className="message-item" onClick={() => handleMessageClick(msg.id)}>
                    <img src={msg.photos[0]} alt="preview" className="message-thumb" />
                    <div className="message-info">
                      <div className="message-topic">{msg.topic}</div>
                      <div className="message-date">{new Date(msg.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-messages">Нет сообщений</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;