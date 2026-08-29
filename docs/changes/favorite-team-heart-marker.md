# Feature: Serduszko — wyraźne oznaczanie meczów ulubionych drużyn

## Type
Feature (planned by proto-feature)

## User goal
„Potrzebuję jakoś oznaczać mecze, które dotyczą drużyn, które obserwujesz — w taki sposób, żeby było jasno widać, gdzie są mecze, które mogą interesować osobę." Obecne podświetlenie (`bg-muted/60`) jest zbyt subtelne, znika na tintach pasm (płaski terminarz, ADR-0032) i nie daje sygnału na poziomie skanu dnia.

## Decyzja designera (rozmowa przy planowaniu)
**Serduszko = ulubiona drużyna (globalnie). Gwiazdka = obserwowanie wydarzenia (watchlista).** Dwie różne ikony o dwóch różnych znaczeniach — rozwiązuje dotychczasowy konflikt semantyczny (star w wierszu = watchlista, star w teams = ulubiona drużyna; GLOSSARY od początku ostrzegał przed „ulubione" dla watchlisty).

## MVP scope
**Musi działać:**
1. Wiersz wydarzenia (`EventRow`, wszystkie warianty: kalendarz, płaski terminarz z tintem, watchlista, PastSection): wypełnione serduszko ♥ w barwie brandowej tuż przed etykietą uczestników, gdy którykolwiek uczestnik jest ulubioną drużyną. Usunięcie starego washu `bg-muted/60` (serduszko jest nośnikiem; wash nie żyje na tintach).
2. Karta (`EventCard`, widok cards): serduszko przed etykietą uczestników; usunięcie washu (tint pasma pozostaje czysty).
3. Nagłówek dnia (`DayGroup`): chip-licznik „N my teams" w tincie papayi (słownictwo chipów liczników pasm) z ikonką serduszka — sygnał skanu „które dni w ogóle mają moje mecze", widoczny też na zwiniętych dniach przeszłych.
4. Moduł teams: gwiazdka → serduszko we wszystkich afordancjach ulubionej drużyny (FilterBar „My teams", kafel My teams, wiersz ligi, header terminarza) + copy „Star teams…" → „Heart teams…".
5. Terminarz pojedynczej drużyny NIE znaczy wierszy serduszkami (każdy wiersz to „ta drużyna" — zmyłka, ta sama racja co ADR-0032 dla washu): `favorite={false}` na render wierszy.
6. A11y: serduszko ikonowe dostaje odpowiednik tekstowy dla SR („My team"); chip w nagłówku to tekst widoczny.

**Later (odłożone):**
- Serduszko w NowBlock (LIVE/SOON) — blok ma czytać się w pół sekundy; trzeci chip w wierszu to szum. Wrócić, jeśli user da sygnał.
-„Both my teams" — wariant tekstu SR gdy obie drużyny ulubione (dziś jedno serduszko wystarcza).
- Eksport/ICS bez zmian.

## Impact map
- **New module?**: nie — rozszerza event-calendar (powierzchnie wiersza/karty/nagłówka dnia) i teams (semantyka ikony); watchlist dostaje marker „przy okazji" (favorite już płynie do jej wierszy).
- **Modules affected**: event-calendar (EventRow/EventCard/DayGroup), teams (3 ekrany + FilterBar z modułu filters), watchlist (bez zmian kodu — dziedziczy marker przez EventRow/PastSection).
- **Cross-module integration**: istniejąca już integracja `useFavoriteTeams` → `favorite: boolean` w itemach list; zmiana jest czysto prezentacyjna na tej samej krawędzi. Krytyczne: FILTERS/teams/event-calendar muszą użyć TEJ sameJ ikony dla „ulubiona drużyna" (reguła globalna).
- **Shared-doc additions**: GLOSSARY.md (rozszerzenie `FavoriteTeam` o marker ♥ + zasadę heart/star), ACTIONS.md (aktualizacja pasywnego „Highlight on main list"), ENTITY_MAP.md (opis FAVORITE_TEAM zachowanie 1).

## Per-module changes

### event-calendar
- **Data**: brak zmian encji; `DayItem.favorite` już istnieje.
- **Actions**: brak nowych (zachowanie pasywne).
- **Screens & flows**: wiersz/karta prowadzą serduszko przed uczestnikami; nagłówek dnia dostaje brandowy chip „N my teams" obok chipów pasm (tylko gdy >0).
- **States**: brak nowych stanów pustych/błędów — marker znika, gdy brak ulubionych (istniejące `hasFavorites`).
- **Edge cases**: (a) brak ulubionych → zero serduszek, zero chipów; (b) obie drużyny ulubione → jedno serduszko; (c) mecz ulubionej drużyny na tincie nocy → serduszko brand-text (kontrast ≥3:1 na tintach, jak gwiazdka watchlisty); (d) mecz ulubionej + watched → ♥ po lewej, ☆ wypełniona po prawej — kształt rozróżnia.
- **Design**: serduszko `fill-current text-brand-text` (token AA brandu, ten sam co gwiazdka watchlisty — spójność rodzinna); chip nagłówka `bg-primary/12 text-brand-text` (dokładnie słownictwo chipa SOON); bez side-stripe'ów, bez hue pasm — zgodne z DESIGN.md.

### teams
- **Data/Actions**: brak zmian logiki; zmiana ikony afordancji Star→Heart + copy empty state.
- **Screens & flows**: TeamsScreen (kafel + copy), LeagueScreen (wiersz), TeamScheduleScreen (header) — serduszko wypełnione gdy ulubiona; TeamScheduleScreen dodatkowo: `favorite={false}` na EventRow/EventCard (powrót do racji ADR-0032 w nowym świecie markerów).
- **States**: bez zmian.
- **Edge cases**: undo/aria-label bez zmian („Add/Remove … from favorites").

### filters
- **FilterBar „My teams"**: ikona Star→Heart (semantyka globalna), reszta bez zmian.

### watchlist
- **Bez zmian kodu** — wiersze dziedziczą serduszko przez `favorite` prop (już płynie z `buildWatchlistGroups`); gwiazdka watchlisty pozostaje gwiazdką.

## Routing — which proto skill builds what
| Step | Skill | Target | What it does |
|------|-------|--------|--------------|
| 1 | (bez skilla — residual) | src/modules/{event-calendar,teams,filters} | czysto prezentacyjna zmiana na istniejących ekranach, bez nowych stanów — direct edits wg listy poniżej |
| 2 | (direct edit) | docs/modules/*.md, GLOSSARY, ACTIONS, ENTITY_MAP | synchronizacja speców |
| 3 | (direct edit) | *.stories.tsx | stories regresyjne: serduszka w liście/kartach, chip w nagłówku, brak serduszek na terminarzu drużyny |
| 4 | weryfikacja | — | `npm run build`, `npm run lint`, vitest (storybook E2E, z workaroundem fontconfig), przegląd wizualny zrzutów light+dark |

Proto-edgecases/harden nie są routingowane: cecha nie dodaje nowych stanów ani ścieżek — domyka się w istniejących stanach (brak ulubionych = marker znika, już pokryte `hasFavorites`).

## Residual — direct edits not covered by a proto skill
- **[`src/modules/event-calendar/components/EventRow.tsx:61-67`]** — now: wash `!bandTint && favorite && 'bg-muted/60'`. change to: usuwash; dodać `Heart` (lucide, `size-3.5 shrink-0 fill-current text-brand-text`, `aria-hidden` + `sr-only` „My team") przed etykietą w obu wariantach (single-line: po czasie; dateLabel: na czele body).
- **[`src/modules/event-calendar/components/EventCard.tsx:43-51`]** — now: `favorite ? 'bg-muted/60'` po `BAND_CARD`. change to: usunąć wash; blok uczestników jako flex z serduszkiem przed etykietą.
- **[`src/modules/event-calendar/components/DayGroup.tsx:144-157`]** — now: tylko chipy pasm. change to: po chipach pasm chip `N my teams` (Heart size-3 fill-current + licznik) przy `favoriteCount > 0`, klasa `bg-primary/12 text-brand-text`.
- **[`src/modules/filters/components/FilterBar.tsx:2,113`]** — Star → Heart.
- **[`src/modules/teams/components/TeamsScreen.tsx:3,105,130`]** — Star → Heart; copy „Star teams…" → „Heart teams…".
- **[`src/modules/teams/components/LeagueScreen.tsx:3,166`]** — Star → Heart (wypełnione gdy ulubiona).
- **[`src/modules/teams/components/TeamScheduleScreen.tsx:3,177,256,273`]** — Star → Heart w headerze; `favorite={false}` na wierszach (komentarz: ADR-0032 racja — cały terminarz to „ta" drużyna).
- **Specs/shared docs**: `docs/modules/event-calendar.md:41` (opis wiersza: ♥ zamiast „subtelne podświetlenie"; nagłówek: chip my teams), `docs/modules/teams.md:81` (♥ w EventRow), GLOSSARY `FavoriteTeam`, ACTIONS.md „Highlight on main list", ENTITY_MAP.md FAVORITE_TEAM.

## Later (deferred)
- Serduszko w NowBlock (patrz MVP scope — Later).
- Wariant „My teams ×2" w SR.
- Ewentualny pinch: sortowanie/podnoszenie meczów my-teams na szczyt sekcji (zmiana porządku — osobna decyzja designera).

## Hand-off
Implementacja bezpośrednio z listy residual (zmiana prezentacyjna), potem weryfikacja i stories. ADR-0034 notuje decyzję heart/star.
