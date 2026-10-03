# SeasonScout — куда поехать в любой месяц

Англоязычный сайт для зарубежной аудитории, в первую очередь из США и Великобритании. Для каждого из 121 направления есть оценка погоды по месяцам, климатические графики, бюджет на день, районы для проживания, практическая информация и партнёрские ссылки Travelpayouts.

Сайт статический (Astro), около **1700 страниц**. Ни база данных, ни сервер не нужны. Размещается бесплатно на Cloudflare Pages.

📋 **План развития на 1000 задач:** [`docs/CONTENT_PLAN.md`](docs/CONTENT_PLAN.md). Статусы в нём считаются по реальным данным сайта. Обновить план: `npm run plan`.

## Что строим в первую очередь

Порядок определён по спросу в поиске. Источник — подсказки Google по запросам из США и Великобритании.

| Тип страницы | Пример URL | Под какой запрос |
|---|---|---|
| Подборки по месяцам (7 видов × 12 месяцев) | `/warm-places-to-visit-in-december/` | «warm places to visit in December», «cheap places to travel in March», «beach vacations in July», «warmest places in Europe in November», «best places to travel in the US in October» |
| Куда поехать в месяце | `/where-to-go-in-october/` | «best places to travel in October» |
| Страна или регион (22 шт.) | `/best-time-to-visit-thailand/` | «best time to visit Thailand / Japan / Hawaii / Greece…» |
| Страна в месяце (22 × 12) | `/thailand-in-december/` | «Thailand in December», «Japan in November» |
| Направление (121 шт.) | `/destinations/iceland/` | «best time to visit Iceland» |
| Направление в месяце (121 × 12) | `/destinations/iceland/october/` | «Iceland in October», «Cancun weather in January» |
| Сравнения (110 шт., только пары со спросом) | `/compare/maui-vs-oahu/` | «Maui vs Oahu», «Lisbon vs Porto», «Thailand vs Vietnam» |
| Гиды (7 шт.) | `/guides/hurricane-season/` | «hurricane season Caribbean», «cherry blossom season», «northern lights» |
| Календарь, поиск, списки | `/calendar/`, `/countries/`, `/compare/` | Навигация |
| Страницы доверия | `/about-us/`, `/editorial-policy/`, `/contact/`, `/terms/` | Требования Google и партнёрских программ |

## Мобильная версия и удобство

- Меню-гамбургер, поиск на весь экран и закреплённая кнопка бронирования внизу экрана на страницах направлений.
- Фильтры на телефоне сворачиваются под кнопку «Filter & sort».
- Зоны нажатия от 44 px. Широкие таблицы прокручиваются вбок, а первая колонка остаётся на месте.
- Переключатель **°C/°F** (миллиметры/дюймы). Посетителям из США °F включается автоматически.
- Светлая и тёмная темы. Шкала оценок безопасна для дальтоников и всегда подписана текстом.

## Партнёрские ссылки (главное для заработка)

Все ссылки хранятся в одном файле: **`src/data/affiliates.json`**.

1. В Travelpayouts подключитесь к программам: авиабилеты, отели, экскурсии, страховка, eSIM.
2. Создайте ссылку для каждой программы и вставьте её в `url`. Кнопки появятся на всех страницах. Пока `url` пустой, кнопка скрыта.
3. Ссылка на конкретный город, например поиск отелей в Бангкоке, задаётся в `overrides`:

```json
"overrides": { "bangkok": { "hotels": "https://..." } }
```

Уже подключён GetTransfer (трансферы). Все ссылки получают `rel="sponsored nofollow"`.

## Публикация на Cloudflare Pages (бесплатно)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git** → репозиторий `newlife`.
2. Framework preset: **Astro**, Build command: `npm run build`, Output: `dist`.
3. После публикации укажите итоговый адрес в `url` в **`src/config.ts`**.
4. Добавьте сайт в [Google Search Console](https://search.google.com/search-console) и [Bing Webmaster Tools](https://www.bing.com/webmasters) и отправьте `https://ваш-домен/sitemap-index.xml`.
5. Укажите контактный e-mail в `email` в `src/config.ts`. Он появится на странице `/contact/`.

## Команды

```bash
npm install
npm run dev       # локально: http://localhost:4321
npm run build     # сборка в dist/
npm run check     # проверка типов
npm run climate   # обновить климат (src/data/climate.json)
npm run images    # загрузить фото и авторов (src/data/images.json)
npm run plan      # пересчитать docs/CONTENT_PLAN.md
```

## Откуда данные

- **Климат:** нормы национальных метеослужб, обычно за 1991–2020 годы, из таблиц «Climate data» в Википедии. Если в таблице нет осадков, они берутся из NASA POWER. Источник и метеостанция указаны на каждой странице.
- **Оценка погоды** (`src/lib/score.ts`): 55% температура и 45% осадки, с поправками на ураганы, муссоны, сезон дыма и закрытие отелей на зиму. Формула описана на `/about/`.
- **Фото:** Wikimedia Commons, только свободные лицензии. Авторы указаны на страницах и на `/photo-credits/`.
- **Тексты:** `src/data/destinations.json` (направления), `src/data/hubs.json` (страны и регионы), `src/data/countries.json` (язык, розетки, чаевые).
- **Сравнения:** `src/data/comparisons.json`. Только пары, которые реально ищут.

## Как добавить направление

1. Добавьте запись в `src/data/destinations.json`. Формат можно скопировать у любого существующего направления.
2. `npm run climate <slug>` и `npm run images <slug>`.
3. `npm run build`. Появятся страница направления, 12 страниц по месяцам, а также оно войдёт в подборки, страны и календарь.

## Структура

```
src/
  config.ts              название, адрес, e-mail
  data/                  все данные (направления, климат, фото, страны, сравнения, партнёрские ссылки)
  lib/                   оценка погоды, данные, подборки, сравнения, SEO
  components/            карточки, графики, фильтры, календарь, поиск, блоки бронирования
  layouts/               базовый шаблон и шаблон гидов
  pages/                 все типы страниц
scripts/                 сбор климата, фото, генерация иконок и плана
docs/CONTENT_PLAN.md     план на 1000 задач
```
