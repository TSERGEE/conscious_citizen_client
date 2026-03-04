import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { streets } from '../../data/streets';
import { validateCyrillic, validateHouse, validateApartment, validatePhone, formatPhone } from '../../utils/validation';
import './Profile.css';

const ProfileEdit = () => {
  const navigate = useNavigate();
  
  // Состояние формы
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    phone: '',
    city: 'Самара', // по умолчанию
    street: '',
    house: '',
    apartment: ''
  });

  // Ошибки валидации
  const [errors, setErrors] = useState({});

  // При монтировании загружаем сохранённые данные (если есть)
  useEffect(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Для телефона применяем форматирование
    if (name === 'phone') {
      newValue = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));

    // Валидация по мере ввода
    validateField(name, newValue);
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'lastName':
        if (!value.trim()) error = 'Обязательное поле';
        else if (!validateCyrillic(value, true)) error = 'Только кириллица, пробел или дефис';
        break;
      case 'firstName':
        if (!value.trim()) error = 'Обязательное поле';
        else if (!validateCyrillic(value)) error = 'Только кириллица';
        break;
      case 'middleName':
        if (value && !validateCyrillic(value)) error = 'Только кириллица';
        break;
      case 'phone':
        if (!value.trim()) error = 'Обязательное поле';
        else if (!validatePhone(value)) error = 'Некорректный формат (+7 XXX XXX XX XX)';
        break;
      case 'street':
        if (!value.trim()) error = 'Обязательное поле';
        break;
      case 'house':
        if (!value.trim()) error = 'Обязательное поле';
        else if (!validateHouse(value)) error = 'Только цифры, кириллица, тире, дробь';
        break;
      case 'apartment':
        if (value && !validateApartment(value)) error = 'Только цифры и кириллица';
        break;
      default: break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Проверяем все поля на ошибки
    const requiredFields = ['lastName', 'firstName', 'phone', 'street', 'house'];
    let hasErrors = false;
    requiredFields.forEach(field => {
      if (!formData[field]) {
        setErrors(prev => ({ ...prev, [field]: 'Обязательное поле' }));
        hasErrors = true;
      }
    });
    if (hasErrors) return;

    // Сохраняем в localStorage
    localStorage.setItem('userProfile', JSON.stringify(formData));
    // Переход на экран рубрик (пока просто на профиль)
    navigate('/profile');
  };

  // Фильтрация улиц для подсказок
  const filteredStreets = streets.filter(street =>
    street.toLowerCase().includes(formData.street.toLowerCase())
  );

  return (
    <div className="profile-container">
      <h2>Редактирование профиля</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Фамилия *</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={errors.lastName ? 'error' : ''}
          />
          {errors.lastName && <span className="error-message">{errors.lastName}</span>}
        </div>

        <div className="form-group">
          <label>Имя *</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={errors.firstName ? 'error' : ''}
          />
          {errors.firstName && <span className="error-message">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label>Отчество</label>
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            className={errors.middleName ? 'error' : ''}
          />
          {errors.middleName && <span className="error-message">{errors.middleName}</span>}
        </div>

        <div className="form-group">
          <label>Телефон *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+7 XXX XXX XX XX"
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label>Город</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled // в MVP только Самара
          />
        </div>

        <div className="form-group">
          <label>Улица *</label>
          <input
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            list="street-suggestions"
            className={errors.street ? 'error' : ''}
            autoComplete="off"
          />
          <datalist id="street-suggestions">
            {filteredStreets.map((street, idx) => (
              <option key={idx} value={street} />
            ))}
          </datalist>
          {errors.street && <span className="error-message">{errors.street}</span>}
        </div>

        <div className="form-group">
          <label>Дом *</label>
          <input
            type="text"
            name="house"
            value={formData.house}
            onChange={handleChange}
            className={errors.house ? 'error' : ''}
          />
          {errors.house && <span className="error-message">{errors.house}</span>}
        </div>

        <div className="form-group">
          <label>Квартира</label>
          <input
            type="text"
            name="apartment"
            value={formData.apartment}
            onChange={handleChange}
            className={errors.apartment ? 'error' : ''}
          />
          {errors.apartment && <span className="error-message">{errors.apartment}</span>}
        </div>

        <button type="submit" className="save-btn">Сохранить</button>
      </form>
    </div>
  );
};

export default ProfileEdit;