import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PasswordInput from '../PasswordInput/PasswordInput';
import '../Auth/Auth.css';
import eyeOpen from '../../assets/icons/eye-open.png';
import eyeClosed from '../../assets/icons/eye-closed.png';
import {
  validateHouse,
  validateApartment,
  validatePhone,
  validateCyrillicWithHyphen,
  validateCyrillicOnly,
  normalizeAndFormatPhone,
} from '../../utils/validation';
import { register, deleteIncidentPhoto  } from '../../api';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const Register = () => {
  const navigate = useNavigate();
  const streetSuggestionsRef = useRef(null);

  // Управление шагами: 1 – основные данные, 2 – данные профиля
  const [step, setStep] = useState(1);

  // Данные первого шага
  const [authData, setAuthData] = useState({
    login: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [subscribeNews, setSubscribeNews] = useState(true);
  const [authErrors, setAuthErrors] = useState({});

  // Данные профиля (второй шаг)
  const [profileData, setProfileData] = useState({
    lastName: '',
    firstName: '',
    middleName: '',
    phone: '',
    city: 'Самара',
    street: '',
    house: '',
    apartment: '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [serverError, setServerError] = useState(''); // новое состояние
  // Для подсказок улиц
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [isFetchingStreets, setIsFetchingStreets] = useState(false);
  const [selectedStreet, setSelectedStreet] = useState(false);
  const debouncedStreet = useDebounce(profileData.street, 500);

  // --- Валидация первого шага ---
  const validateLogin = (login) => {
    if (!login) return 'Логин обязателен';
    if (!/^[a-zA-Z0-9._-]+$/.test(login)) {
      return 'Логин может содержать только латинские буквы, цифры, точки, тире и подчёркивания';
    }
    if (login.startsWith('.') || login.endsWith('.')) {
      return 'Логин не может начинаться или заканчиваться точкой';
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email) return 'Email обязателен';
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!re.test(email)) return 'Некорректный email';
    const [localPart, domain] = email.split('@');
    if (localPart.startsWith('.') || localPart.endsWith('.')) return 'Email не может начинаться или заканчиваться точкой до @';
    if (localPart.includes('..')) return 'Email не может содержать две точки подряд до @';
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    if (!/^[a-zA-Z]{2,}$/.test(tld)) return 'Домен верхнего уровня должен содержать только буквы (минимум 2 символа)';
    if (domainParts.some(part => part.startsWith('-') || part.endsWith('-'))) {
      return 'Сегменты домена не могут начинаться или заканчиваться дефисом';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Пароль обязателен';
    if (password.length < 8) return 'Пароль должен быть не менее 8 символов';
    if (!/^[A-Za-z0-9 !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/.test(password)) {
      return 'Пароль содержит недопустимые символы';
    }
    return '';
  };

  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthData(prev => ({ ...prev, [name]: value }));
    if (authErrors[name]) {
      setAuthErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // --- Обработчик первого шага: переход ко второму шагу ---
  const handleFirstStepSubmit = (e) => {
    e.preventDefault();

    const loginError = validateLogin(authData.login);
    const emailError = validateEmail(authData.email);
    const passwordError = validatePassword(authData.password);
    const confirmError = authData.password !== authData.confirmPassword ? 'Пароли не совпадают' : '';

    setAuthErrors({
      login: loginError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmError,
    });

    if (loginError || emailError || passwordError || confirmError) return;

    if (!agreeTerms) {
      alert('Необходимо согласиться с правилами проекта');
      return;
    }

    // Переходим к заполнению профиля
    goToProfileStep(); // переходим ко второму шагу, сбрасывая serverError
  };

  // --- Валидация полей профиля (аналогично ProfileEdit) ---
  const validateProfileField = (name, value) => {
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
        // Окончательная проверка с selectedStreet будет в handleFinalSubmit
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
    setProfileErrors(prev => ({ ...prev, [name]: error }));
  };
  // При переходе на второй шаг сбрасываем предыдущую серверную ошибку
  const goToProfileStep = () => {
    setServerError('');
    setStep(2);
  };
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === 'phone') newValue = value.replace(/\D/g, '');
    if (name === 'street') setSelectedStreet(false);
    setProfileData(prev => ({ ...prev, [name]: newValue }));
    if (name !== 'phone') validateProfileField(name, newValue);
    else setProfileErrors(prev => ({ ...prev, phone: '' }));
    if (serverError) setServerError(''); // сбрасываем серверную ошибку
  };

  const handlePhoneBlur = () => {
    const formatted = normalizeAndFormatPhone(profileData.phone);
    if (formatted !== profileData.phone) {
      setProfileData(prev => ({ ...prev, phone: formatted }));
    }
    validateProfileField('phone', formatted);
  };

  // --- Подсказки улиц ---
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (streetSuggestionsRef.current && !streetSuggestionsRef.current.contains(event.target)) {
        setShowStreetSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStreetSuggestionClick = (street) => {
    setProfileData(prev => ({ ...prev, street }));
    setSelectedStreet(true);
    setShowStreetSuggestions(false);
    setProfileErrors(prev => ({ ...prev, street: '' }));
  };

  // --- Отправка всех данных на сервер ---
  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    // Нормализация телефона
    let phoneForValidation = profileData.phone;
    const normalizedPhone = normalizeAndFormatPhone(profileData.phone);
    if (normalizedPhone !== profileData.phone) {
      setProfileData(prev => ({ ...prev, phone: normalizedPhone }));
      phoneForValidation = normalizedPhone;
    }

    const newProfileErrors = {};

    if (!profileData.lastName.trim()) newProfileErrors.lastName = 'Обязательное поле';
    else if (!validateCyrillicWithHyphen(profileData.lastName)) newProfileErrors.lastName = 'Только кириллица и дефис';

    if (!profileData.firstName.trim()) newProfileErrors.firstName = 'Обязательное поле';
    else if (!validateCyrillicOnly(profileData.firstName)) newProfileErrors.firstName = 'Только кириллица';

    if (profileData.middleName && !validateCyrillicOnly(profileData.middleName)) newProfileErrors.middleName = 'Только кириллица';

    if (!phoneForValidation.trim()) newProfileErrors.phone = 'Обязательное поле';
    else if (!validatePhone(phoneForValidation)) newProfileErrors.phone = 'Некорректный формат (+7 XXX XXX XX XX)';

    if (!profileData.street.trim()) newProfileErrors.street = 'Обязательное поле';
    else if (!selectedStreet) newProfileErrors.street = 'Пожалуйста, выберите улицу из списка';

    if (!profileData.house.trim()) newProfileErrors.house = 'Обязательное поле';
    else if (!validateHouse(profileData.house)) newProfileErrors.house = 'Только цифры, кириллица, тире, дробь';

    if (profileData.apartment && !validateApartment(profileData.apartment)) newProfileErrors.apartment = 'Только цифры и кириллица';

    setProfileErrors(newProfileErrors);

    if (Object.keys(newProfileErrors).length > 0) return;

    // Формируем fullName и address
    const fullName = [profileData.lastName, profileData.firstName, profileData.middleName]
      .filter(Boolean)
      .join(' ')
      .trim();

    // Формируем address с городом
    const address = `г. ${profileData.city || 'Самара'}, ${profileData.street}, д. ${profileData.house}${profileData.apartment ? `, кв. ${profileData.apartment}` : ''}`;


    const payload = {
      login: authData.login,
      email: authData.email,
      password: authData.password,
      fullName,
      phone: phoneForValidation,
      address,
      subscribeNews,
    };

    try {
      await register(payload);
      navigate('/login'); // переход на страницу входа после успешной регистрации
    } catch (error) {
      //alert(error.message);
      setServerError(error.message); // показываем ошибку
    }
  };

  // --- Рендер первого шага (только основные поля) ---
  const renderAuthStep = () => (
    <form onSubmit={handleFirstStepSubmit}>
      <div className="form-group">
        <label htmlFor="login">Логин</label>
        <input
          type="text"
          id="login"
          name="login"
          value={authData.login}
          onChange={handleAuthChange}
          className={authErrors.login ? 'error' : ''}
          required
        />
        {authErrors.login && <span className="error-message">{authErrors.login}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">E-mail</label>
        <input
          type="email"
          id="email"
          name="email"
          value={authData.email}
          onChange={handleAuthChange}
          className={authErrors.email ? 'error' : ''}
          required
        />
        {authErrors.email && <span className="error-message">{authErrors.email}</span>}
      </div>

      <PasswordInput
        id="password"
        name="password"
        label="Пароль"
        value={authData.password}
        onChange={handleAuthChange}
        required
        error={authErrors.password}
        iconShow={<img src={eyeOpen} alt="show" width="20" height="20" />}
        iconHide={<img src={eyeClosed} alt="hide" width="20" height="20" />}
      />

      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Подтверждение пароля"
        value={authData.confirmPassword}
        onChange={handleAuthChange}
        required
        error={authErrors.confirmPassword}
        iconShow={<img src={eyeOpen} alt="show" width="20" height="20" />}
        iconHide={<img src={eyeClosed} alt="hide" width="20" height="20" />}
      />

      <div className="checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            required
          />
          <span>
            Я согласен с <Link to="/rules" target="_blank">правилами проекта "Сознательный гражданин"</Link>
          </span>
        </label>
      </div>

      <div className="checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={subscribeNews}
            onChange={(e) => setSubscribeNews(e.target.checked)}
          />
          <span>Я хочу получать рассылку о новостях на email</span>
        </label>
      </div>

      <button type="submit">Зарегистрироваться</button>
    </form>
  );

  // --- Рендер второго шага (поля профиля) ---
  const renderProfileStep = () => (
    <form onSubmit={handleFinalSubmit}>
      {serverError && <div className="server-error">{serverError}</div>} {/* блок ошибки */}
      <div className="form-group">
        <label>Фамилия *</label>
        <input
          type="text"
          name="lastName"
          value={profileData.lastName}
          onChange={handleProfileChange}
          className={profileErrors.lastName ? 'error' : ''}
        />
        {profileErrors.lastName && <span className="error-message">{profileErrors.lastName}</span>}
      </div>

      <div className="form-group">
        <label>Имя *</label>
        <input
          type="text"
          name="firstName"
          value={profileData.firstName}
          onChange={handleProfileChange}
          className={profileErrors.firstName ? 'error' : ''}
        />
        {profileErrors.firstName && <span className="error-message">{profileErrors.firstName}</span>}
      </div>

      <div className="form-group">
        <label>Отчество</label>
        <input
          type="text"
          name="middleName"
          value={profileData.middleName}
          onChange={handleProfileChange}
          className={profileErrors.middleName ? 'error' : ''}
        />
        {profileErrors.middleName && <span className="error-message">{profileErrors.middleName}</span>}
      </div>

      <div className="form-group">
        <label>Телефон *</label>
        <input
          type="tel"
          name="phone"
          value={profileData.phone}
          onChange={handleProfileChange}
          onBlur={handlePhoneBlur}
          placeholder="+7 XXX XXX XX XX"
          className={profileErrors.phone ? 'error' : ''}
        />
        {profileErrors.phone && <span className="error-message">{profileErrors.phone}</span>}
      </div>

      <div className="form-group">
        <label>Город *</label>
        <input
          type="text"
          name="city"
          value={profileData.city}
          onChange={handleProfileChange}
          disabled
        />
      </div>

      <div className="form-group" ref={streetSuggestionsRef}>
        <label>Улица *</label>
        <div className="input-wrapper">
          <input
            type="text"
            name="street"
            value={profileData.street}
            onChange={handleProfileChange}
            onFocus={() => {
              if (streetSuggestions.length > 0) setShowStreetSuggestions(true);
            }}
            className={profileErrors.street ? 'error' : ''}
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
        {profileErrors.street && <span className="error-message">{profileErrors.street}</span>}
      </div>

      <div className="form-group">
        <label>Дом *</label>
        <input
          type="text"
          name="house"
          value={profileData.house}
          onChange={handleProfileChange}
          className={profileErrors.house ? 'error' : ''}
        />
        {profileErrors.house && <span className="error-message">{profileErrors.house}</span>}
      </div>

      <div className="form-group">
        <label>Квартира</label>
        <input
          type="text"
          name="apartment"
          value={profileData.apartment}
          onChange={handleProfileChange}
          className={profileErrors.apartment ? 'error' : ''}
        />
        {profileErrors.apartment && <span className="error-message">{profileErrors.apartment}</span>}
      </div>

      <div className="step-buttons">
        <button type="submit">Завершить регистрацию</button>
        <button type="button" onClick={() => setStep(1)} className="back-button">
          Назад
        </button>
      </div>
    </form>
  );

  return (
    <div className="auth-container">
      <h2>Регистрация</h2>
      <div className="description">
        {step === 1
          ? 'Для продолжения Вам необходимо выполнить регистрацию'
          : 'Заполните данные профиля'}
      </div>
      {step === 1 ? renderAuthStep() : renderProfileStep()}
    </div>
  );
};

export default Register;