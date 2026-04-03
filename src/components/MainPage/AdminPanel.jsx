// AdminPanel.js
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import {
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import L from 'leaflet';
import './AdminPanel.css';

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
  if (type === 'PARKING') return parkingIcon;
  if (type === 'FOOD_EXPIRED') return foodIcon;
  return new L.Icon.Default();
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { messages } = useMessages();

  const [filterType, setFilterType] = useState('all');
  const [filterUserId, setFilterUserId] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Защита страницы
  useEffect(() => {
    const userData = JSON.parse(
      localStorage.getItem('userProfile') || '{}'
    );

    if (userData.role !== 'ADMIN') {
      navigate('/main');
    }
  }, [navigate]);

  // Статистика
  const stats = useMemo(() => {
    const total = messages.length;

    const published = messages.filter(
      m => m.active === true
    ).length;

    const drafts = messages.filter(
      m => m.active === false
    ).length;

    const parking = messages.filter(
      m =>
        m.type === 'PARKING' &&
        m.active === true
    ).length;

    const expired = messages.filter(
      m =>
        m.type === 'FOOD_EXPIRED' &&
        m.active === true
    ).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const lastWeek = messages.filter(
      m =>
        m.created &&
        new Date(m.created) >= weekAgo &&
        m.active === true
    ).length;

    const today = new Date().toDateString();

    const todayCount = messages.filter(
      m =>
        m.created &&
        new Date(m.created).toDateString() === today &&
        m.active === true
    ).length;

    const uniqueUsers = new Set(
      messages.map(m => m.userId)
    ).size;

    return {
      total,
      published,
      drafts,
      parking,
      expired,
      lastWeek,
      todayCount,
      uniqueUsers,
    };
  }, [messages]);

  const typeData = useMemo(
    () => [
      { name: 'Парковка', value: stats.parking },
      { name: 'Просрочка', value: stats.expired },
    ],
    [stats]
  );

  // График за 7 дней
  const timelineData = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dateStr = date
        .toISOString()
        .slice(0, 10);

      const count = messages.filter(m => {
        if (!m.created || m.active !== true)
          return false;

        const msgDate = new Date(m.created)
          .toISOString()
          .slice(0, 10);

        return msgDate === dateStr;
      }).length;

      days.push({
        date: dateStr,
        count,
      });
    }

    return days;
  }, [messages]);

  // Таблица
  const filteredMessages = useMemo(() => {
    let filtered = messages.filter(
      m => m.active === true
    );

    if (filterType !== 'all') {
      filtered = filtered.filter(
        m => m.type === filterType
      );
    }

    if (filterUserId !== 'all') {
      filtered = filtered.filter(
        m =>
          m.userId === Number(filterUserId)
      );
    }

    return filtered;
  }, [messages, filterType, filterUserId]);

  const userIds = useMemo(() => {
    return [...new Set(messages.map(m => m.userId))];
  }, [messages]);

  const openMessageDetails = (msg) => {
    setSelectedMessage(msg);
  };

  return (
    <div className="admin-panel">
      <h1>Админ панель</h1>

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
          <h3>Авторов</h3>
          <div className="stat-value">{stats.uniqueUsers}</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-box">
          <h3>Типы сообщений</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {typeData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={
                      index === 0
                        ? '#667eea'
                        : '#f56565'
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>За 7 дней</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="map-section">
        <h3>Карта обращений</h3>

        <div className="map-container">
          <MapContainer
            center={[53.195873, 50.100193]}
            zoom={10}
            style={{
              height: '400px',
              width: '100%',
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {messages
              .filter(
                msg =>
                  msg.lat != null &&
                  msg.lng != null &&
                  msg.active === true
              )
              .map(msg => (
                <Marker
                  key={msg.id}
                  position={[msg.lat, msg.lng]}
                  icon={getIconByType(msg.type)}
                >
                  <Popup>
                    <strong>{msg.title}</strong>
                    <br />
                    {msg.address}
                    <br />
                    <button
                      onClick={() =>
                        openMessageDetails(msg)
                      }
                    >
                      Подробнее
                    </button>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </div>

      <div className="messages-table-section">
        <h3>Список сообщений</h3>

        <div className="filters">
          <select
            value={filterType}
            onChange={e =>
              setFilterType(e.target.value)
            }
          >
            <option value="all">Все</option>
            <option value="PARKING">
              Парковка
            </option>
            <option value="FOOD_EXPIRED">
              Просрочка
            </option>
          </select>

          <select
            value={filterUserId}
            onChange={e =>
              setFilterUserId(e.target.value)
            }
          >
            <option value="all">
              Все авторы
            </option>

            {userIds.map(id => (
              <option key={id} value={id}>
                Пользователь {id}
              </option>
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
                <td>{msg.title}</td>
                <td>
                  {msg.type === 'PARKING'
                    ? 'Парковка'
                    : 'Просрочка'}
                </td>
                <td>
                  {msg.created
                    ? new Date(
                        msg.created
                      ).toLocaleDateString()
                    : '—'}
                </td>
                <td>{msg.address}</td>
                <td>
                  <button
                    onClick={() =>
                      openMessageDetails(msg)
                    }
                  >
                    Просмотр
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMessage && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedMessage(null)
          }
        >
          <div
            className="modal-content"
            onClick={e =>
              e.stopPropagation()
            }
          >
            <h2>{selectedMessage.title}</h2>

            <p>
              <strong>Тип:</strong>{' '}
              {selectedMessage.type ===
              'PARKING'
                ? 'Парковка'
                : 'Просрочка'}
            </p>

            <p>
              <strong>Автор:</strong>{' '}
              {selectedMessage.userId}
            </p>

            <p>
              <strong>Дата:</strong>{' '}
              {selectedMessage.created
                ? new Date(
                    selectedMessage.created
                  ).toLocaleString()
                : '—'}
            </p>

            <p>
              <strong>Адрес:</strong>{' '}
              {selectedMessage.address}
            </p>

            <p>
              <strong>Описание:</strong>{' '}
              {selectedMessage.description ||
                'Нет описания'}
            </p>

            <button
              onClick={() =>
                setSelectedMessage(null)
              }
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;