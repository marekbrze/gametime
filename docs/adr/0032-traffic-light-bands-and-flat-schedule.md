# 0032 — Sygnalizacja świetlna pasm, widoczny disclosure nocy, płaski terminarz

**Date**: 2026-08-29
**Module**: event-calendar, teams, filters, settings
**Status**: Accepted

## Context

Trzy sygnały od designera po ship-passie (ADR-0031):

1. **Ukrywanie meczów nocnych na listach jest zbyt subtelne** — zwinięta noc to był mały ghost-przycisk „🌙 Night — N events after midnight" w kolorze muted; użytkownik nie zauważał, że dzień ma nocną zawartość, ani że to klikalne.
2. **Kolory pasm (azure/magenta/indigo z ADR-0029) wymagają nauki legendy** — designer chce 3 kolory oznaczeń pory meczu jak sygnalizacja świetlna: **zielony = dzień, żółty = wieczór, czerwony = noc**.
3. **Terminarz drużyny nie musi grupować meczów** (ADR-0022 grupował po ViewingDay z separatorami miesięcy) — ma być płaska lista na wierzchu, ewentualnie filtrowana.

## Decision

### 1. Pasma = sygnalizacja świetlna (tokeny `--band-*`)

Przemapowanie hue w `index.css` (oba tematy, zachowana struktura dot/tint/text):

| Band | Hue | Dot light | Dot dark | Tekst na tincie light/dark |
|------|-----|-----------|----------|---------------------------|
| day | zieleń 150 | oklch(0.55 0.12 150) | oklch(0.72 0.10 150) | 7.50 / 8.47 |
| evening | złoto 85 | oklch(0.65 0.13 85) | oklch(0.80 0.12 90) | 7.37 / 8.94 |
| night | czerwień 27 | oklch(0.55 0.19 27) | oklch(0.68 0.17 27) | 6.71 / 8.01 |

- Metafora uniwersalna bez nauki: zielono = komfortowo, żółto = prime time, czerwono = po północy („późno — świadoma decyzja").
- **Złoto celowo głębokie** (L 0.65): kropka 8 px na jasnym card wymaga ≥3:1 — zmierzone: złoto 3.17, zieleń 4.46, czerwień 5.19 (skrypt OKLCH→sRGB→WCAG, kompozyt jak w audycie ADR-0031). Czysta żółć ~0.8 daje ~1.6 — fail.
- Zbieżność rodzin z semantykami (zieleń ≈ success, czerwień ≈ live/destructive, złoto ≈ warning) świadoma i zaakceptowana: pasma zawsze niosą też etykietę (mini-nagłówek/chip/licznik) i pozycję, kształt odróżnia nośniki (kropka pasma vs chip LIVE vs gwiazdka brandowa). Zasada „kolor nigdy jedynym nośnikiem" z ADR-0029 zostaje.
- **Drugi nośnik koloru w wierszu**: godzina startu w kolorze pasma (`BAND_TIME`, wcześniej martwy token) w EventRow i EventCard — AA na card i na tincie w obu tematach.

### 2. Widoczny disclosure nocy (DayGroup)

- Zwinięta noc to teraz **pełnoszerokościowy przycisk**: obwódka `border-band-night/40`, tło `bg-band-night-tint`, ikona księżyca, tekst „Night — N events after midnight" w `--band-night-text`, po prawej pill **Show/Hide** + chevron z rotacją; `aria-expanded`/`aria-controls`, focus-ring jak Button, `motion-reduce` gasi transform.
- **Auto-open**: gdy noc jest jedynym pasmem dnia (w tym po przefiltrowaniu `?band=night`, które opróżnia Day/Evening) sekcja rozwija się sama i dostaje mini-nagłówek „Night" jak Day/Evening — chowanie jedynej treści dnia (albo jedynego wyniku filtru) za zwinięciem byłoby pułapką. Reguła lokalna w `DayGroup` (`nightOnly`), ekrany nic nie muszą przekazywać.
- Chipy podsumowania w nagłówku dnia ujednolicone: **każde pasmo pokazuje licznik** (wcześniej noc miała zamiast liczby emoji 🌙); noc dostaje ikonę księżyca lucide obok liczby.

### 3. Płaski terminarz drużyny (TeamScheduleScreen)

- Upcoming = **jedna lista chronologiczna** (sort po `startUtc`), bez grup dnia, bez mini-nagłówków pasm, bez separatorów miesięcy. PastSection dostaje wariant `flat` (też chronologia, od najnowszych).
- Wiersz/karta dostają **kolumnę daty** (`dateLabel`): dwie linie „Sat" / „Sep 6" (caption, w-14) — mieści się na 375 px bez zjadania etykiety meczu; dla bieżącego dnia weekday = „Today". EventCard: „Sat, Sep 6 · 19:30".
- **ViewingDay (ADR-0004) przestaje obowiązywać na tym ekranie**: w płaskiej chronologii mecz 01:30 po prostu stoi po wieczorze z datą faktyczną (czwartek). ADR-0004 dotyczy list grupowanych po dniach (kalendarz, watchlista) — tam bez zmian.
- Zawężanie listy robi dotychczasowy FilterBar bands-only (`?band`).

### 4. Stories: naprawa braku Routera (harden przy okazji)

`EventCalendarScreen.stories` i `WatchlistScreen.stories` renderowały ekrany używające `useSearchParams` **bez providera Routera** — `useLocation()` rzuca poza `<Router>`, więc stories były puste/crashowe od lofi. Dodany meta-dekorator MemoryRouter (wzorzec z teams, ADR-0020) + nowe stories: `NightDisclosureCollapsed`, `NightOnlyDayAutoOpen`, `NightBandFilterAutoOpen` (kalendarz), `NightBandFilterFlat`, `AllPastFlat` (terminarz).

## Impact

- Konsumenci tokenów pasm (FilterBar chips, EventDetailsDialog, BandsPreview w settings, karty) dostają nowe kolory automatycznie — zero zmian poza tokenami.
- `chart-2/3/4` przemapowane na kotwice pasm dla spójności (nieużywane).
- `formatShortDateParts` w shared/lib/datetime — jedyny formater daty wiersza.
- DESIGN.md: sekcja Time bands przepisana (tabela + rationale); spec teams.md i event-calendar.md zsynchronizowane.
- Weryfikacja: build ✅, eslint ✅, E2E playwright (tokeny w DOM 1:1, disclosure nocny + auto-open, płaski terminarz z datami, filtr band=night, mobile 375 px, dark) — szczegóły w commicie.
