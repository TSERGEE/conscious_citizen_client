import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import SecureImage from '../SecureImage/SecureImage';
import './MessagePage.css';

const categoryLabels = {
  PARKING: 'Парковка',
  FOOD_EXPIRED: 'Просроченные продукты'
};

const MessagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMessage, addMessage, currentUserId } = useMessages();
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null); // индекс открытого фото

  useEffect(() => {
    let mounted = true;
    getMessage(id)
      .then(data => { if (mounted) setMessage(data); })
      .catch(() => navigate('/main'));
    return () => { mounted = false; };
  }, [id, getMessage, navigate]);

  const handleSaveAsDraft = async () => {
    if (!message) return;
    setSaving(true);
    try {
      await addMessage({
        title: message.title,
        description: message.description,
        type: message.type,
        address: message.address,
        latitude: message.latitude,
        longitude: message.longitude,
        active: false,
      }, []);
      alert('Черновик создан');
      navigate('/drafts');
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    navigate(`/edit/${id}`);
  };

  const isOwner = currentUserId && message?.userId === currentUserId;

  // Открыть фото по индексу
  const openPhoto = (index) => {
    setSelectedPhotoIndex(index);
  };

  // Закрыть модальное окно
  const closeModal = () => {
    setSelectedPhotoIndex(null);
  };

  // Переключение на следующее фото
  const nextPhoto = () => {
    if (message?.photos && selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % message.photos.length);
    }
  };

  // Переключение на предыдущее фото
  const prevPhoto = () => {
    if (message?.photos && selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + message.photos.length) % message.photos.length);
    }
  };

  // Обработка клавиш навигации
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, message?.photos]);

  if (!message) return <div>Загрузка...</div>;

  return (
    <div className="message-page">
      <h1 className="page-title">Новое сообщение</h1>
      <div className="message-content">
        <div className="message-field">
          <label>Автор</label>
          <div className="message-value">{message.fullName || 'Неизвестный автор'}</div>
        </div>

        <div className="message-field">
          <label>Рубрика</label>
          <div className="message-value">
            {categoryLabels[message.type] || message.type}
          </div>
        </div>

        <div className="message-field">
          <label>Тема сообщения</label>
          <div className="message-value">{message.title}</div>
        </div>

        <div className="message-field">
          <label>Фото</label>
          <div className="photo-gallery">
            {message.photos && message.photos.length > 0 ? (
              message.photos.map((photoUrl, idx) => (
                <div
                  key={idx}
                  className="gallery-item"
                  onClick={() => openPhoto(idx)}
                >
                  <SecureImage
                    src={photoUrl}
                    alt={`Фото ${idx + 1}`}
                    className="gallery-photo"
                  />
                </div>
              ))
            ) : (
              <div className="message-value">Нет фотографий</div>
            )}
          </div>
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
        <button className="action-btn" onClick={handleSaveAsDraft} disabled={saving}>
          {saving ? '⏳' : '📥'}
        </button>
        <button className="action-btn">💾</button>
        <button className="action-btn">📧</button>
        <button className="action-btn">🖨️</button>
        {isOwner && (
          <button className="action-btn" onClick={handleEdit}>✏️</button>
        )}
      </div>

      {/* Модальное окно для просмотра фото */}
      {selectedPhotoIndex !== null && message.photos && message.photos.length > 0 && (
        <div className="photo-modal" onClick={closeModal}>
          <span className="modal-close" onClick={closeModal}>&times;</span>
          {message.photos.length > 1 && (
            <>
              <button className="modal-prev" onClick={(e) => { e.stopPropagation(); prevPhoto(); }}>❮</button>
              <button className="modal-next" onClick={(e) => { e.stopPropagation(); nextPhoto(); }}>❯</button>
            </>
          )}
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <SecureImage
              src={message.photos[selectedPhotoIndex]}
              alt={`Фото ${selectedPhotoIndex + 1}`}
              className="modal-image"
            />
            <div className="photo-counter">
              {selectedPhotoIndex + 1} / {message.photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagePage;