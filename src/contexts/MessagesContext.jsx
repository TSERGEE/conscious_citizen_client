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
      console.log('[Messages] Загружаю список...');
      const [publicIncidents, draftIncidents] = await Promise.all([
        getAllIncidents(),
        getDraftIncidents()
      ]);

      const allIncidents = [
        ...publicIncidents.map(inc => ({ ...inc, active: true })),
        ...draftIncidents.map(inc => ({ ...inc, active: false }))
      ];

      // Превью пока нет – показываем заглушку. Реальные фото подгрузятся при открытии карточки.
      const normalized = allIncidents.map(inc => ({
        ...inc,
        preview: placeholderImg
      }));

      setMessages(normalized);
      console.log(`[Messages] Загружено ${normalized.length} записей`);
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
  const updateMessage = async (id, messageData) => {
    try {
      await updateIncident(id, messageData);
      await loadMessages(); // обновить список после редактирования
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