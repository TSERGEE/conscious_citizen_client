import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateHouse, validateApartment, validatePhone, validateCyrillicWithHyphen, validateCyrillicOnly, normalizeAndFormatPhone } from '../../utils/validation';
import './Profile.css';
import { getUser } from '../../api';

// Простейший debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const ProfileEdit = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const streetSuggestionsRef = useRef(null);

  // Состояние формы
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    phone: '',
    city: 'Самара',
    street: '',
    house: '',
    apartment: '',
    email: '',        // <-- добавить
    photo: '',
    isAdmin: true,
  });

  // Ошибки валидации
  const [errors, setErrors] = useState({});

  // Состояния для подсказок улиц
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [isFetchingStreets, setIsFetchingStreets] = useState(false);
  const [selectedStreet, setSelectedStreet] = useState(false);

  // Debounce для ввода улицы
  const debouncedStreet = useDebounce(formData.street, 500);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const login = localStorage.getItem('userLogin');

        if (!login) {
          navigate('/login');
          return;
        }

        const user = await getUser(login);

        const fullNameParts = user.fullName?.split(' ') || [];

        const lastName = fullNameParts[0] || '';
        const firstName = fullNameParts[1] || '';
        const middleName = fullNameParts[2] || '';
        
        const addressParts = user.address?.split(',') || [];

        const city = addressParts[0]?.trim() || 'Самара';
        const street = addressParts[1]?.trim() || '';
        const extractNumberPart = (s) => {
          const match = s?.match(/(\d.*)/); // берём всё от первой цифры до конца
          return match ? match[1].trim() : '';
        };

        const house = extractNumberPart(addressParts[2]);
        const apartment = extractNumberPart(addressParts[3]);

        setFormData(prev => ({
          ...prev,
          lastName,
          firstName,
          middleName,
          phone: user.phone || '',
          email: user.email || '',
          city,
          street,
          house,
          apartment
        }));
        if (street) {
          setSelectedStreet(true);
        }
        //console.log(localStorage.getItem('userLogin'));

      } catch (e) {
        console.error(e);
        navigate('/profile');
      }
    };

    loadUser();
  }, [navigate]);

  // Получение подсказок улиц через Nominatim
  useEffect(() => {
    const fetchStreetSuggestions = async () => {
      if (!debouncedStreet.trim() || debouncedStreet.length < 3) {
        setStreetSuggestions([]);
        setShowStreetSuggestions(false);
        return;
      }

      setIsFetchingStreets(true);
      try {
        const query = `${debouncedStreet}, Самара, Россия`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`
        );
        const data = await response.json();
        // Извлекаем названия улиц
        const uniqueStreets = data
          .map(item => item.address?.road || item.display_name.split(',')[0])
          .filter((street, index, self) => street && self.indexOf(street) === index);
        setStreetSuggestions(uniqueStreets);
        setShowStreetSuggestions(uniqueStreets.length > 0);
      } catch (error) {
        console.error('Ошибка получения подсказок улиц:', error);
        setStreetSuggestions([]);
        setShowStreetSuggestions(false);
      } finally {
        setIsFetchingStreets(false);
      }
    };

    fetchStreetSuggestions();
  }, [debouncedStreet]);

  // Закрытие подсказок при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (streetSuggestionsRef.current && !streetSuggestionsRef.current.contains(event.target)) {
        setShowStreetSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'phone') {
      newValue = value.replace(/\D/g, '');
    }
    if (name === 'street') {
      setSelectedStreet(false); // сброс флага при ручном вводе
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

  const handlePhotoClick = () => fileInputRef.current?.click();

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
        // проверка по selectedStreet будет в handleSubmit
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

  const handleStreetSuggestionClick = (street) => {
    setFormData(prev => ({ ...prev, street }));
    setSelectedStreet(true);
    setShowStreetSuggestions(false);
    setErrors(prev => ({ ...prev, street: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let phoneForValidation = formData.phone;
    const normalizedPhone = normalizeAndFormatPhone(formData.phone);
    
    if (normalizedPhone !== formData.phone) {
      setFormData(prev => ({ ...prev, phone: normalizedPhone }));
      phoneForValidation = normalizedPhone;
    }

    const newErrors = {};

    // ===== ВАЛИДАЦИЯ (оставляем ВСЁ) =====

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Обязательное поле';
    } else if (!validateCyrillicWithHyphen(formData.lastName)) {
      newErrors.lastName = 'Только кириллица и дефис';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Обязательное поле';
    } else if (!validateCyrillicOnly(formData.firstName)) {
      newErrors.firstName = 'Только кириллица';
    }

    if (formData.middleName && !validateCyrillicOnly(formData.middleName)) {
      newErrors.middleName = 'Только кириллица';
    }

    if (!phoneForValidation.trim()) {
      newErrors.phone = 'Обязательное поле';
    } else if (!validatePhone(phoneForValidation)) {
      newErrors.phone = 'Некорректный формат';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Обязательное поле';
    } /*else if (!selectedStreet) {
      newErrors.street = 'Выберите из списка';
    }*/

    if (!formData.house.trim()) {
      newErrors.house = 'Обязательное поле';
    } else if (!validateHouse(formData.house)) {
      newErrors.house = 'Некорректный формат';
    }

    if (formData.apartment && !validateApartment(formData.apartment)) {
      newErrors.apartment = 'Некорректный формат';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // ===== ОТПРАВКА НА СЕРВЕР =====

    try {
      const login = localStorage.getItem('userLogin');
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:54455/user/${login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          login: login,
          fullName: `${formData.lastName} ${formData.firstName} ${formData.middleName || ''}`,
          phone: phoneForValidation,
          email: formData.email,
          address: `${formData.city}, ${formData.street}, ${formData.house}, ${formData.apartment || ''}`,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Ошибка обновления профиля');
      }

      const updatedUser = await response.json();
      // можно сохранить локально (кэш)
      localStorage.setItem('userProfile', JSON.stringify(updatedUser));

      navigate('/profile');

    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении профиля');
    }
  };

  return (
    <div className="profile-container">
      <h2>Редактирование профиля</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Фото профиля</label>
          <div className="photo-upload">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            {formData.photo ? (
              <div className="photo-preview">
                <img src={formData.photo} alt="preview" />
              </div>
            ) : (
              <div className="photo-placeholder">Нет фото</div>
            )}
            <div className="photo-actions">
              <button type="button" onClick={handlePhotoClick}>
                {formData.photo ? 'Заменить' : 'Загрузить'}
              </button>
              {formData.photo && (
                <button type="button" className="remove-btn" onClick={handleRemovePhoto}>
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
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            className="readonly-field"
          />
        </div>

        <div className="form-group">
          <label>Город</label>
          <input type="text" name="city" value={formData.city} onChange={handleChange} disabled />
        </div>

        <div className="form-group" ref={streetSuggestionsRef}>
          <label>Улица *</label>
          <div className="input-wrapper">
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              onFocus={() => {
                if (streetSuggestions.length > 0) setShowStreetSuggestions(true);
              }}
              className={errors.street ? 'error' : ''}
              autoComplete="off"
            />
            {showStreetSuggestions && (
              <ul className="suggestions-list">
                {isFetchingStreets && <li className="suggestion-item loading">Загрузка...</li>}
                {!isFetchingStreets &&
                  streetSuggestions.map((street, idx) => (
                    <li key={idx} className="suggestion-item" onClick={() => handleStreetSuggestionClick(street)}>
                      {street}
                    </li>
                  ))}
              </ul>
            )}
          </div>
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