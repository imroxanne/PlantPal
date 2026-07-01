# PlantPal

Персональный помощник по уходу за домашними растениями. Telegram Mini App.

## Стек

- **Frontend:** React 19 + Vite 8
- **Backend:** Vercel Serverless Functions (ESM)
- **Database:** Supabase (PostgreSQL)
- **Telegram:** WebApp SDK + Bot API
- **Хостинг:** Vercel

## Возможности

- Поиск и добавление растений из каталога
- Коллекция растений с плашками статуса полива
- Карточка растения: быстрые действия (полив, подкормка, пересадка, проверка, заметка)
- Гибкий интервал полива (точный или диапазон)
- Расчёт окна следующего полива
- Задачи с группировкой (просрочено, сегодня, завтра, на неделе) и badge
- История ухода (общая и по конкретному растению)
- Очистка истории за выбранный период
- Настройки растения (имя, расположение, заметки, интервал)
- Архивирование и восстановление растений
- Haptic feedback (Telegram WebApp)
- Screen transitions с поддержкой prefers-reduced-motion
- Telegram BackButton интеграция
- Toast-уведомления
- Предупреждение о несохранённых изменениях

## Структура проекта

```
PlantPal/
├── api/                          # Серверные функции (Vercel)
│   ├── _lib/
│   │   ├── auth.js               # HMAC-проверка initData
│   │   ├── supabase.js           # Клиент Supabase
│   │   └── watering.js           # Расчёт интервалов полива
│   ├── home.js                   # GET /api/home
│   ├── health.js                 # GET /api/health
│   ├── plants.js                 # GET /api/plants
│   ├── tasks.js                  # GET /api/tasks
│   ├── care-events.js            # GET/DELETE /api/care-events
│   ├── user-plants.js            # GET/POST /api/user-plants
│   ├── user-plants/[id].js       # GET/PATCH /api/user-plants/:id
│   └── user-plants/[id]/
│       ├── water.js              # POST water
│       ├── events.js             # POST events
│       ├── archive.js            # POST archive
│       └── unarchive.js          # POST unarchive
├── src/
│   ├── main.jsx                  # Точка входа
│   ├── App.jsx                   # Роутинг и навигация
│   ├── index.css                 # Design system, переменные, анимации
│   ├── pages/
│   │   ├── MyPlants.jsx          # Коллекция растений
│   │   ├── SearchPlant.jsx       # Поиск растений
│   │   ├── AddPlantDetails.jsx   # Добавление растения
│   │   ├── PlantDetail.jsx       # Карточка растения
│   │   ├── PlantSettings.jsx     # Настройки растения
│   │   ├── Tasks.jsx             # Задачи по поливу
│   │   ├── History.jsx           # История ухода
│   │   └── ArchivedPlants.jsx    # Архив растений
│   ├── components/
│   │   ├── BottomNav.jsx         # Нижняя навигация
│   │   ├── PlantAvatar.jsx       # Аватар растения (image + fallback)
│   │   ├── Toast.jsx             # Toast-уведомления
│   │   └── ConfirmDialog.jsx     # Диалог подтверждения
│   └── utils/
│       ├── api.js                # HTTP-клиент
│       ├── telegram.js           # Telegram SDK обёртка
│       └── status.js             # Статусы, форматирование дат
├── index.html
├── package.json
├── vite.config.js
└── vercel.json                   # Rewrites для SPA и API
```

## Запуск локально

### 1. Установка

```bash
npm install
```

### 2. Переменные окружения

Создай файл `.env` в корне:

```
TELEGRAM_BOT_TOKEN=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Dev-сервер

```bash
npm run dev
```

В браузере работает dev-режим: API запросы используют заголовок `x-dev-telegram-id` вместо Telegram initData.

## Деплой на Vercel

1. Подключи репозиторий к Vercel
2. Добавь переменные окружения в Settings → Environment Variables
3. Деплой произойдёт автоматически

## Безопасность

- Telegram initData проверяется на сервере через HMAC-SHA256
- Секреты только на бекенде
- Dev-обход работает только при `NODE_ENV !== 'production'`
- Поиск экранирует спецсимволы в ilike-запросах

## Roadmap

- [x] Каталог растений + добавление в коллекцию
- [x] Карточка растения + действия по уходу
- [x] Задачи + история + настройки
- [x] Гибкий интервал полива (точный / диапазон)
- [x] Visual System Alignment
- [x] Advanced UX Polish (haptic, transitions, unsaved warning)
- [x] Bugfix + History Cleanup
- [x] MVP Stabilization (unarchive, plant history, search fix)
- [ ] Настройки пользователя + уведомления через бота
- [ ] AI pipeline
