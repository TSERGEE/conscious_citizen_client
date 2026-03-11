import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import './CreateMessagePage.css';

const CreateMessagePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addMessage } = useMessages();
  const { lat, lng, address } = location.state || {};

  React.useEffect(() => {
    if (!address) {
      alert('Сначала выберите место на карте');
      navigate('/main');
    }
  }, [address, navigate]);

  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Для фото пока сохраняем заглушку (в реальности нужно загружать на сервер)
    const photoUrl = photo ? URL.createObjectURL(photo) : 'https://via.placeholder.com/100';

    const newMessage = {
      topic,
      description,
      category,
      photos: [photoUrl],
      address,
      lat,
      lng,
      userId: 1, // текущий пользователь (позже брать из контекста auth)
    };

    const messageId = addMessage(newMessage);
    navigate(`/message/${messageId}`);
  };

  if (!address) return null;

  return (
    <div className="create-message-page">
      <h1 className="page-title">Создание сообщения</h1>
      <h2 className="section-subtitle">Опишите проблему</h2>
      <form onSubmit={handleSubmit} className="create-message-form">
        {/* поля формы как раньше */}
        <div className="form-group">
          <label htmlFor="topic">Тема сообщения</label>
          <input type="text" id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={errors.topic ? 'error' : ''} />
          {errors.topic && <span className="error-message">{errors.topic}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="description">Текст сообщения</label>
          <textarea id="description" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} className={errors.description ? 'error' : ''} />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>
        <div className="form-group">
          <label>Фото</label>
          <div className="photo-upload">
            <button type="button" onClick={handlePhotoClick} className="photo-btn">Добавить фото</button>
            <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" style={{ display: 'none' }} />
            {photo && <span className="photo-name">{photo.name}</span>}
          </div>
        </div>
        <div className="form-group">
          <label>Адрес</label>
          <div className="address-display">{address}</div>
        </div>
        <div className="form-group">
          <label>Рубрика</label>
          <div className="radio-group">
            <label className="radio-label">
              <input type="radio" name="category" value="parking" checked={category === 'parking'} onChange={(e) => setCategory(e.target.value)} /> Парковка
            </label>
            <label className="radio-label">
              <input type="radio" name="category" value="expired" checked={category === 'expired'} onChange={(e) => setCategory(e.target.value)} /> Просроченные продукты
            </label>
          </div>
          {errors.category && <span className="error-message">{errors.category}</span>}
        </div>
        <button type="submit" className="submit-btn">Опубликовать сообщение</button>
      </form>
    </div>
  );
};

export default CreateMessagePage;