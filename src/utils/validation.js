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

/**
 * Нормализует номер телефона: удаляет нецифры, заменяет 8 на +7 при необходимости
 * @param {string} phone - введённое значение (может содержать любые символы)
 * @returns {string} строка из цифр, готовая для форматирования
 */
export const normalizePhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    return '7' + digits.slice(1);
  }
  return digits;
};
/**
 * Нормализует номер телефона: удаляет все нецифровые символы,
 * и если получено 11 цифр, начинающихся с 8, заменяет 8 на 7.
 * @param {string} phone - любое значение из поля
 * @returns {string} строка из цифр
 */
export const normalizePhoneDigits = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    return '7' + digits.slice(1);
  }
  return digits;
};

/**
 * Форматирует 11 цифр в вид +7 XXX XXX XX XX.
 * Если цифр не 11, возвращает исходную строку.
 * @param {string} digits - строка цифр
 * @returns {string} отформатированный номер или исходная строка
 */
export const formatPhoneDigits = (digits) => {
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    const normalized = digits.startsWith('8') ? '7' + digits.slice(1) : digits;
    return `+${normalized[0]} ${normalized.slice(1, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 9)} ${normalized.slice(9, 11)}`;
  }
  return digits;
};

/**
 * Основная функция: нормализует и форматирует номер в российский международный формат.
 * Если номер не подходит (не 11 цифр, начинающихся с 7 или 8), возвращает исходную строку.
 * @param {string} phone - введённое значение
 * @returns {string} отформатированный номер или исходная строка
 */
export const normalizeAndFormatPhone = (phone) => {
  const digits = normalizePhoneDigits(phone);
  return formatPhoneDigits(digits);
};

// Обновляем validatePhone для строгой проверки +7
export const validatePhone = (value) => {
  const phoneRegex = /^\+7 \d{3} \d{3} \d{2} \d{2}$/;
  return phoneRegex.test(value);
};