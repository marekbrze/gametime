# Settings

## Vision

Ustawienia to miejsce, w którym user dopasowuje narzędzie do swojego życia — dosłownie do swojej doby. Dwa problemy z PROJECT.md domykają się tu w jednym ekranie: **strefa czasowa niedopasowana do lig** (kibic w Polsce, ligi grające w nocy jego czasu) i **osobista definicja „da się obejrzeć po ludzku"** (granica wieczoru i nocy u shiftowca wygląda inaczej niż u studenta). Zasada zero-setupu z PROJECT.md: domyślne wartości działają jeszcze przed pierwszą edycją — ekran ustawień istnieje dla tych, którzy chcą więcej niż default.

Moduł jest mały (Low-Medium design priority), ale **pasma napędzają cały system wizualny aplikacji** — klasyfikacja kolorystyczna, filtry i grupowanie ViewingDay na każdej liście czytają to, co user tu ustawi.

## Designer decisions (proto-detail, 2026-08-27)

1. **Pasma edytowane dwiema granicami** — user ustawia tylko „Day starts" (default 6:00) i „Evening starts" (default 22:00); Noc = północ→dzień, Wieczór = evening→północ. Pasma zawsze pokrywają całą dobę, zero luk i nakładek, reprezentacja w storage bez zmian (ADR-0025).
2. **Strefa: pełna lista IANA** — select z `Intl.supportedValuesOf('timeZone')`, na szczycie „System default" z dopiskiem rozpoznanej strefy przeglądarki (ADR-0026).
3. **Reset wszystkiego z dialogiem potwierdzenia** — jeden reset przywraca strefę + pasma + viewMode (DEFAULT_SETTINGS); świadoma decyzja designera ponad idiom undo-toast używany w watchliście/teams (ADR-0026).
4. **ViewMode poza ekranem** — toggle list/cards żyje na kalendarzu (ADR-0006); ustawienia trzymają się tematu czasu, bez dublowania źródła prawdy.
5. **Zapis natychmiastowy, bez „Save"** — wzorzec write-first (ADR-0011); każda zmiana od razu przepływa do wszystkich konsumentów.
6. **Pasek podglądu 24h** — wizualizacja trzech pasm (tokeny `bands-ui`) z markerem „now" w rozpoznanej strefie; granice widać w kontekście całej doby, a nie jako dwie abstrakcyjne liczby.

## User Flows

### Adjust band boundaries
1. User klika Settings (tab 4 / desktop nav) → widzi `/settings`: sekcja Timezone, sekcja Time bands, Reset.
2. Sekcja Time bands: dwa steppery godzinowe — **Day starts** (default 6:00) i **Evening starts** (default 22:00), krok 30 min — oraz pasek podglądu 24h z kolorami pasm i markerem „now".
3. User przesuwa „Day starts" z 6:00 na 7:00 → podgląd i odczyty zakresów („Night 0:00 – 7:00") aktualizują się natychmiast; zapis do localStorage bez przycisku Save.
4. User wraca na kalendarz/watchlistę/terminarz — klasyfikacja pasm, filtry i grupowanie ViewingDay liczą się od nowych granic. **Konsekwencja do zakomunikowania w UI**: wydarzenia 0:00–7:00 należą teraz do wieczoru dnia poprzedniego (noc = północ→dzień, ADR-0004).

### Switch timezone
1. User otwiera „Timezone" — select z „System default ({rozpoznana strefa})" na szczycie i pełną listą IANA (Europe/Warsaw, America/New_York, …).
2. Wybiera strefę → wszystkie godziny w aplikacji (kalendarz, watchlista, terminarze, dialogi, eksporty ICS) natychmiast renderują się w niej; pasek podglądu pasm pokazuje godziny w wybranej strefie.
3. „System default" przywraca strefę przeglądarki — dopisek obok opcji zawsze pokazuje, co się rozpoznało.

### Reset to defaults
1. User klika „Reset to defaults" (na dole ekranu, oddzielony sekcją).
2. Dialog potwierdzenia: „This will reset timezone, bands and view mode to defaults." — Cancel = no-op, Reset = zapis DEFAULT_SETTINGS.
3. Po resetuje ekran wraca do stanu domyślnego (6:00 / 22:00 / System default), podgląd się odświeża.

## Screens (rough)

- **SettingsScreen** (`/settings`): jedna strona, sekcje pionowe:
  - **Timezone**: label + select (System default na szczycie, lista IANA poniżej), pomocniczy dopisek rozpoznanej strefy.
  - **Time bands**: dwa steppery granic (Day starts / Evening starts, krok 30 min, wzajemny clamp: 0:30 ≤ day < evening ≤ 23:30), pasek podglądu 24h (proporcjonalne segmenty Night/Day/Evening w kolorach pasm + marker „now"), odczyt zakresów per pasmo.
  - **Danger zone na dole**: „Reset to defaults" (secondary/destructive button) + dialog potwierdzenia.

## Actions

| Action | Description | Entity | Notes |
|--------|------------|--------|-------|
| Change timezone | Select strefy; „System default" = przeglądarka. | UserSettings | Zapis nazwy IANA lub 'system'; natychmiastowy efekt globalny (ADR-0026) |
| Edit band ranges | Dwie granice: Day starts / Evening starts (30 min, clamp wzajemny). | UserSettings | Model dwugraniczny, noc przypięta do północy (ADR-0025) |
| Reset to defaults | Jeden reset: strefa + pasma + viewMode. | UserSettings | Dialog potwierdzenia (ADR-0026); viewMode resetuje się też, choć nie ma go na ekranie |

## Edge Cases

Systematyczny audyt: `settings-edgecases.md` (baseline ADR-0027, harden ADR-0028 — 5/6 wdrożonych). Zachowania po harden:

- **Granice skrajne**: day=23:30, evening=23:30 dozwolone (pasma się degenerują, ale doba pokryta); stepper clampuje wzajemnie — nie da się ustawić day ≥ evening.
- **Pad zapisu localStorage**: `writeError` konsumowany przez StorageWarning (wzorzec ADR-0011/0024), zapis z rollbackiem wizualnym.
- **Zepsuty kształt w storage**: `sanitizeSettings` scala z defaultami (ADR-0018); po harden waliduje też **wartość strefy** (probe Intl; śmieci → `system`) i **spójność pasm** (noc@0:00, wieczór@24:00, siatka 30 min bez luk — niespójne → defaults, decyzja designera ADR-0028).
- **Strefa poprawna dla Intl, ale nieobecna na liście** (legacy aliasy `Poland`, `US/Pacific`): przypięty option „Saved: {zone}" — select nigdy nie renderuje się pusty.
- **`Intl.supportedValuesOf` niedostępne** (stare Safari): fallback = krótka lista ręczna 12 stref + System default (**zaakceptowane**, ADR-0028 — rozpoznana strefa zawsze działa).
- **Zmiana strefy zmienia klasyfikację pasm** — zamierzone; podgląd pokazuje godziny w aktualnie wybranej strefie.
- **Multi-tab**: brak synchronizacji między kartami — odroczone platformowo (ADR-0028, analogia offline z ADR-0018/0024).

## Integration Points

- **event-calendar / watchlist / teams / filters**: wszyscy czytają `useSettings` — strefa (prezentacja + ViewingDay) i pasma (klasyfikacja + FilterBar). Zmiana w ustawieniach przepływa natychmiast (ten sam klucz localStorage).
- **calendar-export**: eksporty ICS/Google liczą godziny w strefie użytkownika — czytają ten sam `settings.timezone`.
- **bands-ui**: tokeny kolorów pasm (`BAND_EDGE/CHIP/DOT`) — finalne kolory ustali proto-brand/proto-design; pasek podglądu jest ich pierwszym „klientem systemowym".
- **data-source**: brak zależności (ustawienia czysto lokalne, per przeglądarka).
