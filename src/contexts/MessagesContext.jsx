import React, { createContext, useState, useContext } from 'react';

const MessagesContext = createContext();

export const useMessages = () => useContext(MessagesContext);

export const MessagesProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const addMessage = (message) => {
    const newMessage = {
      ...message,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [newMessage, ...prev]);
    return newMessage.id;
  };

  const getMessage = (id) => messages.find(msg => msg.id === id);

  return (
    <MessagesContext.Provider value={{ messages, addMessage, getMessage }}>
      {children}
    </MessagesContext.Provider>
  );
};