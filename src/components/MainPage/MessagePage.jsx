import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import './MessagePage.css';

const MessagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMessage, addMessage } = useMessages();
  const message = getMessage(Number(id));

  const handleSaveAsDraft = () => {
    if (!message) return;

    const draftCopy = {
      ...message,
      id: Date.now(),
      isDraft: true,
      createdAt: new Date().toISOString(),
    };

    addMessage(draftCopy);
    alert('Сообщение сохранено в черновики');
  };

  if (!message) {
    return (
      <div className="message-not-found">
        <h2>Сообщение не найдено</h2>
        <button onClick={() => navigate('/main')}>Вернуться на главную</button>
      </div>
    );
  }

  // Галерея: если фото есть, показываем их все
  const photos = message.photos || [];

  return (
    <div className="message-page">
      <h1 className="page-title">Новое сообщение</h1>

      <div className="message-content">
        <div className="message-field">
          <label>Тема сообщения</label>
          <div className="message-value">{message.topic}</div>
        </div>

        <div className="message-field">
          <label>Фото</label>
          {photos.length > 0 ? (
            <div className="photo-gallery">
              {photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`фото ${idx + 1}`}
                  className="gallery-photo"
                />
              ))}
            </div>
          ) : (
            <div className="message-value">Нет фотографий</div>
          )}
        </div>

        <div className="message-field">
          <label>Адрес события</label>
          <div className="message-value">{message.address}</div>
        </div>

        <div className="message-field">
          <label>Текст сообщения</label>
          <div className="message-value description">{message.description}</div>
        </div>
      </div>

      <div className="action-panel">
        <button
          className="action-btn"
          title="Сохранить в черновики"
          onClick={handleSaveAsDraft}
        >
          📥
        </button>
        <button className="action-btn" title="Сохранить в документы">
          💾
        </button>
        <button className="action-btn" title="Отправить на email">
          📧
        </button>
        <button className="action-btn" title="Печать">
          🖨️
        </button>
      </div>
    </div>
  );
};

export default MessagePage;