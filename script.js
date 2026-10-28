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

// ============================================================
// 3. Секция «Проекты»: публичные репозитории через GitHub API
// ============================================================

// Имя пользователя на GitHub. Если сменишь — поменяй только здесь.
const GITHUB_USERNAME = 'v1reless';

// Сколько карточек показывать максимум.
const PROJECTS_LIMIT = 6;

// Запрашиваем до 100 репозиториев, чтобы после фильтрации форков
// точно осталось достаточно проектов для показа.
const PROJECTS_API = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;

const projectsList = document.getElementById('projects-list');
const projectsStatus = document.getElementById('projects-status');

/**
 * Показывает сообщение над списком проектов.
 * @param {string} message — текст; пустая строка скрывает сообщение
 * @param {boolean} isError — добавить красный цвет
 */
function setProjectsStatus(message, isError = false) {
  projectsStatus.textContent = message;
  projectsStatus.classList.toggle('projects__status--error', isError);
  projectsStatus.hidden = message === '';
}

/**
 * Форматирует дату из ISO-строки в понятный вид.
 * @param {string} isoDate
 * @returns {string}
 */
function formatProjectDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Создаёт карточку проекта без innerHTML.
 * Все данные из API вставляются через textContent —
 * так браузер не выполнит чужой HTML или скрипт.
 * @param {object} repo — объект репозитория из GitHub API
 * @returns {HTMLElement}
 */
function createProjectCard(repo) {
  const card = document.createElement('article');
  card.className = 'project-card';

  // Иконка: у архивных проектов другой символ
  const icon = document.createElement('div');
  icon.className = 'project-card__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = repo.archived ? '▣' : '◆';

  // Название — ссылка на репозиторий
  const title = document.createElement('h3');
  title.className = 'project-card__title';

  const link = document.createElement('a');
  link.className = 'project-card__link';
  link.href = repo.html_url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = repo.name;
  title.appendChild(link);

  // Описание: у репозитория может не быть description
  const description = document.createElement('p');
  description.className = 'project-card__text';
  description.textContent = repo.description || 'Без описания — но код уже на GitHub.';

  // Нижняя строка: язык, звёзды, дата обновления
  const meta = document.createElement('div');
  meta.className = 'project-card__meta';

  if (repo.language) {
    const language = document.createElement('span');
    language.className = 'project-card__lang';
    language.textContent = repo.language;
    meta.appendChild(language);
  }

  if (repo.stargazers_count > 0) {
    const stars = document.createElement('span');
    stars.textContent = `★ ${repo.stargazers_count}`;
    meta.appendChild(stars);
  }

  const updated = document.createElement('span');
  updated.textContent = `обновлён ${formatProjectDate(repo.updated_at)}`;
  meta.appendChild(updated);

  if (repo.archived) {
    const archived = document.createElement('span');
    archived.className = 'project-card__badge';
    archived.textContent = 'архив';
    meta.appendChild(archived);
  }

  card.append(icon, title, description, meta);
  return card;
}

/**
 * Загружает публичные репозитории и рисует карточки.
 */
async function loadProjects() {
  setProjectsStatus('Загружаю проекты…');
  projectsList.replaceChildren();
  projectsList.setAttribute('aria-busy', 'true');

  try {
    const response = await fetch(PROJECTS_API, {
      headers: {
        // GitHub рекомендует явно просить JSON-версию API
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      // 403 и 429 — это чаще всего лимит анонимных запросов
      if (response.status === 403 || response.status === 429) {
        throw new Error('rate-limit');
      }
      throw new Error(`GitHub ответил кодом ${response.status}`);
    }

    const repos = await response.json();

    const projects = repos
      .filter((repo) => !repo.fork) // форки — не наши проекты
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, PROJECTS_LIMIT);

    if (projects.length === 0) {
      setProjectsStatus('Пока нет публичных проектов. Загляни позже.');
      return;
    }

    const fragment = document.createDocumentFragment();
    projects.forEach((repo) => {
      fragment.appendChild(createProjectCard(repo));
    });
    projectsList.appendChild(fragment);

    setProjectsStatus(''); // скрываем «Загружаю…»
  } catch (error) {
    console.error('Не удалось загрузить проекты:', error);

    if (error.message === 'rate-limit') {
      setProjectsStatus(
        'GitHub временно ограничил число запросов. Подожди час или открой профиль на GitHub.',
        true
      );
    } else {
      setProjectsStatus('Не удалось загрузить проекты. Открой профиль на GitHub.', true);
    }

    // Ссылка-запасной вариант, чтобы секция не оставалась пустой
    const fallback = document.createElement('a');
    fallback.className = 'projects__fallback';
    fallback.href = `https://github.com/${GITHUB_USERNAME}?tab=repositories`;
    fallback.target = '_blank';
    fallback.rel = 'noopener noreferrer';
    fallback.textContent = 'Открыть профиль на GitHub →';

    projectsStatus.appendChild(document.createElement('br'));
    projectsStatus.appendChild(fallback);
  } finally {
    projectsList.setAttribute('aria-busy', 'false');
  }
}

loadProjects();
