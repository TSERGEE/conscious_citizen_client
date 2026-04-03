// contexts/MessagesContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { getAllIncidents, createIncident, getIncidentById } from '../api';

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
    setError(null);
    try {
      const incidents = await getAllIncidents();
      const normalized = incidents.map(inc => ({
        ...inc,
        active: inc.active === true || inc.active === 't' || inc.active === 'true',
      }));
      setMessages(normalized);
      //console.log('Incidents from server:', incidents);
      //setMessages(incidents);
    } catch (err) {
      console.error('Ошибка загрузки инцидентов:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMessage = async (messageData) => {
    try {
      const newIncident = await createIncident(messageData);
      await loadMessages(); // обновляем список после создания
      return newIncident.id;
    } catch (err) {
      console.error('Ошибка создания инцидента:', err);
      throw err;
    }
  };

  const getMessage = async (id) => {
    try {
      return await getIncidentById(id);
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