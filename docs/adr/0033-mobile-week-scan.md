# 0033 — Mobilny skan tygodnia: zwinięte dni przeszłe, zwijany pasek filtrów, pełne nazwy drużyn

**Date**: 2026-08-29
**Module**: event-calendar, filters
**Status**: Accepted

## Context

Trzy sygnały od designera po iteracji 2 ADR-0032, wszystkie o widoku bieżącego tygodnia:

1. **Dni przeszłe w tygodniu zajmują ekran nieproporcjonalnie do swojej wartości** — skan ma sens od Today w przód; poniedziałek–piątek zakończonymi meczami pchają Today i jutro w głąb, choć nikt na nie nie „czeka".
2. **Pasek filtrów na mobilce zawija się do ~3 wierszy** (pasma + select sportu + My teams + More filters + view-mode) i zjada pierwszy ekranlisty — dokładnie ten moment, w którym user ma odpowiedzieć sobie „co dziś obejrzę".
3. **Nazwy drużyn w wierszach są ucięte** (`truncate` w EventRow): na 375 px po kropce, emoji i kolumnie czasu na etykietę zostaje ~180 px — „Toronto Maple Leafs vs Boston Bruins" robi się z jednego wiersza „Toronto Maple Lea…". Pełna nazwa to podstawowa treść wiersza, nie ozdoba.

## Decision

### 1. Dzień przeszły = zwinięty pod nagłówkiem (DayGroup)

- `DayGroup` dostaje `isPast`; kalendarz przekazuje `key < todayKey` (klucze `YYYY-MM-DD` porównywalne leksykograficznie).
- Nagłówek dnia przeszłego staje się **pełnoszerokościowym przyciskiem w istniejącym kostiumie nagłówka** (bez tintu — to nie pasmo, tylko archive): `aria-expanded`/`aria-controls` (`day-content-…`), chevron z rotacją jak disclosure nocy, hover `bg-muted/40`, focus-ring, `motion-reduce` gasi transform. Wzorzec dostępności: `button` wewnątrz `h3`.
- **Chipy liczników pasm zostają w nagłówku** — zwinięty dzień wciąż mówi, ile i czego się odbyło; rozwinięcie jest po szczegóły, nie po podsumowanie.
- Today i dni przyszłe pozostają statyczne (rozwijanie czegoś, co ma być widoczne, byłoby szumem). Reguła lokalna w `DayGroup`; watchlista nie przekazuje `isPast` (pokazuje tylko przyszłość + osobną PastSection), więc bez zmian.
- Przejrzenie tygodnia wstecz = wszystkie dni zwinięte — spójna konsekwencja reguły, chipsy dają nagłówkowy przegląd wyników.

### 2. FilterBar zwijalny <768 px

- Pełny wariant paska (nie `bandsOnly`) na <md chowa sterowania za przyciskiem **„Filters"** (ikona ListFilter + licznik aktywnych wymiarów + chevron): `aria-expanded`/`aria-controls`, wariant `default` gdy cokolwiek aktywne — jak licznik More filters.
- Licznik sumuje pasmo + sport + ligi + My teams (wszystkie wymiary paska; w odróżnieniu od licznika More filters, który zlicza tylko tier 2).
- **Slot dzieci (view-mode) zostaje na wierzchu** obok „Filters" — kompaktowy, częsty przełącznik nie może chować się za tym samym disclosure.
- **Deep-link z aktywnymi filtrami startuje rozwinięty** (initial state = licznik > 0) — złoty filtr musi być widoczny, nie domyślny; ta sama anty-pułapkowa zasada co auto-open nocy (ADR-0032).
- Breakpoint md świadomie zbieżny z MoreFilters (popover ≥md / drawer <md) — jeden próg „mobilnego" paska. `bandsOnly` (terminarz drużyny) nie zwija się: cztery przyciski pasm mieszczą się w jednym wierszu 375 px.
- ≥md bez zmian — pełny pasek w jednym wierszu.

### 3. Etykieta uczestników zawija się <640 px (EventRow)

- `truncate` zostaje tylko ≥sm (`sm:truncate`); poniżej etykieta zawija swobodnie (`leading-snug`) — wiersz może zająć 2–3 linie, by pełne nazwy były czytelne. Wiersz = karta listy; rosną w głąb, nie w szerz.
- Desktopy wracają do gęstości jednowierszowej — tam miejsca starcza, a lista ma być skanowalna.
- Dotyczy wszystkich konsumentów EventRow (kalendarz, watchlista, terminarz płaski — długie nazwy niemieckich klubów ze snapshota ESPN były głównym bodźcem). EventCard (widok cards) zawsze zawijał — bez zmian.

## Iteracja 2 (feedback designera, tego samego dnia)

**Wiersz z datą na mobile był ściśnięty, nie czytelny.** Decyzja §3 (zawijanie etykiet) odsłoniła drugi problem: w wierszach płaskich list (terminarz drużyny, PastSection flat) kolumna daty w-14 + czas w-12 + kropka + emoji + akcje (gwiazdka, eksport) zjadały ~260 px z 375 px — na pełne nazwy drużyn zostawało ~90 px i wiersz robił się wąski, wysoki i ściskany.

- **EventRow z `dateLabel` przestaje być jedną linią flex — staje się gridem o trzech obszarach** (`meta` / `body` / `actions`):
  - **<sm**: dwa wiersze — meta (kropka pasa, emoji, „Sat · Sep 6", czas w kolorze pasma, po prawej gwiazdka + eksport) i **etykieta meczu na całej szerokości** karty (zawija, LIVE chip przy niej);
  - **≥sm**: obszary układają się w jedną linię `meta body actions` — układ desktopowy **1:1 ze stanem sprzed zmiany** (kolumna daty w-14, czas w-12, truncate), grid tylko formalnie zastępuje flex.
- Jeden DOM, zero duplikacji przycisków; kolejność tabulacji = kolejność czytania (data/czas → etykieta → akcje), grid-areas reorderują wyłącznie wizualnie.
- Wiersze bez `dateLabel` (kalendarz, watchlista) — ta sama pojedyncza linia flex co przed iteracją (zweryfikowane regresyjnie).
- Dotyczy TeamScheduleScreen (upcoming + past flat) — czyli dokładnie to, co designer zgłosił.

## Impact

- `EventCalendarScreen` przekazuje `isPast`; `DayGroup` zagnieżdża sekcje w warunkowym wrapperze (`id` tylko dla dni zwijalnych — czytelnikom URL nie trafiają puste kotwice).
- FilterBar przestaje być czysto bezstanowy (lokalny `open`); stan filtrów nadal trzyma ekran-listy (URL, ADR-0014) — `open` to czysta prezentacja, nie przekłada się na URL.
- Stories: `PastDaysCollapsed` (kalendarz), `MobileCollapsed` + `MobileExpandedWithCount` (FilterBar, z story-only shimem matchMedia <768 px, bo SB10 bez addonu viewport; shim przywraca prawdziwe `matchMedia` na odmontowaniu).
- Suite `vitest --project storybook` w tym środowisku pada na infrze (import `aria-query` ESM w setup-file pluginu, 10/10 suit, 0 testów) — nierelated; weryfikacja stories przez `storybook dev` + playwright (iframe per story).
- Weryfikacja: tsc ✅ eslint ✅ E2E playwright na dev-serverze z realnym snapshotem (31 asercji: zwinięcie/przełączenie dni przeszłych mobile+desktop, Filters schowany/rozwinięty z licznikiem, `whiteSpace` normal <sm / nowrap ≥sm, wiersze wielolinowe) + przegląd wizualny zrzutów 375 px/1280 px.
