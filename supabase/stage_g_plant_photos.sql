-- Stage G: Plant Photo Upload
-- Creates public storage bucket for user plant photos
--
-- photo_url column already exists in user_plants (from initial schema)
-- No table changes needed.
--
-- Bucket is public: photos are accessible by URL.
-- Only the backend (service role key) can upload/delete.
-- Path isolation: {user_id}/{user_plant_id}/photo

INSERT INTO storage.buckets (id, name, public)
VALUES ('plant-photos', 'plant-photos', true)
ON CONFLICT (id) DO NOTHING;
