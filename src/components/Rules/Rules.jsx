import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Rules.css';

const Rules = () => {
  const navigate = useNavigate();

  return (
    <div className="rules-container">
      <div className="rules-header">
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
        <h2>Правила проекта</h2>
      </div>
      <div className="rules-content">
        <p>1. Пользователь обязуется предоставлять достоверную информацию.</p>
        <p>2. Запрещено размещать материалы, нарушающие законодательство РФ.</p>
        <p>3. Администрация имеет право блокировать аккаунты за нарушение правил.</p>
        <p>4. ... (здесь будут все правила, предоставленные заказчиком)</p>
        <p>5. Правила могут быть изменены без предварительного уведомления.</p>
        <p>6. Продолжая использовать сервис, вы соглашаетесь с текущей версией правил.</p>
        {}
      </div>
    </div>
  );
};

export default Rules;