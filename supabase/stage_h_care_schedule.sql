-- Stage H: Care Schedule Expansion
-- Adds fertilizing and repotting schedule tracking to user_plants.
-- interval = null means disabled (no schedule).
-- Simple exact intervals only (no range like watering).

ALTER TABLE user_plants
  ADD COLUMN IF NOT EXISTS fertilizing_interval_days integer,
  ADD COLUMN IF NOT EXISTS last_fertilized_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_fertilizing_at timestamptz,
  ADD COLUMN IF NOT EXISTS repotting_interval_days integer,
  ADD COLUMN IF NOT EXISTS last_repotted_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_repotting_at timestamptz;

-- Validate intervals: 1–730 days
ALTER TABLE user_plants
  ADD CONSTRAINT chk_fertilizing_interval
    CHECK (fertilizing_interval_days IS NULL OR (fertilizing_interval_days >= 1 AND fertilizing_interval_days <= 730)),
  ADD CONSTRAINT chk_repotting_interval
    CHECK (repotting_interval_days IS NULL OR (repotting_interval_days >= 1 AND repotting_interval_days <= 730));
