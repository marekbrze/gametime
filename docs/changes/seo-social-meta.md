# Feature: SEO i social-meta — strona przyjazna do udostępniania

## Type
Feature (planned by proto-feature)

## User goal
"Strona ma być przyjazna dla odwiedzających i dzielących się nią w internecie" — sensowny tytuł i opis w wynikach wyszukiwania oraz karcie przeglądarki, ładna karta podglądu przy wklejeniu linku (Messenger/Slack/X/WhatsApp), rozpoznawalna ikona na pasku zakładek i ekranie telefonu, spójne podstawowe informacje o stronie (język, canonical, theme-color).

## MVP scope
1. **Statyczny head w `index.html`** (źródło prawdy dla crawlerów — HashRouter serwuje jeden dokument na wszystkie trasy): `lang="pl"`, opisowy `<title>`, `meta description`, `robots`, `canonical`, `theme-color` (light + dark przez `prefers-color-scheme`), pełne `og:*` (type/url/title/description/image/locale/site_name), `twitter:*` (summary_large_image), JSON-LD `WebApplication`.
2. **Tytuł karty per ekran** — `useDocumentTitle` w `src/shared/hooks/`, wywołany w 6 ekranach; ligowy/drużynowy ekran dostaje tytuł dynamiczny z katalogu. Klienckie tytuły służą UX (karta/historia), nie SEO — scrapery social nie wykonują JS.
3. **Zestaw faviconów wg brandu** (DESIGN.md: papaya + tusz): nowy `favicon.svg` (ink-on-papaya), PNG 16/32, `apple-touch-icon.png` 180, `icon-192/512` + `site.webmanifest` z `theme_color`. Generacja przez skill `favicon-gen`.
4. **`og-image.png` 1200×630** — wygenerowany z brandu (Geist, papaya, tusz, trzy kropki pasm = kluczowy insight produktu), skrypt w `scripts/og-image/` (render chromium → screenshot), artefakt commitowany do `public/`.
5. **`robots.txt`** (allow all) — tani sygnał "strona zaprasza".
6. **Umami analytics** — tag `<script defer src="https://analytics.at.marekbrze.dev/script.js" data-website-id="cfa2ad28-4714-4e64-aca7-52f3aa768f70">` w head (dostarczony przez właściciela; self-hosted instancja).

### Later (deferred)
- Śledzenie zmian trasy hash-SPA w Umami (`umami.track()` na przejściu routera) — domyślnie script liczy pageview per załadowanie dokumentu, a HashRouter nie zmienia pathname.
- Dynamiczne per-wydarzenie karty OG (wymaga prerenderingu — sprzeczne z hash-SPA bez backendu).
- `sitemap.xml` — hash-SPA = 1 realny URL, zero wartości.
- Per-ekranowe meta description (rotowane kliencie — kosmetyka, po MVP jeśli w ogóle).
- JSON-LD `SportsEvent` per mecz (to samo ograniczenie prerenderingu).
- `hreflang`/i18n — strona jednojęzyczna (PL).
- Zmiana nazwy `gametime` → finalna (open question z PROJECT.md); wszystkie wystąpienia brandu w jednym miejscu (`src/shared/lib/seo.ts` + head), więc zmiana = jeden plik.

## Impact map
- **New module?**: nie — to warstwa app-shell + assety statyczne, nie obszar domenowy. Żaden z 8 modułów z MODULES.md nie rośnie o encje/akcje.
- **Modules affected**: `shared` (nowy hook + stałe SEO), wszystkie 6 ekranów (jedna linia tytułu każdy), `index.html`/`public/` (head, faviconi, og-image, manifest, robots).
- **Cross-module integration**: brak — zero nowych encji/relacji; jedyny punkt ryzyka to **base path `/gametime/`** w absolutnych URL-ach (canonical, og:image) — Scrapery social dostają pełne URL-e z `https://marekbrze.github.io/gametime/…`.
- **Shared-doc additions**: brak (ACTIONS.md — zero nowych akcji usera; ENTITY_MAP/GLOSSARY — zero nowych terminów domenowych; "og-image" to asset, nie termin).

## Per-module changes

### shared
- **Data**: brak encji; nowe stałe `src/shared/lib/seo.ts` (SITE_NAME, SITE_URL, DEFAULT_TITLE, DEFAULT_DESCRIPTION — jedno źródło prawdy dla nazwy/opisu strony, też dla hooka tytułów).
- **Actions**: brak (pasywne meta).
- **Screens & flows**: brak zmian UI; `useDocumentTitle(title)` — ustawia `document.title` na mount/zmianę.
- **States/Edge cases**: brak (hook bezstanowy, efekt czysty).
- **Design**: brak powierzchni w aplikacji.

### Ekrany (event-calendar, watchlist, teams ×3, settings)
- **Zmiana**: jedna linia `useDocumentTitle('…')` na ekran; `LeagueScreen`/`TeamScheduleScreen` — tytuł z nazwy ligi/drużyny z katalogu (fallback stały, gdy id poza katalogiem — zasada ADR-0024).
- **Design**: brak.

### Assety statyczne (index.html, public/)
- **Zmiany**: pełny head (jak w MVP pkt 1); wymiana `favicon.svg`; nowe: `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`, `og-image.png`, `robots.txt`.
- **Kolory hex** (konwersja z OKLCH z DESIGN.md/index.css, liczone w skrypcie OG): papaya `--brand-500` oklch(0.72 0.17 48), tusz oklch(0.20 0.02 48), canvas dark oklch(0.15 0.008 48), canvas light oklch(0.975 0.005 48).

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | `favicon-gen` (zainstalowany skills CLI) | `public/` | zestaw faviconów wg brandu |
| 2 | (direct edit — residual) | `index.html`, `src/shared/`, ekrany | head, stałe SEO, hook, tytuły |
| 3 | (direct edit — residual) | `scripts/og-image/`, `public/` | generator og-image + artefakt |
| 4 | (direct edit — residual) | `public/robots.txt`, `site.webmanifest` | drobiazgi |

Czysto infrastrukturalna zmiana — bez nowych ekranów/stanów, więc `proto-detail`/`lofi`/`harden`/`polish` nie mają czego budować (routing tabelkowy z skill: "czysta zmiana bez nowych ekranów → od razu residual").

## Residual — direct edits not covered by a proto skill
- **[`index.html:2`]** — now: `lang="en"`, title "gametime", samotny favicon. change to: `lang="pl"` + pełny head z MVP pkt 1. why: jedyna powierzchnia widziana przez crawlerów/social Scrapery.
- **[`src/shared/lib/seo.ts`]** — now: brak. create: stałe SITE_NAME/SITE_URL/DEFAULT_TITLE/DEFAULT_DESCRIPTION. why: jedno źródło prawdy brandu (open question nazwy z PROJECT.md).
- **[`src/shared/hooks/use-document-title.ts`]** — now: brak. create: hook `useDocumentTitle(title: string)`. why: idiomatyczne per-ekranowe tytuły bez boilerplate'u.
- **[`src/modules/event-calendar/components/EventCalendarScreen.tsx` + 5 pozostałych ekranów]** — now: brak tytułu. change to: wywołanie hooka. why: tytuł karty/historii per ekran.
- **[`public/favicon.svg`]** — now: generyczny czarny kwadrat z "P" (szablon). change to: papaya + tusz wg DESIGN.md. why: obecny favicon nie jest marką.
- **[`scripts/og-image/`]** — now: brak. create: generator (HTML → chromium screenshot 1200×630). why: og-image to asset brandowy, reproducible z repo (font Geist z node_modules, kolory z OKLCH).

## Hand-off
Run the routing steps in order. This doc is the base each skill reads.
