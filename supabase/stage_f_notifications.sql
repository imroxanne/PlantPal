-- Stage F: Telegram Watering Reminders
-- Adds notification settings columns to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_time text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Moscow';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_notification_sent_at timestamptz;
