// contexts/MessagesContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import {
  getAllIncidents,
  createIncident,
  getIncidentById,
  uploadIncidentPhoto,
  getIncidentPhotos,
  getDraftIncidents,
  updateIncident,        // <-- добавлен импорт
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

  // Текущий ID пользователя из localStorage
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

  // Загрузка списка инцидентов (без превью, показываем плейсхолдер)
  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const [publicIncidents, draftIncidents] = await Promise.all([
        getAllIncidents(),
        getDraftIncidents()
      ]);

      // Загружаем адреса параллельно, но даже при ошибке сохраняем инцидент
      const incidentsWithAddress = await Promise.allSettled(
        publicIncidents.map(async (inc) => {
          try {
            const full = await getIncidentById(inc.id);
            return { ...inc, address: full.address, active: true };
          } catch (err) {
            console.warn(`Не удалось загрузить адрес для инцидента ${inc.id}`, err);
            return { ...inc, address: 'Адрес не загружен', active: true };
          }
        })
      );

      const validPublic = incidentsWithAddress.map(result => result.value); // берём value даже у rejected

      const allIncidents = [
        ...validPublic,
        ...draftIncidents.map(inc => ({ ...inc, active: false }))
      ];

      setMessages(allIncidents.map(inc => ({ ...inc, preview: placeholderImg })));
    } catch (err) {
      console.error('[Messages] Ошибка загрузки:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  // Создание нового инцидента + загрузка фото
  const addMessage = async (messageData, photoFiles = []) => {
    try {
      console.log('[Messages] Создаю инцидент...', messageData);
      const newIncident = await createIncident(messageData);
      const incidentId = newIncident.id;
      console.log(`[Messages] Инцидент создан, id=${incidentId}`);

      if (photoFiles.length > 0) {
        console.log(`[Messages] Загружаю ${photoFiles.length} фото...`);
        const uploadPromises = photoFiles.map(file => uploadIncidentPhoto(incidentId, file));
        await Promise.all(uploadPromises);
        console.log('[Messages] Все фото загружены');
      }

      await loadMessages(); // обновить список
      return incidentId;
    } catch (err) {
      console.error('[Messages] Ошибка при добавлении:', err);
      throw err;
    }
  };

  // Получение одного инцидента со всеми фото, а также userId и fullName
  const getMessage = async (id) => {
    try {
      console.log(`[Messages] Загружаю инцидент ${id}...`);
      const [incident, photosData] = await Promise.all([
        getIncidentById(id),
        getIncidentPhotos(id)
      ]);

      // Пытаемся найти userId в локальном списке messages
      const cachedIncident = messages.find(m => m.id === Number(id));
      const userId = cachedIncident?.userId || incident.userId; // если в incident уже есть userId

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

  // Обновление инцидента
// Заменить updateMessage на версию, принимающую все поля
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
    // Проверяем, есть ли уже реальное preview у сообщения
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
        currentUserId,   // <-- добавляем для использования в компонентах
        loadThumbnail,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};