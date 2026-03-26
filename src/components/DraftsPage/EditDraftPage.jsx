import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import placeholderImg from '../../assets/placeholder.png';
import './EditDraftPage.css';

const EditDraftPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMessage, updateMessage } = useMessages();
  const draft = getMessage(Number(id));

  // Состояния
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]); // массив { id, file, previewUrl }
  const [type, setType] = useState('');     // категория
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const pendingActionRef = useRef('add');

  // Инициализация из черновика
  useEffect(() => {
    if (draft) {
      setTopic(draft.topic || '');
      setDescription(draft.description || '');
      setType(draft.type || '');

      // Преобразуем существующие фото в формат { id, previewUrl }
      const existingPhotos = (draft.photos || []).map((url, idx) => ({
        id: Date.now() + idx,
        file: null,
        previewUrl: url,
      }));
      setPhotos(existingPhotos);
    }
  }, [draft]);

  // Проверка существования черновика
  useEffect(() => {
    if (!draft || draft.userId !== 1) {
      alert('Черновик не найден');
      navigate('/drafts');
    }
  }, [draft, navigate]);

  // Функции для работы с фото (аналогично CreateMessagePage)
  const addFiles = (newFiles) => {
    const newPhotos = newFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const replaceFiles = (newFiles) => {
    photos.forEach(photo => {
      if (photo.file) URL.revokeObjectURL(photo.previewUrl);
    });
    const newPhotos = newFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos(newPhotos);
  };

  const handleAddPhotoClick = () => {
    pendingActionRef.current = 'add';
    fileInputRef.current.click();
  };

  const handleReplacePhotoClick = () => {
    pendingActionRef.current = 'replace';
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (pendingActionRef.current === 'add') {
      addFiles(files);
    } else {
      replaceFiles(files);
    }
    e.target.value = '';
  };

  const removePhoto = (id) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === id);
      if (photoToRemove && photoToRemove.file) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!topic.trim()) newErrors.topic = 'Укажите тему сообщения';
    if (!description.trim()) newErrors.description = 'Опишите проблему';
    if (!type) newErrors.type = 'Выберите рубрику';
    return newErrors;
  };

  const handlePublish = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const photoUrls = photos.map(photo => photo.previewUrl);
    if (photoUrls.length === 0) photoUrls.push(placeholderImg);

    const updatedMessage = {
      ...draft,
      topic,
      description,
      type,
      photos: photoUrls,
      isDraft: false,
    };

    updateMessage(draft.id, updatedMessage);
    navigate(`/message/${draft.id}`);
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const photoUrls = photos.map(photo => photo.previewUrl);
    if (photoUrls.length === 0) photoUrls.push(placeholderImg);

    const updatedMessage = {
      ...draft,
      topic,
      description,
      type,
      photos: photoUrls,
      isDraft: true,
    };

    updateMessage(draft.id, updatedMessage);
    navigate('/drafts');
  };

  if (!draft) return null;

  return (
    <div className="create-message-page">
      <h1 className="page-title">Редактирование черновика</h1>
      <form onSubmit={handlePublish} className="create-message-form">
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
            <button type="button" onClick={handleAddPhotoClick} className="photo-btn">
              Добавить фото
            </button>
            <button type="button" onClick={handleReplacePhotoClick} className="photo-btn">
              Заменить фото
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
          </div>

          {photos.length > 0 && (
            <div className="photo-preview-list">
              {photos.map(photo => (
                <div key={photo.id} className="photo-preview-item">
                  <img src={photo.previewUrl} alt="preview" className="photo-preview" />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={() => removePhoto(photo.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
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
                name="type"
                value="parking"
                checked={type === 'parking'}
                onChange={(e) => setType(e.target.value)}
              />
              Парковка
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="type"
                value="expired"
                checked={type === 'expired'}
                onChange={(e) => setType(e.target.value)}
              />
              Просроченные продукты
            </label>
          </div>
          {errors.type && <span className="error-message">{errors.type}</span>}
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">Опубликовать</button>
          <button type="button" onClick={handleSaveDraft} className="submit-btn">
            Сохранить черновик
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDraftPage;