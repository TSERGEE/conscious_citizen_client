import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import placeholderImg from '../../assets/placeholder.png';
import './MessagePage.css';

const MessagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMessage, addMessage } = useMessages();
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const data = await getMessage(id);
        setMessage(data);
      } catch (err) {
        console.error('Ошибка загрузки сообщения:', err);
        alert('Не удалось загрузить сообщение');
        navigate('/main');
      }
    };
    fetchMessage();
  }, [id, navigate, getMessage]);

  const handleSaveAsDraft = async () => {
    if (!message) return;
    setSaving(true);
    try {
      // Создаём новый черновик на основе текущего сообщения
      await addMessage({
        title: message.title,
        description: message.description,
        type: message.type,
        address: message.address,
        latitude: message.latitude,
        longitude: message.longitude,
        active: false,
      });
      alert('Черновик сохранён');
      navigate('/drafts'); // переходим в список черновиков
    } catch (err) {
      alert('Ошибка при сохранении черновика: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!message) return <div>Загрузка...</div>;

  const photos = message.photos?.length ? message.photos : [placeholderImg];

  return (
    <div className="message-page">
      <h1 className="page-title">Новое сообщение</h1>

      <div className="message-content">
        <div className="message-field">
          <label>Тема сообщения</label>
          <div className="message-value">{message.title}</div>
        </div>

        <div className="message-field">
          <label>Фото</label>
          {photos.length > 0 ? (
            <div className="photo-gallery">
              {photos.map((photo, idx) => (
                <img key={idx} src={photo} alt={`фото ${idx + 1}`} className="gallery-photo" />
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
          disabled={saving}
        >
          {saving ? '⏳' : '📥'}
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