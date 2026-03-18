// Только кириллица, пробелы, дефис (для фамилии и имени)
export const validateCyrillic = (value, allowHyphen = false) => {
  const regex = allowHyphen ? /^[А-Яа-яЁё\s-]+$/ : /^[А-Яа-яЁё\s]+$/;
  return regex.test(value);
};
// Только кириллица (без пробелов и дефиса)
export const validateCyrillicOnly = (value) => /^[А-Яа-яЁё]+$/.test(value);

// Кириллица и дефис (без пробелов) – для фамилии
export const validateCyrillicWithHyphen = (value) => /^[А-Яа-яЁё-]+$/.test(value);

// Для дома: цифры, буквы кириллицы, тире, дробь
export const validateHouse = (value) => {
  return /^[А-Яа-яЁё0-9\-\/]+$/.test(value);
};

// Для квартиры: цифры и буквы кириллицы
export const validateApartment = (value) => {
  return /^[А-Яа-яЁё0-9]*$/.test(value);
};

// Формат телефона: +7 XXX XXX XX XX (можно упростить)
export const formatPhone = (value) => {
  // Удаляем всё кроме цифр
  const cleaned = value.replace(/\D/g, '');
  // Ограничим до 11 цифр (для РФ)
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
  }
  return value;
};

export const validatePhone = (value) => {
  // Точный формат: +X XXX XXX XX XX (X – цифры)
  const phoneRegex = /^\+\d \d{3} \d{3} \d{2} \d{2}$/;
  return phoneRegex.test(value);
};