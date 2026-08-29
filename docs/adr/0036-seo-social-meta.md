# 0036 - SEO i social-meta strony (tytuły, OG, faviconi, Umami)

**Date**: 2026-08-29
**Status**: Accepted

## Context

Strona działa na GitHub Pages, ale `index.html` był minimalny: `lang="en"`, tytuł "gametime", jeden generyczny favicon, zero description/OG/analytics. Link udostępniony w komunikatorze nie miał karty podglądu, wynik wyszukiwania nie miał opisu, a ruch był niemierzalny. Aplikacja używa HashRoutera — crawlerzy social (FB/Slack/X) nie wykonują JS, więc **statyczny head jest jedyną powierzchnią SEO**, jaką strona realnie ma.

## Decision

1. **Statyczny head w `index.html` = źródło prawdy SEO**: opisowy title, meta description, robots, canonical, theme-color (light/dark), pełne `og:*`, `twitter:*` (summary_large_image), JSON-LD `WebApplication`. Copy po angielsku, `lang="en"` bez zmian (ADR-0003 — sprostowanie: pierwotna wersja tego ADR zakładała `lang="pl"`). Wszystkie absolutne URL-e z base `/gametime/` (`https://marekbrze.github.io/gametime/…`).
2. **Tytuł karty per ekran** przez `useDocumentTitle` (shared/hooks) — celowo UX-owy (karta/historia), nie SEO-owy; statyczny head niesie SEO.
3. **Brand assety generowane z DESIGN.md, nie ręcznie**: faviconi (papaya + tusz, glif = wielkie geometryczne "G" — małe "g" czytało się jako "q"; PNG 16/32/180/192/512, manifest, bez `.ico` — brak ImageMagick, PNG pokrywa przeglądarki) i `og-image.png` 1200×630 (Geist + papaya + trzy kropki pasm — kluczowy insight produktu) przez skrypty `scripts/generate-{icons,og-image}.mjs` w repo (raster: headless chromium).
4. **Stałe brandu w `src/shared/lib/seo.ts`** (SITE_NAME/SITE_URL/DEFAULT_TITLE/DEFAULT_DESCRIPTION) — nazwa produktu to open question z PROJECT.md, więc jedna lokacja na zmianę.
5. **Umami** (self-hosted `analytics.at.marekbrze.dev`, website-id `cfa2ad28-4714-4e64-aca7-52f3aa768f70`) — tag w head z `data-auto-track="false"` + `UmamiPageviews` (shared/components) trackuje pageview per trasa z URL-em routera; hash-SPA ma jeden pathname, więc auto-track liczyłby wszystko jako "/".
6. **`robots.txt`** allow-all. Sitemap celowo poza zakresem (hash-SPA = 1 URL).

Plan w `docs/changes/seo-social-meta.md`. Bez nowego modułu — czysto infrastrukturalna zmiana (routing: favicon-gen + residual direct edits, bez detail/lofi/harden).

## Impact

- Udostępnianie linku dostaje kartę podglądu (obraz, tytuł, opis); wyszukiwarka dostaje opis i język.
- Ekran telefonu/pasek zakładek dostają markę (papaya) zamiast generycznego kwadratu.
- Ruch mierzalny Umami (pageview per załadowanie; zmiany tras hash-SPA nie są rozróżnialne do czasu wdrożenia `umami.track()` — Later).
- Regeneracja og-image/faviconów możliwa ze skryptu w repo (font i kolory z zależności/DESIGN.md, nie z ręcznego eye-dropperowania).
