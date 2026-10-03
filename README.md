# SeasonScout — куда поехать в любой месяц

Англоязычный сайт для зарубежной аудитории, в первую очередь из США и Великобритании. Для каждого из **242 направлений** есть:
- оценка погоды по месяцам;
- климатические графики;
- температура моря и световой день;
- бюджет на день;
- районы для проживания;
- практическая информация;
- партнёрские ссылки Travelpayouts.

Сайт статический (Astro), около **4700 страниц**. Ни база данных, ни сервер не нужны. Размещается бесплатно на Cloudflare Pages.

🔁 **Продолжение работы:** [`docs/HANDOFF.md`](docs/HANDOFF.md) — что сделано и что делать дальше.

📋 **План развития:** [`docs/CONTENT_PLAN.md`](docs/CONTENT_PLAN.md). Статусы в нём считаются по реальным данным, страницам и скриптам сайта. Обновить план: `npm run plan`.

## Что есть на сайте

Порядок определён по спросу в поиске. Источник — подсказки Google по запросам из США и Великобритании.

| Тип страницы | Пример URL | Под какой запрос |
|---|---|---|
| Подборки по месяцам (12 видов × 12 месяцев) | `/warm-places-to-visit-in-december/` | «warm places to visit in December», «cheap places to travel in March», «best places to visit in South America in July» |
| Где кататься на лыжах в месяце | `/where-to-ski-in-july/` | «where to ski in July», «skiing in August» |
| Рождество и Новый год | `/christmas-destinations/` | «warm places to go for Christmas», «best places to spend Christmas» |
| Куда поехать в месяце | `/where-to-go-in-october/` | «best places to travel in October» |
| Страна или регион (60 шт.) | `/best-time-to-visit-caribbean/`, `/best-time-to-visit-japan/` | «best time to visit the Caribbean / Japan / Scandinavia / Southeast Asia» |
| Страна в месяце (60 × 12) | `/thailand-in-december/` | «Thailand in December» |
| Направление (242 шт.) | `/destinations/iceland/` | «best time to visit Iceland» |
| Направление в месяце (242 × 12) | `/destinations/iceland/october/` | «Iceland in October» |
| Сравнения (382 шт., только пары со спросом) | `/compare/maui-vs-oahu/` | «Maui vs Oahu», «Tulum vs Cancun» |
| Гиды (37 шт.) | `/guides/ski-season/`, `/guides/christmas-markets-europe/` | сезоны, сафари, киты, муссоны, сакура, северное сияние |
| Инструменты | `/trip-finder/`, `/map/`, `/compare/custom/`, `/saved/` | «where should I travel», карта погоды, сравнение любых двух мест |
| Виджет для блогеров | `/embed/{направление}/` | обратные ссылки (код вставки есть на каждой странице направления) |
| Страницы доверия | `/about-us/`, `/editorial-policy/`, `/advertise/`, `/contact/` | требования Google и партнёрских программ |

## Удобство и мобильная версия

- Меню-гамбургер, поиск на весь экран, закреплённая кнопка бронирования внизу экрана.
- **Избранное** (♥ на карточках) и **недавно просмотренные** хранятся в браузере посетителя, без регистрации.
- Переключатели **°C/°F** (посетителям из США °F включается автоматически) и **светлой и тёмной темы**.
- Кнопки «поделиться» (на телефоне открывается системное меню), версия для печати.
- Офлайн-кэш недавно открытых страниц (service worker).
- Зоны нажатия от 44 px. Широкие таблицы прокручиваются вбок, а первая колонка остаётся на месте.
- Lighthouse: производительность 95–100, доступность 96–100, SEO 92–100 (подробности в [`docs/AUDIT.md`](docs/AUDIT.md)).

## Партнёрские ссылки (главное для заработка)

Все ссылки хранятся в одном файле: **`src/data/affiliates.json`**.

1. В Travelpayouts подключитесь к программам: авиабилеты, отели, экскурсии, страховка, eSIM.
2. Создайте ссылку для каждой программы и вставьте её в `url`. Кнопки появятся на всех страницах, в том числе в гидах про страховку и eSIM. Пока `url` пустой, кнопка скрыта.
3. Ссылка на конкретный город, например поиск отелей в Бангкоке, задаётся в `overrides`:

```json
"overrides": { "bangkok": { "hotels": "https://..." } }
```

Уже подключён GetTransfer (трансферы). Все ссылки получают `rel="sponsored nofollow"`.

## Публикация на Cloudflare Pages (бесплатно)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git** → репозиторий `newlife`.
2. Framework preset: **Astro**, Build command: `npm run build`, Output: `dist`.
3. После публикации укажите итоговый адрес в `url` в **`src/config.ts`**.
4. Добавьте сайт в [Google Search Console](https://search.google.com/search-console) и [Bing Webmaster Tools](https://www.bing.com/webmasters). Отправьте две карты сайта: `https://ваш-домен/sitemap-index.xml` и `https://ваш-домен/sitemap-images.xml`.
5. Укажите контактный e-mail в `email` в `src/config.ts`. Он появится на странице `/contact/`.
6. Включите Cloudflare Web Analytics. Она не использует cookies и показывает Core Web Vitals.

### Автоматизация в GitHub Actions

| Workflow | Что делает | Что нужно |
|---|---|---|
| `ci.yml` | При каждом push собирает сайт, проверяет типы, битые ссылки, разметку schema.org, заголовки и описания | ничего |
| `monthly-rebuild.yml` | 1-го числа каждого месяца пересобирает сайт, чтобы обновились годы в заголовках и сезонные блоки, затем отправляет страницы в IndexNow | секреты `CF_DEPLOY_HOOK` (Cloudflare Pages → Settings → Builds → Deploy hooks) и `SITE_URL` |
| `uptime.yml` | Каждые 6 часов проверяет доступность ключевых страниц. Если сайт лежит, GitHub пришлёт письмо | секрет `SITE_URL` |

Секреты добавляются в GitHub: **Settings → Secrets and variables → Actions**.

## Команды

```bash
npm install
npm run dev          # локально: http://localhost:4321
npm run build        # сборка в dist/
npm run check        # проверка типов
npm run check:site   # после сборки: битые ссылки, schema.org, h1, title, description
npm run climate      # климат (src/data/climate.json), можно указать slug
npm run images       # фото и авторы (src/data/images.json)
npm run sea          # температура моря (src/data/sea.json)
npm run map          # контур суши для карты (src/data/world.json)
npm run comparisons  # поиск пар «X vs Y», которые ищут в Google
npm run pins         # после сборки: пины для Pinterest в marketing/pins/
npm run indexnow     # после публикации: отправить страницы в IndexNow (Bing и др.)
npm run plan         # пересчитать docs/CONTENT_PLAN.md
```

## Откуда данные

- **Климат:** нормы национальных метеослужб, обычно за 1991–2020 годы, из таблиц «Climate data» в Википедии. Если в таблице нет осадков, они берутся из NASA POWER. Источник и метеостанция указаны на каждой странице.
- **Температура моря:** Open-Meteo Marine API, средние за 2023–2025 годы. Есть для 140 прибрежных направлений.
- **Световой день:** рассчитывается по широте с учётом рефракции.
- **Горнолыжные сезоны:** поле `ski` в `src/data/destinations.json`, 16 направлений.
- **Оценка погоды** (`src/lib/score.ts`): 55% температура и 45% осадки, с поправками на ураганы, муссоны, сезон дыма и закрытие отелей на зиму. Формула описана на `/about/`.
- **Фото:** Wikimedia Commons, только свободные лицензии. Авторы указаны на страницах и на `/photo-credits/`.
- **Тексты:**
  - `src/data/destinations.json` — направления;
  - `src/data/hubs.json` — страны и регионы;
  - `src/data/countries.json` — язык, розетки, чаевые.
- **Сравнения:** `src/data/comparisons.json`. Только пары, которые реально ищут.

## Как добавить направление

1. Добавьте запись в `src/data/destinations.json`. Формат можно скопировать у любого существующего направления. Поле `hub` может быть строкой или списком, например `["US National Parks", "California"]`.
2. Выполните `npm run climate <slug>`, `npm run images <slug>` и `npm run sea <slug>`.
3. `npm run build`. Появятся страница направления и 12 страниц по месяцам, а само направление войдёт в подборки, страны, карту и календарь.

## Маркетинг

Папка [`marketing/`](marketing/README.md):
- календарь публикаций на 12 месяцев;
- идеи историй на данных для журналистов;
- шаблоны писем для блогеров, гостевых постов и туристических офисов;
- генератор пинов для Pinterest (3 дизайна на каждую страну или регион).

## Структура

```
src/
  config.ts              название, адрес, e-mail
  data/                  данные: направления, климат, море, фото, страны, регионы, сравнения, партнёрские ссылки, карта
  lib/                   оценка погоды, данные, подборки, сравнения, гиды, SEO
  components/            карточки, графики, фильтры, календарь, поиск, бронирование, «поделиться», избранное
  layouts/               базовый шаблон и шаблон гидов
  pages/                 все типы страниц, инструменты, API для них (api/destinations.json), виджет (embed/)
scripts/                 сбор климата, фото, температуры моря, поиск сравнений, проверка сайта, IndexNow, пины, план
marketing/               материалы для продвижения
docs/                    план развития и отчёт об аудите
.github/workflows/       CI, ежемесячная пересборка, мониторинг
```
