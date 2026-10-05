# Передача работы: что сделано и что делать дальше

Файл для продолжения в новой сессии, в том числе с другого аккаунта. Новому ассистенту достаточно сказать:
**«Прочитай docs/HANDOFF.md и продолжай с раздела „Что делать дальше“»**.

- Ветка: `claude/jolly-einstein-u25rz2` (все изменения закоммичены и отправлены).
- Состояние на 2026-10-05: `npm run check` даёт 0 ошибок; `npm run build` собирает **6661 страницу**; `npm run check:site` не находит проблем (битых ссылок 0 из 688 тыс., ошибок в 8726 блоках JSON-LD тоже 0, склеенных слов тоже нет).
- План (`npm run plan`): 2686 задач, выполнено 2517, ждут владельца 70, запланировано 99.

## Пожелания владельца (соблюдать)

- **Маркетингом не заниматься** (папка `marketing/` остаётся как есть, новых материалов не делать).
- **Без подписей под фото.** Авторы и лицензии — только на `/photo-credits/` (ссылка в футере каждой страницы). Совсем убирать авторство нельзя: этого требуют лицензии CC BY и CC BY-SA.

## Что сделано в последних сессиях

**Сессия 2026-10-05, продолжение (round 4)**
- **Направления 312 → 342** — очередь «round 4». Семь пунктов заменены, потому что дублировали существующие направления или упирались в предупреждения МИДов: La Digue → Réunion (Сейшелы уже есть), Taormina → Bologna & Emilia-Romagna (есть Sicily), Sacred Valley → Arequipa & Colca Canyon (есть Cusco), Uco Valley → Salta & Jujuy (есть Mendoza), Alleppey → Darjeeling (есть Kerala), Bagan → Ninh Binh (Мьянма), Lijiang → Guilin & Yangshuo (есть Yunnan). Остальные: Mozambique, Tunisia, Bavarian Alps, Vilnius, Sarajevo, Lake District, Belfast & the Causeway Coast, Hamburg, Lake Balaton, Budva, Outer Hebrides, Mérida, Guadeloupe, Martinique, Dominica, Tobago, Paraty & Ilha Grande, Fernando de Noronha, Paracas, Charlevoix, Côn Đảo, Hampi, Hakuba. Девять автоматических фото заменены после просмотра; лыжные сезоны у Bavarian Alps, Hakuba, Charlevoix; осенние краски у Hakuba и Charlevoix.
- **Регионы 74 → 80:** Adriatic, American Southwest, French Caribbean, Hungary, Sri Lanka & the Maldives, Yucatán Peninsula.
- **Сравнения 483 → 520.**
- **Гиды 59 → 69:** South America country by country, Mexico and India region by region, Australia north vs south, Nile cruise, turtle nesting seasons, cool summer escapes in Europe, hot springs and onsen, Torres del Paine vs El Chaltén, Northern Lights in Norway, Finland and Iceland. В плане — 10 новых идей гидов.
- **Исправлен климат Тромсё:** в статьях про город таблицы нет, скрипт уходил на «Climate of Norway» и брал первую таблицу — Осло (июль +23°C вместо +16°C). Новое поле `climateLocation` выбирает таблицу по названию станции; регулярка теперь пропускает комментарий после `{{Weather box`. Остальные запасные источники климата проверены — верные.
- `scripts/fetch-images.mjs` убирает префикс «User:» из имени автора.

**Сессия 2026-10-05**
- **Направления 282 → 312** — вся очередь «round 3»: Málaga, Naples, Lake Garda, Loire Valley, Bordeaux, Riga, Hallstatt, Montreal, Toronto, Asheville, Santa Fe, Scottsdale, Palm Springs, Jasper, Havana, Antigua, Grenada, Bonaire, British Virgin Islands, Santa Marta, Ushuaia, Florianópolis, Nha Trang, Sapa, Chiang Rai, Koh Lanta, Agra, Varanasi, Vanuatu, New Caledonia. Фото проверены глазами; лыжные сезоны у Santa Fe, Jasper, Ushuaia; осенние краски у Montreal и Asheville.
- **Регионы 68 → 74:** Arizona, Baltic States, ABC Islands, Alaska, Lowcountry, Southern Africa.
- **Сравнения 432 → 483.**
- **Гиды 49 → 59:** Southeast Asia country by country, Japan by season, Mediterranean sea temperatures, Lunar New Year 2027, Oktoberfest & autumn festivals, cheapest Caribbean islands, Africa rainy seasons, high-altitude destinations, best beaches in Europe by month, US national parks park by park. В плане — 10 новых идей гидов.
- `scripts/fetch-climate.mjs` умеет брать таблицу климата из другой языковой Википедии: `"climateWiki": ["vi:Sa Pa (thị xã)"]` (так получены Sapa и Nha Trang); таблица климата на сайте ссылается на эту версию и называет язык.
- Сезоны: летний «каникулярный» прирост больше не включается там, где погода плохая (Финикс, Палм-Спрингс, муссоны), кроме семейных мест вроде Орландо.
- **Исправлена системная ошибка вёрстки:** Astro выбрасывает перенос строки между текстом и следующим за ним тегом или выражением, поэтому в 47 местах слова склеивались («See<a…>», «every one of our312 destinations»). Теперь такие строки заканчиваются `{' '}`, а `npm run check:site` ловит новые случаи.

**Сессия 2026-10-03** (кратко)
- Заменены 18 слабых фото, подписи под фото убраны; повторный аудит Lighthouse/axe (`docs/AUDIT.md`, `npm run audit`).
- Подборки: Middle East, Central America, Oceania, Romantic getaways, National parks, Fall foliage (поле `foliage`, `hasPage(c, m)`).
- Направления 242 → 282, регионы 60 → 68, гиды 37 → 49.
- Инструменты: сезоны (`src/lib/seasonality.ts`, `/about/#seasons`), генератор списка вещей `/packing-list-generator/`, подсказки к оценке погоды.
- Исправлены: перевод разниц температур в °F, переключатель единиц, сравнения при равной температуре.

## Что делать дальше (по порядку)

1. **Направления «round 5»** (раздел P плана, 30 шт.: Valencia, San Sebastián, Corsica, Zakynthos, Kefalonia, Zadar & Plitvice, Gdańsk, Isle of Skye, Orkney, Zermatt, Merano & South Tyrol, Lake Atitlán, Colombia's Coffee Region, Cape Cod, Nova Scotia, San Juan Islands, Puerto Escondido, Uganda, Garden Route, Chefchaouen, Merzouga, Takayama & Shirakawa-go, Ha Giang, Da Lat, Perhentian Islands, Khao Lak, Mongolia, Byron Bay, Ningaloo, Tonga). Сначала проверить, не дублирует ли пункт существующее направление и нет ли предупреждений МИДов. Порядок:
   - запись в `src/data/destinations.json` (формат как у соседей; `hub` — строка или список, первый элемент — «домашний» регион);
   - `npm run climate <slug>`; если таблицы нет — `climateWiki` со списком статей, в том числе из других Википедий (`"fr:…"`, `"vi:…"`); если на странице несколько таблиц — `climateLocation`; если в тексте используется климат соседнего города, оговорите это в `intro`. **Проверяйте станцию** в выводе скрипта;
   - `npm run images <slug>` и **обязательно посмотреть фото глазами** (см. «Как подбирать фото»);
   - `npm run sea <slug>`; новые страны — в `src/data/countries.json`;
   - `node scripts/find-comparisons.mjs <slug> …` → отобрать осмысленные пары в `src/data/comparisons.json` (выбрасывать футбольные «Страна vs Страна» и путаницу вроде Granada/Grenada).
2. **Новые регионы** (раздел C): northern Vietnam (уже есть Hanoi, Sapa, Ninh Binh, Ha Long Bay — нужен только `hub` и текст), the Scottish islands (Outer Hebrides + Skye + Orkney), the Japanese Alps (Hakuba + Takayama), the Dolomites & South Tyrol (+ Merano), the Ionian islands (Corfu + Zakynthos + Kefalonia), the Pacific coast of Central America. Каждому нужно 2+ направления и текст в `src/data/hubs.json`.
3. **Новые гиды** — 10 идей в разделе F плана (Greece islands vs mainland, Italy / Spain / Canada / China region by region, Vietnam north–centre–south, Indian Ocean islands, Caribbean sea temperatures, the Great Migration, bioluminescent bays). Гид = файл в `src/pages/guides/` + запись в `src/lib/guides.ts` (рубрика `kicker` — только из списка в `src/pages/guides/index.astro`; в заголовках — типографские апострофы ’; заголовок должен совпадать с идеей в плане, иначе она останется ⏳). Без записи в `guides.ts` сборка падает с «Cannot read properties of undefined (reading 'title')».
4. **Фотогалереи по месяцам** (раздел G) — единственный оставшийся инструмент; нужны дополнительные свободные фото на направление.
5. **Локализация** (раздел N) — самый большой оставшийся блок: es, de, fr, pt, it; затем hreflang (I).
6. Слабые места данных:
   - климат соседнего города: `hoi-an` — Da Nang, `koh-phangan` — Ko Samui, `isla-mujeres` — Cancún, `roatan` — La Ceiba, `british-virgin-islands` — St Thomas, `scottsdale` — Phoenix, `tunisia` — Sousse, `paraty` — Angra dos Reis, `ninh-binh` — Nam Định, `hampi` — Ballari (оговорено в тексте там, где разница заметна);
   - `serengeti` и `kilimanjaro` — оба Arusha, `lofoten` — Bodø; `rwanda` — Ruhengeri (Musanze), `madagascar` — Antananarivo (оговорено в тексте).

## Что может сделать только владелец сайта (🟡)

1. Опубликовать сайт на Cloudflare Pages и привязать домен, затем указать адрес в `src/config.ts`.
2. Указать контактный e-mail в `src/config.ts`.
3. Подключить Google Search Console и Bing Webmaster Tools, отправить `sitemap-index.xml` и `sitemap-images.xml`.
4. Вставить ссылки Travelpayouts в `src/data/affiliates.json`: авиа, отели, туры, страховка, eSIM и ссылки на отели по городам.
5. Добавить секреты GitHub `CF_DEPLOY_HOOK` и `SITE_URL`. Без них не заработают ежемесячная пересборка, IndexNow и мониторинг.
6. Включить Cloudflare Web Analytics.
7. Ручная проверка со скринридером (VoiceOver, TalkBack) — нужен живой человек.

## Технические заметки (важно)

- **Как подбирать фото.** Автоматическое главное фото статьи часто неудачно (спутник, карта, коллаж). Рабочий способ:
  - превью целой категории без отдельных запросов к файлам: HTML страницы `https://commons.wikimedia.org/wiki/Category:<Name>` (или статьи Википедии) содержит теги `<img src="https://thumb.wikimedia.org/...">` с `data-file-width`/`data-file-height`; скачать превью, собрать контактный лист `montage -label '%t' *.jpg -tile 5x -geometry 260x180+4+4 sheet.png` и посмотреть;
  - брать оригиналы шириной от 1280 px (главное фото — до 1280, og:image — 1200), горизонтальные;
  - прописать `"imageFile": "<имя файла>"` и запустить `npm run images <slug>`; скрипт сам проверит лицензию (только CC BY, CC BY-SA, CC0, PD) и запишет автора;
  - после загрузки проверить, что у автора не «Unknown author».
- **Ограничение частоты запросов Википедии (HTTP 429)**: превью `upload.wikimedia.org` и API часто отвечают 429 — скрипты повторяют запрос с паузой, это нормально, просто медленно (40 фото ≈ 10–15 минут; запускайте в фоне).
- **Не используйте `pkill -f …`** (например, `pkill -f "astro preview"`): шаблон совпадает с командой вашей же оболочки, и та завершается (код 144). Ищите PID через `ps aux | grep` и завершайте `kill <PID>`.
- **Node 22:** для сетевых скриптов нужен `NODE_USE_ENV_PROXY=1`, так как в окружении работает прокси.
- **Стили динамических элементов** (созданных в браузере скриптом) пишите через `<style is:global>` или `:global(...)`: скоупинг Astro на них не действует.
- **Перевод единиц** (`src/layouts/Base.astro`) понимает «21°C», диапазоны «24–30°C», «-5 to -20°C», типографский минус «−» и разницы «3°C warmer/cooler». Элементы, которые переводить нельзя, помечайте `data-no-units`. Для текста, созданного скриптом, вызывайте `window.__convertUnits(el)`.
- **Климат с общих страниц** («Climate of Norway» и т. п.): скрипт берёт первую полную таблицу на странице, поэтому для таких источников обязательно задавайте `climateLocation` и сверяйте станцию в выводе.
- **Подборки:** при выводе ссылок на подборки по месяцам фильтруйте через `hasPage(c, m)` — у осенних красок страниц не 12.
- **Пробелы в шаблонах Astro:** если строка текста заканчивается словом, а следующая начинается с тега (`<a>`, `<strong>`, `<b>`) или выражения `{…}`, Astro склеит их без пробела. Заканчивайте такую строку `{' '}` (или держите тег на той же строке). `npm run check:site` сообщает о таких местах.
- **Таблицы без ссылок** в `.table-wrap`, которые прокручиваются на телефоне, должны иметь `tabindex="0" role="region" aria-label="…"` — иначе axe выдаёт `scrollable-region-focusable`.
- **Проверки:**
  - `npm run check` и `npm run build`;
  - `npm run check:site` (после сборки);
  - `npm run audit` (Lighthouse + axe; см. `docs/AUDIT.md`), Chromium — `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- **План** — `npm run plan`; статусы считаются по файлам и данным, поэтому выполненные пункты нужно переводить из статичных списков ⏳ в проверки (как сделано для подборок, регионов, гидов и инструментов в `scripts/build-plan.mjs`).
