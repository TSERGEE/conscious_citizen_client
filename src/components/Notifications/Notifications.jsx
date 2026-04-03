import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '../../contexts/MessagesContext';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();

  const {
    messages,
    readNotifications,
    markAsRead,
    markAllAsRead
  } = useMessages();

  const sorted = [...messages].sort((a, b) => {
    const dateA = a.created
      ? new Date(a.created)
      : new Date(0);

    const dateB = b.created
      ? new Date(b.created)
      : new Date(0);

    return dateB - dateA;
  });

  const handleOpen = (msg) => {
    markAsRead(msg.id);
    navigate(`/message/${msg.id}`);
  };

  return (
    <div className="notifications-page">
      <div className="notifications-card">
        <div className="notifications-header">
          <h1>Уведомления</h1>

          <button onClick={markAllAsRead}>
            Прочитать все
          </button>
        </div>

        <div className="notifications-list">
          {sorted.length > 0 ? (
            sorted.map(msg => (
              <div
                key={msg.id}
                className={`notification-item ${
                  !readNotifications.includes(msg.id)
                    ? 'unread'
                    : ''
                }`}
                onClick={() => handleOpen(msg)}
              >
                <div className="notification-title">
                  {msg.title}
                </div>

                <div className="notification-date">
                  {msg.created
                    ? new Date(
                        msg.created
                      ).toLocaleString()
                    : '—'}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-notifications">
              Нет уведомлений
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;