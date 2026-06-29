# PlantPal

Персональный помощник по уходу за домашними растениями. Telegram Mini App.

## Стек

- **Frontend:** React + Vite
- **Backend:** Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL)
- **Telegram:** WebApp SDK + Bot API
- **Хостинг:** Vercel

## Структура проекта

```
PlantPal/
├── api/                     # Серверные функции (Vercel)
│   ├── _lib/                # Общие утилиты бекенда
│   │   ├── auth.js          # HMAC-проверка initData, авторизация
│   │   └── supabase.js      # Клиент Supabase
│   └── home.js              # GET /api/home
├── src/
│   ├── main.jsx             # Точка входа React
│   ├── App.jsx              # Корневой компонент
│   ├── index.css            # Глобальные стили
│   ├── pages/               # Экраны приложения
│   │   ├── MyPlants.jsx     # Главный экран — коллекция
│   │   └── MyPlants.css
│   ├── components/          # Переиспользуемые компоненты
│   └── utils/
│       ├── telegram.js      # Обёртка Telegram SDK
│       └── api.js           # HTTP-клиент
├── public/
│   └── assets/              # Статика (изображения, иконки)
├── index.html               # HTML-шаблон (Telegram SDK подключён)
├── package.json
├── vite.config.js           # Vite конфиг с proxy для dev
└── vercel.json              # Rewrites для SPA и API
```

## Запуск локально

### 1. Установка зависимостей

```bash
npm install
```

### 2. Переменные окружения

Создай файл `.env` в корне проекта:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_TELEGRAM_ID=your_telegram_id_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key_here
```

### 3. Запуск dev-сервера

```bash
npm run dev
```

Приложение откроется на `http://localhost:5173`.

В браузере работает dev-режим: запросы к API автоматически подставляют заголовок `x-dev-telegram-id` вместо Telegram initData.

### 4. Без Supabase

Приложение запускается без Supabase — фронтенд загружается нормально. Запрос к `/api/home` вернёт ошибку, пока Supabase не настроен.

## Деплой на Vercel

1. Подключи репозиторий к Vercel
2. Добавь переменные окружения в Settings → Environment Variables
3. Деплой произойдёт автоматически

## Supabase — схема таблиц

### users

```sql
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id     text UNIQUE NOT NULL,
  display_name    text NOT NULL DEFAULT 'Пользователь',
  role            text NOT NULL DEFAULT 'user',
  notification_time text DEFAULT NULL,
  timezone        text DEFAULT 'Europe/Moscow',
  last_seen_at    timestamptz DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### plants (Этап 1)

```sql
CREATE TABLE plants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  name_latin      text,
  aliases         text[] DEFAULT '{}',
  status          text NOT NULL DEFAULT 'published',
  watering_interval_days integer NOT NULL DEFAULT 7,
  light           text,
  temperature     text,
  humidity        text,
  soil            text,
  fertilizing     text,
  repotting       text,
  toxicity        text,
  diseases        text,
  pests           text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### user_plants (Этап 1)

```sql
CREATE TABLE user_plants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  plant_id        uuid NOT NULL REFERENCES plants(id),
  nickname        text,
  photo_url       text,
  purchase_date   date,
  last_watered    timestamptz,
  last_fertilized timestamptz,
  last_repotted   timestamptz,
  is_archived     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### care_events (Этап 2)

```sql
CREATE TABLE care_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_plant_id   uuid NOT NULL REFERENCES user_plants(id),
  event_type      text NOT NULL,
  note            text,
  photo_url       text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

## Безопасность

- Telegram initData проверяется на сервере через HMAC-SHA256
- Секреты (`TELEGRAM_BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`) только на бекенде
- Админские эндпоинты защищены через `requireAdmin`
- Dev-обход работает только при `NODE_ENV !== 'production'`

## Roadmap

- [x] Этап 0 — Скелет проекта
- [ ] Этап 1 — Каталог растений + добавление в коллекцию
- [ ] Этап 2 — Карточка растения + действия по уходу
- [ ] Этап 3 — Задачи + история
- [ ] Этап 4 — Настройки + уведомления через бота
- [ ] Этап 5 — Progressive Onboarding + точность рекомендаций
- [ ] Этап 6 — Модерация (админ)
- [ ] Этап 7 — AI pipeline
- [ ] Этап 8 — Офлайн-режим
