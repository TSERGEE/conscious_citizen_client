// AdminPanel.js
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import L from 'leaflet';
import './AdminPanel.css';

// Иконки для маркеров (можно переиспользовать из MainPage)
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
  if (type === 'parking') return parkingIcon;
  if (type === 'expired') return foodIcon;
  return new L.Icon.Default();
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { messages } = useMessages();
  const [filterType, setFilterType] = useState('all'); // all, parking, expired
  const [filterUserId, setFilterUserId] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null); // для модалки

  // Защита: если не админ – редирект на главную
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (!userData.isAdmin) {
      navigate('/main');
    }
  }, [navigate]);

  // Статистика
  const stats = useMemo(() => {
    const total = messages.length;
    const published = messages.filter(m => !m.isDraft).length;
    const drafts = messages.filter(m => m.isDraft).length;
    const parking = messages.filter(m => m.type === 'parking' && !m.isDraft).length;
    const expired = messages.filter(m => m.type === 'expired' && !m.isDraft).length;

    // За последние 7 дней
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const lastWeek = messages.filter(m => new Date(m.createdAt) >= weekAgo && !m.isDraft).length;

    // За сегодня
    const today = new Date().toDateString();
    const todayCount = messages.filter(m => new Date(m.createdAt).toDateString() === today && !m.isDraft).length;

    // Уникальные пользователи
    const uniqueUsers = new Set(messages.map(m => m.userId)).size;

    return { total, published, drafts, parking, expired, lastWeek, todayCount, uniqueUsers };
  }, [messages]);

  // Данные для графика по типам
  const typeData = useMemo(() => [
    { name: 'Парковка', value: stats.parking },
    { name: 'Просрочка', value: stats.expired },
  ], [stats]);

  // Динамика по дням (последние 7 дней)
  const timelineData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const count = messages.filter(m => {
        const msgDate = new Date(m.createdAt).toISOString().slice(0, 10);
        return msgDate === dateStr && !m.isDraft;
      }).length;
      days.push({ date: dateStr, count });
    }
    return days;
  }, [messages]);

  // Фильтрация сообщений для таблицы
  const filteredMessages = useMemo(() => {
    let filtered = messages.filter(m => !m.isDraft); // показываем только опубликованные
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.type === filterType);
    }
    if (filterUserId !== 'all') {
      filtered = filtered.filter(m => m.userId === parseInt(filterUserId));
    }
    return filtered;
  }, [messages, filterType, filterUserId]);

  // Получить список уникальных userId для фильтра
  const userIds = useMemo(() => {
    const ids = new Set();
    messages.forEach(m => ids.add(m.userId));
    return Array.from(ids);
  }, [messages]);

  // Функция для просмотра деталей сообщения
  const openMessageDetails = (msg) => {
    setSelectedMessage(msg);
  };

  return (
    <div className="admin-panel">
      <h1>Админ панель</h1>

      {/* Карточки с ключевыми показателями */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Всего сообщений</h3>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <h3>Опубликовано</h3>
          <div className="stat-value">{stats.published}</div>
        </div>
        <div className="stat-card">
          <h3>Черновики</h3>
          <div className="stat-value">{stats.drafts}</div>
        </div>
        <div className="stat-card">
          <h3>За сегодня</h3>
          <div className="stat-value">{stats.todayCount}</div>
        </div>
        <div className="stat-card">
          <h3>За неделю</h3>
          <div className="stat-value">{stats.lastWeek}</div>
        </div>
        <div className="stat-card">
          <h3>Уникальных авторов</h3>
          <div className="stat-value">{stats.uniqueUsers}</div>
        </div>
      </div>

      {/* Графики */}
      <div className="charts-row">
        <div className="chart-box">
          <h3>Сообщения по типам</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#667eea' : '#f56565'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-box">
          <h3>Динамика за последние 7 дней</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Географическое распределение */}
      <div className="map-section">
        <h3>География обращений</h3>
        <div className="map-container">
          <MapContainer center={[53.195873, 50.100193]} zoom={10} style={{ height: '400px', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
            {messages
              .filter(msg => msg.lat && msg.lng && !msg.isDraft)
              .map(msg => (
                <Marker key={msg.id} position={[msg.lat, msg.lng]} icon={getIconByType(msg.type)}>
                  <Popup>
                    <strong>{msg.topic}</strong><br />
                    {msg.address}<br />
                    <button onClick={() => openMessageDetails(msg)}>Подробнее</button>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>

      {/* Таблица сообщений */}
      <div className="messages-table-section">
        <h3>Список сообщений</h3>
        <div className="filters">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">Все типы</option>
            <option value="parking">Парковка</option>
            <option value="expired">Просрочка</option>
          </select>
          <select value={filterUserId} onChange={e => setFilterUserId(e.target.value)}>
            <option value="all">Все авторы</option>
            {userIds.map(id => (
              <option key={id} value={id}>Пользователь {id}</option>
            ))}
          </select>
        </div>
        <table className="messages-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Автор</th>
              <th>Тема</th>
              <th>Тип</th>
              <th>Дата</th>
              <th>Адрес</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.map(msg => (
              <tr key={msg.id}>
                <td>{msg.id}</td>
                <td>{msg.userId}</td>
                <td>{msg.topic}</td>
                <td>{msg.type === 'parking' ? 'Парковка' : 'Просрочка'}</td>
                <td>{new Date(msg.createdAt).toLocaleDateString()}</td>
                <td>{msg.address}</td>
                <td>
                  <button onClick={() => openMessageDetails(msg)}>Просмотр</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно с деталями сообщения */}
      {selectedMessage && (
        <div className="modal-overlay" onClick={() => setSelectedMessage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{selectedMessage.topic}</h2>
            <p><strong>Тип:</strong> {selectedMessage.type === 'parking' ? 'Парковка' : 'Просрочка'}</p>
            <p><strong>Автор:</strong> {selectedMessage.userId}</p>
            <p><strong>Дата:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}</p>
            <p><strong>Адрес:</strong> {selectedMessage.address}</p>
            <p><strong>Описание:</strong> {selectedMessage.description || 'Нет описания'}</p>
            {selectedMessage.photos && selectedMessage.photos.length > 0 && (
              <div className="photos">
                {selectedMessage.photos.map((photo, idx) => (
                  <img key={idx} src={photo} alt={`Фото ${idx+1}`} className="message-photo" />
                ))}
              </div>
            )}
            <button onClick={() => setSelectedMessage(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;