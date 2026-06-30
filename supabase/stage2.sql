-- Stage 2: События ухода + обновление полива
-- Запустить в Supabase SQL Editor

-- Таблица событий ухода
CREATE TABLE care_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_plant_id  uuid NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           text NOT NULL,
  note           text,
  photo_url      text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_care_events_user ON care_events(user_id, created_at DESC);
CREATE INDEX idx_care_events_plant ON care_events(user_plant_id, created_at DESC);

-- Добавить next_watering_at в user_plants (last_watered уже существует)
ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS next_watering_at timestamptz;
