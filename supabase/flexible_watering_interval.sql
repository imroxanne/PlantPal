-- Stage A.5: Flexible watering interval (range support)
-- Safe for repeated execution: all ADD COLUMN IF NOT EXISTS

-- Range interval columns
ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS custom_watering_interval_min_days integer;
ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS custom_watering_interval_max_days integer;

-- Window end date (window start = next_watering_at)
ALTER TABLE user_plants ADD COLUMN IF NOT EXISTS next_watering_window_end_at timestamptz;
