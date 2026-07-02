-- Add Scindapsus pictus as a separate catalog entry.
-- Safe for repeated execution: skips if latin_name already exists.
-- Does NOT modify Epipremnum aureum (Потос) or any user data.

INSERT INTO plants (
  common_name, latin_name, category, description,
  watering_interval_days, light, humidity, temperature,
  soil, fertilizing, toxicity, image_url, status
)
SELECT
  'Сциндапсус расписной',
  'Scindapsus pictus',
  'Лиственное',
  'Декоративная лиана с бархатистыми листьями и серебристыми пятнами. Хорошо подходит для подвесных кашпо или опоры, любит рассеянный свет и умеренный полив.',
  7,
  'Яркий рассеянный свет или лёгкая полутень',
  'Средняя или высокая',
  '18–27°C',
  'Лёгкий рыхлый грунт с перлитом',
  'Раз в 2 недели весной-летом',
  'Токсично для кошек и собак',
  NULL,
  'published'
WHERE NOT EXISTS (
  SELECT 1 FROM plants WHERE latin_name = 'Scindapsus pictus'
);
