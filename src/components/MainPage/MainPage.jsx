import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import LeftPanel from './LeftPanel';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
  LayersControl,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import './MainPage.css';
import L from 'leaflet';

// Определяем доступные слои
const layers = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Стандартная (OSM)',
  },
  cyclosm: {
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style" target="_blank">CyclOSM</a> Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Велосипедная',
  },
  humanitarian: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>',
    name: 'Гуманитарная',
  },
  darkCarto: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Тёмная (CartoDB)',
  },
  darkStadia: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    name: 'Тёмная (OpenMapTiles)',
  },
};

const parkingIcon = new L.Icon({
  iconUrl: '/images/parking31.png', // путь к иконке
  shadowUrl: '/images/shadow.png',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -50],
  shadowSize: [48, 48],
});

const foodIcon = new L.Icon({
  iconUrl: '/images/food31.png',
  shadowUrl: '/images/shadow.png',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -50],
  shadowSize: [48, 48],
});
const iconMap = {
  parking: parkingIcon,
  food: foodIcon,
};

const getIconByType = (type) => {
  if (type === 'parking') return parkingIcon;
  if (type === 'expired') return foodIcon;
  return new L.Icon.Default();
};
// Компонент для обработки кликов по карте
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Компонент для программного перемещения карты
function MapController({ center }) {
  const map = useMap();
  if (center) {
    map.setView(center, map.getZoom());
  }
  return null;
}

// Вспомогательная функция для проверки, входит ли адрес в зону обслуживания
const isInServiceArea = (address) => {
  return address.toLowerCase().includes('самара');
};

// Функция debounce для ограничения частоты запросов
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const MainPage = () => {
  const navigate = useNavigate();

  const { theme } = useTheme(); // получаем текущую тему
  const [currentLayer, setCurrentLayer] = useState(layers.standard);
  const [manualOverride, setManualOverride] = useState(false);

  // При смене темы, если нет ручного выбора, выбираем слой по умолчанию
  useEffect(() => {
    if (!manualOverride) {
      if (theme === 'dark') {
        setCurrentLayer(layers.darkStadia); // можно заменить на darkStadia, если хотите
      } else {
        setCurrentLayer(layers.standard);
      }
    }
  }, [theme, manualOverride]);

  // Функция ручного выбора слоя
  const selectLayer = (layerKey) => {
    setCurrentLayer(layers[layerKey]);
    setManualOverride(true);
  };

  // Сброс к автоматическому выбору по теме
  const resetToAuto = () => {
    setManualOverride(false);
    setCurrentLayer(theme === 'dark' ? layers.darkCarto : layers.standard);
  };

  const { messages } = useMessages();

  const [markerPosition, setMarkerPosition] = useState(null);
  const [addressInput, setAddressInput] = useState('');
  const [searchCenter, setSearchCenter] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Состояния для подсказок
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Состояние для портала – храним ссылку на элемент #search-root
  const [searchRoot, setSearchRoot] = useState(null);

  // Debounce для адреса (задержка 500 мс)
  const debouncedAddress = useDebounce(addressInput, 500);

  // Эффект для поиска элемента #search-root после монтирования
  useEffect(() => {
    const el = document.getElementById('search-root');
    if (el) {
      setSearchRoot(el);
    } else {
      console.error('search-root not found – проверьте PrivateLayout');
    }
  }, []);

  // Эффект для запроса подсказок при изменении debouncedAddress
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedAddress.trim() || debouncedAddress.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsFetchingSuggestions(true);
      try {
        const query = `${debouncedAddress}, Самара`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ru&limit=5`
        );
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch (error) {
        console.error('Ошибка получения подсказок:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsFetchingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedAddress]);

  // Закрыть подсказки при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Обратное геокодирование (получение адреса по координатам)
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || 'Адрес не найден';
    } catch (error) {
      console.error('Ошибка обратного геокодинга:', error);
      return null;
    }
  };

  // Обработчик клика по карте
  const handleMapClick = async (latlng) => {
    setMarkerPosition(latlng);
    setSearchCenter(latlng);

    const address = await reverseGeocode(latlng.lat, latlng.lng);
    if (address && isInServiceArea(address)) {
      setAddressInput(address);
    } else {
      alert('Данный адрес не входит в зону обслуживания проекта.');
      setAddressInput('');
    }
    setShowSuggestions(false);
  };

  // Прямое геокодирование (поиск координат по адресу)
  const searchAddress = async (query) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos = [parseFloat(lat), parseFloat(lon)];

        if (isInServiceArea(display_name)) {
          setMarkerPosition(newPos);
          setSearchCenter(newPos);
          setAddressInput(display_name);
        } else {
          alert('Данный адрес не входит в зону обслуживания проекта.');
        }
      } else {
        alert('Адрес не найден');
      }
    } catch (error) {
      console.error('Ошибка геокодинга:', error);
      alert('Ошибка при поиске адреса');
    } finally {
      setIsSearching(false);
      setShowSuggestions(false);
    }
  };

  // Обработчик выбора подсказки
  const handleSuggestionClick = (suggestion) => {
    const { lat, lon, display_name } = suggestion;
    const newPos = [parseFloat(lat), parseFloat(lon)];
    if (isInServiceArea(display_name)) {
      setMarkerPosition(newPos);
      setSearchCenter(newPos);
      setAddressInput(display_name);
    } else {
      alert('Данный адрес не входит в зону обслуживания проекта.');
    }
    setShowSuggestions(false);
  };

  // Обработчик нажатия кнопки "Найти"
  const handleSearchClick = () => {
    searchAddress(addressInput);
  };

  // Переход к созданию сообщения
  const handleNext = () => {
    if (!markerPosition) {
      alert('Сначала выберите место на карте или найдите адрес.');
      return;
    }
    if (!addressInput) {
      alert('Адрес не определён. Возможно, он вне зоны обслуживания.');
      return;
    }
    navigate('/create-message', {
      state: {
        lat: markerPosition.lat,
        lng: markerPosition.lng,
        address: addressInput,
      },
    });
  };

  const handleFocus = () => {
    if (!addressInput) {
      setShowTooltip(true);
    }
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setShowTooltip(false);
  };
  
  const handleClearInput = () => {
    setAddressInput('');
    setMarkerPosition(null);
    setSearchCenter(null);
    setShowSuggestions(false);
  };
  // Контент для шапки
  const headerContent = (
    <div className="header-search-block">
      <div className="address-input-wrapper" ref={suggestionsRef}>
        {/* + Оборачиваем input и иконку в дополнительный контейнер */}
        <div className="input-container">
          <input
            type="text"
            placeholder="Адрес события"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {/* + Иконка крестика появляется только при наличии текста */}
          {addressInput && (
            <span
              className="clear-icon"
              onClick={handleClearInput}
              role="button"
              tabIndex={0}
              aria-label="Очистить поле"
            >
              ✕
            </span>
          )}
        </div>
        {showTooltip && (
          <div className="tooltip">
            Введите адрес вручную
          </div>
        )}
        {showSuggestions && (
          <ul className="suggestions-list">
            {isFetchingSuggestions && <li className="suggestion-item loading">Загрузка...</li>}
            {!isFetchingSuggestions &&
              suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.display_name}
                </li>
              ))}
          </ul>
        )}
        <button
          className="search-btn"
          onClick={handleSearchClick}
          disabled={isSearching}
        >
          {isSearching ? 'Поиск...' : 'Найти'}
        </button>
      </div>
      <button className="next-btn" onClick={handleNext}>
        Далее
      </button>
    </div>
  );

  return (
    <div className="main-page">
      {searchRoot && ReactDOM.createPortal(headerContent, searchRoot)}
      <LeftPanel />

      <MapContainer center={[53.195873, 50.100193]} zoom={13} className="map-container">
        {/* Динамический слой */}
        <TileLayer url={currentLayer.url} attribution={currentLayer.attribution} />

        {/* Селектор слоёв (вместо LayersControl) */}
        <div className="map-layer-selector">
          <select
            value={Object.keys(layers).find(key => layers[key] === currentLayer) || ''}
            onChange={(e) => selectLayer(e.target.value)}
          >
            {Object.entries(layers).map(([key, layer]) => (
              <option key={key} value={key}>{layer.name}</option>
            ))}
          </select>
          {manualOverride && (
            <button onClick={resetToAuto} className="reset-auto-btn">
              Авто
            </button>
          )}
        </div>

        <MapClickHandler onMapClick={handleMapClick} />
        {markerPosition && (
          <Marker position={markerPosition}>
            <Popup>Выбранное место</Popup>
          </Marker>
        )}
        {messages
          .filter(msg => msg.lat && msg.lng && !msg.isDraft)
          .map(msg => (
            <Marker key={msg.id} position={[msg.lat, msg.lng]} icon={getIconByType(msg.type)}>
              <Popup>
                <div className="message-popup">
                  <strong>{msg.topic}</strong>
                  <p>{msg.address}</p>
                  <button onClick={() => navigate(`/message/${msg.id}`)}>Подробнее</button>
                </div>
              </Popup>
            </Marker>
          ))}
        <MapController center={searchCenter} />
      </MapContainer>
    </div>
  );
};

export default MainPage;