# 0018 - Watchlist prototype hardened

**Date**: 2026-08-26
**Module**: watchlist
**Status**: Accepted

## Context

Ekran watchlisty po `proto-lofi` obsługiwał happy paths; audyt `proto-edgecases`
(docs/modules/watchlist-edgecases.md, ADR-0017) znalazł 14 gapów (1×🔴, 8×🟡, 5×🟢).

## Decision

Wdrożono 13 z 14; odroczone: offline w prod (#13 — zależność całej appki od snapshota,
cache to decyzja platformowa). Decyzje designera (pytania pojedynczo, z rekomendacją audytu):

1. **Canceled zostaje na watchliście** przygaszony z plakietką (mimo że kalendarz go ukrywa,
   ADR-0011) — to lista, którą user świadomie kuratorował; poza eksportem ICS.
2. **Postponed**: dialog szczegółów pokazuje "Rescheduled → nowy termin" i "Watch new date"
   migrujący gwiazdkę na nową instancję z feedu (dopasowanie: liga + skład drużyn + późniejszy
   start, `lib/reschedule.ts`). Świadomie bez automatycznej migracji.
3. **LIVE**: chip w wierszu, tylko na watchliście (kalendarz ma NowBlock) — `liveIndicator`.
4. **Unstar**: undo toast 5s, wpis wraca verbatim (`addedAt`); brak confirmu — gwiazdka
   pozostaje one-click toggle.

Pozostałe wdrożenia: sanityzacja kształtu localStorage przy odczycie (settings/watchlist/
favorites — scalenie z defaultami zamiast białego ekranu, gap 🔴 odtworzony w E2E);
sieroty poza oknem danych widoczne z licznikiem i sprzątaniem (z undo), totalny przypadek
dostaje CTA; eksport ICS wyklucza postponed/canceled; własny skeleton ekranu; `?w=` stripowane
na watchliście (`useUrlFilters({ week: false })`, kalendarz bez zmian); clamp offsetu ±52
w "Show in calendar"; toast po eksporcie.

Bonus odkryty przy harden: `useLocalStorage` liczył funkcyjne updatory ze stanu closure'u —
dwa wywołania w jednym zdarzeniu (remove+add migracji) nadpisywały się; hook łańcuchuje
teraz po refie z ostatnią wartością.

## Impact

Prototyp obsługuje każdą ścieżkę przepływów, nie tylko happy path. Weryfikacja: E2E harden
25/25 + regresja happy-path 8/8 (chromium); stories `Watchlist/WatchlistScreen` ×7 i
`Watchlist/States` ×3. Visual polish to przyszły proto-design. Uwaga narzędziowa (poza modułem):
storyboook-vitest pada na imporcie setup-filu (dryf aria-query/@testing-library) — dotyczy
wszystkich modułów, do naprawy w toolingu.
