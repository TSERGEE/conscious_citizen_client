import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { streets } from '../../data/streets';
import { validateHouse, validateApartment, validatePhone, validateCyrillicWithHyphen, validateCyrillicOnly, normalizeAndFormatPhone } from '../../utils/validation';
import './Profile.css';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  // Состояние формы
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    phone: '',
    city: 'Самара', // по умолчанию
    street: '',
    house: '',
    apartment: '',
    photo: ''
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

    if (name === 'phone') {
      // При вводе сохраняем только цифры
      newValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (name !== 'phone') {
      validateField(name, newValue);
    } else {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handlePhoneBlur = () => {
    const formatted = normalizeAndFormatPhone(formData.phone);
    if (formatted !== formData.phone) {
      setFormData(prev => ({ ...prev, phone: formatted }));
    }
    validateField('phone', formatted);
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: '' }));
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'lastName':
        if (!value.trim()) error = 'Обязательное поле';
        else if (!validateCyrillicWithHyphen(value)) error = 'Только кириллица и дефис';
        break;
      case 'firstName':
        if (!value.trim()) error = 'Обязательное поле';
        else if (!validateCyrillicOnly(value)) error = 'Только кириллица';
        break;
      case 'middleName':
        if (value && !validateCyrillicOnly(value)) error = 'Только кириллица';
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
  
    let phoneForValidation = formData.phone;
    const normalizedPhone = normalizeAndFormatPhone(formData.phone);
    if (normalizedPhone !== formData.phone) {
      setFormData(prev => ({ ...prev, phone: normalizedPhone }));
      phoneForValidation = normalizedPhone;
    }
  
    const newErrors = {};

    // Фамилия
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Обязательное поле';
    } else if (!validateCyrillicWithHyphen(formData.lastName)) {
      newErrors.lastName = 'Только кириллица и дефис';
    }

    // Имя
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Обязательное поле';
    } else if (!validateCyrillicOnly(formData.firstName)) {
      newErrors.firstName = 'Только кириллица';
    }

    // Отчество (необязательное, но если есть – проверяем)
    if (formData.middleName && !validateCyrillicOnly(formData.middleName)) {
      newErrors.middleName = 'Только кириллица';
    }

    // Телефон
    if (!phoneForValidation.trim()) {
      newErrors.phone = 'Обязательное поле';
    } else if (!validatePhone(phoneForValidation)) {
      newErrors.phone = 'Некорректный формат (+7 XXX XXX XX XX)';
    }

    // Улица
    if (!formData.street.trim()) {
      newErrors.street = 'Обязательное поле';
    }

    // Дом
    if (!formData.house.trim()) {
      newErrors.house = 'Обязательное поле';
    } else if (!validateHouse(formData.house)) {
      newErrors.house = 'Только цифры, кириллица, тире, дробь';
    }

    // Квартира (необязательная)
    if (formData.apartment && !validateApartment(formData.apartment)) {
      newErrors.apartment = 'Только цифры и кириллица';
    }

    setErrors(newErrors);

    // Если есть ошибки – не сохраняем
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Сохраняем
    localStorage.setItem('userProfile', JSON.stringify({...formData, phone: phoneForValidation}));
    navigate('/profile');
  };

  // Фильтрация улиц для подсказок
  const filteredStreets = streets.filter(street =>
    street.toLowerCase().startsWith(formData.street.toLowerCase())
  );

  return (
    <div className="profile-container">
      <h2>Редактирование профиля</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
        <label>Фото профиля</label>
        <div className="photo-upload">
          {/* Скрытый input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            style={{ display: 'none' }}
          />
          {/* Превью */}
          {formData.photo ? (
            <div className="photo-preview">
              <img src={formData.photo} alt="preview" />
            </div>
          ) : (
            <div className="photo-placeholder">
              Нет фото
            </div>
          )}
          {/* Кнопки */}
          <div className="photo-actions">
            <button type="button" onClick={handlePhotoClick}>
              {formData.photo ? 'Заменить' : 'Загрузить'}
            </button>
            {formData.photo && (
              <button
                type="button"
                className="remove-btn"
                onClick={handleRemovePhoto}
              >
                Удалить
              </button>
            )}
          </div>
        </div>
      </div>
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
            onBlur={handlePhoneBlur}
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