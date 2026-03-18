// contexts/MessagesContext.js
import React, { createContext, useState, useContext } from 'react';

const MessagesContext = createContext();

export const useMessages = () => useContext(MessagesContext);

export const MessagesProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  // Добавление нового сообщения (по умолчанию опубликованное)
  const addMessage = (messageData) => {
    const newMessage = {
      id: Date.now(), // или использовать генератор ID
      ...messageData,
      isDraft: messageData.isDraft || false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  // Получение сообщения по id
  const getMessage = (id) => messages.find(msg => msg.id === id);

  // Обновление существующего сообщения
  const updateMessage = (id, updatedData) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, ...updatedData } : msg))
    );
  };

  // Публикация черновика (снимает флаг isDraft)
  const publishDraft = (id) => {
    setMessages(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, isDraft: false } : msg))
    );
  };

  // Удаление сообщения (по желанию)
  const deleteMessage = (id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  return (
    <MessagesContext.Provider
      value={{
        messages,
        addMessage,
        getMessage,
        updateMessage,
        publishDraft,
        deleteMessage,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
};