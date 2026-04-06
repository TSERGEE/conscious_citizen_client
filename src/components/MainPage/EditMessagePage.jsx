import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import './CreateMessagePage.css'; // можно скопировать стили CreateMessagePage

const EditMessagePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getMessage, updateMessage } = useMessages();

  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getMessage(id)
      .then(msg => {
        setTopic(msg.title);
        setDescription(msg.description);
        setCategory(msg.type);
        setAddress(msg.address);
        setLoading(false);
      })
      .catch(() => {
        alert('Не удалось загрузить сообщение');
        navigate('/main');
      });
  }, [id, getMessage, navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!topic.trim()) newErrors.topic = 'Укажите тему сообщения';
    if (!description.trim()) newErrors.description = 'Опишите проблему';
    if (!category) newErrors.category = 'Выберите рубрику';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        address,          // адрес обычно не меняется, но оставим
        active: true,     // при редактировании публикуем
      });
      navigate(`/message/${id}`);
    } catch (err) {
      alert('Ошибка при сохранении: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="create-message-page"> {/* используем те же стили */}
      <h1 className="page-title">Редактирование сообщения</h1>

      <form onSubmit={handleSubmit} className="create-message-form">
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

        <div className="form-group">
          <label>Адрес</label>
          <div className="address-display">{address}</div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <button type="button" onClick={() => navigate(`/message/${id}`)} className="submit-btn">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditMessagePage;