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

Остальные отмеченные пункты носят информационный характер (`render-blocking-resources` — один небольшой CSS-файл, `dom-size` на страницах-списках). Повторный полный прогон Lighthouse после исправлений ещё не делался. Это первая задача в `docs/HANDOFF.md`.

## Как повторить

```bash
npm run build && npx astro preview --port 4321 &
# Lighthouse: CHROME_PATH=<путь к Chromium> npx lighthouse http://localhost:4321/ --only-categories=performance,accessibility,best-practices,seo
# axe: @axe-core/playwright, теги wcag2a wcag2aa wcag21a wcag21aa
```
