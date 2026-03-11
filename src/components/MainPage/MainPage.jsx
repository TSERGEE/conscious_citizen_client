import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
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

  const [markerPosition, setMarkerPosition] = useState(null);
  const [addressInput, setAddressInput] = useState('');
  const [searchCenter, setSearchCenter] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Состояния для подсказок
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const suggestionsRef = useRef(null); // для отслеживания кликов вне списка

  // Debounce для адреса (задержка 500 мс)
  const debouncedAddress = useDebounce(addressInput, 500);

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
        // Добавляем ", Самара" к запросу и ограничиваем страну Россией
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

  // Прямое геокодирование (поиск координат по адресу) - используется при нажатии кнопки "Найти" или выборе подсказки
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
    // Показать подсказки, если есть
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setShowTooltip(false);
    // Не скрываем подсказки сразу, так как клик по ним может не успеть
  };

  // Контент для шапки
  const headerContent = (
    <div className="header-search-block">
      <div className="address-input-wrapper" ref={suggestionsRef}>
        <input
          type="text"
          placeholder="Адрес события"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
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
      {ReactDOM.createPortal(headerContent, document.getElementById('search-root'))}

      <MapContainer center={[53.195873, 50.100193]} zoom={13} className="map-container">
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Standard (OpenStreetMap)">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="CyclOSM (велосипедная)">
            <TileLayer
              url="https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png"
              attribution='<a href="https://github.com/cyclosm/cyclosm-cartocss-style" target="_blank">CyclOSM</a> Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Humanitarian">
            <TileLayer
              url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>'
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapClickHandler onMapClick={handleMapClick} />
        {markerPosition && (
          <Marker position={markerPosition}>
            <Popup>Выбранное место</Popup>
          </Marker>
        )}
        <MapController center={searchCenter} />
      </MapContainer>
    </div>
  );
};

export default MainPage;