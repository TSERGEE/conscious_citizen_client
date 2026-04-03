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

  // Состояния формы
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]); // { id, file, previewUrl }
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const pendingActionRef = useRef('add');

  // Инициализация из черновика
  useEffect(() => {
    if (draft) {
      setTopic(draft.topic || draft.title || '');
      setDescription(draft.description || '');
      setCategory(draft.type || '');

      // Преобразуем существующие фото в формат компонента
      const existingPhotos = (draft.photos || []).map((url, idx) => ({
        id: Date.now() + idx,
        file: null,             // существующие фото не имеют File объекта
        previewUrl: url,        // это может быть data URL или URL с сервера
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

  // ----- Функции работы с фото (полностью как в CreateMessagePage) -----
  const addFiles = (newFiles) => {
    const newPhotos = newFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      previewUrl: URL.createObjectURL(file), // временный blob URL
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const replaceFiles = (newFiles) => {
    // Освобождаем ресурсы старых blob URL (только для новых фото, у которых есть file)
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

  // Преобразование новых файлов в постоянные data URL для сохранения
  const getPhotoUrls = async () => {
    const urls = [];
    for (const photo of photos) {
      if (photo.file) {
        // Новый файл – читаем как data URL
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(photo.file);
        });
        urls.push(dataUrl);
      } else {
        // Существующее фото – используем его previewUrl (data URL или URL с сервера)
        urls.push(photo.previewUrl);
      }
    }
    if (urls.length === 0) urls.push(placeholderImg);
    return urls;
  };

  // Валидация
  const validateForm = () => {
    const newErrors = {};
    if (!topic.trim()) newErrors.topic = 'Укажите тему сообщения';
    if (!description.trim()) newErrors.description = 'Опишите проблему';
    if (!category) newErrors.category = 'Выберите рубрику';
    return newErrors;
  };

  // Публикация (черновик -> активное сообщение)
  const handlePublish = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const photoUrls = await getPhotoUrls();
      const updatedMessage = {
        ...draft,
        topic,
        description,
        type: category,
        photos: photoUrls,
        isDraft: false,      // теперь это не черновик
      };
      updateMessage(draft.id, updatedMessage);
      navigate(`/message/${draft.id}`);
    } catch (err) {
      alert('Ошибка при публикации: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Сохранить как черновик (обновить существующий)
  const handleSaveDraft = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const photoUrls = await getPhotoUrls();
      const updatedMessage = {
        ...draft,
        topic,
        description,
        type: category,
        photos: photoUrls,
        isDraft: true,
      };
      updateMessage(draft.id, updatedMessage);
      navigate('/drafts');
    } catch (err) {
      alert('Ошибка при сохранении черновика: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!draft) return null;

  return (
    <div className="create-message-page">
      <h1 className="page-title">Редактирование черновика</h1>

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

        {/* Описание */}
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

        {/* Фото – полностью как в CreateMessagePage */}
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

        {/* Адрес (только для чтения) */}
        <div className="form-group">
          <label>Адрес</label>
          <div className="address-display">{draft.address}</div>
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
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Публикация...' : 'Опубликовать'}
          </button>
          <button type="button" onClick={handleSaveDraft} className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сохранить черновик'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDraftPage;