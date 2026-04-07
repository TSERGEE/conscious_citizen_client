import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import {
  getIncidentPhotos,
  deleteIncidentPhoto,
  uploadIncidentPhoto,
  deleteIncident,
} from '../../api';
import SecureImage from '../SecureImage/SecureImage';
import './CreateMessagePage.css';

const EditMessagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMessage, addMessage, updateMessage, messages, refreshMessages } = useMessages();

  // Текстовые поля
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Фото
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [photosToDelete, setPhotosToDelete] = useState([]);
  const fileInputRef = useRef(null);
  const pendingActionRef = useRef('add');

  // Определяем, является ли текущий инцидент черновиком
  const isDraft = messages.find(m => m.id === Number(id))?.active === false;

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        const msg = await getMessage(id);
        setTopic(msg.title);
        setDescription(msg.description);
        setCategory(msg.type);
        setAddress(msg.address);
        setLatitude(msg.latitude);
        setLongitude(msg.longitude);

        const photosData = await getIncidentPhotos(id);
        const photos = photosData.map((p, idx) => ({
          id: p.id ?? idx,
          url: p.downloadUrl,
        }));
        setExistingPhotos(photos);
      } catch (err) {
        console.error('Load error:', err);
        if (err.message?.includes('500') || err.status === 500) {
          alert('Ошибка сервера. Возможно, инцидент был удалён. Попробуйте позже.');
        } else {
          alert('Не удалось загрузить сообщение: ' + err.message);
        }
        navigate('/main');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, getMessage, navigate]);

  // --- Работа с фото (как в CreateMessagePage) ---
  const handleAddPhotoClick = () => {
    pendingActionRef.current = 'add';
    fileInputRef.current.click();
  };

  const handleReplacePhotoClick = () => {
    pendingActionRef.current = 'replace';
    fileInputRef.current.click();
  };

  const addFiles = (files) => {
    const newPhotoObjects = files.map((file, index) => ({
      id: Date.now() + index,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setNewPhotos(prev => [...prev, ...newPhotoObjects]);
  };

  const replaceFiles = (files) => {
    newPhotos.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
    const newPhotoObjects = files.map((file, index) => ({
      id: Date.now() + index,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setNewPhotos(newPhotoObjects);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (pendingActionRef.current === 'add') addFiles(files);
    else replaceFiles(files);
    e.target.value = '';
  };

  const removeExistingPhoto = (photoId) => {
    setPhotosToDelete(prev => [...prev, photoId]);
    setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const removeNewPhoto = (tempId) => {
    const photoToRemove = newPhotos.find(p => p.id === tempId);
    if (photoToRemove) URL.revokeObjectURL(photoToRemove.previewUrl);
    setNewPhotos(prev => prev.filter(p => p.id !== tempId));
  };

  // Валидация
  const validateForm = () => {
    const newErrors = {};
    if (!topic.trim()) newErrors.topic = 'Укажите тему сообщения';
    if (!description.trim()) newErrors.description = 'Опишите проблему';
    if (!category) newErrors.category = 'Выберите рубрику';
    return newErrors;
  };

  // Скачать существующее фото как Blob (для копирования в новый инцидент)
  const downloadPhotoAsBlob = async (photoUrl) => {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(photoUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Не удалось скачать фото');
    return await response.blob();
  };

  // Публикация черновика (создание нового инцидента)
  const publishDraft = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setSaving(true);
    try {
      // Собираем все файлы для нового инцидента
      const allPhotoFiles = [];

      // Новые фото
      for (const photo of newPhotos) {
        allPhotoFiles.push(photo.file);
      }

      // Существующие фото (скачиваем и добавляем)
      for (const photo of existingPhotos) {
        const blob = await downloadPhotoAsBlob(photo.url);
        const file = new File([blob], `photo_${photo.id}.jpg`, { type: blob.type });
        allPhotoFiles.push(file);
      }

      // Создаём опубликованный инцидент
      const newIncidentId = await addMessage(
        {
          title: topic,
          description,
          type: category,
          address,
          latitude,
          longitude,
          active: true,
        },
        allPhotoFiles
      );

      // Удаляем старый черновик
      await deleteIncident(id);

      await refreshMessages();
      navigate(`/message/${newIncidentId}`);
      return true;
    } catch (err) {
      alert('Ошибка при публикации: ' + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Обновление опубликованного инцидента (без изменения статуса)
  const updatePublished = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    setSaving(true);
    try {
      await updateMessage(id, {
        title: topic,
        description,
        type: category,
        address,
      });

      for (const photoId of photosToDelete) {
        await deleteIncidentPhoto(id, photoId);
      }
      for (const photo of newPhotos) {
        await uploadIncidentPhoto(id, photo.file);
      }

      navigate(`/message/${id}`);
      return true;
    } catch (err) {
      alert('Ошибка при сохранении: ' + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Сохранение как черновик (только для черновиков, иначе предупреждение)
  const saveAsDraft = async () => {
    if (!isDraft) {
      alert('Опубликованное сообщение нельзя превратить в черновик без изменения сервера.\nИзменения будут сохранены, но статус останется "опубликован".');
      await updatePublished();
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSaving(true);
    try {
      await updateMessage(id, {
        title: topic,
        description,
        type: category,
        address,
      });
      for (const photoId of photosToDelete) {
        await deleteIncidentPhoto(id, photoId);
      }
      for (const photo of newPhotos) {
        await uploadIncidentPhoto(id, photo.file);
      }
      navigate('/drafts');
    } catch (err) {
      alert('Ошибка при сохранении черновика: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (isDraft) {
      await publishDraft();
    } else {
      await updatePublished();
    }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    await saveAsDraft();
  };

  // Очистка URL при размонтировании
  useEffect(() => {
    return () => {
      newPhotos.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [newPhotos]);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="create-message-page">
      <h1 className="page-title">Редактирование сообщения</h1>

      <form onSubmit={handlePublish} className="create-message-form">
        {/* Тема */}
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

        {/* Описание */}
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

        {/* Фото */}
        <div className="form-group">
          <label>Фотографии</label>
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

          {existingPhotos.length > 0 && (
            <div className="photo-preview-list">
              {existingPhotos.map(photo => (
                <div key={photo.id} className="photo-preview-item">
                  <SecureImage src={photo.url} alt="existing" className="photo-preview" />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={() => removeExistingPhoto(photo.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {newPhotos.length > 0 && (
            <div className="photo-preview-list">
              {newPhotos.map(photo => (
                <div key={photo.id} className="photo-preview-item">
                  <img src={photo.previewUrl} alt="new preview" className="photo-preview" />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={() => removeNewPhoto(photo.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
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

        {/* Кнопки */}
        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? 'Публикация...' : 'Опубликовать сообщение'}
          </button>
          <button type="button" onClick={handleSaveDraft} className="submit-btn" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить как черновик'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditMessagePage;