import React, { useState, useEffect } from 'react';
import { useMessages } from '../../contexts/MessagesContext';
import MessagesList from '../MessagesList/MessagesList';
import { List, User, FileText } from 'lucide-react'; // иконки
import './UnifiedMessagesPage.css';

const UnifiedMessagesPage = () => {
  const { messages, loadThumbnail } = useMessages();
  const [activeTab, setActiveTab] = useState('all');
  const userId = Number(localStorage.getItem('userId'));

  // Фильтрация сообщений
    const getFilteredMessages = () => {
    switch (activeTab) {
        case 'all':
        return messages.filter(msg => msg.active === true);
        case 'my':
        return messages.filter(msg => msg.userId === userId && msg.active === true);
        case 'drafts':
        // Убираем проверку на userId – как в LeftPanel
        return messages.filter(msg => msg.active === false);
        default:
        return [];
    }
    };

  const filteredMessages = getFilteredMessages();

  // Подгружаем миниатюры для отфильтрованных сообщений
  useEffect(() => {
    filteredMessages.forEach(msg => {
      if (!msg.preview || msg.preview === '') {
        loadThumbnail?.(msg.id);
      }
    });
  }, [filteredMessages, loadThumbnail]);

  // Вкладки с иконками (как в админке)
  const tabs = [
    { key: 'all', label: 'Все сообщения', icon: List },
    { key: 'my', label: 'Мои сообщения', icon: User },
    { key: 'drafts', label: 'Черновики', icon: FileText },
  ];

  return (
    <div className="unified-view">
      {/* Левая панель – вкладки */}
      <aside className="unified-sidebar">
        <div className="side-brand">
          <div className="brand-logo">📋</div>
          <span>Мои обращения</span>
        </div>
        <nav className="side-nav">
          {tabs.map(tab => (
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

      {/* Основная область */}
      <main className="unified-main">
        <header className="body-header">
          <div className="header-info">
            <h1>{tabs.find(t => t.key === activeTab)?.label}</h1>
            <p>
              {activeTab === 'all' && 'Все опубликованные сообщения граждан'}
              {activeTab === 'my' && 'Ваши активные сообщения'}
              {activeTab === 'drafts' && 'Неопубликованные черновики'}
            </p>
          </div>
        </header>

        <section className="body-content">
          <MessagesList
            messages={filteredMessages}
            isDraftList={activeTab === 'drafts'}
          />
        </section>
      </main>
    </div>
  );
};

export default UnifiedMessagesPage;