# Передача работы: что сделано и что делать дальше

Файл для продолжения в новой сессии, в том числе с другого аккаунта. Новому ассистенту достаточно сказать:
**«Прочитай docs/HANDOFF.md и продолжай с раздела „Что делать дальше“»**.

- Ветка: `claude/jolly-einstein-u25rz2` (все изменения закоммичены и отправлены).
- Состояние на 2026-10-03: `npm run check` даёт 0 ошибок; `npm run build` собирает **5557 страниц**; `npm run check:site` не находит проблем (битых ссылок 0 из 570 тыс., ошибок в 7358 блоках JSON-LD тоже 0).
- План (`npm run plan`): 2301 задача, выполнено 2133, ждут владельца 70, запланировано 98.

## Пожелания владельца (соблюдать)

- **Маркетингом не заниматься** (папка `marketing/` остаётся как есть, новых материалов не делать).
- **Без подписей под фото.** Авторы и лицензии — только на `/photo-credits/` (ссылка в футере каждой страницы). Совсем убирать авторство нельзя: этого требуют лицензии CC BY и CC BY-SA.

## Что сделано в последней сессии

**Фото**
- Заменены 18 слабых фото (спутниковые снимки, коллажи, случайные здания) — список был в прошлой версии этого файла; у `jamaica` больше нет «Unknown author».
- Подписи под главными фото убраны; на `/photo-credits/` добавлено, что фото уменьшены и обрезаны.
- `scripts/fetch-images.mjs` понимает `cc-by-sa-all` внутри `{{self|…}}`, а если шаблон лицензии не распознан (например, `{{Korea.net}}`), берёт лицензию из метаданных Commons.

**Аудит**
- Повторный прогон Lighthouse и axe на 14 страницах — результаты в `docs/AUDIT.md`: доступность, best practices и SEO — 100 везде, производительность 99–100, axe — 0 нарушений в светлой и тёмной темах.
- Главным фото добавлена ширина 800 px (на телефоне фото в рамке 4:3 требует ~810 px): фото Vienna 162 → 113 КБ.
- Скрипт аудита — `scripts/audit.mjs` (`npm run audit`).

**Подборки по месяцам** (`src/lib/collections.ts`)
- Новые: Middle East, Central America, Oceania, Romantic getaways, Best national parks, **Where to see fall foliage** (новое поле `foliage` у 36 направлений; страницы только для месяцев, где есть хотя бы 3 места).
- Лыжная подборка и осенние краски работают через общий интерфейс `season` в `Collection`; `hasPage(c, m)` решает, есть ли страница у месяца, — используйте его в ссылках.

**Направления: 242 → 282**
- Весь бэклог P (36 направлений) плюс Gran Canaria, Lanzarote, Clearwater и Sarasota. У всех есть климат, проверенное глазами фото, районы, практическая информация; у прибрежных — температура моря.
- `da-nang` теперь просто «Da Nang» (раньше «Da Nang & Hoi An»), у Hoi An своя страница.
- Новые регионы (hubs): Mediterranean, Canary Islands, Eastern Europe, Patagonia, Indian Ocean Islands, Florida Gulf Coast, Texas, Andalusia — всего 68.
- +51 сравнение (всего 432), найдены `scripts/find-comparisons.mjs` и отобраны вручную (футбольные пары вроде «Cape Verde vs Argentina» отброшены).
- В плане появилась очередь направлений «round 3» (30 шт.) и идеи новых регионов.

**Гиды: 37 → 49** — все 12 из раздела F: Europe month by month, Thailand Andaman vs Gulf, Costa Rica green season, cheapest months to fly to Europe, wildflowers, carnival 2027, Easter 2027, stargazing, rainy season in Mexico & Central America, road trips by season, solo travel, Halloween & Día de los Muertos.

**Инструменты**
- **Сезоны** (высокий / межсезонье / низкий) для каждого месяца каждого направления — `src/lib/seasonality.ts`. Это оценка, а не данные бронирований; метод описан на `/about/#seasons`. Показано в вердикте, таблице климата и на страницах месяцев.
- **Генератор списка вещей** `/packing-list-generator/` (данные — `/api/packing.json`). Ссылка есть на каждой странице «направление × месяц», в футере и в гиде по упаковке.
- **Подсказка к оценке погоды** на каждой плашке `RatingBadge` (с сезонной пометкой месяца, если она есть).

**Исправленные ошибки**
- В режиме °F разницы температур («6°C cooler») переводились как абсолютные значения (43°F) — теперь ×9/5.
- Переключатель единиц больше не переводит сам себя («°F/°F»): атрибут `data-no-units`.
- Сравнения не называют одно место «теплее», если температуры после округления совпадают.
- `scripts/fetch-climate.mjs` справляется с лишними фигурными скобками внутри таблицы климата (так не читался Tallinn).

## Что делать дальше (по порядку)

1. **Направления «round 3»** (раздел P плана, 30 шт.: Málaga, Naples, Lake Garda, Loire Valley, Montreal, Asheville, Havana, Nha Trang, Agra и др.). Порядок:
   - запись в `src/data/destinations.json` (формат как у соседей; `hub` — строка или список, первый элемент — «домашний» регион);
   - `npm run climate <slug>` (если таблицы нет — укажите `climateWiki`: список статей с таблицей «Climate data»);
   - `npm run images <slug>` и **обязательно посмотреть фото глазами** (см. «Как подбирать фото»);
   - `npm run sea <slug>`; новые страны — в `src/data/countries.json`;
   - `node scripts/find-comparisons.mjs <slug> …` → отобрать осмысленные пары в `src/data/comparisons.json`.
2. **Новые гиды** — 10 идей в разделе F плана (Southeast Asia country by country, Japan, Mediterranean sea temperatures, Lunar New Year 2027, Oktoberfest, cheapest Caribbean islands, rainy seasons in Africa, high-altitude destinations, best beaches in Europe by month, US national parks park by park). Гид = файл в `src/pages/guides/` + запись в `src/lib/guides.ts` (в заголовках — типографские апострофы ’, иначе генератор плана не разберёт строку).
3. **Новые регионы** из плана (Baltic states, Alaska, Lowcountry, Sri Lanka & the Maldives, Southern Africa): каждому нужно 2+ направления и текст в `src/data/hubs.json`.
4. **Фотогалереи по месяцам** (G 1925) — единственный оставшийся инструмент; потребуются дополнительные свободные фото на направление.
5. **Локализация** (раздел N) — самый большой оставшийся блок: es, de, fr, pt, it; затем hreflang (I).
6. Слабые места данных, которые стоит улучшить, когда найдутся источники:
   - `hoi-an` использует климат Da Nang, `koh-phangan` — Ko Samui, `isla-mujeres` — Cancún, `roatan` — La Ceiba (материк; оговорено в тексте);
   - `rwanda` — Ruhengeri (Musanze), `madagascar` — Antananarivo (оговорено в тексте).

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
- **Подборки:** при выводе ссылок на подборки по месяцам фильтруйте через `hasPage(c, m)` — у осенних красок страниц не 12.
- **Проверки:**
  - `npm run check` и `npm run build`;
  - `npm run check:site` (после сборки);
  - `npm run audit` (Lighthouse + axe; см. `docs/AUDIT.md`), Chromium — `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- **План** — `npm run plan`; статусы считаются по файлам и данным, поэтому выполненные пункты нужно переводить из статичных списков ⏳ в проверки (как сделано для подборок, регионов, гидов и инструментов в `scripts/build-plan.mjs`).
