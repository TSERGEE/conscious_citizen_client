// src/pages/MainPage/MainPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import LeftPanel from './LeftPanel';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import './MainPage.css';
import L from 'leaflet';

// Все слои карты (восстановлены полностью)
const layers = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Стандартная (OSM)',
  },
  cyclosm: {
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '<a href="https://github.com/cyclosm/cyclosm-cartocss-style" target="_blank">CyclOSM</a> Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    name: 'Велосипедная',
  },
  humanitarian: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, Tiles by <a href="https://www.hotosm.org/">HOT</a>',
    name: 'Гуманитарная',
  },
  darkCarto: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OSM',
    name: 'Тёмная (CartoDB)',
  },
  darkStadia: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; OSM',
    name: 'Тёмная (OpenMapTiles)',
  },
};

// Иконки
const parkingIcon = new L.Icon({
  iconUrl: '/images/parking31.png',
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

const getIconByType = (type) => {
  const t = type?.toLowerCase();
  if (t === 'parking') return parkingIcon;
  if (t === 'expired' || t === 'food_expired') return foodIcon;
  return new L.Icon.Default();
};

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      // Получаем DOM-элемент, по которому кликнули
      const target = e.originalEvent.target;
      
      // Игнорируем клики по элементам управления картой и вашему селектору
      if (
        target.closest('.leaflet-control') ||      // стандартные элементы Leaflet (зум, атрибуция)
        target.closest('.map-layer-selector') ||   // ваш селектор слоёв
        target.closest('.leaflet-popup')           // клик по попапу (чтобы не закрывался случайно)
      ) {
        return;
      }
      
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapController({ center }) {
  const map = useMap();
  if (center) {
    map.setView(center, map.getZoom());
  }
  return null;
}

const isInServiceArea = (address) =>
  address.toLowerCase().includes('самара');

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
function CustomAttributionControl() {
              const map = useMap();

              useEffect(() => {
                if (!map) return;

                // Удаляем существующий контроль атрибуции, если вдруг он есть (на всякий случай)
                map.attributionControl?.remove();

                // Создаём новый контроль
                const customControl = L.control.attribution({ prefix: false }); // prefix: false убирает стандартный текст Leaflet
                customControl.addTo(map);

                // Можно также задать свой префикс без флага
                // customControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>'); // без флага

                // Очистка при размонтировании
                return () => {
                  map.removeControl(customControl);
                };
              }, [map]);

              return null;
            }
const MainPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const location = useLocation();
  const { messages, refreshMessages } = useMessages();  // только чтение, без addMessage

  const [currentLayer, setCurrentLayer] = useState(layers.standard);
  const [manualOverride, setManualOverride] = useState(false);

  const [markerPosition, setMarkerPosition] = useState(null);
  const [addressInput, setAddressInput] = useState('');
  const [searchCenter, setSearchCenter] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const [searchRoot, setSearchRoot] = useState(null);
  const debouncedAddress = useDebounce(addressInput, 500);
  useEffect(() => {
    refreshMessages(); // подгружаем свежие инциденты с сервера
  }, [refreshMessages, location.key]);
  // Автовыбор слоя по теме
  useEffect(() => {
    if (!manualOverride) {
      setCurrentLayer(theme === 'dark' ? layers.darkStadia : layers.standard);
    }
  }, [theme, manualOverride]);

  const selectLayer = (layerKey) => {
    setCurrentLayer(layers[layerKey]);
    setManualOverride(true);
  };

  const resetToAuto = () => {
    setManualOverride(false);
    setCurrentLayer(theme === 'dark' ? layers.darkStadia : layers.standard);
  };

  useEffect(() => {
    const el = document.getElementById('search-root');
    if (el) setSearchRoot(el);
  }, []);

  // Подсказки адресов
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
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=ru&limit=5`
        );
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsFetchingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [debouncedAddress]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target))
        setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      return data.display_name || 'Адрес не найден';
    } catch {
      return null;
    }
  };

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

  const handleSuggestionClick = (suggestion) => {
    const newPos = { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) };
    if (isInServiceArea(suggestion.display_name)) {
      setMarkerPosition(newPos);
      setSearchCenter(newPos);
      setAddressInput(suggestion.display_name);
    } else {
      alert('Данный адрес не входит в зону обслуживания проекта.');
    }
    setShowSuggestions(false);
  };

  const searchAddress = async (query) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
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
    } catch {
      alert('Ошибка геокодинга');
    } finally {
      setIsSearching(false);
      setShowSuggestions(false);
    }
  };

  const handleSearchClick = () => {
    searchAddress(addressInput);
  };

  // Переход к созданию сообщения (без локального addMessage)
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
    if (!addressInput) setShowTooltip(true);
    if (suggestions.length > 0) setShowSuggestions(true);
  };
  const handleBlur = () => setShowTooltip(false);
  const handleClearInput = () => {
    setAddressInput('');
    setMarkerPosition(null);
    setSearchCenter(null);
    setShowSuggestions(false);
  };

  const headerContent = (
    <div className="header-search-block">
      <div className="address-input-wrapper" ref={suggestionsRef}>
        <div className="input-container">
          <input
            type="text"
            placeholder="Адрес события"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {addressInput && (
            <span className="clear-icon" onClick={handleClearInput}>
              ✕
            </span>
          )}
        </div>
        {showTooltip && <div className="tooltip">Введите адрес вручную</div>}
        {showSuggestions && (
          <ul className="suggestions-list">
            {isFetchingSuggestions && <li className="suggestion-item loading">Загрузка...</li>}
            {!isFetchingSuggestions &&
              suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.display_name}
                </li>
              ))}
          </ul>
        )}
        <button className="search-btn" onClick={handleSearchClick} disabled={isSearching}>
          {isSearching ? 'Поиск...' : 'Найти'}
        </button>
      </div>
      <button className="next-btn" onClick={handleNext}>
        Далее
      </button>
    </div>
  );
  console.log('MESSAGES MAP:', messages);
  return (
    <div className="main-page">
      {searchRoot && ReactDOM.createPortal(headerContent, searchRoot)}
      <LeftPanel />
      <MapContainer center={[53.195873, 50.100193]} zoom={13} className="map-container" attributionControl={false}>
        <TileLayer url={currentLayer.url} attribution={currentLayer.attribution} />

        <div className="map-layer-selector no-map-click" onClick={(e) => e.stopPropagation()}>
          <select
            value={Object.keys(layers).find((key) => layers[key] === currentLayer) || ''}
            onChange={(e) => selectLayer(e.target.value)}
          >
            {Object.entries(layers).map(([key, layer]) => (
              <option key={key} value={key}>
                {layer.name}
              </option>
            ))}
          </select>
          {manualOverride && <button onClick={resetToAuto}>Авто</button>}
        </div>
         <CustomAttributionControl />
        <MapClickHandler onMapClick={handleMapClick} />
        {markerPosition && (
          <Marker position={markerPosition}>
            <Popup>Выбранное место</Popup>
          </Marker>
        )}

        {messages
          .filter(
            (msg) =>
              msg.latitude != null &&
              msg.longitude != null &&
              msg.active === true
          )
          .map((msg) => (
            <Marker
              key={msg.id}
              position={[msg.latitude, msg.longitude]}
              icon={getIconByType(msg.type)}
            >
              <Popup>
                <div className="message-popup">
                  <strong>{msg.title}</strong>
                  <p>{msg.address}</p>
                  <button onClick={() => navigate(`/message/${msg.id}`)}>
                    Подробнее
                  </button>
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