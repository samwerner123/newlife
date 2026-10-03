# Аудит производительности и доступности

Дата: 2026-10-03. Проверялась локальная сборка (`npm run build && npx astro preview`) с мобильной эмуляцией Lighthouse 12 и axe-core (WCAG 2.1 AA) в светлой и тёмной темах.

## Lighthouse (мобильный профиль), до исправлений

| Страница | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 100 | 100 | 100 | 100 | 1.1 s | 0 | 40 ms |
| `/where-to-go-in-december/` | 95 | 100 | 100 | 100 | 1.4 s | 0 | 240 ms |
| `/warm-places-to-visit-in-january/` | 100 | 98 | 100 | 100 | 1.1 s | 0 | 10 ms |
| `/best-time-to-visit-thailand/` | 100 | 96 | 100 | 92 | 1.8 s | 0 | 0 ms |
| `/thailand-in-december/` | 100 | 96 | 100 | 92 | 1.4 s | 0 | 0 ms |
| `/destinations/vienna/` | 99 | 97 | 100 | 92 | 2.0 s | 0 | 0 ms |
| `/destinations/bali/january/` | 100 | 96 | 100 | 92 | 1.8 s | 0 | 0 ms |
| `/compare/maui-vs-oahu/` | 100 | 96 | 100 | 92 | 1.4 s | 0.015 | 0 ms |
| `/calendar/` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 80 ms |
| `/destinations/` | 96 | 98 | 100 | 100 | 1.5 s | 0.013 | 210 ms |
| `/countries/` | 100 | 100 | 100 | 100 | 1.1 s | 0 | 0 ms |
| `/guides/whale-watching/` | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms |

## Найдено и исправлено

- **SEO 92, «link-text»:** ссылка «Learn more» в блоке бронирования заменена на «How affiliate links work».
- **Accessibility, «link-in-text-block»:** у этой ссылки появилось подчёркивание, без него она сливалась с текстом.
- **«heading-order»:** на подборках и в списке направлений добавлены скрытые заголовки h2 перед карточками с h3.
- **«lcp-lazy-loaded»:** первая карточка на главной, в подборках и в списке направлений теперь грузится сразу (`eager` и `fetchpriority=high`).
- **«uses-responsive-images»:**
  - у главных фото появились ширины 480 и 720;
  - у карточек — 240;
  - для сеток в два столбца указан правильный `sizes`.
- **HTML weight / TBT на страницах с 240+ карточками:** у карточек `content-visibility: auto`, браузер не отрисовывает то, что далеко ниже экрана.
- **axe, `/map/`:** у точек на карте появились доступные имена (aria-label), подсказки работают с клавиатуры, у SVG роль `group` вместо `img`.
- **axe, `/compare/*`:** у прокручиваемой таблицы появились `tabindex="0"`, `role="region"` и подпись.

Остальные отмеченные пункты носят информационный характер (`render-blocking-resources` — один небольшой CSS-файл, `dom-size` на страницах-списках).

## Повторный прогон после исправлений (2026-10-03)

Те же 12 шаблонов плюс `/map/` и `/trip-finder/`; Lighthouse 12.8 (мобильный профиль: 412 px, DPR 1.75), axe-core 4 (WCAG 2.1 AA) в светлой и тёмной темах на ширине 390 px.

| Страница | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 100 | 100 | 100 | 100 | 1.7 s | 0 | 0 ms |
| `/where-to-go-in-december/` | 100 | 100 | 100 | 100 | 1.5 s | 0 | 40 ms |
| `/warm-places-to-visit-in-january/` | 100 | 100 | 100 | 100 | 1.6 s | 0 | 0 ms |
| `/best-time-to-visit-thailand/` | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms |
| `/thailand-in-december/` | 100 | 100 | 100 | 100 | 1.6 s | 0 | 0 ms |
| `/destinations/vienna/` | 99 | 100 | 100 | 100 | 2.0 s | 0 | 0 ms |
| `/destinations/bali/january/` | 100 | 100 | 100 | 100 | 1.8 s | 0 | 0 ms |
| `/compare/maui-vs-oahu/` | 100 | 100 | 100 | 100 | 1.5 s | 0 | 0 ms |
| `/calendar/` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 70 ms |
| `/destinations/` | 99 | 100 | 100 | 100 | 2.0 s | 0.013 | 50 ms |
| `/countries/` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `/guides/whale-watching/` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 0 ms |
| `/map/` | 100 | 100 | 100 | 100 | 1.2 s | 0 | 0 ms |
| `/trip-finder/` | 100 | 100 | 100 | 100 | 1.3 s | 0 | 0 ms |

- **Accessibility и SEO — 100 на всех 14 страницах** (было 96–98 и 92 на пяти шаблонах): исправления из первого прогона сработали.
- **axe:** 0 нарушений на всех 14 страницах в обеих темах. Также проверены новые подборки (`/where-to-see-fall-foliage-in-october/`, `/romantic-getaways-in-february/`, `/best-national-parks-to-visit-in-january/`, `/best-places-to-visit-in-the-middle-east-in-december/`) и `/destinations/vermont/october/` — тоже 0.
- **Исправлено в этом прогоне, «uses-responsive-images» на главных фото:** на телефоне фото в рамке 4:3 кадрируется (`object-fit: cover`) и нужно около 810 px по ширине, а в `srcset` были только 720 и 960, поэтому браузер брал 960. Добавлена ширина 800: главное фото `/destinations/vienna/` теперь весит 113 КБ вместо 162, расчётная экономия упала с 75 до 27 KiB. Остаток — плата за кадрирование, его не убрать без отдельной обрезки под телефон.
- **Подписи под главными фото убраны** (по просьбе владельца). Авторы и лицензии указаны на `/photo-credits/`, ссылка на неё есть в футере каждой страницы.
- Остаются информационные пункты: один CSS-файл как `render-blocking-resources` (≈ 10 КБ), `dom-size` на длинных списках (`/calendar/`, `/destinations/`) и `image-delivery-insight` (предлагает сжимать WebP сильнее; качество 72/65 оставлено ради вида фото).

## Как повторить

Повторный прогон сделан скриптом `scripts/audit.mjs` (Lighthouse + axe по тем же 14 страницам, отчёты в `.audit/`):

```bash
npm i --no-save lighthouse@12 @axe-core/playwright playwright-core   # один раз, в package.json не попадает
npm run build && npx astro preview --port 4321 &
npm run audit            # или: npm run audit -- axe / -- lh
PAGES=/romantic-getaways-in-february/ npm run audit -- axe   # другие страницы
```
