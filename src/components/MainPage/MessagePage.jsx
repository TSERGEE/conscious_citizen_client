import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import SecureImage from '../SecureImage/SecureImage';
import {   generateDocument,   downloadDocument,  viewDocument,   sendDocumentByEmail, uploadIncidentPhoto, deleteIncident } from '../../api';
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
  const [docLoading, setDocLoading] = useState({ download: false, email: false, view: false });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    getMessage(id)
      .then(data => { if (mounted) setMessage(data); })
      .catch(() => navigate('/main'));
    return () => { mounted = false; };
  }, [id, getMessage, navigate]);
  useEffect(() => {
    console.log('currentUserId (из контекста):', currentUserId, typeof currentUserId);
    console.log('message.userId (из API):', message?.userId, typeof message?.userId);
  }, [currentUserId, message]);
  // Вспомогательная функция для ожидания генерации документа
  const waitForDocument = async (incidentId, maxAttempts = 10, delay = 2000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Пытаемся скачать документ (если есть — вернёт blob)
        const blob = await downloadDocument(incidentId);
        return blob;
      } catch (error) {
        // Проверяем, является ли ошибка 404 (документ ещё не готов)
        const isNotFound = error.message?.includes('Document not generated') || 
                          error.message?.includes('404');
        
        if (isNotFound && attempt < maxAttempts) {
          console.log(`Документ ещё не готов, попытка ${attempt}/${maxAttempts}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        // Если ошибка другого типа или попытки кончились — выбрасываем
        throw error;
      }
    }
    throw new Error('Документ не сгенерирован после нескольких попыток');
  };
  const handleDelete = async () => {
    if (!message) return;
    const confirmed = window.confirm('Вы уверены, что хотите удалить это сообщение? Действие необратимо.');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteIncident(message.id);
      alert('Сообщение удалено');
      navigate('/main'); // или на страницу со списком
    } catch (err) {
      alert('Ошибка при удалении: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };
  // Скачивание документа
  const handleDownload = async () => {
    if (!message) return;
    setDocLoading(prev => ({ ...prev, download: true }));
    try {
      // Пробуем скачать существующий документ
      let blob = await downloadDocument(message.id);
      // Если документ ещё не сгенерирован, downloadDocument выбросит ошибку 404
      // В этом случае запускаем генерацию и ждём
    } catch (err) {
      // Предполагаем, что документ отсутствует – запускаем генерацию
      console.log('Документ отсутствует, запускаем генерацию...');
      await generateDocument(message.id);
      // Ждём появления документа
      const blob = await waitForDocument(message.id);
      saveBlobAsFile(blob, `incident_${message.id}.pdf`);
      setDocLoading(prev => ({ ...prev, download: false }));
      return;
    }
    // Если скачивание с первого раза успешно
    saveBlobAsFile(blob, `incident_${message.id}.pdf`);
    setDocLoading(prev => ({ ...prev, download: false }));
  };

  // Вспомогательная функция сохранения Blob как файла
  const saveBlobAsFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Отправка по email
  const handleSendEmail = async () => {
    if (!message) return;
    setDocLoading(prev => ({ ...prev, email: true }));
    try {
      // Проверяем, есть ли документ (пытаемся скачать)
      await downloadDocument(message.id);
    } catch (err) {
      // Если нет – генерируем
      await generateDocument(message.id);
      // Ждём генерации (можно без ожидания, т.к. sendDocumentByEmail всё равно упадёт, если файла нет)
      // Поэтому лучше дождаться
      await waitForDocument(message.id);
    }
    // Отправляем email
    await sendDocumentByEmail(message.id);
    alert('Документ отправлен на email');
    setDocLoading(prev => ({ ...prev, email: false }));
  };

  // Просмотр / печать
  const handleView = async () => {
    if (!message) return;
    setDocLoading(prev => ({ ...prev, view: true }));
    try {
      let blob = await viewDocument(message.id);
      saveBlobAsFile(blob, `incident_${message.id}.pdf`); // или открыть в новой вкладке
      // Альтернативно: открыть в новой вкладке
      // const url = window.URL.createObjectURL(blob);
      // window.open(url, '_blank');
    } catch (err) {
      // Если документа нет – генерируем
      await generateDocument(message.id);
      const blob = await waitForDocument(message.id);
      saveBlobAsFile(blob, `incident_${message.id}.pdf`);
    }
    setDocLoading(prev => ({ ...prev, view: false }));
  };
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

  const isOwner = () => {
    if (!currentUserId || !message?.userId) return false;
    // Приводим к числу для надёжного сравнения
    return Number(message.userId) === Number(currentUserId);
  };

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
      <h1 className="page-title">Сообщение</h1>
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
        {/*<button className="action-btn" onClick={handleDownload} disabled={docLoading.download}>
          {docLoading.download ? '⏳' : '💾'}
        </button>
        <button className="action-btn" onClick={handleSendEmail} disabled={docLoading.email}>
          {docLoading.email ? '⏳' : '📧'}
        </button>
        <button className="action-btn" onClick={handleView} disabled={docLoading.view}>
          {docLoading.view ? '⏳' : '🖨️'}
        </button>*/}
        {isOwner() && (
          <>
            <button className="action-btn" onClick={handleEdit}>✏️</button>
            <button className="action-btn" onClick={handleDelete} disabled={deleting}>
              {deleting ? '⏳' : '🗑️'}
            </button>
          </>
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