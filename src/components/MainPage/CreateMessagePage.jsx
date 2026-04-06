import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import placeholderImg from '../../assets/placeholder.png';
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
  const [photos, setPhotos] = useState([]);
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const pendingActionRef = useRef('add');

  const handleAddPhotoClick = () => {
    pendingActionRef.current = 'add';
    fileInputRef.current.click();
  };

  const handleReplacePhotoClick = () => {
    pendingActionRef.current = 'replace';
    fileInputRef.current.click();
  };

  const addFiles = (newFiles) => {
    const newPhotos = newFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const replaceFiles = (newFiles) => {
    photos.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
    const newPhotos = newFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos(newPhotos);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (pendingActionRef.current === 'add') addFiles(files);
    else replaceFiles(files);
    e.target.value = '';
  };

  const removePhoto = (id) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === id);
      if (photoToRemove) URL.revokeObjectURL(photoToRemove.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!topic.trim()) newErrors.topic = 'Укажите тему сообщения';
    if (!description.trim()) newErrors.description = 'Опишите проблему';
    if (!category) newErrors.category = 'Выберите рубрику';
    return newErrors;
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // ПЕРЕДАЕМ photos вторым аргументом
      const newId = await addMessage({
        title: topic,
        description,
        type: category,
        address,
        latitude: lat,
        longitude: lng,
        active: true,
      }, photos.map(p => p.file));
      
      navigate(`/message/${newId}`);
    } catch (err) {
      alert('Ошибка при публикации: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const newId = await addMessage({
        title: topic,
        description,
        type: category,
        address,
        latitude: lat,
        longitude: lng,
        active: false,
      }, photos.map(p => p.file)); 
      
      navigate(`/drafts`);
    } catch (err) {
      alert('Ошибка при сохранении черновика: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!address) return null;

  return (
    <div className="create-message-page">
      <h1 className="page-title">Создание сообщения</h1>

      <form onSubmit={handlePublish} className="create-message-form">
        <div className="form-group">
          <label htmlFor="topic">Тема сообщения</label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={e => setTopic(e.target.value)}
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
            onChange={e => setDescription(e.target.value)}
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
                  <button type="button" className="remove-photo-btn" onClick={() => removePhoto(photo.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Адрес</label>
          <div className="address-display">{address}</div>
        </div>

        <div className="form-group">
          <label>Рубрика</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="category"
                value="PARKING"
                checked={category === 'PARKING'}
                onChange={e => setCategory(e.target.value)}
              />
              Парковка
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="category"
                value="FOOD_EXPIRED"
                checked={category === 'FOOD_EXPIRED'}
                onChange={e => setCategory(e.target.value)}
              />
              Просроченные продукты
            </label>
          </div>
          {errors.category && <span className="error-message">{errors.category}</span>}
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Публикация...' : 'Опубликовать сообщение'}
          </button>
          <button type="button" onClick={handleSaveDraft} className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сохранить как черновик'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMessagePage;