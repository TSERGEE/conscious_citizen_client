// contexts/MessagesContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import {
  getAllIncidents,
  createIncident,
  getIncidentById,
  uploadIncidentPhoto,
  getIncidentPhotos,
  getDraftIncidents,
  updateIncident,
  getIncidentCount,
} from '../api';
import placeholderImg from '../assets/placeholder.png';

const MessagesContext = createContext();

export const useMessages = () => useContext(MessagesContext);

export const MessagesProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [readNotifications, setReadNotifications] = useState(() => {
    const saved = localStorage.getItem('readNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [totalCount, setTotalCount] = useState(0);

  const currentUserId = localStorage.getItem('userId')
    ? Number(localStorage.getItem('userId'))
    : null;

  useEffect(() => {
    localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
  }, [readNotifications]);

  const markAsRead = (id) => {
    setReadNotifications(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const markAllAsRead = () => {
    setReadNotifications(messages.map(m => m.id));
  };
  const loadTotalCount = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setTotalCount(0);
      return;
    }
    try {
      const count = await getIncidentCount();
      setTotalCount(count);
    } catch (err) {
      console.error('[Messages] Ошибка загрузки количества:', err);
      // Не сбрасываем totalCount, оставляем предыдущее значение
    }
  }, []);
  const loadMessages = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('[Messages] Нет токена, пропускаем загрузку');
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [publicIncidents, draftIncidents] = await Promise.all([
        getAllIncidents(),
        getDraftIncidents()
      ]);

      // Логируем структуру полей для отладки
      if (publicIncidents.length) {
        console.log('[Messages] Пример publicIncident:', Object.keys(publicIncidents[0]));
      }
      if (draftIncidents.length) {
        console.log('[Messages] Пример draftIncident:', Object.keys(draftIncidents[0]));
      }

      const incidentsWithAddress = await Promise.allSettled(
        publicIncidents.map(async (inc) => {
          try {
            const full = await getIncidentById(inc.id);
            return { ...inc, address: full.address, active: true };
          } catch (err) {
            console.warn(`Адрес для инцидента ${inc.id} не загружен`, err);
            return { ...inc, address: 'Адрес не загружен', active: true };
          }
        })
      );

      const validPublic = incidentsWithAddress.map(result => result.value);
      const allIncidents = [
        ...validPublic,
        ...draftIncidents.map(inc => ({ ...inc, active: false }))
      ];

      setMessages(allIncidents.map(inc => ({ ...inc, preview: placeholderImg })));
      // После обновления списка инцидентов обновляем счётчик
      await loadTotalCount();
    } catch (err) {
      console.error('[Messages] Ошибка загрузки:', err);
      setError(err.message);
      if (err.message.includes('токен') || err.message.includes('login')) {
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  }, [loadTotalCount]);

  // Создание инцидента с принудительной активацией
  const addMessage = async (messageData, photoFiles = []) => {
    try {
      console.log('[Messages] Создаю инцидент...', messageData);
      // Создаём инцидент (бэкенд может проигнорировать active при создании)
      const newIncident = await createIncident(messageData);
      const incidentId = newIncident.id;
      console.log('[Messages] Инцидент создан, id=', incidentId);

      // Если нужно сделать инцидент активным (active === true), принудительно обновляем
      if (messageData.active === true) {
        await updateIncident(incidentId, { active: true });
        console.log('[Messages] Инцидент активирован через updateIncident');
      }

      // Загружаем фото, если есть
      if (photoFiles.length > 0) {
        const uploadPromises = photoFiles.map(file => uploadIncidentPhoto(incidentId, file));
        await Promise.all(uploadPromises);
        console.log('[Messages] Фото загружены');
      }

      // Перезагружаем список инцидентов
      await loadMessages();
      return incidentId;
    } catch (err) {
      console.error('[Messages] Ошибка при добавлении инцидента:', err);
      throw err;
    }
  };

  const getMessage = async (id) => {
    try {
      console.log(`[Messages] Загружаю инцидент ${id}...`);
      const [incident, photosData] = await Promise.all([
        getIncidentById(id),
        getIncidentPhotos(id)
      ]);
      const cachedIncident = messages.find(m => m.id === Number(id));
      const userId = cachedIncident?.userId || incident.userId;
      const photos = photosData.map(asset => asset.downloadUrl);
      return {
        ...incident,
        photos,
        userId: userId,
        fullName: incident.fullName,
      };
    } catch (err) {
      console.error(`[Messages] Ошибка получения ${id}:`, err);
      throw err;
    }
  };

  const updateMessage = async (id, messageData) => {
    try {
      await updateIncident(id, messageData);
      await loadMessages();
    } catch (err) {
      console.error('[Messages] Ошибка обновления:', err);
      throw err;
    }
  };

  const loadThumbnail = useCallback(async (incidentId) => {
    const existing = messages.find(m => m.id === incidentId);
    if (existing && existing.preview !== placeholderImg) return;
    try {
      const photos = await getIncidentPhotos(incidentId);
      if (photos && photos.length > 0) {
        const firstPhotoUrl = photos[0].downloadUrl;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === incidentId ? { ...msg, preview: firstPhotoUrl } : msg
          )
        );
      }
    } catch (err) {
      console.warn(`Не удалось загрузить фото для ${incidentId}`, err);
    }
  }, [messages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return (
    <MessagesContext.Provider
      value={{
        messages,
        loading,
        error,
        addMessage,
        getMessage,
        updateMessage,
        refreshMessages: loadMessages,
        readNotifications,
        markAsRead,
        markAllAsRead,
        currentUserId,
        loadThumbnail,
        totalCount,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};