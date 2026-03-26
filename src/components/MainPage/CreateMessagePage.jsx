import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import './CreateMessagePage.css';

const CreateMessagePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addMessage } = useMessages();
  const { lat, lng, address } = location.state || {};

  useEffect(() => {
    if (!address) {
      alert('Сначала выберите место на карте');
      navigate('/main');
    }
  }, [address, navigate]);

  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]); // массив объектов { id, file, previewUrl }
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const pendingActionRef = useRef('add'); // 'add' или 'replace'

  const handlePhotoClick = () => fileInputRef.current.click();

  // Добавление новых файлов к существующим
  const addFiles = (newFiles) => {
    const newPhotos = newFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };
  // Замена всех текущих файлов новыми
  const replaceFiles = (newFiles) => {
    // Освобождаем старые URL
    photos.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
    const newPhotos = newFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos(newPhotos);
  };
  // Обработчик клика по кнопке добавления
  const handleAddPhotoClick = () => {
    pendingActionRef.current = 'add';
    fileInputRef.current.click();
  };

  // Обработчик клика по кнопке замены
  const handleReplacePhotoClick = () => {
    pendingActionRef.current = 'replace';
    fileInputRef.current.click();
  };
  // Обработчик выбора файлов
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (pendingActionRef.current === 'add') {
      addFiles(files);
    } else {
      replaceFiles(files);
    }

    // Очищаем поле input, чтобы можно было повторно выбрать те же файлы
    e.target.value = '';
  };

  // Удаление конкретного фото
  const removePhoto = (id) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === id);
      if (photoToRemove) URL.revokeObjectURL(photoToRemove.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  };

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

  // Публикация сообщения
  const handlePublish = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const photoUrls = photos.map(photo => photo.previewUrl);
    // Если фото нет, можно использовать плейсхолдер (но лучше оставить пустой массив)
    if (photoUrls.length === 0) photoUrls.push('https://via.placeholder.com/100');

    const newMessage = {
      topic,
      description,
      type: category,
      photos: photoUrls,
      address,
      lat,
      lng,
      userId: 1,
      isDraft: false,
    };

    const messageId = addMessage(newMessage);
    navigate(`/message/${messageId}`);
  };


  // Сохранение как черновик (isDraft = true)
  const handleSaveDraft = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const photoUrls = photos.map(photo => photo.previewUrl);
    if (photoUrls.length === 0) photoUrls.push('https://via.placeholder.com/100');

    const draftMessage = {
      topic,
      description,
      type: category,
      photos: photoUrls,
      address,
      lat,
      lng,
      userId: 1,
      isDraft: true,
    };

    addMessage(draftMessage);
    navigate('/drafts');
  };

  if (!address) return null;

  return (
  <div className="create-message-page">
      <h1 className="page-title">Создание сообщения</h1>
      <h2 className="section-subtitle">Опишите проблему</h2>

      <form onSubmit={handlePublish} className="create-message-form">
        {/* Тема */}
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

        {/* Текст сообщения */}
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

        {/* Фото */}
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

          {/* Превью выбранных фото */}
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
          {errors.photos && <span className="error-message">{errors.photos}</span>}
        </div>

        {/* Адрес */}
        <div className="form-group">
          <label>Адрес</label>
          <div className="address-display">{address}</div>
        </div>

        {/* Рубрика */}
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
              />
              Парковка
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="category"
                value="expired"
                checked={category === 'expired'}
                onChange={(e) => setCategory(e.target.value)}
              />
              Просроченные продукты
            </label>
          </div>
          {errors.category && <span className="error-message">{errors.category}</span>}
        </div>

        {/* Кнопки действий */}
        <div className="form-actions">
          <button type="submit" className="submit-btn">
            Опубликовать сообщение
          </button>
          <button type="button" onClick={handleSaveDraft} className="submit-btn">
            Сохранить как черновик
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMessagePage;