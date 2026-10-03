# Передача работы: что сделано и что делать дальше

Файл для продолжения в новой сессии, в том числе с другого аккаунта. Новому ассистенту достаточно сказать:
**«Прочитай docs/HANDOFF.md и продолжай с раздела „Что делать дальше“»**.

- Ветка: `claude/jolly-einstein-u25rz2` (все изменения закоммичены и отправлены).
- Состояние на 2026-10-03: `npm run check` даёт 0 ошибок; `npm run build` собирает **4764 страницы**; `npm run check:site` не находит проблем (битых ссылок 0 из 470 тыс., ошибок в 6267 блоках JSON-LD тоже 0).

## Что сделано в этой сессии

**Контент**
- **Направления:** 121 → **242**. Добавлены весь бэклог из раздела P, направления для новых регионов и горнолыжные курорты. Данные в `src/data/destinations.json`.
  - Климат собран для всех.
  - Фото есть у всех, кроме `boracay`.
- **Страны и регионы (hubs):** 22 → **60**. Поле `hub` теперь может быть списком: первый элемент — «домашний» регион для хлебных крошек.
  - В `src/data/hubs.json` появились поля `label` (например, «the Caribbean» для текста внутри предложения) и `photo` (фото для обложки).
- **Сравнения:** 110 → **382**. Пары найдены через подсказки Google скриптом `scripts/find-comparisons.mjs`; спортивные пары («Brazil vs Germany» и подобные) отсеяны вручную.
- **Новые подборки по месяцам** (`src/lib/collections.ts`):
  - South America — `/best-places-to-visit-in-south-america-in-{month}/`;
  - Africa;
  - **Where to ski in {month}** — ранжирование по горнолыжному сезону (поле `ski` у 16 направлений).
- **Новые страницы:**
  - `/christmas-destinations/`;
  - **31 новый гид** в `src/pages/guides/` (реестр — `src/lib/guides.ts`), всего гидов 37.
- **Данные о море и световом дне:**
  - температура моря — `src/data/sea.json`, 140 прибрежных направлений, Open-Meteo;
  - световой день рассчитывается по широте (`monthDaylight` в `src/lib/data.ts`).
- **Практическая информация** по 35 новым странам — `src/data/countries.json`.

**Функции**
- Тема (светлая и тёмная).
- Избранное и недавно просмотренные (localStorage): `/saved/`, кнопка ♥ на карточках.
- Кнопки «поделиться» и печать.
- `/trip-finder/`, `/map/`, `/compare/custom/`.
- Виджет для блогеров `/embed/{slug}/`: в `public/_headers` для него разрешён iframe.
- API для инструментов — `/api/destinations.json`.
- Офлайн-кэш — `public/sw.js`.

**SEO и автоматизация**
- `/sitemap-images.xml` (указан в robots.txt).
- IndexNow: ключ `public/afca11d0af21b801768bb56fd7fc859a.txt` и скрипт `scripts/indexnow.mjs`.
- `scripts/check-site.mjs` проверяет ссылки, JSON-LD, h1, title и description.
- Workflows `.github/workflows/`:
  - `ci.yml`;
  - `monthly-rebuild.yml`;
  - `uptime.yml`.

**Прочее**
- Маркетинг (`marketing/`): контент-календарь, питчи для журналистов, шаблоны писем, генератор пинов `scripts/make-pins.mjs`.
- Страница `/advertise/` с политикой спонсорского контента.
- Генератор плана `scripts/build-plan.mjs` переписан: статусы считаются по реальным файлам, а лимит в 1000 задач снят.
- `README.md` и `docs/AUDIT.md` обновлены.

## Что делать дальше (по порядку)

### 1. Заменить слабые фото (было в процессе)

Контактный лист новых фото показал, что у следующих направлений картинка — спутниковый снимок, коллаж или случайное здание:

| slug | Проблема | Где искать замену (статьи Википедии) |
|---|---|---|
| `boracay` | фото нет вовсе | Boracay, White Beach (Boracay) |
| `outer-banks` | спутниковый снимок | Cape Hatteras Lighthouse, Outer Banks |
| `cozumel` | спутниковый снимок | Cozumel |
| `uyuni` | улица города | файл `Salar_de_Uyuni-5_(53641294827).jpg` (CC BY 2.0) из статьи Salar de Uyuni |
| `namibia` | спутниковый снимок | Deadvlei, Sossusvlei |
| `ladakh` | спутниковый снимок | Pangong Tso, Leh |
| `cebu` | горы с воздуха | Chocolate Hills |
| `siargao` | спутниковый снимок | Siargao, Cloud 9 |
| `jeju` | спутниковый снимок | Hallasan, Seongsan Ilchulbong |
| `siem-reap` | случайное здание | Angkor Wat |
| `cook-islands` | спутниковый снимок | Aitutaki, Rarotonga |
| `rotorua` | невыразительная улица | Pōhutu Geyser, Whakarewarewa |
| `innsbruck` | фасад дома | Innsbruck |
| `lapland` | коллаж | Rovaniemi, Levi |
| `uruguay` *(желательно)* | здание парламента | файл `Colonia-Calle_San_Pedro-TM.jpg` (CC BY-SA 3.0) |
| `barbados` *(желательно)* | вид города сверху | Bathsheba, Barbados |
| `torres-del-paine` *(желательно)* | склейка двух фото | Torres del Paine National Park |

Остальное:
- У `jamaica` автор указан как «Unknown author» — нужно другое фото или ручная правка автора в `src/data/images.json`.

Как заменить фото:
1. Найдите подходящий файл: в черновике сессии был помощник, который перечисляет фото статьи с лицензиями. Его логика: скачать HTML статьи `https://en.wikipedia.org/wiki/<Title>`, найти файлы `(upload|thumb).wikimedia.org/wikipedia/commons/.../<File>.jpg`, затем для каждого файла открыть `commons.wikimedia.org/w/index.php?title=File:<File>&action=raw` и проверить шаблон лицензии.
2. Пропишите в `destinations.json` для нужного slug `"imageFile": "<имя файла на Commons>"` (точный файл) или `"imagePage": ["Статья 1", "Статья 2"]` (кандидаты по порядку).
3. Выполните `NODE_USE_ENV_PROXY=1 node scripts/fetch-images.mjs <slug> <slug> …`.
4. Проверьте результат глазами: файл `src/assets/destinations/<slug>.jpg` и автора в `src/data/images.json`.

### 2. Повторный прогон аудита

После исправлений из `docs/AUDIT.md` нужно снова прогнать Lighthouse и axe на тех же 12 шаблонах, а также на `/map/` и `/trip-finder/`. Результаты допишите в `docs/AUDIT.md`. Затем `npm run plan`: пункты раздела H пересчитаются по этому файлу.

### 3. Проверить отправку workflows

Если `git push` отклонил файлы из `.github/workflows/` (у токена нет права `workflow`), их нужно добавить вручную через веб-интерфейс GitHub. Содержимое лежит в репозитории.

### 4. Что ещё можно сделать без владельца (раздел ⏳ в `docs/CONTENT_PLAN.md`)

- **Новые гиды** из списка в разделе F: Best time to visit Europe, Thailand islands Andaman vs Gulf, Costa Rica green season и др.
- **Новые подборки:** Middle East, Central America, Oceania по месяцам.
- **Новые регионы:** Mediterranean, Canary Islands (нужно второе направление), Eastern Europe.
- **Следующие направления** из бэклога P (Andaman Islands, Samoa, Hoi An и т. д.). Порядок: запись в `destinations.json` → `npm run climate <slug>` → `npm run images <slug>` → `npm run sea <slug>`.
- **Инструменты:** индикаторы сезонности по толпам и ценам, генератор списка вещей.
- **Локализация** (раздел N): самый большой оставшийся блок.

## Что может сделать только владелец сайта (🟡)

1. Опубликовать сайт на Cloudflare Pages и привязать домен, затем указать адрес в `src/config.ts`.
2. Указать контактный e-mail в `src/config.ts`.
3. Подключить Google Search Console и Bing Webmaster Tools, отправить `sitemap-index.xml` и `sitemap-images.xml`.
4. Вставить ссылки Travelpayouts в `src/data/affiliates.json`: авиа, отели, туры, страховка, eSIM и ссылки на отели по городам.
5. Добавить секреты GitHub `CF_DEPLOY_HOOK` и `SITE_URL`. Без них не заработают ежемесячная пересборка, IndexNow и мониторинг.
6. Включить Cloudflare Web Analytics.
7. Завести Pinterest, выполнить `npm run build && npm run pins` и загружать пины по `marketing/social-calendar.md`.

## Технические заметки (важно)

- **Ограничение частоты запросов Википедии (HTTP 429)**:
  - API (`/w/api.php`) и REST (`/api/rest_v1`) отвечают 429 при частых запросах;
  - скрипты переведены на кэшируемые страницы: климат берётся из `index.php?action=raw`, главное фото — из `og:image` HTML-страницы статьи; так 429 почти не возникает;
  - превью на `upload.wikimedia.org` иногда тоже отвечают 429, скрипт повторяет запрос с паузой.
- **Не используйте `pkill -f fetch-…`**: шаблон совпадает с командой вашей же оболочки, и та завершается (код 144). Ищите PID через `ps aux | grep` и завершайте `kill <PID>`.
- **Node 22:** для сетевых скриптов нужен `NODE_USE_ENV_PROXY=1`, так как в окружении работает прокси.
- **Стили динамических элементов** (созданных в браузере скриптом) пишите через `<style is:global>` или `:global(...)`: скоупинг Astro на них не действует.
- **Перевод единиц** (`src/layouts/Base.astro`) понимает «21°C», диапазоны «24–30°C», «-5 to -20°C» и типографский минус «−».
- **Проверки:**
  - `npm run check` и `npm run build`;
  - `npm run check:site` (после сборки);
  - для скриншотов и аудита годится Chromium в `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- **План** — `npm run plan`. Сейчас в нём около 2000 задач, из них около 1770 выполнены.
