import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import { useTheme } from '../../contexts/ThemeContext'; // <-- ДОБАВЛЕНО
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  BarChart3, MapPin, MessageSquare, Users, Settings, 
  Search, Filter, ExternalLink, CheckCircle2, Clock, X, ChevronRight
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AdminPanel.css';
import { getAllAdminIncidents, deleteIncident, getIncidentById, updateIncident } from '../../api';

const TABS = [
  { key: 'dashboard', label: 'Аналитика', icon: BarChart3 },
  { key: 'messages', label: 'Обращения', icon: MessageSquare },
  { key: 'map', label: 'Карта', icon: MapPin },
  { key: 'users', label: 'Пользователи', icon: Users },
  { key: 'settings', label: 'Настройки', icon: Settings },
];
const layers = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OSM contributors',
    name: 'Стандартная (OSM)',
  },
  darkCarto: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO, &copy; OSM',
    name: 'Тёмная (CartoDB)',
  },
  darkStadia: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '&copy; Stadia Maps, &copy; OSM',
    name: 'Тёмная (OpenMapTiles)',
  },
};

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

// Функция для кастомной атрибуции (если она используется в JSX админки)
function CustomAttributionControl() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.attributionControl?.remove();
    const customControl = L.control.attribution({ prefix: false });
    customControl.addTo(map);
    return () => { map.removeControl(customControl); };
  }, [map]);
  return null;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { messages, refreshMessages } = useMessages();
  const [adminIncidents, setAdminIncidents] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { id, action, title }
  const { theme } = useTheme(); // Добавь это, если используешь тему
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');
  
  // Состояния для редактирования
  const [currentLayer, setCurrentLayer] = useState(layers.standard);
  const [manualOverride, setManualOverride] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', type: 'PARKING' });
  const [editLoading, setEditLoading] = useState(false);

// Редактирование (открытие формы)
  const handleEditClick = (incident) => {
    setEditingIncident(incident);
    setEditForm({
      title: incident.title || '',
      description: incident.description || '',
      type: incident.type || 'PARKING',
    });
  };

  // Отправка отредактированных данных
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      // Подготавливаем данные в формате IncidentRequest (как ждет Java Record)
      const requestData = {
        title: editForm.title,
        description: editForm.description,
        type: editForm.type,
        latitude: editingIncident.latitude, // сохраняем старые координаты
        longitude: editingIncident.longitude,
        address: editingIncident.address || "",
        active: editingIncident.active // оставляем текущий статус
      };

      await updateIncident(editingIncident.id, requestData);
      
      // МАГИЯ ОБНОВЛЕНИЯ:
      await loadAdminIncidents(); // Обновит таблицу админа
      await refreshMessages();    // Обновит глобальный контекст (и карту!)
      
      setEditingIncident(null);
      alert('Инцидент успешно обновлен');
    } catch (err) {
      console.error('Ошибка обновления:', err);
      alert(`Ошибка: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };
  // ----------------------------
  // Автовыбор слоя по теме для админки
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
  // ---------- Функции работы с API ----------
  const loadAdminIncidents = async () => {
      setAdminLoading(true);
      try {
        const data = await getAllAdminIncidents();
        const incidentsWithStatus = data.map(inc => ({
          ...inc,
          active: inc.active !== undefined ? inc.active : true
        }));
        setAdminIncidents(incidentsWithStatus);
      } catch (err) {
        console.error('Ошибка загрузки:', err);
      } finally {
        setAdminLoading(false);
      }
    };
    
// Удаление
  const handleDeleteIncident = async (id) => {
    try {
      await deleteIncident(id);
      await loadAdminIncidents();
      await refreshMessages(); // Чтобы с карты тоже исчезло
      setConfirmModal(null);
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить. Возможно, сервер отверг запрос.');
    }
  };

  // Изменение статуса (Опубликован/Черновик)
  const handleToggleStatus = async (incident) => {
    try {
      // Пример логики: инвертируем текущий статус active
      await updateIncident(incident.id, { ...incident, active: !incident.active });
      await loadAdminIncidents();
      await refreshMessages();
    } catch (err) {
      console.error('Ошибка статуса:', err);
    }
  };
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedMessageDetails, setSelectedMessageDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [users, setUsers] = useState([
    { id: 1, name: 'Иван Иванов', email: 'ivan@example.com', role: 'USER', status: 'active' },
    { id: 2, name: 'Админ Системы', email: 'admin@pro.ru', role: 'ADMIN', status: 'active' },
    { id: 3, name: 'Дмитрий Петров', email: 'dima@test.com', role: 'USER', status: 'blocked' },
  ]);

  const [settings, setSettings] = useState({
    notifications: true,
    registrationOpen: true,
    autoModeration: false,
    maintenanceMode: false
  });
  // Auth Guard
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (userData.role !== 'ADMIN') navigate('/main');
  }, [navigate]);
  useEffect(() => {
    if (activeTab === 'messages' || activeTab === 'map') {
      loadAdminIncidents();   // загружаем табличные данные
      if (activeTab === 'map') {
        refreshMessages();    // обновляем контекст для карты
      }
    }
  }, [activeTab]);

  // Вычисления
  const stats = useMemo(() => ({
    total: messages.length,
    published: messages.filter(m => m.active).length,
    today: messages.filter(m => new Date(m.created).toDateString() === new Date().toDateString()).length,
    users: new Set(messages.map(m => m.userId)).size,
  }), [messages]);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString();
    }).reverse();
    return last7Days.map(date => ({
      date,
      count: messages.filter(m => new Date(m.created).toLocaleDateString() === date).length
    }));
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return adminIncidents.filter(inc => {
      const matchesType = filterType === 'all' || inc.type === filterType;
      const matchesSearch = (inc.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [adminIncidents, filterType, searchQuery]);
  const handleViewDetails = async (id) => {
    setDetailsLoading(true);
    try {
      const fullIncident = await getIncidentById(id);
      setSelectedMessageDetails(fullIncident);
    } catch (err) {
      console.error('Ошибка загрузки деталей инцидента:', err);
      alert('Не удалось загрузить подробную информацию');
    } finally {
      setDetailsLoading(false);
    }
  };
  return (
    <div className="admin-view">
      {/* Sidebar */}
      <aside className="admin-side">
        <div className="side-brand">
          <div className="brand-logo">A</div>
          <span>Admin Portal</span>
        </div>
        
        <nav className="side-nav">
          {TABS.map(tab => (
            <button 
              key={tab.key}
              className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Container */}
      <main className="admin-body">
        <header className="body-header">
          <div className="header-info">
            <h1>{TABS.find(t => t.key === activeTab)?.label}</h1>
            <p>Управление экосистемой проекта</p>
          </div>

          <div className="header-search">
            <Search size={18} />
            <input 
              placeholder="Поиск заявок..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <section className="body-content">
          {activeTab === 'dashboard' && (
          <div className="tab-dashboard fade-in">
            {/* Карточки статистики */}
            <div className="stat-row">
              <StatCard label="Всего" val={stats.total} icon={MessageSquare} />
              <StatCard label="Активно" val={stats.published} icon={CheckCircle2} color="var(--success)" />
              <StatCard label="Новые сегодня" val={stats.today} icon={Clock} color="var(--accent)" />
              <StatCard label="Авторы" val={stats.users} icon={Users} />
            </div>

            <div className="chart-grid">
              {/* ЛИНЕЙНЫЙ ГРАФИК (Тот самый, что пропал) */}
              <div className="chart-card main-chart">
                <h3>Динамика обращений</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                    <XAxis dataKey="date" stroke="var(--text-light)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-light)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="var(--accent)" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* КРУГОВАЯ ДИАГРАММА */}
              <div className="chart-card side-chart">
                <h3>Типы инцидентов</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Парковка', value: messages.filter(m => m.type === 'PARKING').length },
                        { name: 'Просрочка', value: messages.filter(m => m.type === 'FOOD_EXPIRED').length }
                      ]} 
                      innerRadius={70} 
                      outerRadius={90} 
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="var(--accent)" />
                      <Cell fill="var(--danger)" />
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

          {activeTab === 'messages' && (
          <div className="table-card">
            <div className="table-filters">
              <Filter size={16} />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">Все категории</option>
                <option value="PARKING">Парковка</option>
                <option value="FOOD_EXPIRED">Просрочка</option>
              </select>
              <button className="btn-refresh" onClick={loadAdminIncidents} disabled={adminLoading}>
                Обновить
              </button>
            </div>
            {adminLoading ? (
              <div className="loading-spinner">Загрузка...</div>
            ) : (
              <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Тема</th>
                  <th>Тип</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map(inc => (
                  <tr key={inc.id}>
                  <td>#{inc.id}</td>
                  <td>{inc.title}</td>
                  <td>{inc.type}</td>
                  <td>{inc.login}</td> {/* В DTO это login, а не userId */}
                  <td>
                    <span className={`status-badge ${inc.active ? 'active' : 'draft'}`}>
                      {inc.active ? 'Опубликован' : 'Черновик'}
                    </span>
                  </td>
                  <td className="table-actions-cell">
                    {/* КНОПКИ БЕЗ canEdit - АДМИНУ МОЖНО ВСЁ */}
                    <button className="btn-table-icon" onClick={() => handleEditClick(inc)}>
                      <Settings size={16} />
                    </button>
                    <button 
                      className="btn-table-icon danger" 
                      onClick={() => setConfirmModal({
                        id: inc.id,
                        title: `Удалить инцидент "${inc.title}"?`,
                        action: () => handleDeleteIncident(inc.id)
                      })}
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}

          {/* ВКЛАДКА: КАРТА (Аналог MainPage, но для контроля) */}
          {activeTab === 'map' && (
          <div className="tab-map fade-in">
            <div className="map-layer-selector no-map-click">
              <select
                value={Object.keys(layers).find((key) => layers[key] === currentLayer) || ''}
                onChange={(e) => selectLayer(e.target.value)}
              >
                {Object.entries(layers).map(([key, layer]) => (
                  <option key={key} value={key}>{layer.name}</option>
                ))}
              </select>
              {manualOverride && <button className="auto-layer-btn" onClick={resetToAuto}>Авто</button>}
            </div>
            <div className="map-container-wrapper">
              <MapContainer center={[53.1958, 50.1001]} zoom={12} className="leaflet-admin-map" attributionControl={false}>
                <TileLayer key={currentLayer.url} url={currentLayer.url} attribution={currentLayer.attribution} />
                
                {/* Используем messages из контекста, а не adminIncidents */}
                {messages
                  .filter(msg => msg.latitude != null && msg.longitude != null)
                  .map(msg => (
                    <Marker
                      key={msg.id}
                      position={[msg.latitude, msg.longitude]}
                      icon={getIconByType(msg.type)}
                    >
                      <Popup>
                        <div className="map-popup-admin">
                          <span className={`badge-type ${msg.type?.toLowerCase()}`}>
                            {msg.type === 'PARKING' ? 'Парковка' : 'Просрочка'}
                          </span>
                          <strong>{msg.title}</strong>
                          <p>{msg.address}</p>
                          <div className="popup-actions">
                            <button onClick={() => handleViewDetails(msg.id)}>Подробнее</button>
                            {true && (
                              <>
                                <button onClick={() => handleEditClick(msg)}>Редактировать</button>
                                <button
                                  className="btn-del"
                                  onClick={() => setConfirmModal({
                                    id: msg.id,
                                    title: `Удалить инцидент "${msg.title}"?`,
                                    action: () => handleDeleteIncident(msg.id),
                                    actionName: 'Удалить'
                                  })}
                                >
                                  Удалить
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                <CustomAttributionControl />
              </MapContainer>
            </div>
          </div>
        )}

          {/* ========== ПОЛЬЗОВАТЕЛИ (заглушка) ========== */}
          {activeTab === 'users' && (
            <div className="table-card fade-in">
              <div className="table-header-tool">
                <h3>База пользователей</h3>
                <div className="table-actions">
                  <button className="btn-accent">Экспорт CSV</button>
                  <button className="btn-primary">+ Новый модератор</button>
                </div>
              </div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Пользователь</th>
                      <th>Роль</th>
                      <th>Статус</th>
                      <th>Сообщений</th>
                      <th className="text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div className="user-info-cell">
                            <div className="user-avatar-sm">{user.id}</div>
                            <div>
                              <p className="u-name">{user.name}</p>
                              <p className="u-email">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge-role">{user.role}</span></td>
                        <td>
                          <span className={`status-indicator ${user.status === 'active' ? 'active' : 'blocked'}`}>
                            {user.status === 'active' ? 'Активен' : 'Заблокирован'}
                          </span>
                        </td>
                        <td>{Math.floor(Math.random() * 10)}</td>
                        <td className="text-right">
                          <button className="btn-table-icon"><Settings size={14} /></button>
                          <button className="btn-table-icon danger"><X size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ВКЛАДКА: НАСТРОЙКИ */}
          {activeTab === 'settings' && (
            <div className="settings-grid fade-in">
              <div className="settings-column">
                <div className="settings-card">
                  <h4>Конфигурация системы</h4>
                  <div className="setting-control">
                    <div className="setting-text">
                      <strong>Технический режим</strong>
                      <p>Ограничить доступ к API для всех, кроме админов</p>
                    </div>
                    <label className="ui-switch">
                     <input 
                        type="checkbox" 
                        checked={settings.maintenanceMode} 
                        onChange={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})} 
                      />
                      <span className="ui-slider"></span>
                    </label>
                  </div>
                  
                  <div className="setting-control">
                    <div className="setting-text">
                      <strong>Лимит заявок</strong>
                      <p>Макс. кол-во активных заявок от одного пользователя</p>
                    </div>
                    <input type="number" className="ui-input-sm" defaultValue={5} />
                  </div>
                </div>
              </div>

              <div className="settings-column">
                <div className="settings-card danger-zone">
                  <h4>Безопасность и данные</h4>
                  <p className="danger-desc">Эти действия необратимы</p>
                  <button className="btn-outline-danger">Сбросить все токены сессий</button>
                  <button className="btn-danger-full">Удалить неактивные сообщения (30+ дней)</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      
      {/* Модалка просмотра деталей (полная информация) */}
      {selectedMessageDetails && (
        <div className="custom-modal-overlay" onClick={() => setSelectedMessageDetails(null)}>
          <div className="custom-modal wide-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Детали инцидента #{selectedMessageDetails.id}</h3>
              <button onClick={() => setSelectedMessageDetails(null)}><X size={20} /></button>
            </div>
            {detailsLoading ? (
              <div className="modal-inner">Загрузка...</div>
            ) : (
              <div className="modal-inner">
                <p><strong>Заголовок:</strong> {selectedMessageDetails.title}</p>
                <p><strong>Тип:</strong> {selectedMessageDetails.type === 'PARKING' ? 'Парковка' : 'Просрочка'}</p>
                <p><strong>Адрес:</strong> {selectedMessageDetails.address}</p>
                <p><strong>Автор (ID):</strong> {selectedMessageDetails.userId}</p>
                <p><strong>Статус:</strong> {selectedMessageDetails.active ? 'Опубликован' : 'Черновик'}</p>
                <p><strong>Создано:</strong> {new Date(selectedMessageDetails.created).toLocaleString()}</p>
                <p><strong>Описание:</strong> {selectedMessageDetails.description || 'Нет описания'}</p>
                {selectedMessageDetails.photos && selectedMessageDetails.photos.length > 0 && (
                  <div className="photos-section">
                    <strong>Фотографии:</strong>
                    <div className="photos-grid">
                      {selectedMessageDetails.photos.map((photo, idx) => (
                        <img key={idx} src={photo} alt={`Фото ${idx+1}`} className="modal-photo" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Модалка подтверждения удаления */}
      {confirmModal && (
        <div className="custom-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="custom-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Подтверждение</h3>
              <button onClick={() => setConfirmModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-inner">
              <p>{confirmModal.title}</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setConfirmModal(null)}>Отмена</button>
                <button className="btn-danger" onClick={confirmModal.action}>
                  {confirmModal.actionName || 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {editingIncident && (
        <div className="custom-modal-overlay" onClick={() => setEditingIncident(null)}>
          <div className="custom-modal wide-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Редактирование инцидента #{editingIncident.id}</h3>
              <button onClick={() => setEditingIncident(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Заголовок</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Тип</label>
                <select
                  value={editForm.type}
                  onChange={e => setEditForm({...editForm, type: e.target.value})}
                >
                  <option value="PARKING">Парковка</option>
                  <option value="FOOD_EXPIRED">Просрочка</option>
                </select>
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  rows="4"
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditingIncident(null)}>Отмена</button>
                <button type="submit" className="btn-primary" disabled={editLoading}>
                  {editLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, val, icon: Icon, color }) => (
  <div className="card-stat">
    <div className="card-stat-icon" style={{ color: color || 'var(--text-secondary)' }}>
      <Icon size={24} />
    </div>
    <div className="card-stat-info">
      <span>{label}</span>
      <strong>{val}</strong>
    </div>
  </div>
);