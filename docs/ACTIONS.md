# Action Inventory

Pełna lista akcji użytkownika wg encji (`proto-deepen`). Zasada uniwersalna potwierdzona przez designera: **każda lista w aplikacji filtruje się po pasmach godzinowych** (TimeBand), sporcie i lidze — wspólnym paskiem modułu filters (ADR-0012). Zakres dat należy do ekranu-listy (pager tygodnia, sezon, podział watchlisty); filtr drużynowy poza paskiem w v1 — team-scoping w module teams.

## Roles

- **Visitor** (anonimowy gość): jedyna rola. Bez konta, bez logowania, stan trzymany w localStorage jego przeglądarki. Wszystkie akcje poniżej dotyczą tej roli — kolumna Role pominięta w tabelach.

## Actions

### Event

| Action | Description | Notes |
|--------|-------------|-------|
| View Now block | Trwające (LIVE + elapsed) i startujące w ≤60 min (countdown) w jednym bloku na szczycie listy. | Statusy wyliczane z czasu startu — brak realtime (ADR-0005) |
| Browse week list | Domyślny widok po wejściu: aktualny tydzień, wszystkie sporty, zero setupu. | Happy path entry; nocne zwinięte/zdyskretowane |
| Page weeks | Nawigacja ‹ Previous / Next week › + This week, po tygodniach kalendarzowych. | ADR-0006 |
| Toggle view type | Przełącznik list ↔ cards; persystencja w `UserSettings.viewMode`. | Eksperyment adopcji (ADR-0006) |
| Filter list | Po: pasmie, sporcie, lidze (multi-select) + toggle MyTeamsFilter. | Zasada uniwersalna — każdy typ listy; stan per-ekran w pamięci, czysty start wizyty (ADR-0013) |
| Expand/collapse night section | Rozwinięcie zdyskretowanych wydarzeń nocnych. | |
| See event status | Prezentacja statusu: scheduled / live / finished / postponed / canceled. | Pasywne, data-driven |
| Star event | Dodaje WATCHLIST_ENTRY. | Gwiazdka |
| Unstar event | Usuwa WATCHLIST_ENTRY. | |
| Export single → Google Calendar | Jedno wydarzenie do Google Calendar. | Link z template URL |
| Export single → Apple Calendar | Jedno wydarzenie do Apple Calendar. | Plik ICS |
| Go to team schedule | Nawigacja z uczestnika wydarzenia do SeasonSchedule drużyny. | |

### Watchlist

| Action | Description | Notes |
|--------|-------------|-------|
| View watchlist | Nadchodzące + zwinięta sekcja przeszłych na dole. | Przeszłe przechodzą tam automatycznie |
| Expand past section | Rozwinięcie historii obserwowanych. | |
| Remove entry | Ręczne usunięcie z watchlisty (odgwiazdkowanie). | Jedyny sposób "sprzątania" |
| Export whole watchlist → calendar | Wszystkie nadchodzące jako jeden ICS. | Nice-to-have, potwierdzone jako "ok, jeśli jest" |
| Jump to event | Kliknięcie wpisu → źródłowe Event / jego szczegóły. | |

### FavoriteTeam

| Action | Description | Notes |
|--------|-------------|-------|
| Add favorite team | Tworzy FAVORITE_TEAM. | Z listy drużyn lub z terminarza |
| Remove favorite team | Usuwa FAVORITE_TEAM. | |
| Toggle "only my teams" filter | Przełącznik na liście: tylko wydarzenia ulubionych drużyn. | Jeden klik, na każdej liście |
| (pasywnie) Highlight on main list | Wydarzenia ulubionych drużyn wyróżnione wizualnie. | Zachowanie stałe, nie akcja |
| (pasywnie) Quick access | Skróty do terminarzy ulubionych drużyn bez szukania. | Zachowanie stałe |

### Team

| Action | Description | Notes |
|--------|-------------|-------|
| Browse teams | Nawigacja: sport → liga → drużyny. | Hierarchia zgodna z GLOSSARY; dwa poziomy ekranów (ADR-0020) |
| Search teams | Tekstowe filtrowanie listy drużyn na ekranie ligi. | Mechanika widoku (ADR-0020) |
| View season schedule | Pełny terminarz sezonu drużyny. | Filtruje się po pasmach (zasada uniwersalna, wariant FilterBar bands-only); wymaga sezonowego okna pipeline (ADR-0019) |

### UserSettings

| Action | Description | Notes |
|--------|-------------|-------|
| Change timezone | Prezentacja wszystkich godzin w wybranej strefie. | Domyślnie strefa przeglądarki; pełna lista IANA (ADR-0026) |
| Edit band ranges | Zakresy godzin trzech TimeBandów (start/koniec). | Model dwugraniczny: Day starts / Evening starts, noc przypięta do północy (ADR-0025) |
| Reset to defaults | Powrót do ustawień domyślnych. | Dialog potwierdzenia; resetuje strefę + pasma + viewMode (ADR-0026) |

### Sport / League

| Action | Description | Notes |
|--------|-------------|-------|
| Filter by sport | Sport nadrzędny wobec ligi w hierarchii filtrowania; single-select z "All sports". | Tier 1 paska — ADR-0012 |
| Filter by league | Multi-select w "More filters", lista pogrupowana po sportach. | Uzgadnianie ze sportem — ADR-0012 |
| Clear filters | Reset wszystkich wymiarów do stanu czystego. | W empty state zero-match — ADR-0013 |
| (pasywnie) Sport icon display | Emoji/ikona sportu przy wydarzeniu — rozpoznanie z pierwszego rzutu oka. | 🏒 🏀 🏈 ⚾ ⚽ 🏁 🏐 |
| (pasywnie) Shareable view URL | Filtry + offset tygodnia w hash query — każdy widok do wysłania. | ADR-0014 |

## Bilans

- Encji: 9 (w tym USER jawny i STANDING przyszłościowa)
- Akcji: 21 (w tym 4 pasywne/prezentacyjne)
- Ról: 1 (Visitor)
