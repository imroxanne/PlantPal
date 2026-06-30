-- MVP Core: новые колонки user_plants + индексы
-- Запустить в Supabase SQL Editor

-- Новые колонки для user_plants
ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS custom_watering_interval_days integer;

-- Индекс для задач: неархивированные растения с next_watering_at
CREATE INDEX IF NOT EXISTS idx_user_plants_tasks
  ON user_plants(user_id, next_watering_at)
  WHERE is_archived = false AND next_watering_at IS NOT NULL;
