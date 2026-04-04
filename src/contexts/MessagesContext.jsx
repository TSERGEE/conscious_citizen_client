// contexts/MessagesContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { getAllIncidents, createIncident, getIncidentById, uploadIncidentPhoto,  getIncidentPhotos, getDraftIncidents } from '../api';
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
  useEffect(() => {
    localStorage.setItem(
      'readNotifications',
      JSON.stringify(readNotifications)
    );
  }, [readNotifications]);
  const markAsRead = (id) => {
    setReadNotifications(prev =>
      prev.includes(id) ? prev : [...prev, id]
    );
  };

  const markAllAsRead = () => {
    setReadNotifications(messages.map(m => m.id));
  };
  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      // Делаем два запроса одновременно
      const [publicIncidents, draftIncidents] = await Promise.all([
        getAllIncidents(),     // Тот, что без параметра, но мы знаем, что они active
        getDraftIncidents()    // Тот, что без параметра, но мы знаем, что это черновики
      ]);

      // Руками добавляем поле active для первой группы
      const normalPublic = publicIncidents.map(inc => ({
        ...inc,
        active: true, 
        preview: inc.photos?.[0] || placeholderImg
      }));

      // Руками добавляем поле active для второй группы
      const normalDrafts = draftIncidents.map(inc => ({
        ...inc,
        active: false,
        preview: inc.photos?.[0] || placeholderImg
      }));

      // Соединяем в один массив
      setMessages([...normalPublic, ...normalDrafts]);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMessage = async (messageData, photoFiles = []) => {
    try {
      // 1. Создаем запись об инциденте
      const newIncident = await createIncident(messageData);
      const incidentId = newIncident.id;

      // 2. Если есть выбранные фото, загружаем их
      if (photoFiles.length > 0) {
        // Загружаем параллельно все файлы
        await Promise.all(
          photoFiles.map(photo => uploadIncidentPhoto(incidentId, photo.file))
        );
      }

      await loadMessages(); // Обновляем список
      return incidentId;
    } catch (err) {
      console.error('Ошибка при создании инцидента с фото:', err);
      throw err;
    }
  };

  const getMessage = async (id) => {
    try {
      // Получаем данные инцидента и список фото одновременно
      const [incident, photosData] = await Promise.all([
        getIncidentById(id),
        getIncidentPhotos(id)
      ]);

      return {
        ...incident,
        // Собираем массив URL из объектов MediaAssetDto
        photos: photosData.map(asset => asset.downloadUrl)
      };
    } catch (err) {
      console.error(`Ошибка получения инцидента ${id}:`, err);
      throw err;
    }
  };

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
        refreshMessages: loadMessages,
        readNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};