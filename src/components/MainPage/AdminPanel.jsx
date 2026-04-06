import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import {
  BarChart3, MapPin, MessageSquare, Users,
  Filter, CheckCircle2, Clock, X
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AdminPanel.css';
import {
  getAllAdminIncidents, deleteIncident, getIncidentById,
  updateIncident, getAllUsers, uploadIncidentPhoto, getIncidentPhotos
} from '../../api';

const TABS = [
  { key: 'dashboard', label: 'Аналитика', icon: BarChart3 },
  { key: 'messages', label: 'Обращения', icon: MessageSquare },
  { key: 'map', label: 'Карта', icon: MapPin },
  { key: 'users', label: 'Пользователи', icon: Users },
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
  const [confirmModal, setConfirmModal] = useState(null);
  const { theme } = useTheme();
  const currentUserId = parseInt(localStorage.getItem('userId') || '0');

  const [editPhotos, setEditPhotos] = useState([]);        // новые файлы для загрузки
  const [existingPhotos, setExistingPhotos] = useState([]); // существующие фото (url)
  const [editPhotosPreviews, setEditPhotosPreviews] = useState([]); // превью новых фото
  const fileInputRef = useRef(null);

  const [currentLayer, setCurrentLayer] = useState(layers.standard);
  const [manualOverride, setManualOverride] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', type: 'PARKING' });
  const [editLoading, setEditLoading] = useState(false);
  const [loadingEditData, setLoadingEditData] = useState(false); // для загрузки полных данных

  const [activeTab, setActiveTab] = useState('dashboard');
  const [filterType, setFilterType] = useState('all');
  const [selectedMessageDetails, setSelectedMessageDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Загрузка полных данных инцидента перед редактированием
  const handleEditClick = async (incidentId) => {
    setLoadingEditData(true);
    setEditingIncident({ id: incidentId });
    try {
      const fullData = await getIncidentById(incidentId);
      // Загружаем существующие фото
      const photosData = await getIncidentPhotos(incidentId);
      const photoUrls = photosData.map(p => p.downloadUrl);
      setExistingPhotos(photoUrls);
      setEditPhotos([]);
      setEditPhotosPreviews([]);
      setEditingIncident(fullData);
      setEditForm({
        title: fullData.title || '',
        description: fullData.description || '',
        type: fullData.type || 'PARKING',
      });
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      alert('Не удалось загрузить данные для редактирования');
      setEditingIncident(null);
    } finally {
      setLoadingEditData(false);
    }
  };
    const handleAddPhotoClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newPreviews = files.map((file, idx) => ({
      id: Date.now() + idx,
      url: URL.createObjectURL(file),
      file,
    }));
    setEditPhotosPreviews(prev => [...prev, ...newPreviews]);
    setEditPhotos(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeNewPhoto = (id) => {
    setEditPhotosPreviews(prev => prev.filter(p => p.id !== id));
    setEditPhotos(prev => prev.filter((_, idx) => {
      // находим файл по совпадающему preview id – сложно, проще хранить файлы в preview объектах
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      // 1. Обновляем текстовые данные
      const requestData = {
        title: editForm.title,
        description: editForm.description,
        type: editForm.type,
        latitude: editingIncident.latitude,
        longitude: editingIncident.longitude,
        address: editingIncident.address || "",
        active: editingIncident.active
      };
      await updateIncident(editingIncident.id, requestData);

      // 2. Загружаем новые фото (если есть)
      if (editPhotosPreviews.length > 0) {
        const uploadPromises = editPhotosPreviews.map(item =>
          uploadIncidentPhoto(editingIncident.id, item.file)
        );
        await Promise.all(uploadPromises);
      }

      // 3. Обновляем списки
      await loadAdminIncidents();
      await refreshMessages();
      setEditingIncident(null);
      alert('Инцидент успешно обновлён');
    } catch (err) {
      console.error('Ошибка обновления:', err);
      alert(`Ошибка: ${err.message}`);
    } finally {
      setEditLoading(false);
    }
  };

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

  const handleDeleteIncident = async (id) => {
    try {
      await deleteIncident(id);
      await loadAdminIncidents();
      await refreshMessages();
      setConfirmModal(null);
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить. Возможно, сервер отверг запрос.');
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userProfile') || '{}');
    if (userData.role !== 'ADMIN') navigate('/main');
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'messages' || activeTab === 'map') {
      loadAdminIncidents();
      if (activeTab === 'map') {
        refreshMessages();
      }
    }
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await getAllUsers(); // предполагаемая функция API
      setUsers(data);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
    } finally {
      setUsersLoading(false);
    }
  };

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
      return matchesType;
    });
  }, [adminIncidents, filterType]);

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

  // Обработчик клика по строке таблицы
  const handleRowClick = (incidentId) => {
    handleEditClick(incidentId);
  };

  return (
    <div className="admin-view">
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

      <main className="admin-body">
        <header className="body-header">
          <div className="header-info">
            <h1>{TABS.find(t => t.key === activeTab)?.label}</h1>
            <p>Управление экосистемой проекта</p>
          </div>
          {/* Поиск удалён */}
        </header>

        <section className="body-content">
          {activeTab === 'dashboard' && (
            <div className="tab-dashboard fade-in">
              <div className="stat-row">
                <StatCard label="Всего" val={stats.total} icon={MessageSquare} />
                <StatCard label="Активно" val={stats.published} icon={CheckCircle2} color="var(--success)" />
                <StatCard label="Новые сегодня" val={stats.today} icon={Clock} color="var(--accent)" />
                <StatCard label="Авторы" val={stats.users} icon={Users} />
              </div>
              <div className="chart-grid">
                <div className="chart-card main-chart">
                  <h3>Динамика обращений</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                      <XAxis dataKey="date" stroke="var(--text-light)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-light)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="count" stroke="var(--accent)" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
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
                      <Legend verticalAlign="bottom" height={36} />
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
                      <th>Адрес</th>
                      <th>Дата</th>
                      <th>Автор</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMessages.map(inc => (
                      <tr key={inc.id} onClick={() => handleRowClick(inc.id)} style={{ cursor: 'pointer' }}>
                        <td>#{inc.id}</td>
                        <td>{inc.title}</td>
                        <td>{inc.type === 'PARKING' ? 'Парковка' : 'Просроченные продукты'}</td>
                        <td>{inc.address || '—'}</td>
                        <td>{inc.created ? new Date(inc.created).toLocaleDateString() : '—'}</td>
                        <td>{inc.login || '—'}</td>
                        <td className="table-actions-cell" onClick={(e) => e.stopPropagation()}>
                          <button className="btn-table-icon" onClick={() => handleEditClick(inc.id)}>
                            <X size={16} /> {/* или шестерёнка, но иконки нет – можно поставить любую */}
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
                              <button onClick={() => handleEditClick(msg.id)}>Редактировать</button>
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

          {activeTab === 'users' && (
            <div className="table-card fade-in">
              <div className="table-header-tool">
                <h3>База пользователей</h3>
                {/* Кнопки экспорта и добавления удалены */}
              </div>
              <div className="table-responsive">
                {usersLoading ? (
                  <div className="loading-spinner">Загрузка пользователей...</div>
                ) : (
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
                          <td>{user.incidentCount || 0}</td>
                          <td className="text-right">
                            <button className="btn-table-icon"><Settings size={14} /></button>
                            <button className="btn-table-icon danger"><X size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Модалка деталей */}
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
                        <img key={idx} src={photo} alt={`Фото ${idx + 1}`} className="modal-photo" />
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

      {/* Модалка редактирования (загружает полные данные) */}
      {editingIncident && (
        <div className="custom-modal-overlay" onClick={() => setEditingIncident(null)}>
          <div className="custom-modal wide-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h3>Редактирование инцидента #{editingIncident.id}</h3>
              <button onClick={() => setEditingIncident(null)}><X size={20} /></button>
            </div>
            {loadingEditData ? (
              <div className="modal-inner">Загрузка данных...</div>
            ) : (
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label>Заголовок</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Тип</label>
                  <select
                    value={editForm.type}
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
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
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Адрес</label>
                  <div className="address-display" style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    {editingIncident.address || 'Не указан'}
                  </div>
                </div>

                {/* Блок фото */}
                <div className="form-group">
                  <label>Фотографии</label>
                  {/* Существующие фото (только просмотр) */}
                  {existingPhotos.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-light)' }}>Текущие фото:</div>
                      <div className="photo-preview-list" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {existingPhotos.map((url, idx) => (
                          <div key={idx} className="photo-preview-item" style={{ position: 'relative', width: '80px', height: '80px' }}>
                            <img src={url} alt={`фото ${idx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Новые фото (превью + кнопка удаления) */}
                  <div className="photo-upload">
                    <button type="button" onClick={handleAddPhotoClick} className="photo-btn">
                      Добавить фото
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                    />
                  </div>
                  {editPhotosPreviews.length > 0 && (
                    <div className="photo-preview-list" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                      {editPhotosPreviews.map(photo => (
                        <div key={photo.id} className="photo-preview-item" style={{ position: 'relative', width: '80px', height: '80px' }}>
                          <img src={photo.previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                          <button
                            type="button"
                            className="remove-photo-btn"
                            onClick={() => removeNewPhoto(photo.id)}
                            style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditingIncident(null)}>Отмена</button>
                  <button type="submit" className="btn-primary" disabled={editLoading}>
                    {editLoading ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              </form>
            )}
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