import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import SecureImage from '../SecureImage/SecureImage';
import placeholderImg from '../../assets/placeholder.png';
import './MessagesList.css';

const MessagesList = ({ messages, isDraftList = false }) => {
  const navigate = useNavigate();
  const { loadThumbnail } = useMessages();

  // Подгружаем реальные миниатюры для всех сообщений
  useEffect(() => {
    messages.forEach(msg => {
      if (!msg.preview || msg.preview === placeholderImg) {
        loadThumbnail?.(msg.id);
      }
    });
  }, [messages, loadThumbnail]);

  const handleClick = (id) => {
    if (isDraftList) {
      navigate(`/edit/${id}`); // переход на редактирование черновика
    } else {
      navigate(`/message/${id}`);
    }
  };

  if (messages.length === 0) {
    return <div className="messages-container empty">Нет сообщений для отображения</div>;
  }

  return (
    <div className="messages-container">
      {messages.map(msg => (
        <div key={msg.id} className="message-card" onClick={() => handleClick(msg.id)}>
          <div className="message-card-header">
            <span className={`category-badge ${msg.type?.toLowerCase()}`}>
              {msg.type === 'PARKING' ? 'Парковка' : 'Просроченные продукты'}
            </span>
            <span className="message-date">
              {new Date(msg.created).toLocaleDateString()} в {new Date(msg.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h3 className="message-topic">{msg.title}</h3>
          <p className="message-address">{msg.address}</p>
          <div className="message-photos">
            <SecureImage
              src={msg.preview || placeholderImg}
              alt="preview"
              className="photo-thumb"
            />
            {msg.photos && msg.photos.length > 1 && (
              <span className="photo-count">+{msg.photos.length - 1}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessagesList;