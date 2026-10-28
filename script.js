// ============================================================
// script.js — вся логика страницы-визитки
// Пока тут две задачи: год в подвале и кнопка «Связаться».
// ============================================================

// ---------- 1. Текущий год в подвале ----------
const yearElement = document.getElementById('year');
yearElement.textContent = new Date().getFullYear();

// ---------- 2. Кнопка «Связаться»: копирование юза Telegram ----------
// FIXME: заменить на свой юз (можно с @ или без — скрипт сам добавит @)
const TELEGRAM_USERNAME = '@etnad1111';

// Приводим юз к единому виду: всегда с @ в начале
const telegramHandle = TELEGRAM_USERNAME.startsWith('@')
  ? TELEGRAM_USERNAME
  : '@' + TELEGRAM_USERNAME;

const contactButton = document.getElementById('contact-btn');
const toast = document.getElementById('toast');

// Флаг, чтобы таймер уведомления не «накладывался» при быстрых нажатиях
let toastTimer = null;

/**
 * Копирует текст в буфер обмена.
 * Сначала пробуем современный Clipboard API,
 * если он недоступен — откатываемся на execCommand.
 * @param {string} text — что копировать
 * @returns {Promise<boolean>} — успех или нет
 */
async function copyToClipboard(text) {
  try {
    // Современный способ (работает на http/https)
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Резервный путь: временная textarea + execCommand
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // textarea должна быть в DOM, но невидима для пользователя
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    document.body.removeChild(textarea);
    return copied;
  }
}

/**
 * Показывает маленькое уведомление под кнопкой.
 * @param {string} message — текст уведомления
 */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('toast--visible');

  // Если timer от прошлого показа жив — отменяем его
  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  // Прячем уведомление через 2.5 секунды
  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--visible');
    toastTimer = null;
  }, 2500);
}

// Блокируем двойной показ во время уже идущего копирования
let isCopying = false;

contactButton.addEventListener('click', async () => {
  if (isCopying) return;
  isCopying = true;

  const copied = await copyToClipboard(telegramHandle);

  if (copied) {
    showToast('✓ Юз скопирован: ' + telegramHandle);
  } else {
    // Если копирование не сработало (например, старый браузер) — просто показываем юз
    showToast('Юз в Telegram: ' + telegramHandle);
  }

  isCopying = false;
});
