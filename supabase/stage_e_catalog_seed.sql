-- Stage E: Catalog Data Completion
-- Adds 11 popular houseplants to reach 26 total
-- Uses INSERT ... ON CONFLICT DO NOTHING pattern via subquery check
-- (no unique constraint on latin_name, so we guard with WHERE NOT EXISTS)

-- 1. Крассула (Денежное дерево)
INSERT INTO plants (common_name, latin_name, category, description, watering_interval_days, light, humidity, temperature, soil, fertilizing, repotting, toxicity, image_url, status)
SELECT 'Крассула', 'Crassula ovata', 'Суккулент',
  'Неприхотливый суккулент с мясистыми округлыми листьями. Символ финансового благополучия.',
  14, 'Яркий рассеянный свет', 'Низкая, 30–40%', '18–25°C',
  'Для суккулентов с добавлением песка', 'Раз в месяц весной-летом', 'Раз в 2–3 года',
  'Слаботоксично для животных', NULL, 'published'
WHERE NOT EXISTS (SELECT 1 FROM plants WHERE latin_name = 'Crassula ovata');

-- 2. Антуриум
INSERT INTO plants (common_name, latin_name, category, description, watering_interval_days, light, humidity, temperature, soil, fertilizing, repotting, toxicity, image_url, status)
SELECT 'Антуриум', 'Anthurium andraeanum', 'Цветущее',
  'Эффектное растение с глянцевыми красными прицветниками. Цветёт круглый год при правильном уходе.',
  5, 'Яркий рассеянный свет, без прямых лучей', 'Высокая, 70–80%', '20–28°C',
  'Рыхлый, на основе торфа и коры', 'Раз в 2 недели весной-летом', 'Раз в 2 года',
  'Токсично при попадании внутрь', NULL, 'published'
WHERE NOT EXISTS (SELECT 1 FROM plants WHERE latin_name = 'Anthurium andraeanum');

-- 3. Аглаонема
INSERT INTO plants (common_name, latin_name, category, description, watering_interval_days, light, humidity, temperature, soil, fertilizing, repotting, toxicity, image_url, status)
SELECT 'Аглаонема', 'Aglaonema commutatum', 'Декоративно-лиственное',
  'Выносливое растение с пёстрыми листьями. Отлично очищает воздух и переносит тень.',
  7, 'Полутень, рассеянный свет', 'Умеренная, 50–60%', '18–25°C',
  'Лёгкий, торфяной с перлитом', 'Раз в месяц весной-летом', 'Раз в 2–3 года',
  'Токсично для животных и детей', NULL, 'published'
WHERE NOT EXISTS (SELECT 1 FROM plants WHERE latin_name = 'Aglaonema commutatum');

-- 4. Диффенбахия
INSERT INTO plants (common_name, latin_name, category, description, watering_interval_days, light, humidity, temperature, soil, fertilizing, repotting, toxicity, image_url, status)
SELECT 'Диффенбахия', 'Dieffenbachia seguine', 'Декоративно-лиственное',
  'Крупное растение с большими пёстрыми листьями. Быстро растёт и хорошо очищает воздух.',
  5, 'Яркий рассеянный свет', 'Высокая, 60–70%', '20–27°C',
  'Питательный, рыхлый с дренажем', 'Раз в 2 недели весной-летом', 'Ежегодно для молодых',
  'Токсично! Сок вызывает раздражение', NULL, 'published'
WHERE NOT EXISTS (SELECT 1 FROM plants WHERE latin_name = 'Dieffenbachia seguine');

-- 5. Каланхоэ
INSERT INTO plants (common_name, latin_name, category, description, watering_interval_days, light, humidity, temperature, soil, fertilizing, repotting, toxicity, image_url, status)
SELECT 'Каланхоэ', 'Kalanchoe blossfeldiana', 'Суккулент',
  'Компактный цветущий суккулент с яркими соцветиями. Не требует частого полива.',
  10, 'Яркий свет, допустимо немного прямого', 'Низкая, 30–40%', '15–25°C',
  'Для суккулентов с хорошим дренажем', 'Раз в месяц в период роста', 'Раз в 2 года после цветения',
  'Токсично для кошек и собак', NULL, 'published'
WHERE NOT EXISTS (SELECT 1 FROM plants WHERE latin_name = 'Kalanchoe blossfeldiana');

-- 6. Эхеверия
INSERT INTO plants (common_name, latin_name, category, description, watering_interval_days, light, humidity, temperature, soil, fertilizing, repotting, toxicity, image_url, status)
SELECT 'Эхеверия', 'Echeveria elegans', 'Суккулент',
  'Розеточный суккулент с мясистыми листьями. Компактный, идеален для подоконника.',
  14, 'Яркий прямой свет', 'Низкая, 20–30%', '15–27°C',
  'Для суккулентов и кактусов', 'Раз в месяц весной-летом, слабым раствором', 'Раз в 2–3 года',
  'Нетоксично', NULL, 'published'
WHERE NOT EXISTS (SELECT 1 FROM plants WHERE latin_name = 'Echeveria elegans');

-- 7. Орхидея фаленопсис
INSERT INTO plants (common_name, latin_name, category, description, watering_interval_days, light, humidity, temperature, soil, fertilizing, repotting, toxicity, image_url, status)
SELECT 'Орхидея фаленопсис', 'Phalaenopsis amabilis', 'Цветущее',
  'Самая популярная комнатная орхидея. Цветёт месяцами, не требует сложного ухода.',
  7, 'Яркий рассеянный свет, без прямого солнца', 'Высокая, 60–80%', '18–28°C',
  'Кора, мох сфагнум, без обычной земли', 'Раз в 2 недели специальным удобрением', 'Раз в 2 года, после цветения',
  'Нетоксично', NULL, 'published'
WHERE NOT EXISTS (SELECT 1 FROM plants WHERE latin_name = 'Phalaenopsis amabilis');

-- 8. Пилея
INSERT INTO plants (common_name, latin_name, category, description, watering_interval_days, light, humidity, temperature, soil, fertilizing, repotting, toxicity, image_url, status)
SELECT 'Пилея', 'Pilea peperomioides', 'Декоративно-лиственное',
  'Компактное растение с круглыми листьями на тонких черешках. Легко размножается детками.',
  7, 'Яркий рассеянный свет', 'Умеренная, 50–60%', '16–24°C',
  'Лёгкий, хорошо дренированный', 'Раз в месяц весной-летом', 'Ежегодно весной',
  'Нетоксично', NULL, 'published'
WHERE NOT EXISTS (SELECT 1 FROM plants WHERE latin_name = 'Pilea peperomioides');

-- 9. Маранта
INSERT INTO plants (common_name, latin_name, category, description, watering_interval_days, light, humidity, temperature, soil, fertilizing, repotting, toxicity, image_url, status)
SELECT 'Маранта', 'Maranta leuconeura', 'Декоративно-лиственное',
  'Молитвенное растение — складывает листья на ночь. Красивый узор на листьях.',
  5, 'Полутень, рассеянный свет', 'Высокая, 60–70%', '18–25°C',
  'Торфяной, рыхлый, слабокислый', 'Раз в 2 недели весной-летом', 'Ежегодно весной',
  'Нетоксично', NULL, 'published'
WHERE NOT EXISTS (SELECT 1 FROM plants WHERE latin_name = 'Maranta leuconeura');

-- 10. Папоротник нефролепис
INSERT INTO plants (common_name, latin_name, category, description, watering_interval_days, light, humidity, temperature, soil, fertilizing, repotting, toxicity, image_url, status)
SELECT 'Папоротник нефролепис', 'Nephrolepis exaltata', 'Папоротник',
  'Пышный папоротник с изящными перистыми листьями. Отличный очиститель воздуха.',
  4, 'Рассеянный свет, полутень', 'Высокая, 60–80%', '16–24°C',
  'Торфяной, рыхлый, с хорошей аэрацией', 'Раз в 2 недели весной-летом', 'Ежегодно при необходимости',
  'Нетоксично', NULL, 'published'
WHERE NOT EXISTS (SELECT 1 FROM plants WHERE latin_name = 'Nephrolepis exaltata');

-- 11. Бегония
INSERT INTO plants (common_name, latin_name, category, description, watering_interval_days, light, humidity, temperature, soil, fertilizing, repotting, toxicity, image_url, status)
SELECT 'Бегония', 'Begonia rex', 'Декоративно-лиственное',
  'Растение с эффектными узорчатыми листьями разных оттенков. Компактное, подходит для полки.',
  5, 'Яркий рассеянный свет', 'Высокая, 60–70%', '18–24°C',
  'Лёгкий, торфяной с перлитом', 'Раз в 2 недели весной-летом', 'Ежегодно весной',
  'Токсично для животных', NULL, 'published'
WHERE NOT EXISTS (SELECT 1 FROM plants WHERE latin_name = 'Begonia rex');
