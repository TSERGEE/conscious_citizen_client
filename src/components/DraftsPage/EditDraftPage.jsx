// pages/EditDraftPage/EditDraftPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import './EditDraftPage.css'; // можно использовать те же стили, что и CreateMessagePage

const EditDraftPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMessage, updateMessage, publishDraft } = useMessages();
  const draft = getMessage(Number(id));

  // Проверка, что черновик существует и принадлежит пользователю (здесь userId = 1)
  useEffect(() => {
    if (!draft || draft.userId !== 1) {
      alert('Черновик не найден');
      navigate('/drafts');
    }
  }, [draft, navigate]);

  const [topic, setTopic] = useState(draft?.topic || '');
  const [description, setDescription] = useState(draft?.description || '');
  const [photo, setPhoto] = useState(null);
  const [category, setCategory] = useState(draft?.category || '');
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Если фото уже есть в черновике, показываем его
  const [existingPhoto] = useState(draft?.photos?.[0] || null);

  const handlePhotoClick = () => fileInputRef.current.click();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) setPhoto(file);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!topic.trim()) newErrors.topic = 'Укажите тему сообщения';
    if (!description.trim()) newErrors.description = 'Опишите проблему';
    if (!category) newErrors.category = 'Выберите рубрику';
    return newErrors;
  };

  // Сохранить как опубликованное сообщение
  const handlePublish = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const photoUrl = photo
      ? URL.createObjectURL(photo)
      : existingPhoto || 'https://via.placeholder.com/100';

    const updatedMessage = {
      topic,
      description,
      category,
      photos: [photoUrl],
      address: draft.address,
      lat: draft.lat,
      lng: draft.lng,
      userId: 1,
      isDraft: false, // публикуем
    };

    updateMessage(draft.id, updatedMessage);
    navigate(`/message/${draft.id}`);
  };

  // Сохранить как черновик (обновить, но оставить isDraft = true)
  const handleSaveDraft = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const photoUrl = photo
      ? URL.createObjectURL(photo)
      : existingPhoto || 'https://via.placeholder.com/100';

    const updatedMessage = {
      topic,
      description,
      category,
      photos: [photoUrl],
      address: draft.address,
      lat: draft.lat,
      lng: draft.lng,
      userId: 1,
      isDraft: true,
    };

    updateMessage(draft.id, updatedMessage);
    navigate('/drafts');
  };

  if (!draft) return null;

  return (
    <div className="create-message-page"> {/* используем те же стили */}
      <h1 className="page-title">Редактирование черновика</h1>
      <form onSubmit={handlePublish} className="create-message-form">
        {/* поля формы (аналогично CreateMessagePage) */}
        <div className="form-group">
          <label htmlFor="topic">Тема сообщения</label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={errors.topic ? 'error' : ''}
          />
          {errors.topic && <span className="error-message">{errors.topic}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Текст сообщения</label>
          <textarea
            id="description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label>Фото</label>
          <div className="photo-upload">
            <button type="button" onClick={handlePhotoClick} className="photo-btn">
              {existingPhoto ? 'Заменить фото' : 'Добавить фото'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            {photo && <span className="photo-name">{photo.name}</span>}
            {!photo && existingPhoto && (
              <div className="existing-photo">
                <img src={existingPhoto} alt="текущее" className="photo-thumb" />
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Адрес</label>
          <div className="address-display">{draft.address}</div>
        </div>

        <div className="form-group">
          <label>Рубрика</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="category"
                value="parking"
                checked={category === 'parking'}
                onChange={(e) => setCategory(e.target.value)}
              />{' '}
              Парковка
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="category"
                value="expired"
                checked={category === 'expired'}
                onChange={(e) => setCategory(e.target.value)}
              />{' '}
              Просроченные продукты
            </label>
          </div>
          {errors.category && <span className="error-message">{errors.category}</span>}
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">Опубликовать</button>
          <button type="button" onClick={handleSaveDraft} className="save-draft-btn">
            Сохранить черновик
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDraftPage;