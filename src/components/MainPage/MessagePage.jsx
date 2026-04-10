import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import SecureImage from '../SecureImage/SecureImage';
import { generateDocument, downloadDocument, sendDocumentByEmail, deleteIncident } from '../../api';
import './MessagePage.css';

// Импорт PNG-иконок (поместите свои файлы в папку assets/icons)
import homeIcon from '../../assets/icons/home.png';
import saveIcon from '../../assets/icons/save.png';
import editIcon from '../../assets/icons/edit.png';
import deleteIcon from '../../assets/icons/delete.png';
// Если раскомментируете кнопки документа – импортируйте и их:
// import downloadIcon from '../../assets/icons/download.png';
// import emailIcon from '../../assets/icons/email.png';
// import viewIcon from '../../assets/icons/view.png';

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
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [docLoading, setDocLoading] = useState({ download: false, email: false, view: false });
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' }); // для уведомлений

  // Функция показа уведомления
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 2000);
  };

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

  const waitForDocument = async (incidentId, maxAttempts = 10, delay = 2000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const blob = await downloadDocument(incidentId);
        return blob;
      } catch (error) {
        const isNotFound = error.message?.includes('Document not generated') || 
                          error.message?.includes('404');
        if (isNotFound && attempt < maxAttempts) {
          console.log(`Документ ещё не готов, попытка ${attempt}/${maxAttempts}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
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
      showToast('Сообщение удалено', 'success');
      navigate('/main');
    } catch (err) {
      showToast('Ошибка при удалении: ' + err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!message) return;
    setDocLoading(prev => ({ ...prev, download: true }));
    try {
      let blob = await downloadDocument(message.id);
      saveBlobAsFile(blob, `incident_${message.id}.pdf`);
      showToast('Документ скачан', 'success');
    } catch (err) {
      console.log('Документ отсутствует, запускаем генерацию...');
      try {
        await generateDocument(message.id);
        const blob = await waitForDocument(message.id);
        saveBlobAsFile(blob, `incident_${message.id}.pdf`);
        showToast('Документ сгенерирован и скачан', 'success');
      } catch (genErr) {
        showToast('Ошибка генерации документа', 'error');
      }
    } finally {
      setDocLoading(prev => ({ ...prev, download: false }));
    }
  };

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

  const handleSendEmail = async () => {
    if (!message) return;
    setDocLoading(prev => ({ ...prev, email: true }));
    try {
      await downloadDocument(message.id);
    } catch (err) {
      await generateDocument(message.id);
      await waitForDocument(message.id);
    }
    await sendDocumentByEmail(message.id);
    showToast('Документ отправлен на email', 'success');
    setDocLoading(prev => ({ ...prev, email: false }));
  };

  const handleView = async () => {
    if (!message) return;
    setDocLoading(prev => ({ ...prev, view: true }));
    try {
      let blob = await viewDocument(message.id);
      saveBlobAsFile(blob, `incident_${message.id}.pdf`);
      showToast('Документ открыт', 'success');
    } catch (err) {
      await generateDocument(message.id);
      const blob = await waitForDocument(message.id);
      saveBlobAsFile(blob, `incident_${message.id}.pdf`);
      showToast('Документ сгенерирован и открыт', 'success');
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
      showToast('Черновик создан', 'success');
      navigate('/drafts');
    } catch (err) {
      showToast('Ошибка: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    navigate(`/edit/${id}`);
  };

  const isOwner = () => {
    if (!currentUserId || !message?.userId) return false;
    return Number(message.userId) === Number(currentUserId);
  };

  const openPhoto = (index) => setSelectedPhotoIndex(index);
  const closeModal = () => setSelectedPhotoIndex(null);
  const nextPhoto = () => {
    if (message?.photos && selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % message.photos.length);
    }
  };
  const prevPhoto = () => {
    if (message?.photos && selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + message.photos.length) % message.photos.length);
    }
  };

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
      {/* Кнопка "На главную" – справа сверху */}
      <button 
        className="home-button" 
        onClick={() => navigate('/main')}
        aria-label="На главную"
      >
        <img src={homeIcon} alt="На главную" className="icon-img" />
      </button>

      <h1 className="page-title">Сообщение</h1>

      <div className="message-content">
        <div className="message-field">
          <label>Автор</label>
          <div className="message-value">{message.fullName || 'Неизвестный автор'}</div>
        </div>

        <div className="message-field">
          <label>Рубрика</label>
          <div className="message-value">{categoryLabels[message.type] || message.type}</div>
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
                <div key={idx} className="gallery-item" onClick={() => openPhoto(idx)}>
                  <SecureImage src={photoUrl} alt={`Фото ${idx + 1}`} className="gallery-photo" />
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
        <button className="action-btn" onClick={handleSaveAsDraft} disabled={saving} title="Сохранить как черновик">
          <img src={saveIcon} alt="Сохранить" className="icon-img" />
        </button>

        {/* Раскомментируйте, если нужны кнопки документа с PNG-иконками
        <button className="action-btn" onClick={handleDownload} disabled={docLoading.download} title="Скачать PDF">
          <img src={downloadIcon} alt="Скачать" className="icon-img" />
        </button>
        <button className="action-btn" onClick={handleSendEmail} disabled={docLoading.email} title="Отправить на email">
          <img src={emailIcon} alt="Email" className="icon-img" />
        </button>
        <button className="action-btn" onClick={handleView} disabled={docLoading.view} title="Просмотреть">
          <img src={viewIcon} alt="Просмотр" className="icon-img" />
        </button>
        */}

        {isOwner() && (
          <>
            <button className="action-btn" onClick={handleEdit} title="Редактировать">
              <img src={editIcon} alt="Редактировать" className="icon-img" />
            </button>
            <button className="action-btn" onClick={handleDelete} disabled={deleting} title="Удалить">
              <img src={deleteIcon} alt="Удалить" className="icon-img" />
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

      {/* Toast-уведомление */}
      {toast.message && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default MessagePage;